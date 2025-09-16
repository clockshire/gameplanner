.PHONY:

start-local-dynamodb:
	@docker-compose up -d --remove-orphans

stop-local-dynamodb:
	@docker-compose down

start-minio:
	@docker-compose up -d minio
	@echo "🚀 MinIO started at http://localhost:9000"
	@echo "🔧 MinIO Console at http://localhost:9001"
	@echo "📝 Credentials: minioadmin / minioadmin123"

stop-minio:
	@docker-compose stop minio

start-all:
	@docker-compose up -d --remove-orphans
	@echo "🚀 All services started"
	@echo "📊 DynamoDB: http://localhost:8000"
	@echo "🗄️ MinIO: http://localhost:9000"
	@echo "🔧 MinIO Console: http://localhost:9001"

list-tables:
	@aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1 --query 'TableNames'

# DynamoDB configuration
DYNAMODB_ENDPOINT = http://localhost:8000
DYNAMODB_REGION = us-east-1
AWS_CMD = aws dynamodb scan --endpoint-url $(DYNAMODB_ENDPOINT) --region $(DYNAMODB_REGION)

# Individual table scan targets
scan-bookings:
	@$(AWS_CMD) --table-name bookings

scan-events:
	@$(AWS_CMD) --table-name events

scan-games:
	@$(AWS_CMD) --table-name games

scan-rooms:
	@$(AWS_CMD) --table-name rooms

scan-users:
	@$(AWS_CMD) --table-name users

scan-venues:
	@$(AWS_CMD) --table-name venues

scan-invites:
	@$(AWS_CMD) --table-name invitations

scan-event-participants:
	@$(AWS_CMD) --table-name eventParticipants

# Convenience target to scan all tables
scan-all: scan-bookings scan-events scan-games scan-invites scan-rooms scan-users scan-venues scan-event-participants
	@echo "✅ Scanned all tables"

check-duplicate-users:
	@cd backend && node scripts/check-duplicate-users.js

cleanup-duplicate-users:
	@cd backend && node scripts/cleanup-duplicate-users.js

update-events-createdby:
	@echo "Usage: make update-events-createdby USER_ID=<userId>"
	@echo "Example: make update-events-createdby USER_ID=a6f3aec2-7d19-48d5-85a4-7602da37e79f"
	@if [ -z "$(USER_ID)" ]; then echo "❌ Please provide USER_ID"; exit 1; fi
	@cd backend && node scripts/update-events-createdby.js $(USER_ID)

# Clean up test data
clean-test-data:
	@echo "🧹 Cleaning up test data..."
	@cd backend && node scripts/cleanup-test-data.js
