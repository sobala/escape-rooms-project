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


@app.get("/api/rooms")
def get_rooms(
    city: Optional[str] = None,
    theme: Optional[str] = None,
    difficulty: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Room).join(Venue)

    if city:
        query = query.filter(Venue.city.ilike(f"%{city}%"))
    if theme:
        query = query.filter(Room.theme.ilike(f"%{theme}%"))
    if difficulty:
        query = query.filter(Room.difficulty == difficulty)

    rooms = query.all()

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
            }
        )

    return {"rooms": rooms_list}


@app.get("/api/rooms/{room_id}")
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

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
