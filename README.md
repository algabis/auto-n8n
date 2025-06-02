# Auto-n8n

A comprehensive Model Context Protocol (MCP) server for automated n8n workflow management. This server enables AI assistants to interact with self-hosted n8n instances through a standardized protocol, providing tools for workflow management, execution monitoring, and system administration.

## Features

### 🔧 Workflow Management
- List, create, update, and delete workflows
- Activate/deactivate workflows
- Transfer workflows between projects (Enterprise)
- Manage workflow tags and organization
- **Smart workflow examples search** - Find real working workflows by node types or keywords

### 📊 Execution Monitoring
- Monitor workflow executions in real-time
- View detailed execution logs and debugging information
- Track execution performance and duration
- Delete execution history

### 🏷️ Organization & Management
- Tag management for workflow organization
- Environment variable management
- Project management (Enterprise features)
- Credential management with security

### 🔒 Security & Auditing
- Generate comprehensive security audit reports
- Identify security risks and vulnerabilities
- Monitor unused credentials and abandoned workflows
- Database and filesystem security analysis

### 👥 User Management (Enterprise)
- List and manage users in your n8n instance
- Create and invite new team members
- Manage user roles and permissions
- Delete user accounts

### 🔄 Source Control Integration
- Pull changes from connected Git repositories
- Sync workflows and configurations
- Manage environment variables during deployment
- Handle merge conflicts and versioning

## Installation

### Prerequisites
- Self-hosted n8n instance with API access
- n8n API key
- **Option 1 (Docker - Recommended)**: Docker and Docker Compose
- **Option 2 (Native)**: Node.js 18.0.0 or higher, npm or yarn

## 🐳 Docker Installation (Recommended)

### Quick Start
1. **Clone the repository:**
```bash
git clone https://github.com/algabis/auto-n8n
cd auto-n8n
```

2. **Configure environment variables:**
Create a `.env` file in the project root:
```env
# n8n API Configuration (REQUIRED)
# ⚠️ IMPORTANT: Do NOT include /api/v1/ in the URL
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key-here

# Optional Configuration
REQUEST_TIMEOUT=30000
MAX_RETRY_ATTEMPTS=3
LOG_LEVEL=info
```

3. **Build and run with Docker Compose:**
```bash
# Quick setup (build + run)
make setup

# Or manually:
docker-compose up --build -d
```

4. **Check status:**
```bash
make status
# or
docker-compose ps
```

### 🧪 **Testing Tools Immediately**

Once the server is running, **5 tools work immediately** without needing n8n API configuration:

```bash
# Test that the server and tools are working
# You can try these in your MCP client right away:

# 1. Browse node categories
Tool: node_categories, Parameters: {}

# 2. List webhook-related nodes  
Tool: node_types_list, Parameters: {"search": "webhook"}

# 3. Get detailed webhook node info
Tool: node_type_info, Parameters: {"nodeType": "n8n-nodes-base.webhook"}

# 4. Get a workflow example
Tool: workflow_examples, Parameters: {"useCase": "simple-webhook"}
```

The other **35 tools require a connected n8n instance** with API credentials configured.

### Docker Commands

```bash
# Build the image
make build

# Run in background
make run

# Run in foreground (with logs)
make run-fg

# View logs
make logs

# Stop container
make stop

# Restart
make restart

# Get shell access
make shell

# Clean up everything
make clean

# Test the image
make test-image
```

### Alternative Installation Methods

#### Quick Comparison

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| **Deployment Scripts** | First-time users, Production | Auto-validation, Error handling, Cross-platform | Requires script execution permissions |
| **Docker Compose** | Development, Simple setups | Easy configuration, Built-in services | Manual validation needed |
| **Make Commands** | Linux/Mac developers | Simple commands, Traditional workflow | Linux/Mac only |
| **Direct Docker** | Advanced users, Custom setups | Full control, Minimal dependencies | Manual configuration required |
| **Native Installation** | Development, Debugging | Direct access, Fast iteration | Manual dependency management |

#### Method 1: Deployment Scripts (Recommended)
Use our intelligent deployment scripts with built-in validation and error handling.

**Features:**
- ✅ Automatic Docker installation validation
- ✅ Environment variable validation
- ✅ n8n API connectivity testing
- ✅ Colored output and progress indicators
- ✅ Comprehensive error handling
- ✅ Cross-platform support

