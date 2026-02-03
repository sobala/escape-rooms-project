import os
import time
from datetime import UTC, datetime

import requests
from dotenv import load_dotenv

from database import SessionLocal
from models import Venue

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
# YELP_API_KEY = os.getenv("YELP_API_KEY")
# FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY")

GOOGLE_API_URL = "https://places.googleapis.com/v1/places:searchText"
# YELP_API_URL = "https://api.yelp.com/v3/businesses/search"
# FOURSQUARE_API_URL = "https://api.foursquare.com/v3/places/search"

LONDON_SEARCHES = [
    # General searches
    "escape room London",
    "escape game London",
    "puzzle room London",
    "exit game London",
    # By broad area
    "escape room Central London",
    "escape room East London",
    "escape room North London",
    "escape room South London",
    "escape room West London",
    "escape room Greater London",
    # Central postcodes
    "escape room EC1",
    "escape room EC2",
    "escape room EC3",
    "escape room EC4",
    "escape room WC1",
    "escape room WC2",
    "escape room SW1",
    "escape room SE1",
    "escape room E1",
    "escape room N1",
    # East London
    "escape room E2",
    "escape room E3",
    "escape room E8",
    "escape room E9",
    "escape room E14",
    "escape room E15",
    "escape room E20",
    # North London
    "escape room N4",
    "escape room N5",
    "escape room N7",
    "escape room N8",
    "escape room N16",
    "escape room N19",
    "escape room NW1",
    "escape room NW3",
    # South London
    "escape room SE8",
    "escape room SE10",
    "escape room SE15",
    "escape room SE16",
    "escape room SW2",
    "escape room SW4",
    "escape room SW8",
    "escape room SW9",
    "escape room SW11",
    "escape room SW15",
    # West London
    "escape room W1",
    "escape room W2",
    "escape room W6",
    "escape room W8",
    "escape room W11",
    "escape room W12",
    "escape room W14",
    # Popular neighborhoods (all areas)
    "escape room Soho",
    "escape room Covent Garden",
    "escape room Shoreditch",
    "escape room Camden",
    "escape room Greenwich",
    "escape room Brixton",
    "escape room Clapham",
    "escape room Hackney",
    "escape room Islington",
    "escape room Peckham",
    "escape room Dalston",
    "escape room Stratford",
    "escape room Bethnal Green",
    "escape room Angel",
    "escape room King's Cross",
]


def convert_price_level(price_level_str):
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


# ========================================================================
# GOOGLE PLACES SCRAPER
# ========================================================================


def scrape_google_places(query: str) -> list:
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.priceLevel,places.id",
    }
    body = {"textQuery": query}

    try:
        response = requests.post(GOOGLE_API_URL, json=body, headers=headers, timeout=15)
        response.raise_for_status()
        places = response.json().get("places", [])

        # Convert to standard format
        venues = []
        for place in places:
            location = place.get("location", {})
            venues.append(
                {
                    "source": "google",
                    "source_id": place.get("id"),
                    "name": place.get("displayName", {}).get("text", ""),
                    "address": place.get("formattedAddress", ""),
                    "latitude": location.get("latitude"),
                    "longitude": location.get("longitude"),
                    "phone": place.get("nationalPhoneNumber"),
                    "website": place.get("websiteUri"),
                    "rating": place.get("rating"),
                    "review_count": place.get("userRatingCount", 0),
                    "price_level": convert_price_level(place.get("priceLevel")),
                }
            )

        return venues

    except Exception as e:
        print(f"    Error: {e}")
        return []


# # ========================================================================
# # YELP SCRAPER
# # ========================================================================


# def scrape_yelp_london() -> list:
#     """Scrape London escape rooms from Yelp"""

#     if not YELP_API_KEY:
#         print("  Yelp API key not found, skipping")
#         return []

#     print("\nScraping Yelp...")

#     headers = {"Authorization": f"Bearer {YELP_API_KEY}"}

#     all_venues = []
#     offset = 0

#     # Yelp returns max 50 per request, paginate to get all
#     while offset < 200:  # Max 200 results (4 pages)
#         params = {
#             "term": "escape room",
#             "location": "London, UK",
#             "limit": 50,
#             "offset": offset,
#         }

