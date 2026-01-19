from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Room, Venue

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


@app.get("/")
def read_root():
    return {"message": "Escape Rooms API with complete schema! 🚀"}


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

    # Increment view count
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
