"""
Map API Endpoint - Escape Room Finder
Returns rooms within a radius with filtering options
"""

from fastapi import APIRouter, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import Optional, List
from pydantic import BaseModel, Field
from geoalchemy2.functions import ST_DWithin, ST_Distance, ST_MakePoint
from geoalchemy2.elements import WKTElement
from sqlalchemy import text

# Assuming your models are imported
# from models import Venue, Room, RoomPhoto
# from database import get_db

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


# ============================================================================
# Response Models
# ============================================================================


class VenueResponse(BaseModel):
    id: int
    name: str
    address: Optional[str]
    city: str
    state: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    phone: Optional[str]
    website: Optional[str]
    google_rating: Optional[float]
    google_review_count: Optional[int]

    class Config:
        from_attributes = True


class RoomResponse(BaseModel):
    id: int
    name: str
    slug: str | None
    short_description: Optional[str]
    description: Optional[str]
    theme: Optional[str]
    sub_themes: Optional[List[str]]
    difficulty: Optional[int]
    min_players: Optional[int]
    max_players: Optional[int]
    optimal_players: Optional[int]
    duration_minutes: Optional[int]
    base_price: Optional[float]
    price_per_person: Optional[bool]
    success_rate: Optional[float]
    primary_image_url: Optional[str]
    view_count: int
    is_featured: bool

    # Related data
    venue: VenueResponse
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True


class MapResponse(BaseModel):
    total: int
    page: int
    page_size: int
    rooms: List[RoomResponse]


# ============================================================================
# Map Endpoint - Geospatial Search with Filters
# ============================================================================


@router.get("/map", response_model=MapResponse)
async def get_rooms_map(
    # Location parameters
    lat: float = Query(..., description="Latitude of search center", ge=-90, le=90),
    lng: float = Query(..., description="Longitude of search center", ge=-180, le=180),
    radius: float = Query(
        10, description="Search radius in kilometers", ge=0.1, le=100
    ),
    # Filter parameters
    theme: Optional[str] = Query(
        None, description="Filter by theme (Horror, Mystery, etc.)"
    ),
    min_difficulty: Optional[int] = Query(
        None, description="Minimum difficulty (1-5)", ge=1, le=5
    ),
    max_difficulty: Optional[int] = Query(
        None, description="Maximum difficulty (1-5)", ge=1, le=5
    ),
    min_players: Optional[int] = Query(None, description="Minimum group size", ge=1),
    max_players: Optional[int] = Query(None, description="Maximum group size", ge=1),
    group_size: Optional[int] = Query(
        None, description="Ideal group size (finds rooms that fit this)", ge=1
    ),
    max_price: Optional[float] = Query(
        None, description="Maximum price per person", ge=0
    ),
    min_rating: Optional[float] = Query(
        None, description="Minimum Google rating", ge=0, le=5
    ),
    # Sorting & Pagination
    sort_by: str = Query(
        "distance",
        description="Sort by: distance, rating, price, difficulty, popularity",
    ),
    page: int = Query(1, description="Page number", ge=1),
    page_size: int = Query(20, description="Items per page", ge=1, le=100),
    # Database session (inject via dependency)
    # db: Session = Depends(get_db)
):
    """
    Get escape rooms on a map within a radius with optional filters

    Example:
    GET /api/rooms/map?lat=40.7516&lng=-73.9800&radius=10&theme=Horror&group_size=6
    """

    # For demo, we'll return the query structure
    # You'll need to inject the actual db session

    # ========================================================================
    # Build Query
    # ========================================================================

    from models import Room, Venue  # Import your models
    from database import SessionLocal  # Import your session maker

    db = SessionLocal()

    try:
        # Create point from lat/lng for geospatial query
        user_location = WKTElement(f"POINT({lng} {lat})", srid=4326)

        # Base query with JOIN
        query = (
            db.query(
                Room,
                Venue,
                # Calculate distance in kilometers
                (ST_Distance(Venue.location, user_location) / 1000).label(
                    "distance_km"
                ),
            )
            .join(Venue, Room.venue_id == Venue.id)
            .filter(
                # Only published rooms
                Room.is_published == True,
                # Only active venues
                Venue.is_active == True,
                # Within radius (converted to meters)
                ST_DWithin(
                    Venue.location,
                    user_location,
                    radius * 1000,  # Convert km to meters
                ),
            )
        )

        # ====================================================================
        # Apply Filters
        # ====================================================================

        if theme:
            query = query.filter(Room.theme == theme)

        if min_difficulty:
            query = query.filter(Room.difficulty >= min_difficulty)

        if max_difficulty:
            query = query.filter(Room.difficulty <= max_difficulty)

        if group_size:
            # Room must accommodate this group size
            query = query.filter(
                Room.min_players <= group_size, Room.max_players >= group_size
            )
        elif min_players or max_players:
            # Or use min/max separately
            if min_players:
                query = query.filter(Room.max_players >= min_players)
            if max_players:
                query = query.filter(Room.min_players <= max_players)

        if max_price:
            query = query.filter(Room.base_price <= max_price)

        if min_rating:
            query = query.filter(Venue.google_rating >= min_rating)

        # ====================================================================
        # Sorting
        # ====================================================================

        if sort_by == "distance":
            query = query.order_by(text("distance_km"))
        elif sort_by == "rating":
            query = query.order_by(Venue.google_rating.desc().nullslast())
        elif sort_by == "price":
            query = query.order_by(Room.base_price.asc().nullslast())
        elif sort_by == "difficulty":
            query = query.order_by(Room.difficulty.desc())
        elif sort_by == "popularity":
            query = query.order_by(Room.view_count.desc())
        else:
            # Default to distance
            query = query.order_by(func.literal_column("distance_km").asc())

        # ====================================================================
        # Get Total Count (before pagination)
        # ====================================================================

        total = query.count()

        # ====================================================================
        # Pagination
        # ====================================================================

        offset = (page - 1) * page_size
        results = query.offset(offset).limit(page_size).all()

        # ====================================================================
        # Format Response
        # ====================================================================

        rooms = []
        for room, venue, distance in results:
            # Convert room to dict
            room_dict = {
                "id": room.id,
                "name": room.name,
                "slug": room.slug,
                "short_description": room.short_description,
                "description": room.description,
                "theme": room.theme,
                "sub_themes": room.sub_themes,
                "difficulty": room.difficulty,
                "min_players": room.min_players,
                "max_players": room.max_players,
                "optimal_players": room.optimal_players,
                "duration_minutes": room.duration_minutes,
                "base_price": float(room.base_price) if room.base_price else None,
                "price_per_person": room.price_per_person,
                "success_rate": float(room.success_rate) if room.success_rate else None,
                "primary_image_url": room.primary_image_url,
                "view_count": room.view_count,
                "is_featured": room.is_featured,
                "distance_km": round(float(distance), 2) if distance else None,
                "venue": {
                    "id": venue.id,
                    "name": venue.name,
                    "address": venue.address,
                    "city": venue.city,
                    "state": venue.state,
                    "latitude": float(venue.latitude) if venue.latitude else None,
                    "longitude": float(venue.longitude) if venue.longitude else None,
                    "phone": venue.phone,
                    "website": venue.website,
                    "google_rating": float(venue.google_rating)
                    if venue.google_rating
                    else None,
                    "google_review_count": venue.google_review_count,
                },
            }

            rooms.append(RoomResponse(**room_dict))

        return MapResponse(total=total, page=page, page_size=page_size, rooms=rooms)

    finally:
        db.close()


