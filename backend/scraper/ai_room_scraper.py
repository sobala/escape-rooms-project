import anthropic
import requests
from bs4 import BeautifulSoup
import json
import time
import os
from dotenv import load_dotenv
from database import SessionLocal
from models import Venue, Room

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def fetch_venue_html(url: str) -> str:
    """Fetch HTML from venue website"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        return str(soup)[:15000]
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None


def extract_rooms_with_ai(html: str, venue_name: str, venue_city: str) -> list:
    """Use Claude to extract room data from HTML"""

    prompt = f"""Extract escape room data from this HTML for venue "{venue_name}" in {venue_city}.

Return ONLY a valid JSON array (no markdown, no explanation, no backticks):

[
  {{
    "name": "Room Name",
    "theme": "Horror/Mystery/SciFi/Adventure/Comedy/Historical/Thriller",
    "difficulty": 1-5 (estimate if not stated),
    "min_players": number,
    "max_players": number,
    "duration_minutes": 60 (standard, or actual if stated),
    "price": price in GBP (just the number),
    "description": "Brief description from the website"
  }}
]

Rules:
- Extract ALL escape rooms you find
- If difficulty not stated, estimate from description (easy=2, medium=3, hard=4)
- If player count not stated, use reasonable defaults (min_players: 2, max_players: 6)
- Prices should be per person if stated, otherwise estimate around 25-35
- Description should be 1-2 sentences from the site
- If you find NO rooms, return empty array []

HTML:
{html}
"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()

        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        rooms_data = json.loads(text.strip())
        return rooms_data if isinstance(rooms_data, list) else []

    except json.JSONDecodeError as e:
        print(f"  JSON parse error: {e}")
        print(f"  Response was: {response.content[0].text[:200]}")
        return []
    except Exception as e:
        print(f"  AI extraction error: {e}")
        return []


def find_room_links(html: str, base_url: str) -> list:
    """Extract links to individual room pages"""
    soup = BeautifulSoup(html, "html.parser")

    room_links = []
    for link in soup.find_all("a", href=True):
        href = link["href"]
        text = link.get_text().lower()

        keywords = [
            "room",
            "game",
            "experience",
            "escape",
            "adventure",
            "mission",
            "quest",
        ]
        if any(keyword in text or keyword in href.lower() for keyword in keywords):
            if href.startswith("/"):
                full_url = base_url.rstrip("/") + href
            elif href.startswith("http"):
                full_url = href
            else:
                continue

            if full_url not in room_links and base_url in full_url:
                room_links.append(full_url)

    return room_links[:10]


def scrape_venue_rooms(venue: Venue, db):
    """Scrape rooms for a single venue (with subpage support)"""

    print(f"\n{venue.name} ({venue.city})")
    print(f"  Website: {venue.website}")

    if not venue.website:
        print("  No website - skipping")
        return 0

    existing_rooms = db.query(Room).filter(Room.venue_id == venue.id).count()
    if existing_rooms > 0:
        print(f"  Already has {existing_rooms} rooms - skipping")
        return 0

    print("  Fetching main page...")
    main_html = fetch_venue_html(venue.website)
    if not main_html:
        print("  Could not fetch website")
        return 0

    print("  Extracting rooms from main page...")
    rooms_data = extract_rooms_with_ai(main_html, venue.name, venue.city)

    if len(rooms_data) < 2:
        print("  Looking for room subpages...")
        room_links = find_room_links(main_html, venue.website)

        if room_links:
            print(f"  Found {len(room_links)} potential room pages")

            for link in room_links[:5]:
                print(f"    Checking: {link}")
                subpage_html = fetch_venue_html(link)

                if subpage_html:
                    subpage_rooms = extract_rooms_with_ai(
                        subpage_html, venue.name, venue.city
                    )
                    rooms_data.extend(subpage_rooms)

                time.sleep(1)

    if not rooms_data:
        print("  No rooms found")
        return 0

    seen_names = set()
    unique_rooms = []
    for room in rooms_data:
        if room.get("name") not in seen_names:
            seen_names.add(room.get("name"))
            unique_rooms.append(room)

    rooms_added = 0
    for room_data in unique_rooms:
        try:
            room = Room(
                venue_id=venue.id,
                name=room_data.get("name"),
                theme=room_data.get("theme"),
                difficulty=room_data.get("difficulty"),
                min_players=room_data.get("min_players"),
                max_players=room_data.get("max_players"),
                duration_minutes=room_data.get("duration_minutes", 60),
                base_price=room_data.get("price", 28.00),
                currency="GBP",
                price_per_person=True,
                description=room_data.get("description"),
                latitude=venue.latitude,
                longitude=venue.longitude,
                location=venue.location,
                ai_generated_content=True,
            )

            db.add(room)
            rooms_added += 1

            print(
                f"  Added: {room.name} - {room.theme} (Difficulty: {room.difficulty}/5)"
            )

        except Exception as e:
            print(f"  Error saving room: {e}")
            continue

    db.commit()
    print(f"  Total added: {rooms_added} rooms")

    return rooms_added


def scrape_london_rooms():
    """Main function: Scrape rooms for top London venues"""

    db = SessionLocal()

    london_venues = (
        db.query(Venue)
        .filter(Venue.city == "London", Venue.website != None)
        .order_by(Venue.google_rating.desc())
        .limit(20)
        .all()
    )

    print(f"Starting AI room scraper for {len(london_venues)} London venues...")
    print("=" * 70)

    total_rooms = 0
    successful_venues = 0

    for i, venue in enumerate(london_venues, 1):
        print(f"\n[{i}/{len(london_venues)}]", end=" ")

        rooms_added = scrape_venue_rooms(venue, db)

        if rooms_added > 0:
            successful_venues += 1
            total_rooms += rooms_added

        time.sleep(2)

    db.close()

    print("\n" + "=" * 70)
    print(f"COMPLETE!")
    print(f"  Venues processed: {len(london_venues)}")
    print(f"  Successful: {successful_venues}")
    print(f"  Total rooms added: {total_rooms}")
    print(f"  Estimated cost: £{len(london_venues) * 0.05:.2f}")
    print("=" * 70)


if __name__ == "__main__":
    scrape_london_rooms()
