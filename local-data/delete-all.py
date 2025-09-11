#!/usr/bin/env python3
"""
Development Data Cleanup Script

This script deletes all events, venues, and rooms from the local development database.
Use this to clean up your development environment.
"""

import requests
import sys
import time
from typing import List, Dict


class DataCleaner:
    """Handles cleanup of all development data."""

    def __init__(self, api_base_url: str = "http://localhost:3001/api"):
        self.api_base_url = api_base_url
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def check_server(self) -> bool:
        """Check if the server is running and accessible."""
        try:
            response = self.session.get(f"{self.api_base_url}/venues", timeout=5)
            return response.status_code == 200
        except requests.RequestException:
            return False

    def get_all_entities(self, entity_type: str) -> List[Dict]:
        """Fetch all entities of a given type from the API."""
        try:
            response = self.session.get(f"{self.api_base_url}/{entity_type}s")
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except requests.RequestException as e:
            print(f"❌ Failed to fetch {entity_type}s: {e}")
            return []

    def delete_entity(self, entity_type: str, entity_id: str) -> bool:
        """Delete an entity by ID."""
        try:
            response = self.session.delete(
                f"{self.api_base_url}/{entity_type}s/{entity_id}"
            )
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"   ⚠️  Failed to delete {entity_type} {entity_id}: {e}")
            return False

    def delete_all_entities(self, entity_type: str) -> int:
        """Delete all entities of a given type."""
        print(f"\n🗑️  Deleting all {entity_type}s...")

        entities = self.get_all_entities(entity_type)
        if not entities:
            print(f"   ℹ️  No {entity_type}s found")
            return 0

        deleted_count = 0
        for entity in entities:
            entity_id = entity.get(f"{entity_type}Id")
            entity_name = entity.get(
                "name", entity.get(f"{entity_type}Name", "Unknown")
            )

            if entity_id:
                print(f"   🗑️  Deleting {entity_type}: {entity_name} ({entity_id})")
                if self.delete_entity(entity_type, entity_id):
                    deleted_count += 1
                    time.sleep(0.1)  # Small delay to avoid overwhelming the server
                else:
                    print(f"   ❌ Failed to delete {entity_type}: {entity_name}")

        print(f"   ✅ Deleted {deleted_count}/{len(entities)} {entity_type}s")
        return deleted_count

    def cleanup_all_data(self) -> None:
        """Delete all events, venues, and rooms."""
        print("🧹 Starting complete data cleanup...")

        # Check if server is running
        print("📡 Checking if server is running...")
        if not self.check_server():
            print(
                "❌ Server is not running. Please start the server first with 'npm run dev'"
            )
            sys.exit(1)
        print("✅ Server is running")

        # Delete in order: events first, then rooms, then venues
        # This ensures we don't have orphaned references
        total_deleted = 0

        total_deleted += self.delete_all_entities("event")
        total_deleted += self.delete_all_entities("room")
        total_deleted += self.delete_all_entities("venue")

        print(f"\n🎯 Cleanup Complete!")
        print(f"   📊 Total entities deleted: {total_deleted}")

        if total_deleted == 0:
            print("   ℹ️  No data found to delete")
        else:
            print("   ✅ All development data has been removed")


def main():
    """Main entry point."""
    cleaner = DataCleaner()
    try:
        # Ask for confirmation
        print("⚠️  WARNING: This will delete ALL events, venues, and rooms!")
        response = input("Are you sure you want to continue? (yes/no): ")

        if response.lower() not in ["yes", "y"]:
            print("❌ Operation cancelled")
            sys.exit(0)

        cleaner.cleanup_all_data()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
