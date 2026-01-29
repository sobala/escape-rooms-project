"""
Scrape image URLs from venue websites and attach them to rooms.
Run from project root: uv run python -m backend.scraper.image_scraper
Or from backend: cd backend && uv run python -m scraper.image_scraper
"""
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# Ensure backend is on path so imports work from project root or backend
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from database import SessionLocal
from models import Room, Venue


def scrape_venue_images(venue_url: str) -> list:
    """Scrape image URLs from venue website."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        response = requests.get(venue_url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, "html.parser")

        images = []

        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src")
            if not src:
                continue

            src = urljoin(venue_url, src)
            if not src.startswith("http"):
                continue

            if any(
                kw in src.lower()
                for kw in ["room", "escape", "game", "experience", "photo", "image", "img"]
            ):
                images.append(src)

        if not images:
            for img in soup.find_all("img"):
                src = img.get("src") or img.get("data-src")
                if src and src.startswith("http") and "logo" not in src.lower() and "icon" not in src.lower():
                    images.append(src)

        return images[:5]
    except Exception as e:
        print(f"  Error: {e}")
        return []


def add_images_to_rooms():
    db = SessionLocal()

    rooms = (
        db.query(Room)
        .join(Venue)
        .filter(Venue.city == "London", Room.image_urls.is_(None))
        .all()
    )

    print(f"Adding images to {len(rooms)} rooms...")
    print("=" * 60)

    for i, room in enumerate(rooms, 1):
        venue = room.venue

        if not venue or not venue.website:
            print(f"[{i}/{len(rooms)}] {room.name} - No website, skipping")
            continue

        print(f"[{i}/{len(rooms)}] {room.name}")
        print(f"  Scraping: {venue.website}")

        images = scrape_venue_images(venue.website)

        if images:
            room.image_urls = images
            room.primary_image_url = images[0]
            db.commit()
            print(f"  Added {len(images)} images")
        else:
            print(f"  No images found")

        time.sleep(2)

    db.close()
    print("\n" + "=" * 60)
    print("COMPLETE!")


if __name__ == "__main__":
    add_images_to_rooms()
