# Auto-n8n - Quick Start Guide

Get your Auto-n8n MCP server running in 5 minutes! 🚀

## 📋 Prerequisites

- Self-hosted n8n instance with API access
- n8n API key
- Node.js 18.0.0+ OR Docker

## 🚀 Quick Setup (Choose One Method)

### Method 1: Native Node.js (Recommended for development)

```bash
# 1. Clone and install
git clone https://github.com/your-org/auto-n8n
cd auto-n8n
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
git clone https://github.com/your-org/auto-n8n
cd auto-n8n

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

**Important**: 
- Use **absolute paths** only
- **Restart Cursor completely** after saving

### For Claude Desktop

**File**: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "auto-n8n": {
      "command": "node",
      "args": ["/absolute/path/to/auto-n8n/dist/server.js"],
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
# Should output: 🚀 Auto-n8n MCP Server started successfully
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

## 🎯 Available Tools (40 Total)

Now that your MCP server is running, you have access to **40 powerful n8n automation tools** organized into two categories:

### ✅ **Immediate Access Tools (5 Tools)**
These work instantly without needing n8n API connection:

- **`node_categories`** - Browse all n8n node categories with descriptions
- **`node_types_list`** - List available built-in n8n node types with filtering
- **`node_type_info`** - Get detailed information about specific node types
- **`workflow_examples`** - Get example workflow structures for common use cases
- **`workflow_examples_search`** - 🆕 Smart search through real working workflow examples

### 🔌 **n8n API Tools (35 Tools)**
These require a connected n8n instance with valid API credentials:

#### **Core Workflow Management (8 tools)**
Create, update, delete, activate/deactivate workflows, transfer between projects

#### **Execution Monitoring (3 tools)**
Monitor workflow executions, get detailed debugging information, manage execution history

#### **Organization & Tags (7 tools)**
Create and manage tags for workflow organization, assign tags to workflows

#### **Environment Variables (4 tools)**
Manage environment variables for secure configuration across workflows

#### **Project Management (4 tools)**
Create and manage projects for organizing workflows (Enterprise feature)

#### **User Management (5 tools)**
List, create, update, and delete users; manage roles and permissions (Enterprise feature)

#### **Security & Administration (2 tools)**
Generate security audit reports, pull changes from source control

#### **Credential Management (2 tools)**
Create and delete credentials for workflow authentication

## 🚀 Try These Examples

In your MCP client (Cursor/Claude), try these commands to test the tools:

### ✅ **Immediate Access Examples (Work Without API)**

1. **Browse all node categories:**
   ```
   Tool: node_categories
   Parameters: {}
   ```

2. **Find specific node types:**
   ```
   Tool: node_types_list  
   Parameters: {"category": "Core", "search": "webhook"}
   ```

3. **Learn about webhook nodes:**
   ```
   Tool: node_type_info
   Parameters: {"nodeType": "n8n-nodes-base.webhook"}
   ```

4. **Get workflow examples:**
   ```
   Tool: workflow_examples
   Parameters: {"useCase": "simple-webhook"}
   ```

5. **Search workflow examples (if examples/ folder exists):**
   ```
   Tool: workflow_examples_search
   Parameters: {"keywords": ["webhook", "api"], "maxExamples": 2}
   ```

### 🔌 **n8n API Examples (Require Connected Instance)**

6. **List your workflows:**
   ```
   Tool: workflow_list
   Parameters: {"limit": 5, "active": true}
   ```

7. **Monitor recent executions:**
   ```
   Tool: execution_list
   Parameters: {"limit": 10, "status": "error"}
   ```

8. **Generate security audit:**
   ```
   Tool: audit_generate
   Parameters: {"additionalOptions": {"categories": ["credentials", "nodes"]}}
   ```

## 📚 Next Steps

- Read the full [README](README.md) for complete feature list
- Check [TROUBLESHOOTING](TROUBLESHOOTING.md) for detailed help
- Browse available tools in your MCP client
- **Explore the [examples/README.md](examples/README.md)** for workflow examples documentation
- Create your first workflow using the MCP tools!

---

**Need help?** Check the troubleshooting guide or open an issue on the repository. 