#!/usr/bin/env python3
"""
Venue Listing Script

This script lists all venues in the database along with information about who created each one.
It connects directly to DynamoDB to access the raw data including the createdBy field.
"""

import boto3
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from botocore.exceptions import ClientError, NoCredentialsError


class VenueLister:
    """Handles listing venues and their creators from DynamoDB."""

    def __init__(self, endpoint_url: str = "http://localhost:8000"):
        """Initialize the VenueLister with DynamoDB configuration."""
        self.endpoint_url = endpoint_url
        self.region = "us-east-1"
        self.venues_table = "venues"
        self.users_table = "users"

        # Configure DynamoDB client for local development
        self.dynamodb = boto3.resource(
            "dynamodb",
            endpoint_url=endpoint_url,
            region_name=self.region,
            aws_access_key_id="dummy",
            aws_secret_access_key="dummy",
        )

        self.dynamodb_client = boto3.client(
            "dynamodb",
            endpoint_url=endpoint_url,
            region_name=self.region,
            aws_access_key_id="dummy",
            aws_secret_access_key="dummy",
        )

    def test_connection(self) -> bool:
        """Test the DynamoDB connection."""
        try:
            # Try to list tables to test connection
            response = self.dynamodb_client.list_tables()
            print("✅ DynamoDB connection successful")
            return True
        except Exception as e:
            print(f"❌ DynamoDB connection failed: {e}")
            return False

    def get_all_venues(self) -> List[Dict]:
        """Fetch all venues from the venues table."""
        try:
            table = self.dynamodb.Table(self.venues_table)

            # Scan for all venues
            response = table.scan(
                FilterExpression="entityType = :entityType",
                ExpressionAttributeValues={":entityType": "VENUE"},
            )

            venues = response.get("Items", [])

            # Handle pagination if there are more items
            while "LastEvaluatedKey" in response:
                response = table.scan(
                    FilterExpression="entityType = :entityType",
                    ExpressionAttributeValues={":entityType": "VENUE"},
                    ExclusiveStartKey=response["LastEvaluatedKey"],
                )
                venues.extend(response.get("Items", []))

            return venues

        except ClientError as e:
            print(f"❌ Error fetching venues: {e}")
            return []
        except Exception as e:
            print(f"❌ Unexpected error fetching venues: {e}")
            return []

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user information by user ID."""
        try:
            table = self.dynamodb.Table(self.users_table)

            response = table.get_item(Key={"PK": f"USER#{user_id}", "SK": "PROFILE"})

            return response.get("Item")

        except ClientError as e:
            print(f"❌ Error fetching user {user_id}: {e}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error fetching user {user_id}: {e}")
            return None

    def get_all_users(self) -> Dict[str, Dict]:
        """Get all users and return as a dictionary keyed by user ID."""
        try:
            table = self.dynamodb.Table(self.users_table)

            # Scan for all user profiles
            response = table.scan(
                FilterExpression="SK = :sk",
                ExpressionAttributeValues={":sk": "PROFILE"},
            )

            users = response.get("Items", [])

            # Handle pagination if there are more items
            while "LastEvaluatedKey" in response:
                response = table.scan(
                    FilterExpression="SK = :sk",
                    ExpressionAttributeValues={":sk": "PROFILE"},
                    ExclusiveStartKey=response["LastEvaluatedKey"],
                )
                users.extend(response.get("Items", []))

            # Create a dictionary keyed by user ID
            users_dict = {}
            for user in users:
                if "userId" in user:
                    users_dict[user["userId"]] = user

            return users_dict

        except ClientError as e:
            print(f"❌ Error fetching users: {e}")
            return {}
        except Exception as e:
            print(f"❌ Unexpected error fetching users: {e}")
            return {}

    def format_date(self, date_string: str) -> str:
        """Format a date string for display."""
        try:
            if not date_string:
                return "Unknown"

            # Parse the ISO date string
            dt = datetime.fromisoformat(date_string.replace("Z", "+00:00"))
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return date_string

    def list_venues_with_creators(self) -> None:
        """List all venues with their creator information."""
        print("🏢 Venue Listing Report")
        print("=" * 80)

        # Test connection first
        if not self.test_connection():
            print(
                "❌ Cannot connect to DynamoDB. Please ensure DynamoDB Local is running."
            )
            return

        # Get all venues
        print("\n📋 Fetching venues...")
        venues = self.get_all_venues()

        if not venues:
            print("ℹ️  No venues found in the database.")
            return

        # Get all users for lookup
        print("👥 Fetching user information...")
        users = self.get_all_users()

        print(f"\n📊 Found {len(venues)} venues:")
        print("-" * 80)

        # Sort venues by creation date (newest first)
        venues.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

        for i, venue in enumerate(venues, 1):
            venue_name = venue.get("venueName", "Unknown Venue")
            venue_id = venue.get("venueId", "Unknown ID")
            created_by = venue.get("createdBy", "Unknown")
            created_at = self.format_date(venue.get("createdAt", ""))
            address = venue.get("address", "No address")
            capacity = venue.get("capacity", 0)

            # Get creator information
            creator_info = "Unknown Creator"
            if created_by in users:
                user = users[created_by]
                user_name = user.get("name", "Unknown Name")
                user_email = user.get("email", "Unknown Email")
                creator_info = f"{user_name} ({user_email})"
            elif created_by != "Unknown":
                creator_info = f"User ID: {created_by} (not found in users table)"

            print(f"\n{i}. {venue_name}")
            print(f"   ID: {venue_id}")
            print(f"   Address: {address}")
            print(f"   Capacity: {capacity}")
            print(f"   Created: {created_at}")
            print(f"   Creator: {creator_info}")

            # Show additional details if available
            if venue.get("description"):
                desc = venue["description"][:100]
                if len(venue["description"]) > 100:
                    desc += "..."
                print(f"   Description: {desc}")

            if venue.get("contactEmail"):
                print(f"   Contact: {venue['contactEmail']}")

            if venue.get("websiteURL"):
                print(f"   Website: {venue['websiteURL']}")

        print("\n" + "=" * 80)
        print(f"📊 Summary: {len(venues)} venues found")

        # Show creator statistics
        creator_counts: Dict[str, int] = {}
        for venue in venues:
            created_by = venue.get("createdBy", "Unknown")
            creator_counts[created_by] = creator_counts.get(created_by, 0) + 1

        print("\n👥 Venues by Creator:")
        for creator_id, count in sorted(
            creator_counts.items(), key=lambda x: x[1], reverse=True
        ):
            if creator_id in users:
                user = users[creator_id]
                creator_name = user.get("name", "Unknown Name")
                creator_email = user.get("email", "Unknown Email")
                print(f"   {creator_name} ({creator_email}): {count} venues")
            else:
                print(f"   User ID {creator_id}: {count} venues (user not found)")

    def list_venues_without_creators(self) -> None:
        """List venues that don't have a createdBy field (for debugging)."""
        print("🔍 Checking for venues without creator information...")

        venues = self.get_all_venues()
        venues_without_creator = [
            v for v in venues if "createdBy" not in v or not v["createdBy"]
        ]

        if venues_without_creator:
            print(
                f"⚠️  Found {len(venues_without_creator)} venues without creator information:"
            )
            for venue in venues_without_creator:
                print(
                    f"   - {venue.get('venueName', 'Unknown')} ({venue.get('venueId', 'Unknown ID')})"
                )
        else:
            print("✅ All venues have creator information")


def main():
    """Main function to run the venue listing script."""
    print("🚀 Starting Venue Listing Script")
    print("=" * 50)

    # Check if DynamoDB Local is running
    lister = VenueLister()

    try:
        # List venues with creators
        lister.list_venues_with_creators()

        # Also check for venues without creators
        print("\n")
        lister.list_venues_without_creators()

    except KeyboardInterrupt:
        print("\n\n⏹️  Script interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

    print("\n✅ Script completed successfully")


if __name__ == "__main__":
    main()