#         try:
#             response = requests.get(
#                 YELP_API_URL, headers=headers, params=params, timeout=15
#             )
#             response.raise_for_status()
#             data = response.json()

#             businesses = data.get("businesses", [])
#             if not businesses:
#                 break

#             print(f"  Found {len(businesses)} results (offset {offset})")

#             for biz in businesses:
#                 coords = biz.get("coordinates", {})
#                 all_venues.append(
#                     {
#                         "source": "yelp",
#                         "source_id": biz.get("id"),
#                         "name": biz.get("name"),
#                         "address": ", ".join(
#                             biz.get("location", {}).get("display_address", [])
#                         ),
#                         "latitude": coords.get("latitude"),
#                         "longitude": coords.get("longitude"),
#                         "phone": biz.get("phone"),
#                         "website": biz.get("url"),  # Yelp URL, not actual website
#                         "rating": biz.get("rating"),
#                         "review_count": biz.get("review_count", 0),
#                         "price_level": len(biz.get("price", ""))
#                         if biz.get("price")
#                         else None,
#                     }
#                 )

#             offset += 50
#             time.sleep(1)

#         except Exception as e:
#             print(f"    Error: {e}")
#             break

#     print(f"  Total from Yelp: {len(all_venues)}")
#     return all_venues


# ========================================================================
# FOURSQUARE SCRAPER
# ========================================================================


# def get_foursquare_details(fsq_id: str) -> dict:
#     """Get detailed info for a venue"""
#     headers = {
#         "X-Places-Api-Version": "2025-06-17",
#         "accept": "application/json",
#         "authorization": f"Bearer {FOURSQUARE_API_KEY}",
#     }

#     try:
#         response = requests.get(
#             f"https://places-api.foursquare.com/places/{fsq_id}",
#             headers=headers,
#             timeout=15,
#         )
#         response.raise_for_status()
#         return response.json()
#     except:
#         return {}


# def scrape_foursquare_london() -> list:
#     """Scrape London escape rooms from Foursquare"""

#     if not FOURSQUARE_API_KEY:
#         print("  Foursquare API key not found, skipping")
#         return []

#     print("\nScraping Foursquare...")

#     headers = {
#         "X-Places-Api-Version": "2025-06-17",
#         "accept": "application/json",
#         "authorization": f"Bearer {FOURSQUARE_API_KEY}",
#     }

#     params = {
#         "query": "escape room",
#         "near": "London, UK",
#         "limit": 50,
#     }

#     try:
#         response = requests.get(
#             "https://places-api.foursquare.com/places/search",
#             headers=headers,
#             params=params,
#             timeout=15,
#         )
#         response.raise_for_status()
#         data = response.json()

#         venues = []
#         results = data.get("results", [])
#         print(f"  Found {len(results)} venues, getting details...")

#         for i, place in enumerate(results, 1):
#             fsq_id = place.get("fsq_id")

#             # Get detailed info
#             details = get_foursquare_details(fsq_id)

#             geocodes = place.get("geocodes", {}).get("main", {})
#             location_data = place.get("location", {})

#             # Extract website from details
#             website = details.get("website")
#             tel = details.get("tel")
#             rating = details.get("rating")

#             venues.append(
#                 {
#                     "source": "foursquare",
#                     "source_id": fsq_id,
#                     "name": place.get("name"),
#                     "address": location_data.get("formatted_address"),
#                     "latitude": geocodes.get("latitude"),
#                     "longitude": geocodes.get("longitude"),
#                     "phone": tel,
#                     "website": website,
#                     "rating": rating / 2
#                     if rating
#                     else None,  # Foursquare uses 0-10 scale
#                     "review_count": 0,
#                     "price_level": None,
#                 }
#             )

#             print(f"    [{i}/{len(results)}] {place.get('name')}")
#             time.sleep(0.5)  # Rate limiting for detail calls

#         print(f"  Total from Foursquare: {len(venues)}")
#         return venues

#     except Exception as e:
#         print(f"    Error: {e}")
#         return []


# ========================================================================
# MASTER SCRAPER
# ========================================================================


