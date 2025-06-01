#!/bin/bash

# Auto-n8n Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
PROJECT_NAME="auto-n8n"
IMAGE_NAME="auto-n8n:latest"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        print_warning "Please install Docker first: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        print_warning "Please start Docker Desktop or Docker daemon"
        exit 1
    fi

    print_success "Docker is available and running"
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed or not in PATH"
        print_warning "Please install docker-compose: https://docs.docker.com/compose/install/"
        exit 1
    fi

    print_success "docker-compose is available"
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_error "No .env file found"
        echo ""
        echo "Please create a .env file with the following content:"
        echo ""
        echo "# Auto-n8n API Configuration (REQUIRED)"
        echo "N8N_BASE_URL=https://your-n8n-instance.com"
        echo "N8N_API_KEY=your-api-key-here"
        echo ""
        echo "# Optional Configuration"
        echo "REQUEST_TIMEOUT=30000"
        echo "MAX_RETRY_ATTEMPTS=3"
        echo "LOG_LEVEL=info"
        echo ""
        exit 1
    fi

    print_success ".env file found"
}

# Function to validate environment variables
validate_env() {
    source .env
    
    if [ -z "$N8N_BASE_URL" ]; then
        print_error "N8N_BASE_URL is not set in .env file"
        exit 1
    fi

    if [ -z "$N8N_API_KEY" ]; then
        print_error "N8N_API_KEY is not set in .env file"
        exit 1
    fi

    if [[ ! "$N8N_BASE_URL" =~ ^https?:// ]]; then
        print_error "N8N_BASE_URL must start with http:// or https://"
        exit 1
    fi

    print_success "Environment variables are valid"
}

# Function to build the Docker image
build_image() {
    print_status "Building Docker image..."
    
    if docker build -t "$IMAGE_NAME" .; then
        print_success "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
}

# Function to run the container
run_container() {
    print_status "Starting container..."
    
    if docker-compose up -d; then
        print_success "Container started successfully"
        echo ""
        echo "Container status:"
        docker-compose ps
        echo ""
        echo "To view logs: docker-compose logs -f auto-n8n"
        echo "To stop: docker-compose down"
    else
        print_error "Failed to start container"
        exit 1
    fi
}

# Function to show logs
show_logs() {
    print_status "Showing container logs..."
    docker-compose logs -f auto-n8n
}

# Function to stop the container
stop_container() {
    print_status "Stopping container..."
    
    if docker-compose down; then
        print_success "Container stopped successfully"
    else
        print_error "Failed to stop container"
        exit 1
    fi
}

# Function to show status
show_status() {
    print_status "Container status:"
    docker-compose ps
}

# Function to get shell access
shell_access() {
    print_status "Opening shell in container..."
    docker-compose exec auto-n8n /bin/sh
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    
    docker-compose down --volumes --remove-orphans
    docker image rm "$IMAGE_NAME" 2>/dev/null || true
    docker system prune -f
    
    print_success "Cleanup completed"
}

# Function to show help
show_help() {
    echo "Auto-n8n Deployment Script"
    echo "=========================="
    echo ""
    echo "Usage: ./deploy.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     - Full setup (build and run)"
    echo "  build     - Build Docker image only"
    echo "  run       - Run the container"
    echo "  stop      - Stop the container"
    echo "  restart   - Restart the container"
    echo "  logs      - Show container logs"
    echo "  status    - Show container status"
    echo "  shell     - Get shell access to container"
    echo "  clean     - Clean up containers and images"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh setup     # First time setup"
    echo "  ./deploy.sh logs      # View logs"
    echo "  ./deploy.sh restart   # Restart the container"
}

# Main script logic
main() {
    echo ""
    print_status "🐳 Auto-n8n Deployment Script"
    echo ""

    # Parse command line arguments
    COMMAND=${1:-help}

    case "$COMMAND" in
        "setup")
            check_docker
            check_docker_compose
            check_env_file
            validate_env
            build_image
            run_container
            ;;
        "build")
            check_docker
            check_env_file
            build_image
            ;;
        "run")
            check_docker
            check_docker_compose
            check_env_file
            validate_env
            run_container
            ;;
        "stop")
            check_docker_compose
            stop_container
            ;;
        "restart")
            check_docker_compose
            stop_container
            sleep 2
            run_container
            ;;
        "logs")
            check_docker_compose
            show_logs
            ;;
        "status")
            check_docker_compose
            show_status
            ;;
        "shell")
            check_docker_compose
            shell_access
            ;;
        "clean")
            check_docker
            check_docker_compose
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run the main function
main "$@" 