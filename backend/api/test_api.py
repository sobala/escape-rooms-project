"""
Test Script for Map API
Run this to test your API endpoints with sample data
"""

import requests
import json

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health check"""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")


def test_map_basic():
    """Test basic map search"""
    print("Testing basic map search (NYC)...")

    params = {
        "lat": 40.7516,  # NYC coordinates
        "lng": -73.9800,
        "radius": 10,  # 10km radius
        "page": 1,
        "page_size": 20,
    }

    response = requests.get(f"{BASE_URL}/api/rooms/map", params=params)
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"Total rooms found: {data['total']}")
        print(f"Showing {len(data['rooms'])} rooms on page {data['page']}\n")

        # Show first room
        if data["rooms"]:
            room = data["rooms"][0]
            print(f"First room: {room['name']}")
            print(f"  Venue: {room['venue']['name']}")
            print(f"  Distance: {room['distance_km']} km")
            print(f"  Theme: {room['theme']}")
            print(f"  Difficulty: {room['difficulty']}/5")
            print(f"  Price: ${room['base_price']}\n")
    else:
        print(f"Error: {response.text}\n")


def test_map_filters():
    """Test map search with filters"""
    print("Testing filtered search (Horror, 6 players, max $40)...")

    params = {
        "lat": 40.7516,
        "lng": -73.9800,
        "radius": 20,
        "theme": "Horror",
        "group_size": 6,
        "max_price": 40,
        "min_difficulty": 3,
        "sort_by": "popularity",
        "page": 1,
        "page_size": 10,
    }

    response = requests.get(f"{BASE_URL}/api/rooms/map", params=params)
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"Filtered results: {data['total']} rooms\n")

        for i, room in enumerate(data["rooms"][:3], 1):
            print(f"{i}. {room['name']}")
            print(f"   {room['venue']['name']} - {room['distance_km']} km")
            print(
                f"   {room['theme']} | Difficulty: {room['difficulty']}/5 | ${room['base_price']}"
            )
    else:
        print(f"Error: {response.text}\n")


def test_themes():
    """Test getting all themes"""
    print("Testing themes endpoint...")

    response = requests.get(f"{BASE_URL}/api/rooms/themes")
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"Available themes: {', '.join(data['themes'])}\n")
    else:
        print(f"Error: {response.text}\n")


def test_room_detail():
    """Test getting room by slug"""
    print("Testing room detail endpoint...")

    # You'll need to replace this with an actual slug from your database
    slug = "haunted-mansion-nyc"

    response = requests.get(f"{BASE_URL}/api/rooms/{slug}")
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        room = response.json()
        print(f"Room: {room['name']}")
        print(f"Description: {room['short_description']}")
        print(f"View count: {room['view_count']}\n")
    else:
        print(f"Error: {response.text}\n")


def test_different_cities():
    """Test searches in different cities"""
    cities = [
        {"name": "NYC", "lat": 40.7516, "lng": -73.9800},
        {"name": "LA", "lat": 34.0522, "lng": -118.2437},
        {"name": "Chicago", "lat": 41.8781, "lng": -87.6298},
        {"name": "Austin", "lat": 30.2672, "lng": -97.7431},
    ]

    print("Testing searches in different cities...\n")

    for city in cities:
        params = {"lat": city["lat"], "lng": city["lng"], "radius": 15, "page_size": 5}

        response = requests.get(f"{BASE_URL}/api/rooms/map", params=params)

        if response.status_code == 200:
            data = response.json()
            print(f"{city['name']}: {data['total']} rooms found")
        else:
            print(f"{city['name']}: Error")


if __name__ == "__main__":
    print("=" * 60)
    print("ESCAPE ROOM FINDER API TESTS")
    print("=" * 60 + "\n")

    try:
        # Run all tests
        test_health()
        test_map_basic()
        test_map_filters()
        test_themes()
        # test_room_detail()  # Uncomment when you have real slugs
        test_different_cities()

        print("\n" + "=" * 60)
        print("All tests completed!")
        print("=" * 60)

    except requests.exceptions.ConnectionError:
        print("\nERROR: Could not connect to API")
        print("Make sure the server is running:")
        print("  uvicorn main:app --reload --port 8000\n")
    except Exception as e:
        print(f"\nERROR: {e}\n")
