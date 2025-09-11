#!/bin/bash

# Populate Development Data Script
# This script creates base data for local development
# Run with: bash local-data/populate-dev-data.sh

set -e  # Exit on any error

# Configuration
API_BASE_URL="http://localhost:3001/api"
USER_ID="a6f3aec2-7d19-48d5-85a4-7602da37e79f"  # Chisel's user ID from existing data

echo "🚀 Starting development data population..."

# Check if server is running
echo "📡 Checking if server is running..."
if ! curl -s "$API_BASE_URL/venues" > /dev/null 2>&1; then
    echo "❌ Server is not running. Please start the server first with 'npm run dev'"
    exit 1
fi
echo "✅ Server is running"

# Create Venue 1: Monkey Puzzle (Farnborough)
echo "🏢 Creating venue: Monkey Puzzle (Farnborough)..."
VENUE1_RESPONSE=$(curl -s -X POST "$API_BASE_URL/venues" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monkey Puzzle (Farnborough)",
    "description": "Laid-back family pub/restaurant chain serving classic dishes & international favourites.",
    "address": "101 Ively Rd, Cove, Farnborough GU14 0LE",
    "contactPhone": "+44 1252 546654",
    "contactEmail": "",
    "websiteURL": "https://www.brewersfayre.co.uk/en-gb/locations/hampshire/monkey-puzzle?cid=GLBC_location41015125",
    "capacity": 30,
    "mapLink": "https://maps.app.goo.gl/jxwgd532cFiAmDRJ7"
  }')

echo "Venue 1 response: $VENUE1_RESPONSE"
VENUE1_ID=$(echo "$VENUE1_RESPONSE" | grep -o '"venueId":"[^"]*"' | cut -d'"' -f4)
echo "✅ Created venue 1 with ID: $VENUE1_ID"

# Create Venue 2: DoubleTree by Hilton Southampton
echo "🏨 Creating venue: DoubleTree by Hilton Southampton..."
VENUE2_RESPONSE=$(curl -s -X POST "$API_BASE_URL/venues" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DoubleTree by Hilton Southampton",
    "description": "Set in wooded gardens off the M27 motorway, this informal hotel is 3 miles from Southampton International Airport and 5 miles from Southampton Docks.",
    "address": "Bracken Pl, Chilworth, Southampton SO16 3RB",
    "contactPhone": "+44 2380 702700",
    "contactEmail": "",
    "websiteURL": "https://www.hilton.com/en/hotels/souhndi-doubletree-southampton/?SEO_id=GMB-EMEA-DI-SOUHNDI",
    "capacity": 200,
    "mapLink": "https://maps.app.goo.gl/fXmwzS9bBSHBD7MU6"
  }')

echo "Venue 2 response: $VENUE2_RESPONSE"
VENUE2_ID=$(echo "$VENUE2_RESPONSE" | grep -o '"venueId":"[^"]*"' | cut -d'"' -f4)
echo "✅ Created venue 2 with ID: $VENUE2_ID"

# Create Room 1: Main Area (belongs to Monkey Puzzle)
echo "🏠 Creating room: Main Area (Monkey Puzzle)..."
ROOM1_RESPONSE=$(curl -s -X POST "$API_BASE_URL/rooms" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Main Area\",
    \"description\": \"The main gaming area with large tables perfect for board games\",
    \"venueId\": \"$VENUE1_ID\",
    \"capacity\": 20,
    \"roomType\": \"Gaming Area\",
    \"amenities\": [\"Large Tables\", \"Game Library Access\", \"Refreshments Nearby\"]
  }")

echo "Room 1 response: $ROOM1_RESPONSE"
ROOM1_ID=$(echo "$ROOM1_RESPONSE" | grep -o '"roomId":"[^"]*"' | cut -d'"' -f4)
echo "✅ Created room 1 with ID: $ROOM1_ID"

# Create Room 2: Evil Corner (belongs to Monkey Puzzle)
echo "🏠 Creating room: Evil Corner (Monkey Puzzle)..."
ROOM2_RESPONSE=$(curl -s -X POST "$API_BASE_URL/rooms" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Evil Corner\",
    \"description\": \"A smaller, more intimate space for strategy games and competitive play\",
    \"venueId\": \"$VENUE1_ID\",
    \"capacity\": 8,
    \"roomType\": \"Strategy Gaming\",
    \"amenities\": [\"Quiet Environment\", \"Strategy Game Collection\", \"Timer Access\"]
  }")

echo "Room 2 response: $ROOM2_RESPONSE"
ROOM2_ID=$(echo "$ROOM2_RESPONSE" | grep -o '"roomId":"[^"]*"' | cut -d'"' -f4)
echo "✅ Created room 2 with ID: $ROOM2_ID"

# Create Event: Clockshire 2026 (held at DoubleTree)
echo "🎉 Creating event: Clockshire 2026 (DoubleTree)..."
EVENT_RESPONSE=$(curl -s -X POST "$API_BASE_URL/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Clockshire 2026\",
    \"description\": \"The annual Clockshire board game convention - a weekend of gaming, tournaments, and community\",
    \"eventDate\": \"2026-03-15\",
    \"endDate\": \"2026-03-17\",
    \"startTime\": \"09:00\",
    \"endTime\": \"18:00\",
    \"venueId\": \"$VENUE2_ID\",
    \"maxParticipants\": 150,
    \"createdBy\": \"$USER_ID\"
  }")

echo "Event response: $EVENT_RESPONSE"
EVENT_ID=$(echo "$EVENT_RESPONSE" | grep -o '"eventId":"[^"]*"' | cut -d'"' -f4)
echo "✅ Created event with ID: $EVENT_ID"

echo ""
echo "🎉 Development data population complete!"
echo ""
echo "📋 Created:"
echo "   🏢 Venues: 2"
echo "   🏠 Rooms: 2 (both at Monkey Puzzle)"
echo "   🎉 Events: 1 (Clockshire 2026 at DoubleTree)"
echo ""
echo "🔗 You can now view the data in your application at http://localhost:3000"
echo ""
echo "📝 IDs for reference:"
echo "   Venue 1 (Monkey Puzzle): $VENUE1_ID"
echo "   Venue 2 (DoubleTree): $VENUE2_ID"
echo "   Room 1 (Main Area): $ROOM1_ID"
echo "   Room 2 (Evil Corner): $ROOM2_ID"
echo "   Event (Clockshire 2026): $EVENT_ID"
