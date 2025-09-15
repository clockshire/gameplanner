#!/usr/bin/env python3
"""
Delete specific events from DynamoDB
"""

import boto3
import sys
from botocore.exceptions import ClientError


class EventDeleter:
    def __init__(self):
        """Initialize DynamoDB client"""
        self.dynamodb = boto3.resource(
            "dynamodb",
            endpoint_url="http://localhost:8000",
            region_name="us-east-1",
            aws_access_key_id="dummy",
            aws_secret_access_key="dummy",
        )
        self.events_table = self.dynamodb.Table("events")

    def delete_event(self, event_id: str) -> bool:
        """
        Delete a specific event by ID

        Args:
            event_id: The event ID to delete

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            print(f"Deleting event: {event_id}")

            # Construct the composite key
            pk = f"EVENT#{event_id}"
            sk = f"EVENT#{event_id}"

            # First, check if the event exists
            response = self.events_table.get_item(Key={"PK": pk, "SK": sk})

            if "Item" not in response:
                print(f"  ❌ Event {event_id} not found")
                return False

            event = response["Item"]
            print(f"  📋 Event details:")
            print(f"     - Name: {event.get('eventName', 'Unknown')}")
            print(f"     - Created by: {event.get('createdBy', 'Unknown')}")
            print(f"     - Venue ID: {event.get('venueId', 'None')}")

            # Delete the event
            self.events_table.delete_item(Key={"PK": pk, "SK": sk})
            print(f"  ✅ Successfully deleted event {event_id}")
            return True

        except ClientError as e:
            print(f"  ❌ Error deleting event {event_id}: {e}")
            return False
        except Exception as e:
            print(f"  ❌ Unexpected error deleting event {event_id}: {e}")
            return False

    def delete_events(self, event_ids: list) -> None:
        """
        Delete multiple events

        Args:
            event_ids: List of event IDs to delete
        """
        print(f"🗑️  Deleting {len(event_ids)} events...")
        print("=" * 50)

        successful = 0
        failed = 0

        for event_id in event_ids:
            if self.delete_event(event_id):
                successful += 1
            else:
                failed += 1
            print()  # Add spacing between events

        print("=" * 50)
        print(f"📊 Summary:")
        print(f"   ✅ Successfully deleted: {successful}")
        print(f"   ❌ Failed to delete: {failed}")
        print(f"   📝 Total processed: {len(event_ids)}")

    def list_events(self) -> None:
        """List all events in the table"""
        try:
            print("📋 Current events in the table:")
            print("=" * 50)

            response = self.events_table.scan()
            events = response.get("Items", [])

            if not events:
                print("No events found.")
                return

            for event in events:
                print(
                    f"  - {event.get('eventName', 'Unknown')} ({event.get('eventId', 'Unknown ID')})"
                )
                print(f"    Created by: {event.get('createdBy', 'Unknown')}")
                print(f"    Venue: {event.get('venueId', 'None')}")
                print()

        except Exception as e:
            print(f"Error listing events: {e}")


def main():
    """Main function"""
    # Event IDs to delete
    event_ids_to_delete = [
        "33aee519-ca06-46ea-97ae-3c786ac6df9e",
        "f7d34323-18c1-4bd6-8fef-b3eded732c1a",
    ]

    print("🎯 Event Deletion Script")
    print("=" * 50)

    deleter = EventDeleter()

    # First, show current events
    print("📋 Current events before deletion:")
    deleter.list_events()
    print()

    # Confirm deletion
    print(f"⚠️  About to delete {len(event_ids_to_delete)} events:")
    for event_id in event_ids_to_delete:
        print(f"   - {event_id}")

    confirm = input("\n❓ Are you sure you want to proceed? (yes/no): ").lower().strip()

    if confirm != "yes":
        print("❌ Deletion cancelled.")
        return

    print()

    # Delete the events
    deleter.delete_events(event_ids_to_delete)

    print()
    print("📋 Events after deletion:")
    deleter.list_events()


if __name__ == "__main__":
    main()
