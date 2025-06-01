# Auto-n8n Makefile
.PHONY: help build run stop clean logs shell test setup

# Default target
help: ## Show this help message
	@echo "Auto-n8n - Docker Management"
	@echo "============================"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Docker image
	@echo "🔨 Building Auto-n8n Docker image..."
	docker build -t auto-n8n:latest .
	@echo "✅ Build complete!"

run: ## Run the container with docker-compose
	@echo "🚀 Starting Auto-n8n..."
	docker-compose up -d
	@echo "✅ Container started!"

run-fg: ## Run the container in foreground with logs
	@echo "🚀 Starting Auto-n8n (foreground)..."
	docker-compose up

stop: ## Stop the running container
	@echo "🛑 Stopping Auto-n8n..."
	docker-compose down
	@echo "✅ Container stopped!"

restart: stop run ## Restart the container

logs: ## View container logs
	docker-compose logs -f auto-n8n

shell: ## Get shell access to the running container
	docker-compose exec auto-n8n /bin/sh

clean: ## Clean up containers and images
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down --volumes --remove-orphans
	docker image rm auto-n8n:latest 2>/dev/null || true
	@echo "✅ Cleanup complete!"

status: ## Check container status
	docker-compose ps

setup: build run ## Build and run the container

test-image: build ## Test the built Docker image
	@echo "🧪 Testing Docker image..."
	docker run --rm --env-file .env auto-n8n:latest node -e "console.log('Image test successful!')"
	@echo "✅ Image test complete!" 