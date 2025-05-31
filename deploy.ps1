# n8n MCP Server Deployment Script for Windows
param(
    [Parameter(Position=0)]
    [ValidateSet("setup", "build", "run", "stop", "restart", "logs", "status", "shell", "clean", "help")]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "n8n MCP Server Deployment Script for Windows" -ForegroundColor Blue
    Write-Host "=============================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [COMMAND]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  setup     - Full setup (build and run)"
    Write-Host "  build     - Build Docker image only"
    Write-Host "  run       - Run the container"
    Write-Host "  stop      - Stop the container"
    Write-Host "  restart   - Restart the container"
    Write-Host "  logs      - Show container logs"
    Write-Host "  status    - Show container status"
    Write-Host "  shell     - Get shell access to container"
    Write-Host "  clean     - Clean up containers and images"
    Write-Host "  help      - Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 setup     # First time setup"
    Write-Host "  .\deploy.ps1 logs      # View logs"
    Write-Host "  .\deploy.ps1 restart   # Restart the container"
}

function Test-DockerInstallation {
    try {
        docker --version | Out-Null
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Docker daemon is not running. Please start Docker Desktop." -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Docker is available and running" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Docker is not installed. Please install Docker Desktop." -ForegroundColor Red
        exit 1
    }
}

# Main switch
switch ($Command) {
    "setup" {
        Write-Host "🚀 Setting up n8n MCP Server..." -ForegroundColor Blue
        Test-DockerInstallation
        if (Test-Path ".env") {
            docker-compose up --build -d
            Write-Host "✅ Setup complete! Container is running." -ForegroundColor Green
        } else {
            Write-Host "❌ Please create a .env file first." -ForegroundColor Red
        }
    }
    "build" {
        Test-DockerInstallation
        docker build -t n8n-mcp:latest .
    }
    "run" {
        Test-DockerInstallation
        docker-compose up -d
    }
    "stop" {
        docker-compose down
    }
    "restart" {
        docker-compose restart
    }
    "logs" {
        docker-compose logs -f n8n-mcp
    }
    "status" {
        docker-compose ps
    }
    "shell" {
        docker-compose exec n8n-mcp /bin/sh
    }
    "clean" {
        docker-compose down --volumes --remove-orphans
        docker image rm n8n-mcp:latest 2>$null
        docker system prune -f
    }
    default {
        Show-Help
    }
} 