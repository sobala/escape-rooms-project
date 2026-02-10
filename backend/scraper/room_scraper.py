from playwright.sync_api import sync_playwright
import anthropic
import base64
import json
import time
import os
from dotenv import load_dotenv
from database import SessionLocal
from models import Venue, Room
from sqlalchemy import func

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def screenshot_to_base64(screenshot_bytes):
    return base64.b64encode(screenshot_bytes).decode("utf-8")


def scrape_venue_with_vision(venue_url: str, venue_name: str):
    """AI agent navigates and extracts room data"""

    print(f"\n  Scraping {venue_name}")
    print(f"  URL: {venue_url}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto(venue_url, wait_until="networkidle", timeout=30000)
        except Exception as e:
            print(f"  Failed to load page: {e}")
            browser.close()
            return []

        # Step 1: Analyze main page
        main_screenshot = page.screenshot()

        prompt_1 = f"""Analyze this escape room venue website for {venue_name}.

You MUST respond with ONLY valid JSON, nothing else. No explanations, no markdown, no text before or after.

{{
  "rooms_found": [
    {{"name": "Room Name", "theme": "Horror", "price_min": 25, "price_max": 35, "difficulty": 4, "min_players": 2, "max_players": 6, "duration_minutes": 60, "description": "Brief desc"}}
  ],
  "room_links": ["/rooms/haunted-mansion"],
  "needs_navigation": false
}}

RULES:
- If you see room info on this page, add to rooms_found
- If you see links to room pages, add to room_links
- Use null for any field not explicitly shown
- No guessing or estimating
- Return ONLY the JSON object, nothing else

What rooms and links do you see?
"""

        response_1 = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=3000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": screenshot_to_base64(main_screenshot),
                            },
                        },
                        {"type": "text", "text": prompt_1},
                    ],
                }
            ],
        )

        # Parse response
        try:
            text = response_1.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            result_1 = json.loads(text.strip())
        except Exception as e:
            print(f"  Failed to parse AI response: {e}")
            browser.close()
            return []

        all_rooms = result_1.get("rooms_found", [])

        # Step 2: Navigate to subpages if needed
        if result_1.get("needs_navigation") and result_1.get("room_links"):
            print(f"  Found {len(result_1['room_links'])} subpages to check")

            for link in result_1["room_links"][:5]:
                try:
                    if link.startswith("/"):
                        full_url = venue_url.rstrip("/") + link
                    elif link.startswith("http"):
                        full_url = link
                    else:
                        continue

                    print(f"    Visiting: {full_url}")
                    page.goto(full_url, wait_until="networkidle", timeout=15000)
                    time.sleep(2)

                    subpage_screenshot = page.screenshot()

                    prompt_2 = """Extract escape room data from this page.

Return ONLY JSON array (no markdown):
[{
  "name": "exact room name",
  "theme": "theme or null",
  "difficulty": number only if stated, else null,
  "price_min": number only if you see lowest price, else null,
  "price_max": number only if you see highest price, else null,
  "min_players": number or null,
  "max_players": number or null,
  "duration_minutes": number or null,
  "description": "brief description"
}]

Only extract explicitly stated info. Do not estimate or guess.
"""

                    response_2 = client.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=2000,
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "image",
                                        "source": {
                                            "type": "base64",
                                            "media_type": "image/png",
                                            "data": screenshot_to_base64(
                                                subpage_screenshot
                                            ),
                                        },
                                    },
                                    {"type": "text", "text": prompt_2},
                                ],
                            }
                        ],
                    )

                    text = response_2.content[0].text.strip()
                    if text.startswith("```"):
                        text = text.split("```")[1]
                        if text.startswith("json"):
                            text = text[4:]

                    subpage_rooms = json.loads(text.strip())
                    if isinstance(subpage_rooms, list):
                        all_rooms.extend(subpage_rooms)

                    time.sleep(2)

                except Exception as e:
                    print(f"    Error on subpage: {e}")
                    continue

        browser.close()

        # Deduplicate by name
        unique_rooms = []
        seen = set()
        for room in all_rooms:
            if room.get("name") and room["name"] not in seen:
                seen.add(room["name"])
                unique_rooms.append(room)

        print(f"  Extracted {len(unique_rooms)} unique rooms")
        return unique_rooms


def scrape_london_rooms_with_vision():
    """Main function: Scrape all London venues with vision"""

    db = SessionLocal()

    # Get London venues with websites, no rooms yet
    london_venues = (
        db.query(Venue)
        .filter(Venue.city == "London", Venue.website != None)
        .outerjoin(Room)
        .group_by(Venue.id)
        .having(func.count(Room.id) == 0)
        .order_by(Venue.google_rating.desc())
        .all()
    )

    print(f"Starting vision scraper for {len(london_venues)} London venues")
    print("=" * 70)

    total_rooms = 0

    for i, venue in enumerate(london_venues, 1):
        print(f"\n[{i}/{len(london_venues)}] {venue.name}")

        if not venue.website:
            print("  No website, skipping")
            continue

        # Scrape with vision
        rooms_data = scrape_venue_with_vision(venue.website, venue.name)

        if not rooms_data:
            print("  No rooms extracted")
            continue

        # Save to database
        for room_data in rooms_data:
            try:
                room = Room(
                    venue_id=venue.id,
                    name=room_data.get("name"),
                    theme=room_data.get("theme"),
                    difficulty=room_data.get("difficulty"),
                    min_players=room_data.get("min_players"),
                    max_players=room_data.get("max_players"),
                    # Only store a duration if we actually scraped one.
                    duration_minutes=room_data.get("duration_minutes"),
                    # Store min/max price per person separately; don't fabricate defaults.
                    min_price_per_person=room_data.get("price_min"),
                    max_price_per_person=room_data.get("price_max"),
                    currency="GBP",
                    description=room_data.get("description"),
                    latitude=venue.latitude,
                    longitude=venue.longitude,
                    location=venue.location,
                    ai_generated_content=True,
                )

                db.add(room)
                total_rooms += 1
                print(f"    Added: {room.name}")

            except Exception as e:
                print(f"    Error saving room: {e}")
                continue

        db.commit()
        time.sleep(3)  # Rate limiting between venues

    db.close()

    print("\n" + "=" * 70)
    print(f"COMPLETE! Added {total_rooms} rooms")
    print("=" * 70)


if __name__ == "__main__":
    print("STARTING AI ROOM SCRAPER WITH VISION...")
    scrape_london_rooms_with_vision()
