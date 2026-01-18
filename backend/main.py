from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import Room, Venue

app = FastAPI(title="Escape Rooms API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://*.vercel.app",  # All Vercel deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Escape Rooms API with Supabase! 🚀"}


@app.get("/api/rooms")
def get_rooms(db: Session = Depends(get_db)):
    rooms = db.query(Room).all()

    # Format response
    rooms_list = []
    for room in rooms:
        rooms_list.append(
            {
                "id": room.id,
                "name": room.name,
                "theme": room.theme,
                "difficulty": room.difficulty,
                "price": room.base_price,
                "city": room.venue.city if room.venue else None,
                "venue_name": room.venue.name if room.venue else None,
            }
        )

    return {"rooms": rooms_list}


@app.get("/api/rooms/{room_id}")
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()

    if not room:
        return {"error": "Room not found"}

    return {
        "id": room.id,
        "name": room.name,
        "description": room.description,
        "theme": room.theme,
        "difficulty": room.difficulty,
        "min_players": room.min_players,
        "max_players": room.max_players,
        "duration_minutes": room.duration_minutes,
        "price": room.base_price,
        "success_rate": room.success_rate,
        "venue": {
            "name": room.venue.name,
            "city": room.venue.city,
            "address": room.venue.address,
        }
        if room.venue
        else None,
    }
