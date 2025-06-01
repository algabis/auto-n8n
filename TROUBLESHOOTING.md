# Auto-n8n Troubleshooting Guide

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

### Issue: Workflow examples search not finding files

**Symptoms**: `workflow_examples_search` returns "No examples directory found"

**Cause**: Missing examples directory or empty workflow files

**Solutions**:
1. **Create examples directory**:
   ```bash
   mkdir -p examples/workflows
   ```

2. **Check for workflow files**:
   ```bash
   ls -la examples/workflows/
   ```

3. **Verify JSON files are valid**:
   ```bash
   # Test JSON parsing
   node -e "JSON.parse(require('fs').readFileSync('examples/workflows/filename.json', 'utf8'))"
   ```

4. **Add example workflows**:
   - Export workflows from your n8n instance as JSON
   - Save to `examples/workflows/` with descriptive filenames
   - Use `.json` extension (case-insensitive)

### Issue: Workflow search returns no matches

**Symptoms**: Search completes but returns 0 matches despite having workflow files

**Cause**: Search criteria too specific or incorrect node type names

**Solutions**:
1. **Try broader search**:
   ```json
   {"keywords": ["ai"], "maxExamples": 5}
   ```

2. **Search without criteria** (returns all):
   ```json
   {"maxExamples": 3}
   ```

3. **Check node type format**:
   - Use full node names: `n8n-nodes-base.openai`
   - Not just: `openai`

4. **Check filename keywords**:
   - Search looks in filenames and workflow names
   - Use descriptive filenames like `ai-agent-workflow.json`

### Issue: n8n API connection failures

**Symptoms**: Network timeouts, connection refused, "Resource not found" errors

**Solutions**:
1. **Check URL format**: Remove `/api/v1/` from N8N_BASE_URL
   - ✅ Correct: `https://your-n8n-instance.com`
   - ❌ Wrong: `https://your-n8n-instance.com/api/v1/`
2. **Verify n8n URL**: Ensure it's accessible
3. **Check network**: Firewall, VPN, proxy settings
4. **Test manually**:
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

## MCP Client Configuration Issues

### Issue: Cursor shows "client closed" and no tools listed

**Symptoms**: 
- MCP server starts successfully when run manually
- Cursor MCP panel shows "client closed"
- No tools appear in the MCP offerings

**Common Causes**:
1. **Relative paths in mcp.json**: Cursor may not respect the `cwd` field
2. **Missing environment variables**: Server exits early due to missing config
3. **Incorrect command format**: Using npm commands without proper working directory

**Solutions**:

#### 1. Use Absolute Paths (Recommended)
Update your `~/.cursor/mcp.json` or `C:\Users\<username>\.cursor\mcp.json`:

```json
{
  "mcpServers": {
    "auto-n8n": {
      "command": "node",
      "args": ["D:\\projects\\auto-n8n\\dist\\server.js"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Key Points**:
- Use full absolute path to `dist/server.js`
- Include environment variables directly in `env` object
- Remove any `cwd` field (may be ignored)

#### 2. Verify MCP Configuration Location
- **Windows**: `C:\Users\<username>\.cursor\mcp.json`
- **Linux/Mac**: `~/.cursor/mcp.json`
- Ensure there's only ONE mcp.json file

#### 3. Test Server Manually
Before configuring MCP client, verify server works:
```bash
cd /path/to/auto-n8n
N8N_BASE_URL="https://your-instance.com" N8N_API_KEY="your-key" node dist/server.js
```

Should output: `🚀 Auto-n8n MCP Server started successfully`

#### 4. Check Cursor Logs
- Open Cursor Command Palette (Ctrl+Shift+P)
- Search for "MCP Logs" or "Show Logs"
- Look for errors like:
  - `Cannot find module` - indicates path issues
  - `Missing script` - indicates npm command issues
  - Connection errors - indicates server startup failures

#### 5. Restart Cursor Completely
After any mcp.json changes:
- Close all Cursor windows
- Quit Cursor application completely
- Restart Cursor
- Check MCP panel for connection

### Issue: Claude Desktop MCP not connecting

**Solutions**:
1. **Check config location**: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
2. **Use same absolute path format** as Cursor solution above
3. **Restart Claude Desktop** after configuration changes

### Issue: Environment variables not loaded

**Symptoms**: Server exits with "Missing required environment variable" error

**Solutions**:
1. **Include in mcp.json** (recommended):
   ```json
   {
     "mcpServers": {
       "auto-n8n": {
         "command": "node",
         "args": ["/absolute/path/to/dist/server.js"],
         "env": {
           "N8N_BASE_URL": "https://your-n8n-instance.com",
           "N8N_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

2. **Alternative**: Use .env file and modify command:
   ```json
   {
     "mcpServers": {
       "auto-n8n": {
         "command": "node",
         "args": ["-r", "dotenv/config", "/absolute/path/to/dist/server.js"],
         "cwd": "/absolute/path/to/auto-n8n"
       }
     }
   }
   ```

### Issue: npm commands fail in MCP clients

**Error**: `npm error Missing script: "start:prod"`

**Cause**: MCP clients may not properly handle npm commands or working directories

**Solution**: Always use direct node commands with absolute paths instead of npm scripts

❌ **Don't use**:
```json
{
  "command": "npm",
  "args": ["run", "start:prod"],
  "cwd": "/path/to/project"
}
```

✅ **Use instead**:
```json
{
  "command": "node",
         "args": ["/absolute/path/to/auto-n8n/dist/server.js"],
  "env": {
    "N8N_BASE_URL": "...",
    "N8N_API_KEY": "..."
  }
}
```

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
| **API "not found" errors** | **Remove `/api/v1/` from N8N_BASE_URL** |
| **MCP client closed** | **Use absolute path in mcp.json + env vars** |
| **Missing npm script** | **Use node command instead of npm** |
| **Cannot find module** | **Check absolute path in mcp.json args** |
| **MCP no tools listed** | **Restart MCP client completely** |
| **Examples not found** | **Create `examples/workflows/` directory** |
| **Search no matches** | **Try broader keywords or check node names** |
| **Invalid JSON workflows** | **Validate JSON files with `node -e "JSON.parse(...)"** | 