.PHONY:

start-local-dynamodb:
	@docker-compose up -d --remove-orphans

stop-local-dynamodb:
	@docker-compose down

list-tables:
	@aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1 --query 'TableNames'

scan-bookings:
	@aws dynamodb scan --table-name bookings --endpoint-url http://localhost:8000 --region us-east-1

scan-events:
	@aws dynamodb scan --table-name events --endpoint-url http://localhost:8000 --region us-east-1

scan-games:
	@aws dynamodb scan --table-name games --endpoint-url http://localhost:8000 --region us-east-1

scan-rooms:
	@aws dynamodb scan --table-name rooms --endpoint-url http://localhost:8000 --region us-east-1

scan-users:
	@aws dynamodb scan --table-name users --endpoint-url http://localhost:8000 --region us-east-1

scan-venues:
	@aws dynamodb scan --table-name venues --endpoint-url http://localhost:8000 --region us-east-1

check-duplicate-users:
	@cd backend && node scripts/check-duplicate-users.js

cleanup-duplicate-users:
	@cd backend && node scripts/cleanup-duplicate-users.js

update-events-createdby:
	@echo "Usage: make update-events-createdby USER_ID=<userId>"
	@echo "Example: make update-events-createdby USER_ID=a6f3aec2-7d19-48d5-85a4-7602da37e79f"
	@if [ -z "$(USER_ID)" ]; then echo "❌ Please provide USER_ID"; exit 1; fi
	@cd backend && node scripts/update-events-createdby.js $(USER_ID)