**Linux/Mac:**
```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Quick setup with validation
./deploy.sh setup

# Other commands
./deploy.sh logs      # View logs
./deploy.sh stop      # Stop container
./deploy.sh restart   # Restart container
./deploy.sh status    # Check container status
./deploy.sh shell     # Get shell access
./deploy.sh clean     # Complete cleanup
./deploy.sh help      # Show all commands
```

**Windows PowerShell:**
```powershell
# Quick setup with validation
.\deploy.ps1 setup

# Other commands
.\deploy.ps1 logs      # View logs
.\deploy.ps1 stop      # Stop container
.\deploy.ps1 restart   # Restart container
.\deploy.ps1 status    # Check container status
.\deploy.ps1 shell     # Get shell access
.\deploy.ps1 clean     # Complete cleanup
.\deploy.ps1 help      # Show all commands
```

#### Method 2: Direct Docker Run
```bash
# Build and run manually
docker build -t auto-n8n .
docker run -d --name auto-n8n-server \
  --env-file .env \
  --restart unless-stopped \
  auto-n8n:latest
```

#### Method 3: Using Make (Linux/Mac)
```bash
# All-in-one setup
make setup

# Individual commands
make build     # Build image
make run       # Start container
make logs      # View logs
make stop      # Stop container
make clean     # Cleanup everything
```

## 📦 Native Installation

### Setup

1. **Clone and install dependencies:**
```bash
git clone https://github.com/algabis/auto-n8n
cd auto-n8n
npm install
```

2. **Configure environment variables:**
Create a `.env` file (same as Docker setup above)

3. **Build the project:**
```bash
npm run build
```

4. **Start the server:**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Configuration

### n8n API Setup
1. Access your n8n instance admin panel
2. Navigate to Settings → API
3. Generate a new API key
4. Copy the API key to your `.env` file

### Environment Variables
| Variable | Description | Default | Validation |
|----------|-------------|---------|------------|
| `N8N_BASE_URL` | Base URL of your n8n instance ⚠️ **Do NOT include `/api/v1`** | Required | Must start with http:// or https:// |
| `N8N_API_KEY` | n8n API key for authentication | Required | Must not be empty |
| `REQUEST_TIMEOUT` | API request timeout in milliseconds | 30000 | Optional |
| `MAX_RETRY_ATTEMPTS` | Number of retry attempts for failed requests | 3 | Optional |
| `LOG_LEVEL` | Logging level (info, debug, warn, error) | info | Optional |

#### ⚠️ **Important URL Configuration**
- ✅ **Correct**: `N8N_BASE_URL=https://your-n8n-instance.com`
- ❌ **Wrong**: `N8N_BASE_URL=https://your-n8n-instance.com/api/v1/`

The MCP server automatically appends `/api/v1/` to API requests. Including it in your base URL will cause "Resource not found" errors.

### Automatic Validation
When using deployment scripts, the following validations are performed:
- ✅ Docker installation and daemon status
- ✅ Required environment variables presence
- ✅ n8n URL format validation
- ✅ Optional API connectivity test
- ✅ Container health monitoring

## Available Tools (40 Total)

Auto-n8n provides exactly **40 MCP tools** to stay within LLM compatibility limits. The tools are organized into two categories:

### ✅ **Immediate Access Tools (5 Tools)**
These tools work immediately without requiring n8n API connection:

#### `node_categories`
List all node categories with descriptions and node counts.
```json
{}
```

#### `node_types_list`
List all available built-in n8n node types with categories and descriptions.
```json
{
  "category": "Core",
  "search": "webhook"
}
```

#### `node_type_info`
Get detailed information about a specific node type including parameters and usage.
```json
{
  "nodeType": "n8n-nodes-base.openai"
}
```

#### `workflow_examples`
Get example workflow structures for common use cases.
```json
{
  "useCase": "simple-webhook"
}
```

#### `workflow_examples_search`
🆕 **Smart search through real working workflow examples**. Find workflows that use specific nodes or match keywords. Perfect for learning how nodes are actually implemented.
```json
{
  "nodeTypes": ["n8n-nodes-base.openai", "n8n-nodes-base.slack"],
  "keywords": ["ai", "automation"],
  "maxExamples": 2,
  "includeFullWorkflow": false
}
```

