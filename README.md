# n8n MCP Server

A comprehensive Model Context Protocol (MCP) server for n8n workflow automation. This server enables AI assistants to interact with self-hosted n8n instances through a standardized protocol, providing tools for workflow management, execution monitoring, and system administration.

## Features

### 🔧 Workflow Management
- List, create, update, and delete workflows
- Activate/deactivate workflows
- Transfer workflows between projects (Enterprise)
- Manage workflow tags and organization

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
git clone https://github.com/algabis/n8n-mcp
cd n8n-mcp
```

2. **Configure environment variables:**
Create a `.env` file in the project root:
```env
# n8n API Configuration (REQUIRED)
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
docker build -t n8n-mcp .
docker run -d --name n8n-mcp-server \
  --env-file .env \
  --restart unless-stopped \
  n8n-mcp:latest
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
git clone https://github.com/algabis/n8n-mcp
cd n8n-mcp
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
| `N8N_BASE_URL` | Base URL of your n8n instance | Required | Must start with http:// or https:// |
| `N8N_API_KEY` | n8n API key for authentication | Required | Must not be empty |
| `REQUEST_TIMEOUT` | API request timeout in milliseconds | 30000 | Optional |
| `MAX_RETRY_ATTEMPTS` | Number of retry attempts for failed requests | 3 | Optional |
| `LOG_LEVEL` | Logging level (info, debug, warn, error) | info | Optional |

### Automatic Validation
When using deployment scripts, the following validations are performed:
- ✅ Docker installation and daemon status
- ✅ Required environment variables presence
- ✅ n8n URL format validation
- ✅ Optional API connectivity test
- ✅ Container health monitoring

## Available Tools

### Workflow Tools

#### `workflow_list`
List all workflows with filtering options.
```json
{
  "active": true,
  "tags": "production,staging",
  "name": "Data Processing",
  "limit": 50
}
```

#### `workflow_get`
Get detailed information about a specific workflow.
```json
{
  "id": "workflow-id-here",
  "excludePinnedData": true
}
```

#### `workflow_create`
Create a new workflow programmatically.
```json
{
  "name": "My New Workflow",
  "nodes": [
    {
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "position": [250, 300]
    }
  ],
  "connections": {},
  "active": false
}
```

#### `workflow_activate` / `workflow_deactivate`
Control workflow activation status.
```json
{
  "id": "workflow-id-here"
}
```

### Execution Tools

#### `execution_list`
Monitor workflow executions with filtering.
```json
{
  "status": "error",
  "workflowId": "workflow-id",
  "includeData": false,
  "limit": 100
}
```

#### `execution_get`
Get detailed execution information for debugging.
```json
{
  "id": "execution-id-here",
  "includeData": true
}
```

### Tag Management

#### `tag_create`
Create organization tags for workflows.
```json
{
  "name": "Production"
}
```

#### `workflow_tags_update`
Assign tags to workflows for organization.
```json
{
  "id": "workflow-id",
  "tagIds": ["tag-id-1", "tag-id-2"]
}
```

### Variable Management

#### `variable_create`
Create environment variables for workflows.
```json
{
  "key": "API_ENDPOINT",
  "value": "https://api.example.com"
}
```

### Security & Auditing

#### `audit_generate`
Generate comprehensive security audit reports.
```json
{
  "additionalOptions": {
    "daysAbandonedWorkflow": 90,
    "categories": ["credentials", "database", "nodes"]
  }
}
```

## MCP Client Integration

### Claude Desktop

#### Native Installation (Recommended)
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

**Windows Example:**
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

**Linux/Mac Example:**
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "node",
      "args": ["/home/user/n8n-mcp/dist/server.js"],
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
    "n8n": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env-file", "/path/to/your/.env",
        "n8n-mcp:latest"
      ]
    }
  }
}
```

#### Docker Compose
```json
{
  "mcpServers": {
    "n8n": {
      "command": "docker-compose",
      "args": [
        "-f", "/path/to/n8n-mcp/docker-compose.yml",
        "run", "--rm", "n8n-mcp"
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

**⚠️ Important**: 
- Use **absolute paths** in the `args` field - relative paths and `cwd` may not work reliably
- Include environment variables directly in the `env` object
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
n8n-mcp/
├── src/
│   ├── server.ts              # Main MCP server implementation
│   ├── n8n-client.ts          # n8n API client
│   ├── utils/
│   │   └── validation.ts      # Input validation schemas
│   └── types/                 # TypeScript type definitions
├── dist/                      # Compiled JavaScript output
├── package.json
├── tsconfig.json
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
   - View container logs: `make logs` or `docker-compose logs n8n-mcp`

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