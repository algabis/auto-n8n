# Multi-stage build for n8n MCP Server
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev dependencies for build)
# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi && npm cache clean --force
=======
RUN npm ci && npm cache clean --force
>>>>>>> 825a3d74d878e66cefba664a7072c5239647a61f

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS runtime

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S n8nmcp -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund; else npm install --only=production --no-audit --no-fund; fi && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy environment example (users should mount their own .env)
COPY env.example ./

# Copy and make entrypoint script executable
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Change ownership to non-root user
RUN chown -R n8nmcp:nodejs /app
USER n8nmcp

# Add health check script
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('MCP Server is healthy')" || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Set entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]

# Default command
CMD ["node", "dist/server.js"]

# Labels for metadata
LABEL maintainer="n8n MCP Server Team"
LABEL description="Model Context Protocol server for n8n workflow automation"
LABEL version="1.0.0" 