**Use these immediate access tools when you need to:**
- 📚 Learn about n8n nodes and their capabilities
- 🔍 Find workflow examples and implementation patterns
- 📖 Understand node parameters and configurations
- 🏗️ Design workflows before implementing them

### 🔌 **n8n API Tools (35 Tools)**
These tools require a connected n8n instance with valid API credentials:

#### **Workflow Management (8 tools)**
- `workflow_list` - List all workflows with filtering options
- `workflow_get` - Get detailed workflow information  
- `workflow_create` - Create new workflows programmatically
- `workflow_update` - Update existing workflow properties
- `workflow_delete` - Delete workflows permanently
- `workflow_transfer` - Transfer workflows between projects
- `workflow_activate` - Activate workflows for automatic execution
- `workflow_deactivate` - Deactivate workflows to stop execution

#### **Execution Monitoring (3 tools)**
- `execution_list` - Monitor workflow executions with filtering
- `execution_get` - Get detailed execution information for debugging
- `execution_delete` - Delete execution records

#### **Tag Management (7 tools)**
- `tag_list` - List all available tags for organization
- `tag_create` - Create new tags for organizing workflows
- `tag_get` - Get detailed information about specific tags
- `tag_update` - Update existing tag names
- `tag_delete` - Delete tags permanently
- `workflow_tags_get` - Get all tags assigned to a workflow
- `workflow_tags_update` - Update tags assigned to workflows

#### **Variable Management (4 tools)**
- `variable_list` - List all environment variables
- `variable_create` - Create new environment variables
- `variable_update` - Update existing environment variables
- `variable_delete` - Delete environment variables

#### **Project Management (4 tools)**
- `project_list` - List all projects
- `project_create` - Create new projects
- `project_update` - Update project properties
- `project_delete` - Delete projects

#### **User Management (5 tools)**
- `user_list` - List all users in the n8n instance
- `user_get` - Get detailed user information
- `user_create` - Create new users and send invitations
- `user_role_change` - Change user roles and permissions
- `user_delete` - Delete user accounts

#### **Security & Administration (2 tools)**
- `audit_generate` - Generate comprehensive security audit reports
- `source_control_pull` - Pull changes from connected Git repositories

#### **Credential Management (2 tools)**
- `credential_create` - Create new credentials for workflow authentication
- `credential_delete` - Delete credentials permanently

### 📝 **Example Usage**

#### Workflow Management
```json
// List active workflows
{
  "tool": "workflow_list",
  "args": {
    "active": true,
    "limit": 10
  }
}

// Create a simple webhook workflow
{
  "tool": "workflow_create", 
  "args": {
    "name": "My Webhook Handler",
    "nodes": [
      {
        "name": "Webhook",
        "type": "n8n-nodes-base.webhook",
        "parameters": {
          "httpMethod": "POST",
          "path": "my-webhook"
        },
        "position": [0, 0]
      }
    ],
    "connections": {},
    "settings": {
      "saveExecutionProgress": false,
      "saveManualExecutions": false,
      "saveDataErrorExecution": "all",
      "saveDataSuccessExecution": "all"
    }
  }
}
```

#### Monitoring & Debugging
```json
// Monitor failed executions
{
  "tool": "execution_list",
  "args": {
    "status": "error",
    "limit": 20,
    "includeData": false
  }
}

// Get detailed execution data for debugging
{
  "tool": "execution_get",
  "args": {
    "id": "execution-id-here",
    "includeData": true
  }
}
```

## MCP Client Integration

### Claude Desktop

#### Native Installation (Recommended)
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

**Windows Example:**
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

