#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import dotenv from "dotenv";
import { N8nClient } from "./n8n-client.js";
import { workflowListSchema, workflowIdSchema, workflowCreateSchema, executionListSchema, executionIdSchema, tagCreateSchema, tagIdSchema, variableCreateSchema, variableIdSchema, projectCreateSchema, projectIdSchema, credentialCreateSchema, credentialIdSchema, auditGenerateSchema, createErrorResponse, createSuccessResponse, validateAndTransform } from "./utils/validation.js";
// Load environment variables
dotenv.config();
// Validate required environment variables
const requiredEnvVars = ['N8N_BASE_URL', 'N8N_API_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}
class N8nMcpServer {
    server;
    n8nClient;
    constructor() {
        this.server = new Server({
            name: "n8n-workflow-manager",
            description: "MCP server for comprehensive n8n workflow automation, debugging, and management",
            version: "1.0.0"
        }, {
            capabilities: {
                tools: {},
                resources: {}
            }
        });
        this.n8nClient = new N8nClient({
            baseUrl: process.env.N8N_BASE_URL,
            apiKey: process.env.N8N_API_KEY,
            timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
            retries: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
        });
        this.setupToolHandlers();
        this.setupResourceHandlers();
    }
    setupToolHandlers() {
        // Workflow Management Tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                // Workflow Tools
                {
                    name: "workflow_list",
                    description: `List all workflows with filtering options. 
          
**Input**: Optional filters for active status, tags, name, project, pagination
**Output**: Array of workflow summaries with basic info (name, ID, status, node count)
**Use Cases**: Browse workflows, find specific workflows, get instance overview
**Pagination**: Uses cursor-based pagination with limit up to 250

Example filters:
- active: true (only active workflows)
- tags: "production,staging" (workflows with these tags)
- name: "Data Processing" (partial name match)`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            active: { type: "boolean", description: "Filter by active/inactive status" },
                            tags: { type: "string", description: "Comma-separated list of tag names to filter by" },
                            name: { type: "string", description: "Filter workflows by name (partial match)" },
                            projectId: { type: "string", description: "Filter by project ID (Enterprise)" },
                            excludePinnedData: { type: "boolean", description: "Exclude pinned data from response for faster loading" },
                            limit: { type: "number", minimum: 1, maximum: 250, default: 100, description: "Maximum number of workflows to return" },
                            cursor: { type: "string", description: "Pagination cursor for next page" }
                        }
                    }
                },
                {
                    name: "workflow_get",
                    description: `Get detailed information about a specific workflow.

**Input**: Workflow ID (required), optional excludePinnedData flag
**Output**: Complete workflow object with nodes, connections, settings, and metadata
**Use Cases**: Examine workflow structure, debug issues, understand node configurations
**Performance**: Set excludePinnedData=true for faster loading if you don't need test data

Returns:
- Full node definitions with parameters and credentials
- Connection mappings between nodes
- Workflow settings (execution, timeout, timezone)
- Tags, creation/update timestamps`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Workflow ID" },
                            excludePinnedData: { type: "boolean", description: "Exclude pinned data for faster loading" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "workflow_create",
                    description: `Create a new workflow with nodes, connections, and settings.

**CRITICAL**: All fields (name, nodes, connections, settings) are REQUIRED by n8n API!

**Input Structure**:
\`\`\`json
{
  "name": "My Workflow",
  "nodes": [
    {
      "name": "Start",
      "type": "n8n-nodes-base.manualTrigger", 
      "position": [240, 300],
      "parameters": {}
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
\`\`\`

**Common Node Types**:
- n8n-nodes-base.manualTrigger (manual execution)
- n8n-nodes-base.webhook (HTTP webhook)
- n8n-nodes-base.httpRequest (HTTP requests) 
- n8n-nodes-base.code (JavaScript/Python code)
- n8n-nodes-base.set (data transformation)

**Connection Format**:
\`\`\`json
{
  "Node1": {
    "main": [[{"node": "Node2", "type": "main", "index": 0}]]
  }
}
\`\`\`

**Output**: Created workflow object with assigned ID`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Workflow name (required)",
                                minLength: 1
                            },
                            nodes: {
                                type: "array",
                                description: "Array of workflow nodes (required - must have at least one node)",
                                minItems: 1,
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string", description: "Node name (unique within workflow)" },
                                        type: {
                                            type: "string",
                                            description: "Node type (e.g., 'n8n-nodes-base.manualTrigger')",
                                            pattern: "^n8n-nodes-"
                                        },
                                        parameters: {
                                            type: "object",
                                            description: "Node parameters/configuration (required, use {} if empty)",
                                            default: {}
                                        },
                                        position: {
                                            type: "array",
                                            items: { type: "number" },
                                            minItems: 2,
                                            maxItems: 2,
                                            description: "Node position [x, y] coordinates"
                                        },
                                        credentials: { type: "object", description: "Node credentials configuration" },
                                        disabled: { type: "boolean", description: "Whether node is disabled", default: false },
                                        notes: { type: "string", description: "Node notes/documentation" }
                                    },
                                    required: ["name", "type", "position", "parameters"]
                                }
                            },
                            connections: {
                                type: "object",
                                description: "Node connections object (required - use {} for no connections)",
                                default: {}
                            },
                            settings: {
                                type: "object",
                                description: "Workflow settings (required)",
                                properties: {
                                    saveExecutionProgress: { type: "boolean", default: false },
                                    saveManualExecutions: { type: "boolean", default: false },
                                    saveDataErrorExecution: { type: "string", enum: ["all", "none"], default: "all" },
                                    saveDataSuccessExecution: { type: "string", enum: ["all", "none"], default: "all" },
                                    executionTimeout: { type: "number", maximum: 3600, description: "Timeout in seconds" },
                                    timezone: { type: "string", description: "Workflow timezone" }
                                },
                                required: ["saveExecutionProgress", "saveManualExecutions", "saveDataErrorExecution", "saveDataSuccessExecution"]
                            },
                            tags: { type: "array", items: { type: "string" }, description: "Workflow tags (tag names, not IDs)" },
                            active: { type: "boolean", default: false, description: "Whether to activate immediately" }
                        },
                        required: ["name", "nodes", "connections", "settings"]
                    }
                },
                {
                    name: "workflow_update",
                    description: `Update an existing workflow's properties.

**Input**: Workflow ID (required) + any fields to update
**Output**: Updated workflow object
**Use Cases**: Modify workflows, fix issues, add functionality
**Validation**: Maintains referential integrity of node connections

Updatable fields:
- name: Workflow name
- nodes: Complete nodes array (replaces existing)
- connections: Complete connections object
- settings: Workflow settings object
- active: Activation status`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Workflow ID" },
                            name: { type: "string", description: "New workflow name" },
                            nodes: { type: "array", description: "Updated nodes array (replaces all existing nodes)" },
                            connections: { type: "object", description: "Updated connections object (replaces all existing connections)" },
                            settings: { type: "object", description: "Updated workflow settings" },
                            active: { type: "boolean", description: "Activation status" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "workflow_delete",
                    description: `Delete a workflow permanently.

**WARNING**: This action cannot be undone!

**Input**: Workflow ID (required)
**Output**: Deleted workflow object (for confirmation)
**Use Cases**: Clean up unused workflows, remove test workflows
**Prerequisites**: Workflow must be deactivated first

Side effects:
- Removes all execution history
- Breaks any webhook URLs
- Removes workflow from all projects`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Workflow ID to delete" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "workflow_activate",
                    description: `Activate a workflow to enable automatic execution.

**Input**: Workflow ID (required)
**Output**: Activated workflow object
**Prerequisites**: 
- Workflow must have trigger nodes (webhook, schedule, etc.)
- All required credentials must be configured
- Workflow must be valid (no broken connections)

**Trigger Types That Enable Automation**:
- Webhook trigger (enables HTTP endpoint)
- Schedule trigger (enables cron execution)
- Email trigger (monitors IMAP)
- File trigger (monitors filesystem)

**Note**: Manual triggers don't enable automation`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Workflow ID to activate" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "workflow_deactivate",
                    description: `Deactivate a workflow to stop automatic execution.

**Input**: Workflow ID (required)
**Output**: Deactivated workflow object
**Use Cases**: Pause automation, maintenance, debugging
**Safe Operation**: Does not delete workflow or data

Effects:
- Stops webhook endpoints
- Disables scheduled executions
- Preserves workflow definition and history`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Workflow ID to deactivate" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "workflow_transfer",
                    description: `Transfer a workflow to another project (Enterprise feature).

**Input**: Workflow ID + destination project ID
**Output**: Success confirmation
**Requirements**: n8n Enterprise license, appropriate permissions
**Use Cases**: Project organization, access control management

**Note**: Only available in n8n Enterprise installations`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Workflow ID to transfer" },
                            destinationProjectId: { type: "string", description: "Target project ID" }
                        },
                        required: ["id", "destinationProjectId"]
                    }
                },
                // Execution Tools
                {
                    name: "execution_list",
                    description: `List workflow executions with filtering and analysis.

**Input**: Optional filters for status, workflow, project, pagination
**Output**: Array of execution summaries with timing and status info
**Use Cases**: Monitor runs, find failures, analyze patterns, performance tracking

**Status Filters**:
- "error": Failed executions only
- "success": Successful executions only  
- "waiting": Currently running/waiting

**Performance**: Set includeData=false for faster listing (default)

**Output Information**:
- Execution ID, workflow ID, status
- Start/stop timestamps, duration
- Execution mode (manual, trigger, webhook, etc.)
- Basic error information (if failed)`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            includeData: { type: "boolean", description: "Include execution data in response (slower but more detailed)" },
                            status: { type: "string", enum: ["error", "success", "waiting"], description: "Filter by execution status" },
                            workflowId: { type: "string", description: "Filter by specific workflow ID" },
                            projectId: { type: "string", description: "Filter by project ID (Enterprise)" },
                            limit: { type: "number", minimum: 1, maximum: 250, default: 100 },
                            cursor: { type: "string", description: "Pagination cursor" }
                        }
                    }
                },
                {
                    name: "execution_get",
                    description: `Get detailed execution information for debugging and analysis.

**Input**: Execution ID (required), optional includeData flag
**Output**: Complete execution object with node-by-node results
**Use Cases**: Debug failed workflows, analyze data flow, performance analysis

**Detailed Information Includes**:
- Node execution results and timings
- Data passed between nodes
- Error messages and stack traces
- Input/output data for each node
- Execution timeline and bottlenecks

**Performance**: Set includeData=true for full debugging info (slower)`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Execution ID (numeric string)" },
                            includeData: { type: "boolean", description: "Include full execution data and node results" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "execution_delete",
                    description: `Delete an execution record.

**Input**: Execution ID (required)
**Output**: Deleted execution object (confirmation)
**Use Cases**: Clean up history, remove sensitive data, manage storage
**Warning**: Removes execution data permanently

**Note**: Does not affect the workflow definition, only this execution record`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Execution ID to delete" }
                        },
                        required: ["id"]
                    }
                },
                // Tag Management Tools
                {
                    name: "tag_list",
                    description: `List all available tags for workflow organization.

**Input**: Optional pagination parameters
**Output**: Array of tag objects with ID, name, timestamps
**Use Cases**: See existing tags, prepare for workflow tagging, audit organization

**Tag Information**:
- Tag ID (for workflow_tags_update)
- Tag name (for creation/filtering)
- Creation and update timestamps
- Usage count (how many workflows use it)`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            limit: { type: "number", minimum: 1, maximum: 250, default: 100 },
                            cursor: { type: "string", description: "Pagination cursor" }
                        }
                    }
                },
                {
                    name: "tag_create",
                    description: `Create a new tag for organizing workflows.

**Input**: Tag name (required)
**Output**: Created tag object with ID and timestamps
**Use Cases**: Establish categorization systems, organize workflows by environment/team
**Validation**: Tag names must be unique

**Example**: "production", "development", "data-processing", "team-alpha"`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Tag name (must be unique)",
                                minLength: 1
                            }
                        },
                        required: ["name"]
                    }
                },
                {
                    name: "tag_update",
                    description: `Update an existing tag's name.

**Input**: Tag ID (required) + new name
**Output**: Updated tag object
**Use Cases**: Rename tags for better organization, fix typos
**Validation**: New name must be unique

**Note**: This updates the tag for ALL workflows that use it`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Tag ID" },
                            name: { type: "string", description: "New tag name (must be unique)" }
                        },
                        required: ["id", "name"]
                    }
                },
                {
                    name: "tag_delete",
                    description: `Delete a tag permanently.

**Input**: Tag ID (required)
**Output**: Deleted tag object (confirmation)
**Use Cases**: Remove unused tags, clean up organization
**Side Effects**: Removes tag from ALL workflows that use it

**Warning**: This action cannot be undone`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Tag ID to delete" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "workflow_tags_get",
                    description: `Get all tags assigned to a specific workflow.

**Input**: Workflow ID (required)
**Output**: Array of tag objects assigned to the workflow
**Use Cases**: See how workflow is categorized, audit tagging
**Returns**: Tag objects with ID, name, and timestamps`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Workflow ID" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "workflow_tags_update",
                    description: `Update the tags assigned to a workflow.

**Input**: Workflow ID (required) + array of tag IDs
**Output**: Updated array of tags assigned to workflow
**Use Cases**: Categorize workflows, organize by team/environment
**Validation**: All tag IDs must exist

**IMPORTANT**: Use tag IDs (from tag_list), not tag names!

**Example**: tagIds: ["2tUt1wbLX592XDdX", "3uVs2xbMY693YEeY"]`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Workflow ID" },
                            tagIds: {
                                type: "array",
                                items: { type: "string" },
                                description: "Array of tag IDs to assign (replaces all existing tags)"
                            }
                        },
                        required: ["id", "tagIds"]
                    }
                },
                // Variable Management Tools
                {
                    name: "variable_list",
                    description: `List all environment variables.

**Input**: Optional pagination parameters
**Output**: Array of variable objects with key, value, metadata
**Use Cases**: See available variables, audit configuration, prepare for workflow usage
**Security**: Values may be truncated in listing for security

**Variable Usage in Workflows**: Access via \$vars.VARIABLE_KEY`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            limit: { type: "number", minimum: 1, maximum: 250, default: 100 },
                            cursor: { type: "string", description: "Pagination cursor" }
                        }
                    }
                },
                {
                    name: "variable_create",
                    description: `Create a new environment variable.

**Input**: Key and value (both required)
**Output**: Success confirmation
**Use Cases**: Store configuration, API URLs, feature flags
**Security**: Values are encrypted at rest

**Key Requirements**:
- Must be unique
- Alphanumeric + underscore only
- Typically UPPER_CASE convention

**Example**: key: "API_BASE_URL", value: "https://api.example.com"`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            key: {
                                type: "string",
                                description: "Variable key/name (must be unique, alphanumeric + underscore)",
                                pattern: "^[A-Za-z_][A-Za-z0-9_]*$"
                            },
                            value: {
                                type: "string",
                                description: "Variable value (stored encrypted)"
                            }
                        },
                        required: ["key", "value"]
                    }
                },
                {
                    name: "variable_update",
                    description: `Update an existing environment variable.

**Input**: Variable ID (required) + new key and/or value
**Output**: Success confirmation
**Use Cases**: Change configuration values, update URLs/tokens
**Note**: Can change both key and value simultaneously`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Variable ID" },
                            key: { type: "string", description: "Variable key/name" },
                            value: { type: "string", description: "Variable value" }
                        },
                        required: ["id", "key", "value"]
                    }
                },
                {
                    name: "variable_delete",
                    description: `Delete an environment variable.

**Input**: Variable ID (required)
**Output**: Success confirmation
**Use Cases**: Remove unused variables, clean up configuration
**Warning**: May break workflows that reference this variable`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Variable ID to delete" }
                        },
                        required: ["id"]
                    }
                },
                // Project Management Tools (Enterprise)
                {
                    name: "project_list",
                    description: `List all projects (Enterprise feature).

**Input**: Optional pagination parameters
**Output**: Array of project objects with ID, name, type
**Requirements**: n8n Enterprise license
**Use Cases**: See project organization, manage access control
**Default**: Most n8n instances have a default project for all resources`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            limit: { type: "number", minimum: 1, maximum: 250, default: 100 },
                            cursor: { type: "string", description: "Pagination cursor" }
                        }
                    }
                },
                {
                    name: "project_create",
                    description: `Create a new project (Enterprise feature).

**Input**: Project name (required)
**Output**: Success confirmation
**Requirements**: n8n Enterprise license, appropriate permissions
**Use Cases**: Organize workflows by team/environment, control access`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Project name" }
                        },
                        required: ["name"]
                    }
                },
                {
                    name: "project_update",
                    description: `Update a project's properties (Enterprise feature).

**Input**: Project ID (required) + new name
**Output**: Success confirmation
**Requirements**: n8n Enterprise license
**Use Cases**: Rename projects for better organization`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Project ID" },
                            name: { type: "string", description: "New project name" }
                        },
                        required: ["id", "name"]
                    }
                },
                {
                    name: "project_delete",
                    description: `Delete a project (Enterprise feature).

**Input**: Project ID (required)
**Output**: Success confirmation
**Requirements**: n8n Enterprise license
**Side Effects**: Affects all workflows and resources in the project
**Warning**: This action cannot be undone`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Project ID to delete" }
                        },
                        required: ["id"]
                    }
                },
                // Credential Management Tools
                {
                    name: "credential_create",
                    description: `Create a new credential for workflow authentication.

**Input**: Name, type, and data object (all required)
**Output**: Created credential object with ID
**Use Cases**: Store API keys, passwords, OAuth tokens securely
**Security**: Data is encrypted at rest

**Common Credential Types**:
- "httpBasicAuth": username/password for HTTP Basic Auth
- "oAuth2Api": OAuth 2.0 client credentials
- "httpHeaderAuth": API key in header
- "apiKey": Simple API key

**Example Data Structure**:
\`\`\`json
{
  "name": "My API Credentials",
  "type": "httpHeaderAuth", 
  "data": {
    "name": "X-API-Key",
    "value": "your-api-key-here"
  }
}
\`\`\`

**Use credential_schema_get to see required fields for each type**`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Credential name" },
                            type: { type: "string", description: "Credential type (e.g., 'httpBasicAuth', 'oAuth2Api')" },
                            data: { type: "object", description: "Credential data object with authentication details" }
                        },
                        required: ["name", "type", "data"]
                    }
                },
                {
                    name: "credential_delete",
                    description: `Delete a credential permanently.

**Input**: Credential ID (required)
**Output**: Deleted credential object (confirmation)
**Warning**: Will break all workflows using this credential
**Security**: Credential data is securely deleted

**Prerequisites**: No workflows should be using this credential`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Credential ID to delete" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "credential_schema_get",
                    description: `Get the schema for a specific credential type.

**Input**: Credential type name (required)
**Output**: JSON schema showing required and optional fields
**Use Cases**: Understand what data fields are needed before creating credentials
**Returns**: Complete schema with validation rules and examples

**Example Usage**: Get schema for "httpBasicAuth" to see it needs "user" and "password" fields`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            credentialTypeName: { type: "string", description: "Credential type name (e.g., 'httpBasicAuth')" }
                        },
                        required: ["credentialTypeName"]
                    }
                },
                {
                    name: "credential_transfer",
                    description: `Transfer a credential to another project (Enterprise feature).

**Input**: Credential ID + destination project ID
**Output**: Success confirmation
**Requirements**: n8n Enterprise license
**Use Cases**: Move credentials between projects for organization`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Credential ID" },
                            destinationProjectId: { type: "string", description: "Target project ID" }
                        },
                        required: ["id", "destinationProjectId"]
                    }
                },
                // Security and Audit Tools
                {
                    name: "audit_generate",
                    description: `Generate a comprehensive security audit report.

**Input**: Optional audit configuration
**Output**: Detailed security report organized by risk categories
**Use Cases**: Security assessment, compliance checking, risk identification

**Audit Categories**:
- "credentials": Unused or insecure credentials
- "database": SQL injection risks, insecure queries
- "nodes": Community nodes, filesystem access risks
- "filesystem": File access and manipulation risks
- "instance": Unprotected webhooks, security configuration

**Report Structure**:
- Risk level assessment
- Detailed findings with locations
- Specific recommendations
- Affected workflows and nodes

**Configuration Options**:
- daysAbandonedWorkflow: Consider workflows abandoned after N days
- categories: Limit audit to specific risk categories`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            additionalOptions: {
                                type: "object",
                                properties: {
                                    daysAbandonedWorkflow: { type: "number", description: "Days to consider a workflow abandoned if not executed" },
                                    categories: {
                                        type: "array",
                                        items: { type: "string", enum: ["credentials", "database", "nodes", "filesystem", "instance"] },
                                        description: "Audit categories to include"
                                    }
                                }
                            }
                        }
                    }
                },
                // User Management Tools (Enterprise)
                {
                    name: "user_list",
                    description: `List all users in the n8n instance (Enterprise feature).

**Input**: Optional pagination and filtering parameters
**Output**: Array of user objects with details and roles
**Requirements**: n8n Enterprise license, admin permissions
**Use Cases**: User management, role auditing, access control

**User Information**:
- User ID, email, name
- Role (owner, admin, member)
- Status (active, pending invitation)
- Creation and update timestamps`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            limit: { type: "number", minimum: 1, maximum: 250, default: 100 },
                            cursor: { type: "string", description: "Pagination cursor" },
                            includeRole: { type: "boolean", description: "Include user roles in response" },
                            projectId: { type: "string", description: "Filter users by project" }
                        }
                    }
                },
                {
                    name: "user_get",
                    description: `Get detailed information about a specific user (Enterprise feature).

**Input**: User ID or email address (required)
**Output**: Complete user object with permissions and metadata
**Requirements**: n8n Enterprise license, admin permissions
**Use Cases**: View user details, check permissions, audit access`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            identifier: { type: "string", description: "User ID or email address" },
                            includeRole: { type: "boolean", description: "Include user role in response" }
                        },
                        required: ["identifier"]
                    }
                },
                {
                    name: "user_create",
                    description: `Create new users in the n8n instance (Enterprise feature).

**Input**: Array of user objects with email and optional role
**Output**: Array of creation results (success/error per user)
**Requirements**: n8n Enterprise license, admin permissions
**Use Cases**: Invite team members, bulk user creation

**Roles Available**:
- "global:admin": Full administrative access
- "global:member": Standard user access

**Process**: Creates user accounts and sends invitation emails`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            users: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        email: { type: "string", format: "email", description: "User email address" },
                                        role: { type: "string", enum: ["global:admin", "global:member"], description: "User role" }
                                    },
                                    required: ["email"]
                                },
                                description: "Array of users to create"
                            }
                        },
                        required: ["users"]
                    }
                },
                {
                    name: "user_delete",
                    description: `Delete a user from the n8n instance (Enterprise feature).

**Input**: User ID or email address (required)
**Output**: Success confirmation
**Requirements**: n8n Enterprise license, admin permissions
**Warning**: Permanently removes user access
**Side Effects**: May affect workflows owned by this user`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            identifier: { type: "string", description: "User ID or email address" }
                        },
                        required: ["identifier"]
                    }
                },
                {
                    name: "user_role_change",
                    description: `Change a user's global role (Enterprise feature).

**Input**: User identifier + new role name
**Output**: Success confirmation
**Requirements**: n8n Enterprise license, admin permissions
**Use Cases**: Promote/demote user permissions, role management

**Available Roles**:
- "global:admin": Full administrative access
- "global:member": Standard user access`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            identifier: { type: "string", description: "User ID or email address" },
                            newRoleName: { type: "string", enum: ["global:admin", "global:member"], description: "New role for the user" }
                        },
                        required: ["identifier", "newRoleName"]
                    }
                },
                // Source Control Tools
                {
                    name: "source_control_pull",
                    description: `Pull changes from the connected source control repository.

**Input**: Optional force flag and environment variables
**Output**: Import results showing what was updated
**Requirements**: Source Control feature licensed and configured with Git repository
**Use Cases**: Sync workflows from Git, deploy from repository, environment management

**Force Option**: Overwrites local changes if conflicts exist
**Variables**: Set environment variables during pull process
**Returns**: Details of imported workflows, credentials, variables, and tags`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            force: { type: "boolean", description: "Force pull even if there are conflicts" },
                            variables: { type: "object", description: "Environment variables to set during pull", additionalProperties: { type: "string" } }
                        }
                    }
                },
                // Additional Tag Operation
                {
                    name: "tag_get",
                    description: `Get detailed information about a specific tag.

**Input**: Tag ID (required)
**Output**: Complete tag object with metadata
**Use Cases**: View tag details, get creation info, audit tag usage
**Returns**: Tag ID, name, creation/update timestamps`,
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Tag ID" }
                        },
                        required: ["id"]
                    }
                }
            ]
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    // Workflow Tools
                    case "workflow_list":
                        return await this.handleWorkflowList(args);
                    case "workflow_get":
                        return await this.handleWorkflowGet(args);
                    case "workflow_create":
                        return await this.handleWorkflowCreate(args);
                    case "workflow_update":
                        return await this.handleWorkflowUpdate(args);
                    case "workflow_delete":
                        return await this.handleWorkflowDelete(args);
                    case "workflow_activate":
                        return await this.handleWorkflowActivate(args);
                    case "workflow_deactivate":
                        return await this.handleWorkflowDeactivate(args);
                    case "workflow_transfer":
                        return await this.handleWorkflowTransfer(args);
                    // Execution Tools
                    case "execution_list":
                        return await this.handleExecutionList(args);
                    case "execution_get":
                        return await this.handleExecutionGet(args);
                    case "execution_delete":
                        return await this.handleExecutionDelete(args);
                    // Tag Tools
                    case "tag_list":
                        return await this.handleTagList(args);
                    case "tag_create":
                        return await this.handleTagCreate(args);
                    case "tag_update":
                        return await this.handleTagUpdate(args);
                    case "tag_delete":
                        return await this.handleTagDelete(args);
                    case "workflow_tags_get":
                        return await this.handleWorkflowTagsGet(args);
                    case "workflow_tags_update":
                        return await this.handleWorkflowTagsUpdate(args);
                    // Variable Tools
                    case "variable_list":
                        return await this.handleVariableList(args);
                    case "variable_create":
                        return await this.handleVariableCreate(args);
                    case "variable_update":
                        return await this.handleVariableUpdate(args);
                    case "variable_delete":
                        return await this.handleVariableDelete(args);
                    // Project Tools
                    case "project_list":
                        return await this.handleProjectList(args);
                    case "project_create":
                        return await this.handleProjectCreate(args);
                    case "project_update":
                        return await this.handleProjectUpdate(args);
                    case "project_delete":
                        return await this.handleProjectDelete(args);
                    // Credential Tools
                    case "credential_create":
                        return await this.handleCredentialCreate(args);
                    case "credential_delete":
                        return await this.handleCredentialDelete(args);
                    case "credential_schema_get":
                        return await this.handleCredentialSchemaGet(args);
                    case "credential_transfer":
                        return await this.handleCredentialTransfer(args);
                    // Audit Tools
                    case "audit_generate":
                        return await this.handleAuditGenerate(args);
                    // User Management Tools
                    case "user_list":
                        return await this.handleUserList(args);
                    case "user_get":
                        return await this.handleUserGet(args);
                    case "user_create":
                        return await this.handleUserCreate(args);
                    case "user_delete":
                        return await this.handleUserDelete(args);
                    case "user_role_change":
                        return await this.handleUserRoleChange(args);
                    // Source Control Tools
                    case "source_control_pull":
                        return await this.handleSourceControlPull(args);
                    // Additional Tag Tool
                    case "tag_get":
                        return await this.handleTagGet(args);
                    default:
                        return createErrorResponse(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                console.error(`Error in tool ${name}:`, error);
                return createErrorResponse(`Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    setupResourceHandlers() {
        // Resources will be implemented if needed for caching or additional data access
    }
    // Workflow Tool Handlers
    async handleWorkflowList(args) {
        const params = validateAndTransform(workflowListSchema, args);
        const result = await this.n8nClient.getWorkflows(params);
        const workflowSummary = result.data.map((w) => `• **${w.name}** (ID: ${w.id})\n` +
            `  Status: ${w.active ? '🟢 Active' : '🔴 Inactive'}\n` +
            `  Nodes: ${w.nodes?.length || 0}\n` +
            `  Tags: ${w.tags?.map((t) => t.name).join(', ') || 'None'}\n` +
            `  Created: ${w.createdAt ? new Date(w.createdAt).toLocaleString() : 'Unknown'}`).join('\n\n');
        return createSuccessResponse(`Found ${result.data.length} workflows`, workflowSummary + (result.nextCursor ? `\n\n📄 Next cursor: ${result.nextCursor}` : ''));
    }
    async handleWorkflowGet(args) {
        const params = validateAndTransform(z.object({ id: workflowIdSchema, excludePinnedData: z.boolean().optional() }), args);
        const workflow = await this.n8nClient.getWorkflow(params.id, params.excludePinnedData);
        const nodesList = workflow.nodes?.map((node) => `  • **${node.name}** (${node.type})\n` +
            `    Position: [${node.position?.join(', ') || 'Not set'}]\n` +
            `    Disabled: ${node.disabled ? 'Yes' : 'No'}`).join('\n') || 'No nodes';
        const workflowInfo = `**Workflow: ${workflow.name}**\n` +
            `ID: ${workflow.id}\n` +
            `Status: ${workflow.active ? '🟢 Active' : '🔴 Inactive'}\n` +
            `Nodes: ${workflow.nodes?.length || 0}\n` +
            `Connections: ${Object.keys(workflow.connections || {}).length}\n` +
            `Tags: ${workflow.tags?.map((t) => t.name).join(', ') || 'None'}\n` +
            `Created: ${workflow.createdAt ? new Date(workflow.createdAt).toLocaleString() : 'Unknown'}\n` +
            `Updated: ${workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleString() : 'Unknown'}\n\n` +
            `**Nodes:**\n${nodesList}\n\n` +
            `**Settings:**\n` +
            `  • Save execution progress: ${workflow.settings?.saveExecutionProgress ? 'Yes' : 'No'}\n` +
            `  • Save manual executions: ${workflow.settings?.saveManualExecutions ? 'Yes' : 'No'}\n` +
            `  • Execution timeout: ${workflow.settings?.executionTimeout || 'Default'}\n` +
            `  • Timezone: ${workflow.settings?.timezone || 'Default'}`;
        return createSuccessResponse('Workflow details retrieved', workflowInfo);
    }
    async handleWorkflowCreate(args) {
        const workflowData = validateAndTransform(workflowCreateSchema, args);
        // Convert tag names to tag objects if provided
        const processedData = {
            ...workflowData,
            tags: workflowData.tags?.map((name) => ({ name }))
        };
        const workflow = await this.n8nClient.createWorkflow(processedData);
        return createSuccessResponse(`Workflow "${workflow.name}" created successfully`, `ID: ${workflow.id}\nStatus: ${workflow.active ? 'Active' : 'Inactive'}\nNodes: ${workflow.nodes?.length || 0}`);
    }
    async handleWorkflowUpdate(args) {
        const params = validateAndTransform(z.object({
            id: workflowIdSchema,
            name: z.string().optional(),
            nodes: z.array(z.any()).optional(),
            connections: z.record(z.any()).optional(),
            settings: z.record(z.any()).optional(),
            active: z.boolean().optional()
        }), args);
        const { id, ...updateData } = params;
        const workflow = await this.n8nClient.updateWorkflow(id, updateData);
        return createSuccessResponse(`Workflow "${workflow.name}" updated successfully`, `ID: ${workflow.id}\nStatus: ${workflow.active ? 'Active' : 'Inactive'}`);
    }
    async handleWorkflowDelete(args) {
        const params = validateAndTransform(z.object({ id: workflowIdSchema }), args);
        const workflow = await this.n8nClient.deleteWorkflow(params.id);
        return createSuccessResponse(`Workflow "${workflow.name}" deleted successfully`);
    }
    async handleWorkflowActivate(args) {
        const params = validateAndTransform(z.object({ id: workflowIdSchema }), args);
        const workflow = await this.n8nClient.activateWorkflow(params.id);
        return createSuccessResponse(`Workflow "${workflow.name}" activated successfully`);
    }
    async handleWorkflowDeactivate(args) {
        const params = validateAndTransform(z.object({ id: workflowIdSchema }), args);
        const workflow = await this.n8nClient.deactivateWorkflow(params.id);
        return createSuccessResponse(`Workflow "${workflow.name}" deactivated successfully`);
    }
    async handleWorkflowTransfer(args) {
        const params = validateAndTransform(z.object({ id: workflowIdSchema, destinationProjectId: z.string() }), args);
        await this.n8nClient.transferWorkflow(params.id, params.destinationProjectId);
        return createSuccessResponse(`Workflow transferred to project ${params.destinationProjectId} successfully`);
    }
    // Execution Tool Handlers
    async handleExecutionList(args) {
        const params = validateAndTransform(executionListSchema, args);
        const result = await this.n8nClient.getExecutions(params);
        const executionSummary = result.data.map((exec) => {
            const duration = exec.stoppedAt && exec.startedAt ?
                Math.round((new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000) :
                null;
            return `• **Execution ${exec.id}**\n` +
                `  Workflow: ${exec.workflowData?.name || exec.workflowId}\n` +
                `  Status: ${exec.status === 'success' ? '✅' : exec.status === 'error' ? '❌' : '⏳'} ${exec.status}\n` +
                `  Started: ${new Date(exec.startedAt).toLocaleString()}\n` +
                `  ${exec.stoppedAt ? `Finished: ${new Date(exec.stoppedAt).toLocaleString()}` : 'Still running'}\n` +
                `  Duration: ${duration ? `${duration}s` : 'N/A'}`;
        }).join('\n\n');
        return createSuccessResponse(`Found ${result.data.length} executions`, executionSummary + (result.nextCursor ? `\n\n📄 Next cursor: ${result.nextCursor}` : ''));
    }
    async handleExecutionGet(args) {
        const params = validateAndTransform(z.object({ id: executionIdSchema, includeData: z.boolean().optional() }), args);
        const execution = await this.n8nClient.getExecution(params.id, params.includeData);
        const nodeExecutions = execution.data?.resultData?.runData || {};
        const nodeCount = Object.keys(nodeExecutions).length;
        const hasErrors = execution.status === 'error';
        let detailText = `**Execution ${execution.id}**\n` +
            `Workflow: ${execution.workflowData?.name || execution.workflowId}\n` +
            `Status: ${execution.status === 'success' ? '✅' : execution.status === 'error' ? '❌' : '⏳'} ${execution.status}\n` +
            `Mode: ${execution.mode}\n` +
            `Started: ${new Date(execution.startedAt).toLocaleString()}\n`;
        if (execution.stoppedAt) {
            const duration = Math.round((new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000);
            detailText += `Finished: ${new Date(execution.stoppedAt).toLocaleString()}\n`;
            detailText += `Duration: ${duration}s\n`;
        }
        detailText += `Nodes executed: ${nodeCount}\n\n`;
        if (hasErrors && execution.data?.resultData?.error) {
            detailText += `**❌ Error Details:**\n\`\`\`\n${JSON.stringify(execution.data.resultData.error, null, 2)}\n\`\`\`\n\n`;
        }
        if (nodeCount > 0) {
            detailText += `**Node Execution Summary:**\n`;
            Object.entries(nodeExecutions).forEach(([nodeName, nodeData]) => {
                const nodeRuns = Array.isArray(nodeData) ? nodeData : [nodeData];
                detailText += `  • **${nodeName}**: ${nodeRuns.length} run(s)\n`;
                nodeRuns.forEach((run, index) => {
                    if (run.error) {
                        detailText += `    Run ${index + 1}: ❌ ERROR - ${run.error.message}\n`;
                    }
                    else {
                        detailText += `    Run ${index + 1}: ✅ SUCCESS - ${run.data?.main?.[0]?.length || 0} items\n`;
                    }
                });
            });
        }
        return createSuccessResponse('Execution details retrieved', detailText);
    }
    async handleExecutionDelete(args) {
        const params = validateAndTransform(z.object({ id: executionIdSchema }), args);
        const execution = await this.n8nClient.deleteExecution(params.id);
        return createSuccessResponse(`Execution ${execution.id} deleted successfully`);
    }
    // Tag Tool Handlers
    async handleTagList(args) {
        const params = validateAndTransform(z.object({
            limit: z.number().min(1).max(250).default(100).optional(),
            cursor: z.string().optional()
        }), args);
        const result = await this.n8nClient.getTags(params);
        const tagSummary = result.data.map((tag) => `• **${tag.name}** (ID: ${tag.id})\n` +
            `  Created: ${tag.createdAt ? new Date(tag.createdAt).toLocaleString() : 'Unknown'}`).join('\n');
        return createSuccessResponse(`Found ${result.data.length} tags`, tagSummary + (result.nextCursor ? `\n\n📄 Next cursor: ${result.nextCursor}` : ''));
    }
    async handleTagCreate(args) {
        const params = validateAndTransform(tagCreateSchema, args);
        const tag = await this.n8nClient.createTag({ name: params.name });
        return createSuccessResponse(`Tag "${tag.name}" created successfully`, `ID: ${tag.id}`);
    }
    async handleTagUpdate(args) {
        const params = validateAndTransform(z.object({ id: tagIdSchema, name: z.string() }), args);
        const tag = await this.n8nClient.updateTag(params.id, { name: params.name });
        return createSuccessResponse(`Tag updated to "${tag.name}" successfully`);
    }
    async handleTagDelete(args) {
        const params = validateAndTransform(z.object({ id: tagIdSchema }), args);
        const tag = await this.n8nClient.deleteTag(params.id);
        return createSuccessResponse(`Tag "${tag.name}" deleted successfully`);
    }
    async handleWorkflowTagsGet(args) {
        const params = validateAndTransform(z.object({ id: workflowIdSchema }), args);
        const tags = await this.n8nClient.getWorkflowTags(params.id);
        const tagList = tags.map((tag) => `• ${tag.name} (ID: ${tag.id})`).join('\n') || 'No tags assigned';
        return createSuccessResponse(`Workflow tags retrieved`, tagList);
    }
    async handleWorkflowTagsUpdate(args) {
        const params = validateAndTransform(z.object({ id: workflowIdSchema, tagIds: z.array(z.string()) }), args);
        const tags = await this.n8nClient.updateWorkflowTags(params.id, params.tagIds);
        const tagList = tags.map((tag) => tag.name).join(', ') || 'No tags';
        return createSuccessResponse(`Workflow tags updated successfully`, `Tags: ${tagList}`);
    }
    // Variable Tool Handlers
    async handleVariableList(args) {
        const params = validateAndTransform(z.object({
            limit: z.number().min(1).max(250).default(100).optional(),
            cursor: z.string().optional()
        }), args);
        const result = await this.n8nClient.getVariables(params);
        const variableSummary = result.data.map((variable) => `• **${variable.key}** (ID: ${variable.id})\n` +
            `  Value: ${variable.value.length > 50 ? variable.value.substring(0, 50) + '...' : variable.value}`).join('\n');
        return createSuccessResponse(`Found ${result.data.length} variables`, variableSummary + (result.nextCursor ? `\n\n📄 Next cursor: ${result.nextCursor}` : ''));
    }
    async handleVariableCreate(args) {
        const params = validateAndTransform(variableCreateSchema, args);
        await this.n8nClient.createVariable({ key: params.key, value: params.value });
        return createSuccessResponse(`Variable "${params.key}" created successfully`);
    }
    async handleVariableUpdate(args) {
        const params = validateAndTransform(z.object({ id: variableIdSchema, key: z.string(), value: z.string() }), args);
        await this.n8nClient.updateVariable(params.id, { key: params.key, value: params.value });
        return createSuccessResponse(`Variable "${params.key}" updated successfully`);
    }
    async handleVariableDelete(args) {
        const params = validateAndTransform(z.object({ id: variableIdSchema }), args);
        await this.n8nClient.deleteVariable(params.id);
        return createSuccessResponse(`Variable deleted successfully`);
    }
    // Project Tool Handlers
    async handleProjectList(args) {
        const params = validateAndTransform(z.object({
            limit: z.number().min(1).max(250).default(100).optional(),
            cursor: z.string().optional()
        }), args);
        const result = await this.n8nClient.getProjects(params);
        const projectSummary = result.data.map((project) => `• **${project.name}** (ID: ${project.id})\n` +
            `  Type: ${project.type || 'Standard'}`).join('\n');
        return createSuccessResponse(`Found ${result.data.length} projects`, projectSummary + (result.nextCursor ? `\n\n📄 Next cursor: ${result.nextCursor}` : ''));
    }
    async handleProjectCreate(args) {
        const params = validateAndTransform(projectCreateSchema, args);
        await this.n8nClient.createProject({ name: params.name });
        return createSuccessResponse(`Project "${params.name}" created successfully`);
    }
    async handleProjectUpdate(args) {
        const params = validateAndTransform(z.object({ id: projectIdSchema, name: z.string() }), args);
        await this.n8nClient.updateProject(params.id, { name: params.name });
        return createSuccessResponse(`Project updated to "${params.name}" successfully`);
    }
    async handleProjectDelete(args) {
        const params = validateAndTransform(z.object({ id: projectIdSchema }), args);
        await this.n8nClient.deleteProject(params.id);
        return createSuccessResponse(`Project deleted successfully`);
    }
    // Credential Tool Handlers
    async handleCredentialCreate(args) {
        const params = validateAndTransform(credentialCreateSchema, args);
        const credential = await this.n8nClient.createCredential({
            name: params.name,
            type: params.type,
            data: params.data
        });
        return createSuccessResponse(`Credential "${credential.name}" created successfully`, `ID: ${credential.id}\nType: ${credential.type}`);
    }
    async handleCredentialDelete(args) {
        const params = validateAndTransform(z.object({ id: credentialIdSchema }), args);
        const credential = await this.n8nClient.deleteCredential(params.id);
        return createSuccessResponse(`Credential "${credential.name}" deleted successfully`);
    }
    async handleCredentialSchemaGet(args) {
        const params = validateAndTransform(z.object({ credentialTypeName: z.string() }), args);
        const schema = await this.n8nClient.getCredentialSchema(params.credentialTypeName);
        return createSuccessResponse(`Schema for credential type "${params.credentialTypeName}"`, `\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\``);
    }
    async handleCredentialTransfer(args) {
        const params = validateAndTransform(z.object({ id: credentialIdSchema, destinationProjectId: z.string() }), args);
        await this.n8nClient.transferCredential(params.id, params.destinationProjectId);
        return createSuccessResponse(`Credential transferred to project ${params.destinationProjectId} successfully`);
    }
    // Audit Tool Handlers
    async handleAuditGenerate(args) {
        const options = validateAndTransform(auditGenerateSchema, args);
        const auditReport = await this.n8nClient.generateAudit(options);
        let reportSummary = '**🔍 Security Audit Report**\n\n';
        Object.entries(auditReport).forEach(([reportName, reportData]) => {
            const report = reportData;
            reportSummary += `**${reportName}**\n`;
            reportSummary += `Risk Level: ${report.risk}\n\n`;
            if (report.sections) {
                report.sections.forEach((section) => {
                    reportSummary += `• **${section.title}**\n`;
                    reportSummary += `  ${section.description}\n`;
                    reportSummary += `  💡 Recommendation: ${section.recommendation}\n`;
                    if (section.location && section.location.length > 0) {
                        reportSummary += `  📍 Locations:\n`;
                        section.location.forEach((loc) => {
                            if (loc.workflowName) {
                                reportSummary += `    - Workflow: ${loc.workflowName} (${loc.workflowId})\n`;
                                if (loc.nodeName) {
                                    reportSummary += `      Node: ${loc.nodeName} (${loc.nodeType})\n`;
                                }
                            }
                            else if (loc.name) {
                                reportSummary += `    - ${loc.kind}: ${loc.name}\n`;
                            }
                        });
                    }
                    reportSummary += '\n';
                });
            }
            reportSummary += '\n';
        });
        return createSuccessResponse('Security audit completed', reportSummary);
    }
    // User Management Tool Handlers (Enterprise)
    async handleUserList(args) {
        const params = validateAndTransform(z.object({
            limit: z.number().min(1).max(250).default(100).optional(),
            cursor: z.string().optional(),
            includeRole: z.boolean().optional(),
            projectId: z.string().optional()
        }), args);
        const result = await this.n8nClient.getUsers(params);
        const userSummary = result.data.map((user) => `• **${user.email}** (ID: ${user.id})\n` +
            `  Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() + '\n' +
            `  Role: ${user.role || 'N/A'}\n` +
            `  Status: ${user.isPending ? 'Pending' : 'Active'}\n` +
            `  Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}`).join('\n\n');
        return createSuccessResponse(`Found ${result.data.length} users`, userSummary + (result.nextCursor ? `\n\n📄 Next cursor: ${result.nextCursor}` : ''));
    }
    async handleUserGet(args) {
        const params = validateAndTransform(z.object({
            identifier: z.string(),
            includeRole: z.boolean().optional()
        }), args);
        const user = await this.n8nClient.getUser(params.identifier, params.includeRole);
        const userInfo = `**User: ${user.email}**\n` +
            `ID: ${user.id}\n` +
            `Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() + '\n' +
            `Role: ${user.role || 'N/A'}\n` +
            `Status: ${user.isPending ? 'Pending Invitation' : 'Active'}\n` +
            `Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}\n` +
            `Updated: ${user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Unknown'}`;
        return createSuccessResponse('User details retrieved', userInfo);
    }
    async handleUserCreate(args) {
        const params = validateAndTransform(z.object({
            users: z.array(z.object({
                email: z.string().email(),
                role: z.enum(['global:admin', 'global:member']).optional()
            }))
        }), args);
        const results = await this.n8nClient.createUsers(params.users);
        const resultSummary = results.map((result) => {
            if (result.error) {
                return `❌ ${result.user?.email || 'Unknown'}: ${result.error}`;
            }
            else {
                return `✅ ${result.user.email}: Invited successfully (ID: ${result.user.id})`;
            }
        }).join('\n');
        return createSuccessResponse(`Created ${params.users.length} user invitation(s)`, resultSummary);
    }
    async handleUserDelete(args) {
        const params = validateAndTransform(z.object({ identifier: z.string() }), args);
        await this.n8nClient.deleteUser(params.identifier);
        return createSuccessResponse(`User ${params.identifier} deleted successfully`);
    }
    async handleUserRoleChange(args) {
        const params = validateAndTransform(z.object({
            identifier: z.string(),
            newRoleName: z.enum(['global:admin', 'global:member'])
        }), args);
        await this.n8nClient.changeUserRole(params.identifier, params.newRoleName);
        return createSuccessResponse(`User ${params.identifier} role changed to ${params.newRoleName} successfully`);
    }
    // Source Control Tool Handlers
    async handleSourceControlPull(args) {
        const params = validateAndTransform(z.object({
            force: z.boolean().optional(),
            variables: z.record(z.string()).optional()
        }), args);
        const result = await this.n8nClient.pullFromSourceControl(params);
        let resultSummary = '**🔄 Source Control Pull Results:**\n\n';
        if (result.workflows && result.workflows.length > 0) {
            resultSummary += `**Workflows (${result.workflows.length}):**\n`;
            result.workflows.forEach(w => {
                resultSummary += `  • ${w.name} (${w.id})\n`;
            });
            resultSummary += '\n';
        }
        if (result.credentials && result.credentials.length > 0) {
            resultSummary += `**Credentials (${result.credentials.length}):**\n`;
            result.credentials.forEach(c => {
                resultSummary += `  • ${c.name} (${c.type})\n`;
            });
            resultSummary += '\n';
        }
        if (result.variables) {
            const { added, changed } = result.variables;
            if (added?.length || changed?.length) {
                resultSummary += `**Variables:**\n`;
                if (added?.length)
                    resultSummary += `  Added: ${added.join(', ')}\n`;
                if (changed?.length)
                    resultSummary += `  Changed: ${changed.join(', ')}\n`;
                resultSummary += '\n';
            }
        }
        if (result.tags?.tags?.length) {
            resultSummary += `**Tags (${result.tags.tags.length}):**\n`;
            result.tags.tags.forEach(t => {
                resultSummary += `  • ${t.name} (${t.id})\n`;
            });
        }
        return createSuccessResponse('Source control pull completed', resultSummary);
    }
    // Additional Tag Tool Handler
    async handleTagGet(args) {
        const params = validateAndTransform(z.object({ id: z.string() }), args);
        const tag = await this.n8nClient.getTag(params.id);
        const tagInfo = `**Tag: ${tag.name}**\n` +
            `ID: ${tag.id}\n` +
            `Created: ${tag.createdAt ? new Date(tag.createdAt).toLocaleString() : 'Unknown'}\n` +
            `Updated: ${tag.updatedAt ? new Date(tag.updatedAt).toLocaleString() : 'Unknown'}`;
        return createSuccessResponse('Tag details retrieved', tagInfo);
    }
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("🚀 n8n MCP Server started successfully");
    }
}
// Start the server
const server = new N8nMcpServer();
server.start().catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map