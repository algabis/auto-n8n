#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Starting Auto-n8n Container...${NC}"

# Function to log with timestamp
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1"
}

# Check if .env file exists and load it
if [ -f "/app/.env" ]; then
    log "${GREEN}✅ Loading environment variables from .env file${NC}"
    set -a  # automatically export all variables
    source /app/.env
    set +a
else
    log "${YELLOW}⚠️  No .env file found, using environment variables${NC}"
fi

# Validate required environment variables
log "${BLUE}🔍 Validating environment configuration...${NC}"

REQUIRED_VARS=("N8N_BASE_URL" "N8N_API_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    log "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        log "${RED}   - $var${NC}"
    done
    log "${YELLOW}💡 Please set these variables in your .env file or Docker environment${NC}"
    exit 1
fi

# Validate n8n URL format
if [[ ! "$N8N_BASE_URL" =~ ^https?:// ]]; then
    log "${RED}❌ N8N_BASE_URL must start with http:// or https://${NC}"
    exit 1
fi

# Remove trailing slash from N8N_BASE_URL if present
export N8N_BASE_URL="${N8N_BASE_URL%/}"

log "${GREEN}✅ Environment validation successful${NC}"
log "${BLUE}📡 n8n Instance: $N8N_BASE_URL${NC}"
log "${BLUE}🔑 API Key: ${N8N_API_KEY:0:8}...${NC}"

# Set default values for optional variables
export LOG_LEVEL="${LOG_LEVEL:-info}"
export REQUEST_TIMEOUT="${REQUEST_TIMEOUT:-30000}"
export MAX_RETRY_ATTEMPTS="${MAX_RETRY_ATTEMPTS:-3}"
export NODE_ENV="${NODE_ENV:-production}"

log "${BLUE}⚙️  Configuration:${NC}"
log "${BLUE}   - Log Level: $LOG_LEVEL${NC}"
log "${BLUE}   - Request Timeout: ${REQUEST_TIMEOUT}ms${NC}"
log "${BLUE}   - Max Retry Attempts: $MAX_RETRY_ATTEMPTS${NC}"
log "${BLUE}   - Node Environment: $NODE_ENV${NC}"

# Create logs directory if it doesn't exist
mkdir -p /app/logs

# Test n8n API connectivity (optional)
if command -v curl &> /dev/null; then
    log "${BLUE}🔗 Testing n8n API connectivity...${NC}"
    if curl -s -f -H "X-N8N-API-KEY: $N8N_API_KEY" "$N8N_BASE_URL/api/v1/workflows?limit=1" > /dev/null; then
        log "${GREEN}✅ n8n API connection successful${NC}"
    else
        log "${YELLOW}⚠️  Could not connect to n8n API (this may be normal if n8n is not running yet)${NC}"
    fi
fi

log "${GREEN}🚀 Starting Auto-n8n...${NC}"

# Execute the main command
exec "$@" 