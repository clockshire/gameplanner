#!/usr/bin/env python3
"""
Development Data Population Script

This script populates the local development database with sample venues, rooms, and events.
It's designed to be idempotent - safe to run multiple times without creating duplicates.
"""

import requests
import sys
import time
from datetime import date
from dateutil.relativedelta import relativedelta
from typing import Dict, List, Optional, Tuple

# Constants
MONKEY_PUZZLE_VENUE = "Monkey Puzzle (Farnborough)"
DOUBLE_TREE_VENUE = "DoubleTree by Hilton Southampton"


class DataPopulator:
    """Handles population of development data with proper cleanup and error handling."""

    def __init__(self, api_base_url: str = "http://localhost:3001/api"):
        self.api_base_url = api_base_url
        self.user_id = "a6f3aec2-7d19-48d5-85a4-7602da37e79f"  # Test user ID
        self.session_token = None
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def check_server(self) -> bool:
        """Check if the server is running and accessible."""
        try:
            # Try a simple health check or a non-authenticated endpoint
            response = self.session.get(
                f"{self.api_base_url.replace('/api', '')}/", timeout=5
            )
            return response.status_code == 200
        except requests.RequestException:
            # If that fails, try the venues endpoint and accept 401 as "server running"
            try:
                response = self.session.get(f"{self.api_base_url}/venues", timeout=5)
                return response.status_code in [
                    200,
                    401,
                ]  # 401 means server is running but auth required
            except requests.RequestException:
                return False

    def authenticate(self) -> bool:
        """Authenticate and get session token."""
        try:
            # First try to sign up (in case user doesn't exist)
            signup_data = {"email": "test@example.com", "name": "Test User"}

            signup_response = self.session.post(
                f"{self.api_base_url}/auth/signup", json=signup_data
            )
            if signup_response.status_code not in [
                200,
                201,
                409,
            ]:  # 409 = user already exists
                print(f"⚠️  Signup failed: {signup_response.status_code}")

            # Now try to login
            login_data = {"email": "test@example.com", "password": "password123"}

            login_response = self.session.post(
                f"{self.api_base_url}/auth/login", json=login_data
            )
            if login_response.status_code == 200:
                data = login_response.json()
                self.session_token = data.get("data", {}).get("sessionToken")
                if self.session_token:
                    self.session.headers.update(
                        {"Authorization": f"Bearer {self.session_token}"}
                    )
                    print("✅ Authentication successful")
                    return True
                else:
                    print("❌ No session token received")
                    return False
            else:
                print(f"❌ Login failed: {login_response.status_code}")
                return False
        except requests.RequestException as e:
            print(f"❌ Authentication error: {e}")
            return False

    def get_all_venues(self) -> List[Dict]:
        """Fetch all existing venues from the API."""
        try:
            response = self.session.get(f"{self.api_base_url}/venues")
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except requests.RequestException as e:
            print(f"❌ Failed to fetch venues: {e}")
            return []

    def get_all_events(self) -> List[Dict]:
        """Fetch all existing events from the API."""
        try:
            response = self.session.get(f"{self.api_base_url}/events")
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except requests.RequestException as e:
            print(f"❌ Failed to fetch events: {e}")
            return []

    def get_all_rooms(self) -> List[Dict]:
        """Fetch all existing rooms from the API."""
        try:
            response = self.session.get(f"{self.api_base_url}/rooms")
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except requests.RequestException as e:
            print(f"❌ Failed to fetch rooms: {e}")
            return []

    def find_venue_by_name(self, venue_name: str) -> Optional[Dict]:
        """Find a venue by its name."""
        venues = self.get_all_venues()
        for venue in venues:
            if venue.get("venueName") == venue_name:
                return venue
        return None

    def delete_entity(self, entity_type: str, entity_id: str) -> bool:
        """Delete an entity (venue, room, or event) by ID."""
        try:
            response = self.session.delete(
                f"{self.api_base_url}/{entity_type}s/{entity_id}"
            )
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"   ⚠️  Failed to delete {entity_type} {entity_id}: {e}")
            return False

    def cleanup_venue_data(self, venue_id: str, venue_name: str) -> None:
        """Clean up all data associated with a venue."""
        print(f"🧹 Cleaning up existing data for {venue_name}...")

        # Delete all events for this venue
        events = self.get_all_events()
        for event in events:
            if event.get("venueId") == venue_id:
                event_id = event.get("eventId")
                if event_id:
                    print(f"   🗑️  Deleting event: {event_id}")
                    self.delete_entity("event", event_id)

        # Delete all rooms for this venue
        rooms = self.get_all_rooms()
        for room in rooms:
            if room.get("venueId") == venue_id:
                room_id = room.get("roomId")
                if room_id:
                    print(f"   🗑️  Deleting room: {room_id}")
                    self.delete_entity("room", room_id)

        # Delete the venue itself
        print(f"   🗑️  Deleting venue: {venue_id}")
        self.delete_entity("venue", venue_id)

        # Small delay to ensure deletion is processed
        time.sleep(0.5)

    def create_venue(self, venue_data: Dict) -> Optional[str]:
        """Create a venue and return its ID."""
        try:
            response = self.session.post(f"{self.api_base_url}/venues", json=venue_data)
            response.raise_for_status()
            result = response.json()
            venue_id = result.get("data", {}).get("venueId")
            if venue_id:
                print(f"✅ Created venue: {venue_data['name']} (ID: {venue_id})")
                return venue_id
            else:
                print(
                    f"❌ Failed to create venue {venue_data['name']}: No venue ID returned"
                )
                return None
        except requests.RequestException as e:
            print(f"❌ Failed to create venue {venue_data['name']}: {e}")
            return None

    def create_room(self, room_data: Dict) -> Optional[str]:
        """Create a room and return its ID."""
        try:
            response = self.session.post(f"{self.api_base_url}/rooms", json=room_data)
            response.raise_for_status()
            result = response.json()
            room_id = result.get("data", {}).get("roomId")
            room_name = room_data.get(
                "name", "Unknown Room"
            )  # Use 'name' field instead of 'roomName'
            if room_id:
                print(f"✅ Created room: {room_name} (ID: {room_id})")
                return room_id
            else:
                print(f"❌ Failed to create room {room_name}: No room ID returned")
                return None
        except requests.RequestException as e:
            room_name = room_data.get("name", "Unknown Room")
            print(f"❌ Failed to create room {room_name}: {e}")
            return None

    def create_event(self, event_data: Dict) -> Optional[str]:
        """Create an event and return its ID."""
        try:
            response = self.session.post(f"{self.api_base_url}/events", json=event_data)
            response.raise_for_status()
            result = response.json()
            event_id = result.get("data", {}).get("eventId")
            event_name = event_data.get(
                "name", "Unknown Event"
            )  # Use 'name' field instead of 'eventName'
            if event_id:
                print(f"✅ Created event: {event_name} (ID: {event_id})")
                return event_id
            else:
                print(f"❌ Failed to create event {event_name}: No event ID returned")
                return None
        except requests.RequestException as e:
            event_name = event_data.get("name", "Unknown Event")
            print(f"❌ Failed to create event {event_name}: {e}")
            return None

    def assign_room_to_event(
        self, event_id: str, room_id: str, event_data: Dict
    ) -> bool:
        """Assign a room to an event with availability matching the event time."""
        try:
            # Create event room assignment data
            event_room_data = {
                "eventId": event_id,
                "roomId": room_id,
                "availableFrom": event_data["eventDate"]
                + "T"
                + event_data["startTime"]
                + ":00",
                "availableTo": event_data["endDate"]
                + "T"
                + event_data["endTime"]
                + ":00",
            }

            response = self.session.post(
                f"{self.api_base_url}/event-rooms", json=event_room_data
            )
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"   ⚠️  Failed to assign room {room_id} to event {event_id}: {e}")
            return False

    def populate_data(self) -> None:
        """Main method to populate all development data."""
        print("🚀 Starting development data population...")

        # Check if server is running
        print("📡 Checking if server is running...")
        if not self.check_server():
            print(
                "❌ Server is not running. Please start the server first with 'npm run dev'"
            )
            sys.exit(1)
        print("✅ Server is running")

        # Authenticate to get session token
        print("🔐 Authenticating...")
        if not self.authenticate():
            print("❌ Authentication failed. Please check your credentials.")
            sys.exit(1)

        # Define venue data
        venues_data = [
            {
                "name": MONKEY_PUZZLE_VENUE,
                "description": "Laid-back family pub/restaurant chain serving classic dishes & international favourites.",
                "address": "101 Ively Rd, Cove, Farnborough GU14 0LE",
                "contactPhone": "+44 1252 546654",
                "contactEmail": "",
                "websiteURL": "https://www.brewersfayre.co.uk/en-gb/locations/hampshire/monkey-puzzle?cid=GLBC_location41015125",
                "capacity": 30,
                "mapLink": "https://maps.app.goo.gl/jxwgd532cFiAmDRJ7",
            },
            {
                "name": DOUBLE_TREE_VENUE,
                "description": "Set in wooded gardens off the M27 motorway, this informal hotel is 3 miles from Southampton International Airport and 5 miles from Southampton Docks.",
                "address": "Bracken Pl, Chilworth, Southampton SO16 3RB",
                "contactPhone": "+44 2380 702700",
                "contactEmail": "",
                "websiteURL": "https://www.hilton.com/en/hotels/souhndi-doubletree-southampton/?SEO_id=GMB-EMEA-DI-SOUHNDI",
                "capacity": 200,
                "mapLink": "https://maps.app.goo.gl/fXmwzS9bBSHBD7MU6",
            },
        ]

        # Define room data for each venue
        rooms_data = {
            MONKEY_PUZZLE_VENUE: [
                {
                    "roomName": "Main Area",
                    "capacity": 30,
                    "description": "Large open area with tables and chairs",
                },
                {
                    "roomName": "Back Room",
                    "capacity": 15,
                    "description": "Smaller private area at the back",
                },
            ],
            DOUBLE_TREE_VENUE: [
                {
                    "roomName": "Chilworth Suite",
                    "capacity": 30,
                    "description": "Spacious conference suite with modern amenities",
                },
                {
                    "roomName": "Garden Suite",
                    "capacity": 30,
                    "description": "Bright suite overlooking the gardens",
                },
                {
                    "roomName": "Adams Suite",
                    "capacity": 30,
                    "description": "Executive suite with premium facilities",
                },
                {
                    "roomName": "Austen Suite",
                    "capacity": 30,
                    "description": "Classic suite with traditional decor",
                },
                {
                    "roomName": "Hardy Suite",
                    "capacity": 30,
                    "description": "Contemporary suite with modern technology",
                },
                {
                    "roomName": "The Boardroom",
                    "capacity": 20,
                    "description": "Intimate meeting space for smaller groups",
                },
                {
                    "roomName": "Frome Suite",
                    "capacity": 12,
                    "description": "Compact suite perfect for focused discussions",
                },
            ],
        }

        # Calculate dynamic dates
        today = date.today()
        past_date_1 = today - relativedelta(months=2)  # 2 months ago
        past_date_2 = today - relativedelta(months=4)  # 4 months ago
        future_date_1 = today + relativedelta(months=3)  # 3 months from now
        future_date_2 = today + relativedelta(months=4)  # 4 months from now

        # Calculate 2nd Tuesday of next month
        next_month = today + relativedelta(months=1, day=1)
        # Find first Tuesday of next month
        first_tuesday = next_month + relativedelta(days=(1 - next_month.weekday()) % 7)
        future_next_month_2nd_tuesday = first_tuesday + relativedelta(weeks=1)

        # Calculate 4th Tuesday of next month
        future_next_month_4th_tuesday = first_tuesday + relativedelta(weeks=3)

        # Define event data - past and future events for each venue
        events_data = [
            # Monkey Puzzle - Past Event
            {
                "name": "Board Game Championship - Monkey Puzzle",
                "description": "Monthly board game tournament featuring strategy games. Winners receive prizes!",
                "eventDate": past_date_2.strftime("%Y-%m-%d"),
                "startTime": "14:00",
                "endDate": past_date_2.strftime("%Y-%m-%d"),
                "endTime": "20:00",
                "venueName": MONKEY_PUZZLE_VENUE,
                "maxParticipants": 25,
                "entryFee": 5,
                "eventType": "SOCIAL",
                "isPublic": True,
                "requiresApproval": False,
            },
            # Monkey Puzzle - Future Event
            {
                "name": "Board Game Night - Monkey Puzzle",
                "description": "Weekly board game night at Monkey Puzzle. Bring your own games or play ours!",
                "eventDate": future_date_1.strftime("%Y-%m-%d"),
                "startTime": "18:00",
                "endDate": future_date_1.strftime("%Y-%m-%d"),
                "endTime": "22:00",
                "venueName": MONKEY_PUZZLE_VENUE,
                "maxParticipants": 30,
                "entryFee": 0,
                "eventType": "SOCIAL",
                "isPublic": True,
                "requiresApproval": False,
            },
            # Monkey Puzzle - Clocktower Beginner
            {
                "name": "Clocktower (Beginner Friendly)",
                "description": "Learn to play Blood on the Clocktower! Perfect for newcomers to the game. Experienced players welcome to help teach.",
                "eventDate": future_next_month_2nd_tuesday.strftime("%Y-%m-%d"),
                "startTime": "19:00",
                "endDate": future_next_month_2nd_tuesday.strftime("%Y-%m-%d"),
                "endTime": "22:30",
                "venueName": MONKEY_PUZZLE_VENUE,
                "maxParticipants": 15,
                "entryFee": 0,
                "eventType": "SOCIAL",
                "isPublic": True,
                "requiresApproval": False,
            },
            # Monkey Puzzle - Clocktower Intermediate+
            {
                "name": "Clocktower (Intermediate+)",
                "description": "Advanced Blood on the Clocktower sessions for experienced players. Complex scripts and challenging scenarios.",
                "eventDate": future_next_month_4th_tuesday.strftime("%Y-%m-%d"),
                "startTime": "19:00",
                "endDate": future_next_month_4th_tuesday.strftime("%Y-%m-%d"),
                "endTime": "22:30",
                "venueName": MONKEY_PUZZLE_VENUE,
                "maxParticipants": 15,
                "entryFee": 0,
                "eventType": "SOCIAL",
                "isPublic": True,
                "requiresApproval": False,
            },
            # DoubleTree - Past Event
            {
                "name": "Clockshire '25",
                "description": "Quarterly corporate retreat with team building activities and presentations.",
                "eventDate": past_date_1.strftime("%Y-%m-%d"),
                "startTime": "08:00",
                "endDate": past_date_1.strftime("%Y-%m-%d"),
                "endTime": "18:00",
                "venueName": DOUBLE_TREE_VENUE,
                "maxParticipants": 80,
                "entryFee": 75,
                "eventType": "CORPORATE",
                "isPublic": False,
                "requiresApproval": True,
            },
            # DoubleTree - Future Event
            {
                "name": "Clockshire '26",
                "description": "Team building event with various activities and games.",
                "eventDate": future_date_2.strftime("%Y-%m-%d"),
                "startTime": "09:00",
                "endDate": future_date_2.strftime("%Y-%m-%d"),
                "endTime": "17:00",
                "venueName": DOUBLE_TREE_VENUE,
                "maxParticipants": 100,
                "entryFee": 50,
                "eventType": "CORPORATE",
                "isPublic": False,
                "requiresApproval": True,
            },
        ]

        created_venues = {}

        # Create venues
        print("\n🏢 Creating venues...")
        for venue_data in venues_data:
            venue_name = str(venue_data["name"])
            print(f"\n🏢 Processing venue: {venue_name}")

            # Check if venue already exists
            existing_venue = self.find_venue_by_name(venue_name)
            if existing_venue:
                print(f"   ℹ️  Venue already exists, cleaning up and recreating...")
                self.cleanup_venue_data(existing_venue["venueId"], venue_name)

            # Create the venue
            venue_id = self.create_venue(venue_data)
            if venue_id:
                created_venues[venue_name] = venue_id

        # Create rooms for each venue
        print("\n🏠 Creating rooms...")
        created_rooms = {}

        for venue_name, rooms in rooms_data.items():
            if venue_name not in created_venues:
                print(f"   ⚠️  Skipping rooms for {venue_name} - venue not created")
                continue

            venue_id = created_venues[venue_name]
            print(f"\n🏠 Creating rooms for {venue_name}:")

            for room_data in rooms:
                room_name = room_data["roomName"]  # Store original room name
                room_data_copy = room_data.copy()  # Work with a copy
                room_data_copy["venueId"] = venue_id
                room_data_copy["name"] = room_name  # Use stored name
                del room_data_copy["roomName"]  # Remove the old key
                room_id = self.create_room(room_data_copy)
                if room_id:
                    created_rooms[room_id] = {
                        "roomName": room_name,  # Use stored room name
                        "venueName": venue_name,
                    }

        # Create events
        print("\n🎉 Creating events...")
        created_events = []

        for event_data in events_data:
            venue_name = str(event_data["venueName"])
            if venue_name not in created_venues:
                print(f"   ⚠️  Skipping event {event_data['name']} - venue not created")
                continue

            event_data["venueId"] = created_venues[venue_name]

            event_id = self.create_event(event_data)
            if event_id:
                created_events.append(event_id)

                # For Monkey Puzzle events, assign all available rooms
                if venue_name == MONKEY_PUZZLE_VENUE:
                    print(f"   🏠 Assigning rooms to {event_data['name']}...")
                    venue_id = created_venues[venue_name]

                    # Find all rooms for this venue
                    for room_id, room_info in created_rooms.items():
                        if room_info["venueName"] == venue_name:
                            success = self.assign_room_to_event(
                                event_id, room_id, event_data
                            )
                            if success:
                                print(f"     ✅ Assigned room: {room_info['roomName']}")
                            else:
                                print(
                                    f"     ❌ Failed to assign room: {room_info['roomName']}"
                                )

        # Summary
        print(f"\n🎯 Population Complete!")
        print(f"   📊 Created {len(created_venues)} venues")
        print(f"   🏠 Created {len(created_rooms)} rooms")
        print(f"   🎉 Created {len(created_events)} events")

        print(f"\n📋 Created Venue IDs:")
        for venue_name, venue_id in created_venues.items():
            print(f"   • {venue_name}: {venue_id}")

        print(f"\n🏠 Created Room IDs:")
        for room_id, room_info in created_rooms.items():
            print(f"   • {room_info['roomName']} ({room_info['venueName']}): {room_id}")

        print(f"\n🎉 Created Event IDs:")
        for event_id in created_events:
            print(f"   • Event: {event_id}")


def main():
    """Main entry point."""
    populator = DataPopulator()
    try:
        populator.populate_data()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
