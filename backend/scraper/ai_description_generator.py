import anthropic
import os
import time
from dotenv import load_dotenv
from database import SessionLocal
from models import Venue

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def generate_venue_description(venue: Venue) -> str:
    prompt = f"""Write a compelling 2-3 sentence description for this escape room venue:

Venue: {venue.name}
Location: {venue.city}, {venue.state}
Rating: {venue.google_rating}/5 ({venue.google_review_count} reviews)

Make it exciting and mention the city. Focus on the experience, not just facts."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
    except Exception as e:
        print(f"  Error: {e}")
        return (
            f"Escape room venue in {venue.city} offering immersive puzzle experiences."
        )


def generate_all_descriptions():
    db = SessionLocal()

    venues = db.query(Venue).filter(Venue.ai_description == None).all()
    # venues = db.query(Venue).all()

    print(f"Generating descriptions for {len(venues)} venues with Claude...")
    print("=" * 60)

    for i, venue in enumerate(venues, 1):
        print(f"\n[{i}/{len(venues)}] {venue.name} ({venue.city})")

        description = generate_venue_description(venue)

        venue.ai_description = description
        venue.ai_generated = True

        db.commit()

        print(f"  {description}")

        time.sleep(0.3)

    db.close()

    print("\n" + "=" * 60)
    print(f"COMPLETE! Generated descriptions for {len(venues)} venues")
    print("=" * 60)


if __name__ == "__main__":
    generate_all_descriptions()
