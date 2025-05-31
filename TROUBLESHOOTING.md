# n8n MCP Server Troubleshooting Guide

## Docker Build Issues

### Issue: `tsc: not found` during Docker build

**Problem**: TypeScript compiler not found in Docker builder stage.

**Cause**: Dockerfile was installing only production dependencies in builder stage, but TypeScript is a dev dependency.

**Solution**: Fixed in latest Dockerfile. The builder stage now installs all dependencies:
```dockerfile
# Install ALL dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force
```

### Issue: `package.json and package-lock.json are in sync` errors

**Problem**: Lock file out of sync with package.json.

**Solutions**:
1. **Recommended**: Delete lock file and regenerate:
   ```bash
   rm package-lock.json
   npm install
   ```

2. **Alternative**: Force regeneration:
   ```bash
   npm install --package-lock-only
   ```

## Build Alternatives

If Docker build fails, try these alternatives:

### Option 1: Native Node.js Setup
```bash
# Install dependencies
npm install

# Build manually
npm run build

# Or use alternative build script
npm run build:alt
```

### Option 2: Complete Setup Script
```bash
# Run comprehensive setup
npm run setup
```

### Option 3: Manual Steps
```bash
# 1. Install dependencies
npm install

# 2. Check TypeScript
npx tsc --version

# 3. Build project
npx tsc

# 4. Create environment file
cp env.example .env
# Edit .env with your settings

# 5. Start server
npm start
```

## Environment Issues

### Issue: Missing `.env` file

**Solution**: Copy from example and configure:
```bash
cp env.example .env
```

Edit `.env` with your n8n instance details:
```env
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key-here
```

### Issue: Invalid n8n API Key

**Symptoms**: 401 authentication errors

**Solutions**:
1. Verify API key in n8n Settings → API
2. Check if API key has proper permissions
3. Ensure n8n instance is accessible

## Docker-specific Issues

### Issue: Docker daemon not running

**Error**: `error during connect: this error may indicate that the docker daemon is not running`

**Solutions**:
- **Windows**: Start Docker Desktop
- **Linux**: `sudo systemctl start docker`
- **macOS**: Start Docker Desktop

### Issue: Docker build permissions

**Error**: Permission denied errors

**Solutions**:
- **Linux**: Add user to docker group:
  ```bash
  sudo usermod -aG docker $USER
  # Log out and back in
  ```
- **Alternative**: Use sudo:
  ```bash
  sudo make setup
  ```

### Issue: Docker compose not found

**Error**: `docker-compose: command not found`

**Solutions**:
1. **Install Docker Compose V1**:
   ```bash
   sudo apt install docker-compose
   ```

2. **Use Docker Compose V2**:
   ```bash
   # Replace docker-compose with docker compose
   docker compose up -d
   ```

## Build Script Issues

### Issue: TypeScript compilation errors

**Solutions**:
1. **Check TypeScript installation**:
   ```bash
   npx tsc --version
   ```

2. **Install TypeScript if missing**:
   ```bash
   npm install -g typescript
   # Or locally
   npm install typescript
   ```

3. **Clean and rebuild**:
   ```bash
   rm -rf dist node_modules
   npm install
   npm run build
   ```

### Issue: Memory issues during build

**Symptoms**: Build process killed or out of memory errors

**Solutions**:
1. **Increase Node.js memory**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

2. **Use alternative build**:
   ```bash
   npm run build:alt
   ```

## Runtime Issues

### Issue: Module not found errors

**Cause**: Missing dependencies or incorrect paths

**Solutions**:
1. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check import paths** in TypeScript files

### Issue: n8n API connection failures

**Symptoms**: Network timeouts, connection refused

**Solutions**:
1. **Verify n8n URL**: Ensure it's accessible
2. **Check network**: Firewall, VPN, proxy settings
3. **Test manually**:
   ```bash
   curl -H "X-N8N-API-KEY: your-key" https://your-n8n-instance.com/api/v1/workflows
   ```

## Platform-specific Issues

### Windows

- Use PowerShell or WSL2
- Ensure proper line endings (LF not CRLF)
- Docker Desktop must be running

### Linux

- Check Docker permissions
- Verify Node.js version (>=18.0.0)
- Install build tools if needed:
  ```bash
  sudo apt update
  sudo apt install build-essential
  ```

### macOS

- Use Homebrew for Node.js installation
- Docker Desktop must be running
- Check Xcode command line tools

## Getting Help

If issues persist:

1. **Check logs**:
   ```bash
   # Docker logs
   docker-compose logs -f

   # Direct node logs
   npm start 2>&1 | tee debug.log
   ```

2. **System information**:
   ```bash
   # Node version
   node --version
   npm --version

   # Docker version
   docker --version
   docker-compose --version

   # System info
   uname -a
   ```

3. **Create minimal reproduction**:
   - Fresh clone of repository
   - Clean environment
   - Step-by-step reproduction

4. **Common diagnostic commands**:
   ```bash
   # Check file permissions
   ls -la

   # Check process
   ps aux | grep node

   # Check ports
   netstat -tlnp | grep 3000

   # Check disk space
   df -h
   ```

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| `tsc not found` | Fixed in Dockerfile - rebuild image |
| Lock file sync | `rm package-lock.json && npm install` |
| Docker not running | Start Docker Desktop/daemon |
| Build memory issue | `NODE_OPTIONS="--max-old-space-size=4096" npm run build` |
| Missing .env | `cp env.example .env` |
| TypeScript errors | `npm install typescript && npm run build` |
| Permission denied | `sudo` or add user to docker group |
| Module not found | `rm -rf node_modules && npm install` | 