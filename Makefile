.PHONY:

start-local-dynamodb:
	@docker-compose up -d --remove-orphans

stop-local-dynamodb:
	@docker-compose down

list-tables:
	@aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1 --query 'TableNames'

scan-bookings:
	@aws dynamodb scan --table-name events --endpoint-url http://localhost:8000 --region us-east-1

scan-events:
	@aws dynamodb scan --table-name events --endpoint-url http://localhost:8000 --region us-east-1

scan-games:
	@aws dynamodb scan --table-name events --endpoint-url http://localhost:8000 --region us-east-1

scan-rooms:
	@aws dynamodb scan --table-name events --endpoint-url http://localhost:8000 --region us-east-1

scan-users:
	@aws dynamodb scan --table-name events --endpoint-url http://localhost:8000 --region us-east-1
