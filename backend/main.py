from typing import Optional
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
from models import Room, Venue

# Import the map API router
from api.map_api import router as map_router

app = FastAPI(title="Escape Rooms API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://escape-rooms-project.vercel.app",
        "https://www.escaperoomsnearme.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the map API router
app.include_router(map_router)


@app.get("/")
def read_root():
    return {
        "message": "Escape Rooms API with complete schema",
        "endpoints": {
            "rooms_list": "/api/rooms",
            "room_detail": "/api/rooms/{room_id}",
            "map_search": "/api/rooms/map",
            "themes": "/api/rooms/themes",
            "health": "/health",
        },
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    from database import engine
    from sqlalchemy import text

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@app.get("/api/debug/room/{room_id}")
def debug_room(room_id: int, db: Session = Depends(get_db)):
    """Debug endpoint to check room status"""
    room = db.query(Room).filter(Room.id == room_id).first()

    if not room:
        return {
            "exists": False,
            "room_id": room_id,
            "message": "Room does not exist in database",
        }

    return {
        "exists": True,
        "room_id": room.id,
        "name": room.name,
        "is_published": room.is_published,
        "venue_id": room.venue_id,
        "venue_exists": room.venue is not None,
        "venue_active": room.venue.is_active if room.venue else None,
        "venue_name": room.venue.name if room.venue else None,
        "can_be_accessed": room.is_published and (room.venue and room.venue.is_active)
        if room.venue
        else False,
    }


@app.get("/api/debug/all-rooms")
def debug_all_rooms(db: Session = Depends(get_db)):
    """Debug endpoint to see all rooms and their status"""
    all_rooms = db.query(Room).all()

    rooms_info = []
    for room in all_rooms:
        rooms_info.append(
            {
                "id": room.id,
                "name": room.name,
                "is_published": room.is_published,
                "venue_id": room.venue_id,
                "venue_exists": room.venue is not None,
                "venue_active": room.venue.is_active if room.venue else None,
                "venue_name": room.venue.name if room.venue else None,
                "can_be_accessed": room.is_published
                and (room.venue and room.venue.is_active)
                if room.venue
                else False,
                "would_appear_in_list": room.is_published
                and (room.venue and room.venue.is_active)
                if room.venue
                else False,
            }
        )

    return {
        "total_rooms": len(all_rooms),
        "accessible_rooms": sum(1 for r in rooms_info if r["can_be_accessed"]),
        "rooms": rooms_info,
    }


@app.get("/api/rooms")
def get_rooms(
    city: Optional[str] = None,
    theme: Optional[str] = None,
    difficulty: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(Room)
        .join(Venue)
        .filter(Room.is_published == True, Venue.is_active == True)
    )

    if city:
        query = query.filter(Venue.city.ilike(f"%{city}%"))
    if theme:
        query = query.filter(Room.theme.ilike(f"%{theme}%"))
    if difficulty:
        query = query.filter(Room.difficulty == difficulty)

    rooms = query.all()

    # Debug: Log what room IDs are being returned
    room_ids = [r.id for r in rooms]
    print(f"\n📋 /api/rooms: Returning {len(rooms)} rooms")
    print(f"📋 Room IDs being returned: {room_ids}")

    # Also check what room IDs exist in DB (regardless of filters)
    all_room_ids = [r[0] for r in db.query(Room.id).all()]
    print(f"📊 Total rooms in database: {len(all_room_ids)}")
    print(f"📊 All room IDs in DB: {all_room_ids}\n")

    rooms_list = []
    for room in rooms:
        rooms_list.append(
            {
                "id": room.id,
                "name": room.name,
                "theme": room.theme,
                "difficulty": room.difficulty,
                "price": float(room.base_price) if room.base_price else None,
                "currency": room.currency,
                "latitude": float(room.latitude) if room.latitude else None,
                "longitude": float(room.longitude) if room.longitude else None,
                "city": room.venue.city if room.venue else None,
                "venue_name": room.venue.name if room.venue else None,
                "primary_image_url": room.primary_image_url,
                "image_urls": room.image_urls or [],
            }
        )

    return {"rooms": rooms_list}


@app.get("/api/rooms/{room_id}")
def get_room(room_id: int, db: Session = Depends(get_db)):
    print(f"\n🔍 DEBUG: Fetching room {room_id}")

    # Use the SAME query logic as /api/rooms to ensure consistency
    # This ensures any room shown in the list can be accessed by ID
    room = (
        db.query(Room)
        .join(Venue)
        .filter(Room.id == room_id, Room.is_published == True, Venue.is_active == True)
        .first()
    )

    if not room:
        # Check if room exists at all (for better error messages)
        room_exists = db.query(Room).filter(Room.id == room_id).first()

        if not room_exists:
            all_room_ids = [r[0] for r in db.query(Room.id).all()]
            print(f"❌ Room {room_id} NOT FOUND in database")
            print(f"📊 Total rooms in DB: {len(all_room_ids)}")
            print(f"📋 All room IDs: {all_room_ids}")
            raise HTTPException(
                status_code=404,
                detail=f"Room with ID {room_id} does not exist in database. Total rooms: {len(all_room_ids)}, IDs: {all_room_ids[:10]}",
            )

        # Room exists but doesn't meet the criteria
        issues = []
        if not room_exists.is_published:
            issues.append("not published")
        if not room_exists.venue:
            issues.append("no venue")
        elif not room_exists.venue.is_active:
            issues.append("venue not active")

        print(f"⚠️ Room {room_id} exists but: {', '.join(issues)}")
        raise HTTPException(
            status_code=404,
            detail=f"Room with ID {room_id} exists but cannot be accessed: {', '.join(issues)}",
        )

    print(
        f"✅ Room {room_id} FOUND: name='{room.name}', published={room.is_published}, venue='{room.venue.name if room.venue else None}'"
    )
    print(f"✅ Room {room_id} is accessible - returning data")

    room.view_count += 1
    db.commit()

    return {
        "id": room.id,
        "name": room.name,
        "description": room.description,
        "theme": room.theme,
        "difficulty": room.difficulty,
        "min_players": room.min_players,
        "max_players": room.max_players,
        "duration_minutes": room.duration_minutes,
        "price": float(room.base_price) if room.base_price else None,
        "currency": room.currency,
        "success_rate": float(room.success_rate) if room.success_rate else None,
        "primary_image_url": room.primary_image_url,
        "image_urls": room.image_urls or [],
        "venue": {
            "name": room.venue.name,
            "city": room.venue.city,
            "address": room.venue.address,
            "phone": room.venue.phone,
            "website": room.venue.website,
        }
        if room.venue
        else None,
    }