# ============================================================================
# Get Unique Themes (for filter dropdown)
# ============================================================================


@router.get("/themes")
async def get_themes():
    """
    Get list of all available themes
    """
    from models import Room
    from database import SessionLocal

    db = SessionLocal()

    try:
        themes = (
            db.query(Room.theme)
            .distinct()
            .filter(Room.theme.isnot(None), Room.is_published == True)
            .all()
        )

        return {"themes": [t[0] for t in themes if t[0]]}

    finally:
        db.close()


# ============================================================================
# Get Room by Slug (for detail page)
# ============================================================================


@router.get("/slug/{slug}", response_model=RoomResponse)
async def get_room_by_slug(
    slug: str,
    # db: Session = Depends(get_db)
):
    """
    Get detailed room information by slug
    """
    from models import Room, Venue
    from database import SessionLocal

    db = SessionLocal()

    try:
        room = (
            db.query(Room)
            .options(joinedload(Room.venue))
            .filter(Room.slug == slug, Room.is_published == True)
            .first()
        )

        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        # Increment view count
        room.view_count += 1
        db.commit()

        # Format response
        room_dict = {
            "id": room.id,
            "name": room.name,
            "slug": room.slug,
            "short_description": room.short_description,
            "description": room.description,
            "theme": room.theme,
            "sub_themes": room.sub_themes,
            "difficulty": room.difficulty,
            "min_players": room.min_players,
            "max_players": room.max_players,
            "optimal_players": room.optimal_players,
            "duration_minutes": room.duration_minutes,
            "base_price": float(room.base_price) if room.base_price else None,
            "price_per_person": room.price_per_person,
            "success_rate": float(room.success_rate) if room.success_rate else None,
            "primary_image_url": room.primary_image_url,
            "view_count": room.view_count,
            "is_featured": room.is_featured,
            "venue": {
                "id": room.venue.id,
                "name": room.venue.name,
                "address": room.venue.address,
                "city": room.venue.city,
                "state": room.venue.state,
                "latitude": float(room.venue.latitude) if room.venue.latitude else None,
                "longitude": float(room.venue.longitude)
                if room.venue.longitude
                else None,
                "phone": room.venue.phone,
                "website": room.venue.website,
                "google_rating": float(room.venue.google_rating)
                if room.venue.google_rating
                else None,
                "google_review_count": room.venue.google_review_count,
            },
        }

        return RoomResponse(**room_dict)

    finally:
        db.close()


# ============================================================================
# Track Room View (for analytics)
# ============================================================================


@router.post("/{room_id}/view")
async def track_room_view(
    room_id: int,
    session_id: Optional[str] = None,
    # db: Session = Depends(get_db)
):
    """
    Track a room view for analytics
    """
    from models import RoomView
    from database import SessionLocal
    import hashlib

    db = SessionLocal()

    try:
        # Create view record
        view = RoomView(
            room_id=room_id,
            session_id=session_id,
            # You can add more fields like ip_hash, user_agent from request
        )

        db.add(view)
        db.commit()

        return {"status": "success"}

    finally:
        db.close()
