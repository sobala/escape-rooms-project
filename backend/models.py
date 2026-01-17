from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    Text,
    ARRAY,
    TIMESTAMP,
)
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography
from database import Base
from datetime import datetime


class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(String(500))
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(50))
    country = Column(String(50), default="USA")
    postal_code = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(Geography(geometry_type="POINT", srid=4326))
    phone = Column(String(50))
    website = Column(String(500))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    rooms = relationship("Room", back_populates="venue")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id", ondelete="CASCADE"))
    name = Column(String(200), nullable=False)
    slug = Column(String(250), unique=True, index=True)
    description = Column(Text)
    theme = Column(String(100), index=True)
    difficulty = Column(Integer)
    min_players = Column(Integer)
    max_players = Column(Integer)
    duration_minutes = Column(Integer)
    base_price = Column(Float)
    success_rate = Column(Float)
    image_urls = Column(ARRAY(Text))
    view_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    venue = relationship("Venue", back_populates="rooms")
