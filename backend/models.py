from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    ForeignKey,
    Text,
    ARRAY,
    TIMESTAMP,
    DECIMAL,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geography
from database import Base
from datetime import datetime


class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    google_place_id = Column(String(200), unique=True, index=True)

    # Location
    address = Column(String(500))
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(50))
    country = Column(String(2), nullable=False)
    postal_code = Column(String(20))
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    location = Column(Geography(geometry_type="POINT", srid=4326))

    # Contact
    phone = Column(String(50))
    email = Column(String(200))
    website = Column(String(500))

    # Google data
    google_rating = Column(DECIMAL(2, 1))
    google_review_count = Column(Integer, default=0)
    google_price_level = Column(Integer)

    # AI content
    ai_description = Column(Text)
    ai_generated = Column(Boolean, default=False)

    # Status
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True, index=True)
    data_source = Column(String(50), default="google_places")
    timezone = Column(String(50))

    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_scraped_at = Column(TIMESTAMP)

    # Relationships
    rooms = relationship("Room", back_populates="venue", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(
        Integer, ForeignKey("venues.id", ondelete="CASCADE"), nullable=False
    )

    # Basic info
    name = Column(String(200), nullable=False)
    slug = Column(String(250), unique=True, index=True)
    description = Column(Text)
    short_description = Column(String(300))

    # Categorization
    theme = Column(String(100), index=True)
    sub_themes = Column(ARRAY(Text))
    difficulty = Column(Integer, index=True)
    difficulty_source = Column(String(50))

    # Specs
    min_players = Column(Integer)
    max_players = Column(Integer)
    optimal_players = Column(Integer)
    duration_minutes = Column(Integer)

    # Pricing (Multi-Currency)
    base_price = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), nullable=False)
    price_per_person = Column(Boolean, default=True)
    price_usd = Column(DECIMAL(10, 2))
    price_converted_at = Column(TIMESTAMP)

    # Metrics
    success_rate = Column(DECIMAL(5, 2))
    escape_time_average = Column(Integer)

    # AI content
    ai_review_summary = Column(JSONB)
    ai_generated_content = Column(Boolean, default=False)

    # SEO
    meta_title = Column(String(60))
    meta_description = Column(String(160))

    # Media
    image_urls = Column(ARRAY(Text))
    primary_image_url = Column(Text)
    video_url = Column(Text)

    # Location (Room-level)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    location = Column(Geography(geometry_type="POINT", srid=4326))

    # Analytics
    view_count = Column(Integer, default=0, index=True)
    click_to_book_count = Column(Integer, default=0)
    last_viewed_at = Column(TIMESTAMP)

    # Status
    is_published = Column(Boolean, default=True, index=True)
    is_premium = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    data_quality_score = Column(Integer, default=0)
    language = Column(String(2), default="en")

    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Constraints
    __table_args__ = (
        CheckConstraint("difficulty >= 1 AND difficulty <= 5", name="valid_difficulty"),
        CheckConstraint("min_players <= max_players", name="valid_players"),
        CheckConstraint(
            "success_rate >= 0 AND success_rate <= 100", name="valid_success_rate"
        ),
    )

    # Relationships
    venue = relationship("Venue", back_populates="rooms")
    photos = relationship(
        "RoomPhoto", back_populates="room", cascade="all, delete-orphan"
    )
    views = relationship(
        "RoomView", back_populates="room", cascade="all, delete-orphan"
    )


class RoomPhoto(Base):
    __tablename__ = "room_photos"

    id = Column(Integer, primary_key=True)
    room_id = Column(
        Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False
    )
    url = Column(Text, nullable=False)
    caption = Column(String(200))
    source = Column(String(100))
    is_primary = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    width = Column(Integer)
    height = Column(Integer)
    file_size = Column(Integer)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    room = relationship("Room", back_populates="photos")


class RoomView(Base):
    __tablename__ = "room_views"

    id = Column(Integer, primary_key=True)
    room_id = Column(
        Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False
    )
    viewed_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    session_id = Column(String(100), index=True)
    ip_hash = Column(String(64))
    user_agent = Column(Text)
    referrer = Column(Text)
    viewer_city = Column(String(100))
    viewer_country = Column(String(50))

    room = relationship("Room", back_populates="views")


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    state = Column(String(50))  # Generic: state/province/county/region
    country = Column(String(2), nullable=False)
    slug = Column(String(150), unique=True, index=True)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    page_title = Column(String(60))
    meta_description = Column(String(160))
    ai_description = Column(Text)
    venue_count = Column(Integer, default=0)
    room_count = Column(Integer, default=0)
    avg_price = Column(DECIMAL(10, 2))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