def scrape_london_all_sources():
    """Comprehensive scraper using all sources"""

    print("=" * 70)
    print("COMPREHENSIVE LONDON ESCAPE ROOM SCRAPER")
    print("=" * 70)

    all_venues_data = []
    seen_names = set()  # Track by name to avoid duplicates

    # ===== GOOGLE PLACES =====
    print("\n1. GOOGLE PLACES API")
    print("-" * 70)

    for i, query in enumerate(LONDON_SEARCHES, 1):
        print(f"[{i}/{len(LONDON_SEARCHES)}] {query}")
        venues = scrape_google_places(query)

        # Add unique only
        new = 0
        for v in venues:
            if v["name"] not in seen_names:
                seen_names.add(v["name"])
                all_venues_data.append(v)
                new += 1

        print(f"    {len(venues)} found, {new} new")
        time.sleep(1)

    print(f"\nGoogle total: {len(all_venues_data)} unique venues")

    # # ===== YELP =====
    # print("\n2. YELP API")
    # print("-" * 70)

    # yelp_venues = scrape_yelp_london()
    # yelp_new = 0
    # for v in yelp_venues:
    #     if v["name"] not in seen_names:
    #         seen_names.add(v["name"])
    #         all_venues_data.append(v)
    #         yelp_new += 1

    # print(f"Yelp added {yelp_new} new venues")

    # # ===== FOURSQUARE =====
    # print("\n3. FOURSQUARE API")
    # print("-" * 70)

    # fs_venues = scrape_foursquare_london()
    # fs_new = 0
    # for v in fs_venues:
    #     if v["name"] not in seen_names:
    #         seen_names.add(v["name"])
    #         all_venues_data.append(v)
    #         fs_new += 1

    # print(f"Foursquare added {fs_new} new venues")

    # ===== SAVE TO DATABASE =====
    print("\n" + "=" * 70)
    print("SAVING TO DATABASE")
    print("=" * 70)

    db = SessionLocal()
    venues_added = 0
    venues_updated = 0

    for i, venue_data in enumerate(all_venues_data, 1):
        try:
            # Check if exists (by name or source_id)
            existing = None
            if venue_data["source"] == "google" and venue_data["source_id"]:
                existing = (
                    db.query(Venue)
                    .filter(Venue.google_place_id == venue_data["source_id"])
                    .first()
                )

            if not existing:
                existing = (
                    db.query(Venue).filter(Venue.name == venue_data["name"]).first()
                )

            if existing:
                # Update
                if venue_data["rating"]:
                    existing.google_rating = venue_data["rating"]
                if venue_data["review_count"]:
                    existing.google_review_count = venue_data["review_count"]
                existing.last_scraped_at = datetime.now(UTC)
                venues_updated += 1
                print(f"[{i}/{len(all_venues_data)}] Updated: {existing.name}")

            else:
                venue = Venue(
                    name=venue_data["name"],
                    google_place_id=venue_data["source_id"]
                    if venue_data["source"] == "google"
                    else None,
                    address=venue_data["address"],
                    city="London",
                    state="England",
                    country="GB",
                    latitude=venue_data["latitude"],
                    longitude=venue_data["longitude"],
                    phone=venue_data["phone"],
                    website=venue_data["website"],
                    google_rating=venue_data["rating"],
                    google_review_count=venue_data["review_count"],
                    google_price_level=venue_data["price_level"],
                    data_source=venue_data["source"],
                    last_scraped_at=datetime.now(UTC),
                )

                if venue_data["latitude"] and venue_data["longitude"]:
                    venue.location = f"SRID=4326;POINT({venue_data['longitude']} {venue_data['latitude']})"

                db.add(venue)
                venues_added += 1
                print(
                    f"[{i}/{len(all_venues_data)}] Added: {venue.name} ({venue_data['source']})"
                )

        except Exception as e:
            print(f"  Error: {e}")
            continue

    db.commit()
    db.close()

    print("\n" + "=" * 70)
    print("FINAL RESULTS")
    print("=" * 70)
    print(f"  Total unique venues found: {len(all_venues_data)}")
    print(f"  New venues added: {venues_added}")
    print(f"  Existing updated: {venues_updated}")
    print("=" * 70)


if __name__ == "__main__":
    scrape_london_all_sources()
