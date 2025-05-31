# n8n MCP Server

A comprehensive **Model Context Protocol (MCP) server** for n8n workflow automation, debugging, and management. This server enables AI assistants to interact with your self-hosted n8n instance through a rich set of tools and capabilities.

## 🚀 Features

### Workflow Management
- **List & Browse**: Find workflows by name, tags, status, or project
- **Create & Update**: Build workflows programmatically with nodes and connections
- **Activate/Deactivate**: Control workflow execution status
- **Transfer**: Move workflows between projects (Enterprise)
- **Delete**: Remove workflows with confirmation

### Execution Monitoring
- **List Executions**: Monitor workflow runs with filtering by status, workflow, or project
- **Detailed Analysis**: Get comprehensive execution data including errors and performance
- **Debug Support**: Analyze failed executions with detailed error information
- **Cleanup**: Delete execution records for data management

### Organization & Management
- **Tags**: Create, update, and manage workflow tags for organization
- **Variables**: Manage environment variables for workflow configuration
- **Projects**: Handle project organization (Enterprise feature)
- **Credentials**: Secure credential management for workflow authentication

### Security & Audit
- **Security Audits**: Generate comprehensive security reports
- **Risk Assessment**: Identify potential vulnerabilities and unused resources
- **Compliance**: Monitor security best practices across your n8n instance

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **n8n instance** (self-hosted) with API access enabled
- **n8n API key** with appropriate permissions

## 🛠️ Installation

### 1. Clone and Setup

```bash
git clone <repository-url>
cd n8n-mcp-server
npm install
```

### 2. Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your n8n instance details:

```env
# n8n Instance Configuration (REQUIRED)
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key-here

# Optional Configuration
LOG_LEVEL=info
REQUEST_TIMEOUT=30000
MAX_RETRY_ATTEMPTS=3
CACHE_TTL=300
NODE_ENV=production
```

### 3. Build and Start

```bash
# Build the TypeScript code
npm run build

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

## 🔧 MCP Client Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "n8n-workflow-manager": {
      "command": "node",
      "args": ["/path/to/n8n-mcp-server/dist/server.js"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Cursor IDE

Add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["/path/to/n8n-mcp-server/dist/server.js"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Other MCP Clients

The server works with any MCP-compatible client. Use the built executable or Node.js command with appropriate environment variables.

## 🎯 Available Tools

### Workflow Tools
- `workflow_list` - List workflows with filtering options
- `workflow_get` - Get detailed workflow information
- `workflow_create` - Create new workflows
- `workflow_update` - Update existing workflows
- `workflow_delete` - Delete workflows
- `workflow_activate` - Activate workflows
- `workflow_deactivate` - Deactivate workflows
- `workflow_transfer` - Transfer workflows between projects

### Execution Tools
- `execution_list` - List workflow executions
- `execution_get` - Get detailed execution information
- `execution_delete` - Delete execution records

### Organization Tools
- `tag_list` - List all tags
- `tag_create` - Create new tags
- `tag_update` - Update tag names
- `tag_delete` - Delete tags
- `workflow_tags_get` - Get workflow tags
- `workflow_tags_update` - Update workflow tags

### Variable Tools
- `variable_list` - List environment variables
- `variable_create` - Create new variables
- `variable_update` - Update variables
- `variable_delete` - Delete variables

### Project Tools (Enterprise)
- `project_list` - List projects
- `project_create` - Create projects
- `project_update` - Update projects
- `project_delete` - Delete projects

### Credential Tools
- `credential_create` - Create credentials
- `credential_delete` - Delete credentials
- `credential_schema_get` - Get credential schemas
- `credential_transfer` - Transfer credentials

### Security Tools
- `audit_generate` - Generate security audit reports

## 💡 Usage Examples

### List Active Workflows
```
Use the workflow_list tool to show me all active workflows
```

### Create a Simple Workflow
```
Create a new workflow called "API Monitor" with an HTTP Request node that checks https://api.example.com/health every 5 minutes
```

### Debug Failed Executions
```
Show me the last 10 failed executions and help me understand what went wrong
```

### Security Audit
```
Generate a comprehensive security audit report for my n8n instance
```

### Organize Workflows
```
Create tags for "production", "development", and "testing", then organize my workflows accordingly
```

## 🔒 Security Considerations

### API Key Management
- Store API keys securely using environment variables
- Use API keys with minimal required permissions
- Rotate API keys regularly
- Never commit API keys to version control

### Network Security
- Use HTTPS for n8n instance communication
- Consider VPN or private network access
- Implement proper firewall rules
- Monitor API access logs

### Access Control
- Use n8n's built-in user management and permissions
- Implement project-based access control (Enterprise)
- Regular security audits using the audit tools
- Monitor credential usage and access

## 🐛 Troubleshooting

### Common Issues

**Connection Errors**
```
Error: Authentication failed. Check your API key.
```
- Verify N8N_API_KEY is correct
- Ensure API key has required permissions
- Check n8n instance is accessible

**Permission Errors**
```
Error: Insufficient permissions for this operation.
```
- Verify API key permissions in n8n
- Check if operation requires Enterprise features
- Ensure user has access to target resources

**Network Timeouts**
```
Error: Network Error: timeout of 30000ms exceeded
```
- Increase REQUEST_TIMEOUT in environment
- Check network connectivity to n8n instance
- Verify n8n instance is responding

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

### Health Check

Test your configuration:
```bash
# Test API connectivity
curl -H "X-N8N-API-KEY: your-api-key" https://your-n8n-instance.com/api/v1/workflows
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: Check the technical guide for implementation details
- **n8n Community**: Join the n8n community for workflow-related questions

## 🔄 API Compatibility

This MCP server is compatible with:
- **n8n API Version**: 1.1.1+
- **MCP Protocol**: 1.0.0+
- **Node.js**: 18.0.0+

## 📊 Monitoring

The server provides comprehensive logging and error handling:
- Request/response logging
- Error tracking with context
- Performance monitoring
- API rate limit handling

## 🚀 Advanced Usage

### Custom Workflow Templates
Create reusable workflow templates by combining multiple tools:

```
Create a monitoring workflow template that:
1. Creates a new workflow with HTTP Request and Slack nodes
2. Sets up error handling
3. Configures appropriate tags
4. Activates the workflow
```

### Batch Operations
Perform bulk operations across multiple workflows:

```
Find all workflows tagged "legacy" and update them to use the new API endpoint
```

### Automated Maintenance
Use the audit tools for regular maintenance:

```
Generate a weekly security audit and identify any unused credentials or abandoned workflows
``` 