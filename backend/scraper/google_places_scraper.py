import os
import time
from datetime import UTC, datetime

import requests
from dotenv import load_dotenv

from database import SessionLocal
from models import Venue

load_dotenv()

API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText"

UK_CITIES = [
    ("London", "England"),
    ("Manchester", "England"),
    ("Birmingham", "England"),
    ("Edinburgh", "Scotland"),
    ("Glasgow", "Scotland"),
    ("Bristol", "England"),
    ("Leeds", "England"),
    ("Liverpool", "England"),
    ("Cardiff", "Wales"),
    ("Brighton", "England"),
]


def convert_price_level(price_level_str):
    """Convert new API price level strings to integers"""
    if not price_level_str:
        return None

    mapping = {
        "PRICE_LEVEL_FREE": 0,
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4,
    }

    return mapping.get(price_level_str)


def scrape_city(city_name: str, region: str):
    print(f"\nScraping {city_name}, {region}...")

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.priceLevel,places.id",
    }

    body = {"textQuery": f"escape room {city_name} UK"}

    try:
        response = requests.post(PLACES_API_URL, json=body, headers=headers)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"  Error searching {city_name}: {e}")
        return 0

    db = SessionLocal()
    venues_added = 0

    for place in data.get("places", []):
        try:
            place_id = place.get("id")

            existing = db.query(Venue).filter(Venue.google_place_id == place_id).first()

            if existing:
                print(
                    f"  Skipping {place.get('displayName', {}).get('text', 'Unknown')} - Already exists"
                )
                continue

            location = place.get("location", {})
            lat = location.get("latitude")
            lng = location.get("longitude")

            venue = Venue(
                name=place.get("displayName", {}).get("text", ""),
                google_place_id=place_id,
                address=place.get("formattedAddress", ""),
                city=city_name,
                state=region,
                country="GB",
                latitude=lat,
                longitude=lng,
                phone=place.get("nationalPhoneNumber"),
                website=place.get("websiteUri"),
                google_rating=place.get("rating"),
                google_review_count=place.get("userRatingCount", 0),
                google_price_level=convert_price_level(
                    place.get("priceLevel")
                ),  # FIXED
                data_source="google_places",
                last_scraped_at=datetime.now(UTC),
            )

            if lat and lng:
                venue.location = f"SRID=4326;POINT({lng} {lat})"

            db.add(venue)
            venues_added += 1

            print(f"  Added: {venue.name} (Rating: {venue.google_rating})")

        except Exception as e:
            print(f"  Error processing place: {e}")
            continue

    db.commit()
    db.close()

    print(f"Added {venues_added} venues in {city_name}")
    return venues_added


if __name__ == "__main__":
    print("Starting Google Places scraper for UK...")
    print("=" * 60)

    total_venues = 0

    for city, region in UK_CITIES:
        count = scrape_city(city, region)
        total_venues += count
        time.sleep(2)

    print("\n" + "=" * 60)
    print(
        f"COMPLETE! Added {total_venues} total venues across {len(UK_CITIES)} UK cities"
    )
    print("=" * 60)
