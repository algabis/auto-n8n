# n8n MCP Server - Quick Start Guide

Get your n8n MCP server running in 5 minutes! 🚀

## 📋 Prerequisites

- Self-hosted n8n instance with API access
- n8n API key
- Node.js 18.0.0+ OR Docker

## 🚀 Quick Setup (Choose One Method)

### Method 1: Native Node.js (Recommended for development)

```bash
# 1. Clone and install
git clone https://github.com/your-org/n8n-mcp
cd n8n-mcp
npm install

# 2. Configure environment
cp env.example .env
# Edit .env with your settings (see below)

# 3. Build and start
npm run build
npm start
```

### Method 2: Docker (Recommended for production)

```bash
# 1. Clone repository
git clone https://github.com/your-org/n8n-mcp
cd n8n-mcp

# 2. Configure environment
cp env.example .env
# Edit .env with your settings (see below)

# 3. Build and run
docker-compose up --build -d
```

## ⚙️ Configuration

### 1. **Create `.env` file**

```env
# ⚠️ CRITICAL: Do NOT include /api/v1/ in the URL!
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key-here
```

### 2. **Common URL Mistakes to Avoid**

❌ **Wrong**:
```env
N8N_BASE_URL=https://your-n8n-instance.com/api/v1/
N8N_BASE_URL=https://your-n8n-instance.com/api/v1
```

✅ **Correct**:
```env
N8N_BASE_URL=https://your-n8n-instance.com
```

### 3. **Get your n8n API Key**

1. Open your n8n instance
2. Go to **Settings** → **API**
3. Click **Create API Key**
4. Copy the generated key

## 🔌 MCP Client Setup

### For Cursor IDE

**File**: `C:\Users\<username>\.cursor\mcp.json` (Windows) or `~/.cursor/mcp.json` (Linux/Mac)

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "node",
      "args": ["D:\\projects\\n8n-mcp\\dist\\server.js"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Important**: 
- Use **absolute paths** only
- **Restart Cursor completely** after saving

### For Claude Desktop

**File**: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/n8n-mcp/dist/server.js"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## ✅ Verification

### 1. **Test Server Manually**

```bash
# Should output: 🚀 n8n MCP Server started successfully
npm start
```

### 2. **Test API Connection**

```bash
curl -H "X-N8N-API-KEY: your-key" https://your-n8n-instance.com/api/v1/workflows
```

Should return JSON (empty array `[]` if no workflows exist).

### 3. **Test MCP Connection**

In your MCP client (Cursor/Claude), try:
- List workflows
- Create a simple workflow
- View execution history

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| **"Resource not found"** | Remove `/api/v1/` from N8N_BASE_URL |
| **"Client closed"** | Use absolute paths in mcp.json |
| **No tools listed** | Restart MCP client completely |
| **Permission denied** | Check API key permissions |
| **Cannot find module** | Verify absolute path in mcp.json |

## 🎯 What Works (Non-Enterprise)

✅ **Fully Working**:
- Workflow management (CRUD operations)
- Execution monitoring
- Tag management
- Credential management
- Security audit reports
- User listing

⚠️ **Limited/Enterprise Only**:
- Environment variables (requires higher permissions)
- Project management (Enterprise feature)
- Advanced user management (Enterprise feature)

## 📚 Next Steps

- Read the full [README](README.md) for complete feature list
- Check [TROUBLESHOOTING](TROUBLESHOOTING.md) for detailed help
- Browse available tools in your MCP client
- Create your first workflow using the MCP tools!

---

**Need help?** Check the troubleshooting guide or open an issue on the repository. 