**Linux/Mac Example:**
```json
{
  "mcpServers": {
    "auto-n8n": {
      "command": "node",
      "args": ["/home/user/auto-n8n/dist/server.js"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Docker Installation
```json
{
  "mcpServers": {
    "auto-n8n": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env-file", "/path/to/your/.env",
        "auto-n8n:latest"
      ]
    }
  }
}
```

#### Docker Compose
```json
{
  "mcpServers": {
    "auto-n8n": {
      "command": "docker-compose",
      "args": [
        "-f", "/path/to/auto-n8n/docker-compose.yml",
        "run", "--rm", "auto-n8n"
      ]
    }
  }
}
```

### Cursor IDE

For Cursor IDE, place the configuration in `~/.cursor/mcp.json` (Linux/Mac) or `C:\Users\<username>\.cursor\mcp.json` (Windows):

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

**⚠️ Important**: 
- Use **absolute paths** in the `args` field - relative paths and `cwd` may not work reliably
- Include environment variables directly in the `env` object
- **Do NOT include `/api/v1/` in N8N_BASE_URL** - use just the domain
- Restart Cursor completely after modifying `mcp.json`

### Other MCP Clients
The server implements the standard MCP protocol and works with:
- **Windsurf**: Integrated workflow management
- **n8n Native MCP Nodes**: n8n 1.88.0+ includes built-in MCP Server Trigger and MCP Client Tool nodes
- Any MCP-compatible client

### n8n Native MCP Integration
As of n8n 1.88.0, n8n includes native MCP support:
- **MCP Server Trigger**: Exposes n8n workflows as MCP tools
- **MCP Client Tool**: Connects n8n to external MCP servers

This project complements n8n's native MCP by providing comprehensive API management capabilities.

## API Limitations

⚠️ **Important**: The n8n API does not support direct workflow execution. Workflows can only be executed through:
- Webhook triggers
- Schedule triggers
- Manual execution in the n8n UI
- External triggers configured in the workflow

This MCP server focuses on workflow management, monitoring, and administration rather than direct execution.

## Development

### Project Structure
```
auto-n8n/
├── src/
│   ├── server.ts              # Main MCP server implementation
│   ├── n8n-client.ts          # n8n API client
│   ├── utils/
│   │   └── validation.ts      # Input validation schemas
│   └── types/                 # TypeScript type definitions
├── examples/
│   ├── workflows/             # Real workflow examples for search
│   └── README.md              # Workflow examples documentation
├── dist/                      # Compiled JavaScript output
├── package.json
├── tsconfig.json
├── quick-start.md             # Quick setup guide
├── TROUBLESHOOTING.md         # Comprehensive troubleshooting
└── README.md
```

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Code Style
```bash
npm run lint
npm run format
```

## Error Handling

The server includes comprehensive error handling:
- API authentication errors
- Rate limiting protection
- Network timeout handling
- Input validation with detailed error messages
- Graceful degradation for missing permissions

## Security Considerations

- API keys are never logged or exposed
- All inputs are validated before processing
- Minimum required permissions principle
- Secure credential handling
- Audit trail for all operations

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify your n8n API key is correct
   - Check that API access is enabled in n8n settings
   - Ensure the API key has sufficient permissions

2. **Connection Timeout**
   - Verify your n8n instance is accessible
   - Check network connectivity
   - Increase `REQUEST_TIMEOUT` if needed

3. **Permission Denied**
   - Some features require n8n Enterprise (projects, user management)
   - Verify API key has appropriate scopes

4. **Docker Issues**
   - Ensure Docker Desktop is running
   - Check that `.env` file exists and contains valid values
   - Try rebuilding the image: `make build` or `docker-compose build`
   - View container logs: `make logs` or `docker-compose logs auto-n8n`

5. **Deployment Script Issues**
   - **Linux/Mac**: Make script executable: `chmod +x deploy.sh`
   - **Windows**: Enable script execution: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
   - **Environment validation fails**: Check your `.env` file format and required variables
   - **Docker not found**: Ensure Docker is installed and in your system PATH

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the **GNU Affero General Public License v3.0**.

### What this means:
- ✅ **Free to use** for personal and non-commercial projects
- ✅ **Free to modify** and create derivative works
- ✅ **Free to distribute** under the same license terms
- ⚠️ **Commercial use requires** that the entire application be open-sourced under AGPL
- ⚠️ **SaaS/hosting requires** that all source code be made available to users

### Why AGPL?
This license ensures that improvements and derivative works remain open and free for the community while preventing proprietary commercialization without giving back.

**For commercial licensing inquiries**, please contact the project maintainers.

See the [LICENSE](LICENSE) file for the full license text.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review n8n API documentation
3. Open an issue on the repository

---

**Note**: This server requires a self-hosted n8n instance with API access. n8n Cloud instances may have different API capabilities and limitations. 