#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { N8nClient } from "./n8n-client.js";
import { 
  workflowListSchema,
  workflowIdSchema,
  workflowCreateSchema,
  executionListSchema,
  executionIdSchema,
  tagCreateSchema,
  tagIdSchema,
  variableCreateSchema,
  variableIdSchema,
  projectCreateSchema,
  projectIdSchema,
  userCreateSchema,
  userIdSchema,
  userRoleChangeSchema,
  credentialCreateSchema,
  credentialIdSchema,
  auditGenerateSchema,
  transferSchema,
  createErrorResponse,
  createSuccessResponse,
  validateAndTransform
} from "./utils/validation.js";

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

// Built-in n8n node types and their information
const CORE_NODES = {
  // Core/utility nodes
  'n8n-nodes-base.manualTrigger': {
    category: 'Core',
    description: 'Starts workflow manually from the workflow editor',
    inputsCount: 0,
    outputsCount: 1,
    commonParameters: {},
    usageNotes: 'Best for testing workflows or workflows that should be started manually'
  },
  'n8n-nodes-base.webhook': {
    category: 'Core',
    description: 'Listens for HTTP requests to trigger the workflow',
    inputsCount: 0,
    outputsCount: 1,
    commonParameters: {
      httpMethod: { type: 'string', default: 'GET', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'] },
      path: { type: 'string', description: 'The URL path that will trigger this webhook' },
      authentication: { type: 'string', default: 'none', options: ['none', 'basicAuth', 'headerAuth'] },
      responseMode: { type: 'string', default: 'onReceived', options: ['onReceived', 'lastNode'] }
    },
    usageNotes: 'Creates an HTTP endpoint that can trigger your workflow from external systems'
  },
  'n8n-nodes-base.schedulerigger': {
    category: 'Core', 
    description: 'Triggers workflow on a schedule (cron-like)',
    inputsCount: 0,
    outputsCount: 1,
    commonParameters: {
      rule: { type: 'object', description: 'Schedule configuration with intervals, timezone, etc.' },
      triggerAtSecond: { type: 'number', default: 0 }
    },
    usageNotes: 'Perfect for automating workflows that need to run at specific times or intervals'
  },
  'n8n-nodes-base.code': {
    category: 'Core',
    description: 'Executes custom JavaScript or Python code',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      language: { type: 'string', default: 'javaScript', options: ['javaScript', 'python'] },
      code: { type: 'string', description: 'The code to execute' }
    },
    usageNotes: 'Use for custom data processing, complex logic, or when no built-in node exists'
  },
  'n8n-nodes-base.httpRequest': {
    category: 'Core',
    description: 'Makes HTTP requests to any API',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      method: { type: 'string', default: 'GET', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'] },
      url: { type: 'string', description: 'The URL to make the request to' },
      authentication: { type: 'string', default: 'none' },
      sendHeaders: { type: 'boolean', default: false },
      headerParameters: { type: 'object' },
      sendQuery: { type: 'boolean', default: false },
      queryParameters: { type: 'object' },
      sendBody: { type: 'boolean', default: false },
      bodyParameters: { type: 'object' }
    },
    usageNotes: 'Generic HTTP client for APIs that don\'t have dedicated n8n nodes'
  },
  'n8n-nodes-base.set': {
    category: 'Core',
    description: 'Modifies data by setting, removing, or keeping specific fields',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      keepOnlySet: { type: 'boolean', default: false, description: 'Whether to keep only the set fields' },
      values: { type: 'object', description: 'Fields to set with their values' }
    },
    usageNotes: 'Essential for data transformation and cleaning in workflows'
  },
  'n8n-nodes-base.if': {
    category: 'Core',
    description: 'Routes data based on conditions (if/else logic)',
    inputsCount: 1,
    outputsCount: 2,
    commonParameters: {
      conditions: { type: 'object', description: 'Array of conditions to evaluate' },
      combineOperation: { type: 'string', default: 'all', options: ['all', 'any'] }
    },
    usageNotes: 'Creates conditional workflows - items go to "true" or "false" output based on conditions'
  },
  'n8n-nodes-base.switch': {
    category: 'Core',
    description: 'Routes data to different outputs based on rules',
    inputsCount: 1,
    outputsCount: 4,
    commonParameters: {
      mode: { type: 'string', default: 'rules', options: ['rules', 'expression'] },
      rules: { type: 'object', description: 'Array of routing rules' }
    },
    usageNotes: 'More flexible than IF node - can route to multiple different paths'
  },
  'n8n-nodes-base.merge': {
    category: 'Core',
    description: 'Combines data from multiple inputs',
    inputsCount: 2,
    outputsCount: 1,
    commonParameters: {
      mode: { type: 'string', default: 'append', options: ['append', 'merge', 'chooseBranch', 'multiplex'] },
      joinMode: { type: 'string', default: 'keepEverything' }
    },
    usageNotes: 'Combines data from different workflow branches or data sources'
  },
  'n8n-nodes-base.splitInBatches': {
    category: 'Core',
    description: 'Processes data in batches to handle large datasets',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      batchSize: { type: 'number', default: 10, description: 'Number of items to process in each batch' },
      options: { type: 'object' }
    },
    usageNotes: 'Prevents memory issues when processing large amounts of data'
  },
  'n8n-nodes-base.wait': {
    category: 'Core',
    description: 'Pauses workflow execution for a specified time',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      unit: { type: 'string', default: 'seconds', options: ['seconds', 'minutes', 'hours', 'days'] },
      amount: { type: 'number', default: 1 }
    },
    usageNotes: 'Useful for rate limiting, delays, or waiting for external processes'
  },
  'n8n-nodes-base.noOp': {
    category: 'Core',
    description: 'Does nothing - passes data through unchanged',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {},
    usageNotes: 'Useful for debugging, placeholders, or organizing workflow layout'
  },
  'n8n-nodes-base.stopAndError': {
    category: 'Core',
    description: 'Stops workflow execution and optionally throws an error',
    inputsCount: 1,
    outputsCount: 0,
    commonParameters: {
      message: { type: 'string', description: 'Error message to display' }
    },
    usageNotes: 'Use for error handling, validation, or stopping execution under certain conditions'
  },

  // Popular service nodes
  'n8n-nodes-base.gmail': {
    category: 'Communication',
    description: 'Interacts with Gmail - send, read, and manage emails',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      resource: { type: 'string', options: ['message', 'draft', 'thread', 'label'] },
      operation: { type: 'string', options: ['send', 'get', 'getAll', 'delete', 'reply'] }
    },
    usageNotes: 'Requires Gmail OAuth2 credentials. Great for email automation'
  },
  'n8n-nodes-base.slack': {
    category: 'Communication',
    description: 'Sends messages and interacts with Slack',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      resource: { type: 'string', options: ['message', 'channel', 'user'] },
      operation: { type: 'string', options: ['post', 'update', 'delete', 'get', 'getAll'] }
    },
    usageNotes: 'Requires Slack app credentials. Perfect for team notifications'
  },
  'n8n-nodes-base.googleSheets': {
    category: 'Productivity',
    description: 'Reads from and writes to Google Sheets',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      resource: { type: 'string', options: ['spreadsheet', 'sheet'] },
      operation: { type: 'string', options: ['read', 'append', 'update', 'delete', 'create'] }
    },
    usageNotes: 'Requires Google credentials. Excellent for data storage and reporting'
  },
  'n8n-nodes-base.notion': {
    category: 'Productivity',
    description: 'Manages Notion databases and pages',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      resource: { type: 'string', options: ['database', 'page', 'user'] },
      operation: { type: 'string', options: ['get', 'getAll', 'create', 'update', 'delete'] }
    },
    usageNotes: 'Requires Notion integration token. Great for content management'
  },
  'n8n-nodes-base.mysql': {
    category: 'Data & Storage',
    description: 'Executes queries against MySQL databases',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      operation: { type: 'string', default: 'executeQuery', options: ['executeQuery', 'insert', 'update', 'delete'] },
      query: { type: 'string', description: 'SQL query to execute' }
    },
    usageNotes: 'Requires MySQL credentials. Use for database operations and data integration'
  },
  'n8n-nodes-base.postgres': {
    category: 'Data & Storage',
    description: 'Executes queries against PostgreSQL databases',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      operation: { type: 'string', default: 'executeQuery', options: ['executeQuery', 'insert', 'update', 'delete'] },
      query: { type: 'string', description: 'SQL query to execute' }
    },
    usageNotes: 'Requires PostgreSQL credentials. Powerful for complex data operations'
  },
  'n8n-nodes-base.airtable': {
    category: 'Productivity',
    description: 'Manages Airtable bases and records',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      operation: { type: 'string', options: ['list', 'read', 'create', 'update', 'delete'] },
      application: { type: 'string', description: 'Airtable base ID' },
      table: { type: 'string', description: 'Table name' }
    },
    usageNotes: 'Requires Airtable API key. Great for managing structured data'
  },
  'n8n-nodes-base.telegram': {
    category: 'Communication',
    description: 'Sends messages via Telegram bot',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      resource: { type: 'string', options: ['message', 'file', 'chat'] },
      operation: { type: 'string', options: ['sendMessage', 'sendPhoto', 'sendDocument'] },
      chatId: { type: 'string', description: 'Chat ID to send message to' }
    },
    usageNotes: 'Requires Telegram bot token. Perfect for instant notifications'
  },
  'n8n-nodes-base.discord': {
    category: 'Communication',
    description: 'Sends messages to Discord channels',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      resource: { type: 'string', options: ['message', 'member'] },
      operation: { type: 'string', options: ['send', 'get', 'getAll'] },
      webhookUrl: { type: 'string', description: 'Discord webhook URL' }
    },
    usageNotes: 'Use Discord webhook for simple messaging or bot token for advanced features'
  },
  'n8n-nodes-base.hubspot': {
    category: 'Sales',
    description: 'Manages HubSpot CRM data - contacts, companies, deals',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      resource: { type: 'string', options: ['contact', 'company', 'deal', 'ticket'] },
      operation: { type: 'string', options: ['create', 'update', 'get', 'getAll', 'delete'] }
    },
    usageNotes: 'Requires HubSpot API key. Essential for CRM automation'
  },
  'n8n-nodes-base.openai': {
    category: 'AI',
    description: 'Interacts with OpenAI APIs for AI-powered text and image generation',
    inputsCount: 1,
    outputsCount: 1,
    commonParameters: {
      resource: { type: 'string', options: ['text', 'image', 'audio', 'assistant', 'file'] },
      operation: { type: 'string', options: ['complete', 'message', 'generate', 'transcribe'] }
    },
    usageNotes: 'Requires OpenAI API key. Powerful for AI integration in workflows'
  }
};

const NODE_CATEGORIES = {
  'Core': 'Essential nodes for workflow logic and control flow',
  'Communication': 'Nodes for messaging, email, and team collaboration',
  'Productivity': 'Nodes for productivity tools and document management',
  'Data & Storage': 'Nodes for databases and data storage systems',
  'Sales': 'Nodes for CRM and sales automation',
  'AI': 'Nodes for artificial intelligence and machine learning services',
  'Marketing': 'Nodes for marketing automation and analytics',
  'Development': 'Nodes for development tools and version control',
  'Finance': 'Nodes for payment processing and financial services'
};

class N8nMcpServer {
  private server: Server;
  private n8nClient: N8nClient;

  constructor() {
    this.server = new Server({
      name: "auto-n8n-workflow-manager",
      description: "Auto-n8n MCP server for comprehensive n8n workflow automation, debugging, and management",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    });

    this.n8nClient = new N8nClient({
      baseUrl: process.env.N8N_BASE_URL!,
      apiKey: process.env.N8N_API_KEY!,
      timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
      retries: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
    });

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => (
      {
        tools: [
          // Node information tools
          {
            name: "node_types_list",
            description: "List all available built-in n8n node types with categories and descriptions",
            inputSchema: {
              type: "object",
              properties: {
                category: { 
                  type: "string", 
                  description: "Filter by category (Core, Communication, Productivity, Data & Storage, etc.)",
                  enum: Object.keys(NODE_CATEGORIES)
                },
                search: { 
                  type: "string", 
                  description: "Search node names and descriptions" 
                }
              }
            }
          },
          {
            name: "node_type_info",
            description: "Get detailed information about a specific node type including parameters and usage",
            inputSchema: {
              type: "object",
              properties: {
                nodeType: { 
                  type: "string", 
                  description: "Node type (e.g., 'n8n-nodes-base.manualTrigger', 'n8n-nodes-base.slack')" 
                }
              },
              required: ["nodeType"]
            }
          },
          {
            name: "node_categories",
            description: "List all node categories with descriptions",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "workflow_examples",
            description: "Get example workflow structures for common use cases",
            inputSchema: {
              type: "object",
              properties: {
                useCase: { 
                  type: "string", 
                  description: "Use case type",
                  enum: ["simple-webhook", "scheduled-task", "data-processing", "notification", "api-integration"]
                }
              }
            }
          },
          {
            name: "workflow_examples_search",
            description: "Search real working workflow examples by node types, keywords, or use cases. Returns actual workflow JSON from examples folder that contain the specified nodes/features. Use this when you need to see how specific nodes are actually implemented in working workflows.",
            inputSchema: {
              type: "object",
              properties: {
                nodeTypes: { 
                  type: "array",
                  items: { type: "string" },
                  description: "Array of node types to search for (e.g., ['n8n-nodes-base.openai', 'n8n-nodes-base.slack'])"
                },
                keywords: {
                  type: "array", 
                  items: { type: "string" },
                  description: "Keywords to search in workflow names and descriptions (e.g., ['ai', 'trading', 'social media'])"
                },
                maxExamples: {
                  type: "number",
                  default: 2,
                  minimum: 1,
                  maximum: 5,
                  description: "Maximum number of examples to return (to limit context size)"
                },
                includeFullWorkflow: {
                  type: "boolean",
                  default: false,
                  description: "Include full workflow JSON (true) or just relevant node excerpts (false)"
                }
              }
            }
          },

          // Workflow Tools
          {
            name: "workflow_list",
            description: "List all workflows in the n8n instance",
            inputSchema: {
              type: "object",
              properties: {
                active: { type: "boolean", description: "Filter by active/inactive status" },
                tags: { type: "string", description: "Comma-separated list of tag names to filter by" },
                name: { type: "string", description: "Filter workflows by name (partial match)" },
                projectId: { type: "string", description: "Filter by project ID (Enterprise)" },
                excludePinnedData: { type: "boolean", description: "Exclude pinned data for faster loading" },
                limit: { type: "number", description: "Maximum number of workflows to return", maximum: 250, minimum: 1, default: 100 },
                cursor: { type: "string", description: "Pagination cursor for next page" }
              }
            }
          },
          {
            name: "workflow_get", 
            description: "Get detailed information about a specific workflow",
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
            description: "Create a new workflow with nodes, connections, and settings",
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
                    executionTimeout: { type: "number", description: "Timeout in seconds", maximum: 3600 },
                    timezone: { type: "string", description: "Workflow timezone" }
                  },
                  required: ["saveExecutionProgress", "saveManualExecutions", "saveDataErrorExecution", "saveDataSuccessExecution"]
                },
                tags: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Workflow tags (tag names, not IDs)" 
                },
                active: { type: "boolean", description: "Whether to activate immediately", default: false }
              },
              required: ["name", "nodes", "connections", "settings"]
            }
          },
          {
            name: "workflow_update",
            description: "Update an existing workflow's properties",
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
            description: "Delete a workflow permanently",
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
            description: "Activate a workflow to enable automatic execution",
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
            description: "Deactivate a workflow to stop automatic execution",
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
            description: "Transfer a workflow to another project (Enterprise feature)",
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
            description: "List workflow executions with filtering and analysis",
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
            description: "Get detailed execution information for debugging and analysis",
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
            description: "Delete an execution record",
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
            description: "List all available tags for workflow organization",
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
            description: "Create a new tag for organizing workflows",
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
            description: "Update an existing tag's name",
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
            description: "Delete a tag permanently",
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
            description: "Get all tags assigned to a specific workflow",
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
            description: "Update the tags assigned to a workflow",
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
            description: "List all environment variables",
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
            description: "Create a new environment variable",
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
            description: "Update an existing environment variable",
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
            description: "Delete an environment variable",
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
            description: "List all projects (Enterprise feature)",
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
            description: "Create a new project (Enterprise feature)",
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
            description: "Update a project's properties (Enterprise feature)",
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
            description: "Delete a project (Enterprise feature)",
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
            description: "Create a new credential for workflow authentication",
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
            description: "Delete a credential permanently",
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
            description: "Get the schema for a specific credential type",
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
            description: "Transfer a credential to another project (Enterprise feature)",
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
            description: "Generate a comprehensive security audit report",
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
            description: "List all users in the n8n instance (Enterprise feature)",
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
            description: "Get detailed information about a specific user (Enterprise feature)",
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
            description: "Create new users in the n8n instance (Enterprise feature)",
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
            description: "Delete a user from the n8n instance (Enterprise feature)",
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
            description: "Change a user's global role (Enterprise feature)",
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
            description: "Pull changes from the connected source control repository",
            inputSchema: {
              type: "object",
              properties: {
                force: { type: "boolean", description: "Force pull even if there are conflicts" },
                variables: { type: "object", description: "Environment variables to set during pull", additionalProperties: { type: "string" } }
              }
            }
          },

          // Additional Tag Tool
          {
            name: "tag_get",
            description: "Get detailed information about a specific tag",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Tag ID" }
              },
              required: ["id"]
            }
          }
        ]
      }
    ));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "node_types_list":
            return await this.handleNodeTypesList(args);
          case "node_type_info":
            return await this.handleNodeTypeInfo(args);
          case "node_categories":
            return await this.handleNodeCategories(args);
          case "workflow_examples":
            return await this.handleWorkflowExamples(args);
          case "workflow_examples_search":
            return await this.handleWorkflowExamplesSearch(args);
          default:
            // For now, only node information and workflow examples tools are implemented in this source file
            // Other tools are handled by the compiled dist/server.js version
            throw new Error(`Tool '${name}' is not implemented in this version. Please use the compiled server.`);
        }
      } catch (error) {
        console.error(`Error in tool ${name}:`, error);
        return createErrorResponse(`Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  private setupResourceHandlers() {
    // Resources will be implemented if needed for caching or additional data access
  }

  private async handleNodeTypesList(args: any) {
    const { category, search } = args;
    
    let nodes = Object.entries(CORE_NODES);
    
    // Filter by category
    if (category) {
      nodes = nodes.filter(([_, nodeInfo]) => nodeInfo.category === category);
    }
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      nodes = nodes.filter(([nodeType, nodeInfo]) => 
        nodeType.toLowerCase().includes(searchLower) ||
        nodeInfo.description.toLowerCase().includes(searchLower)
      );
    }
    
    const nodeList = nodes.map(([nodeType, nodeInfo]) => ({
      nodeType,
      category: nodeInfo.category,
      description: nodeInfo.description,
      inputsCount: nodeInfo.inputsCount,
      outputsCount: nodeInfo.outputsCount,
      usageNotes: nodeInfo.usageNotes
    }));
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            totalNodes: nodeList.length,
            nodes: nodeList,
            availableCategories: Object.keys(NODE_CATEGORIES)
          }, null, 2)
        }
      ]
    };
  }

  private async handleNodeTypeInfo(args: any) {
    const { nodeType } = args;
    
    const nodeInfo = CORE_NODES[nodeType as keyof typeof CORE_NODES];
    
    if (!nodeInfo) {
      return {
        content: [
          {
            type: "text",
            text: `Node type "${nodeType}" not found in built-in nodes. 

Available node types:
${Object.keys(CORE_NODES).map(type => `- ${type}`).join('\n')}

You can also use node_types_list to browse nodes by category.`
          }
        ]
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            nodeType,
            ...nodeInfo,
            exampleUsage: {
              basicStructure: {
                name: nodeType.split('.').pop(),
                type: nodeType,
                parameters: nodeInfo.commonParameters,
                position: [0, 0]
              }
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleNodeCategories(args: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            categories: Object.entries(NODE_CATEGORIES).map(([name, description]) => ({
              name,
              description,
              nodeCount: Object.values(CORE_NODES).filter(node => node.category === name).length
            }))
          }, null, 2)
        }
      ]
    };
  }

  private async handleWorkflowExamples(args: any) {
    const { useCase } = args;
    
    const examples = {
      "simple-webhook": {
        name: "Simple Webhook Handler",
        description: "Basic webhook that receives data and processes it",
        nodes: [
          {
            name: "Webhook",
            type: "n8n-nodes-base.webhook",
            parameters: {
              httpMethod: "POST",
              path: "my-webhook",
              responseMode: "onReceived"
            },
            position: [0, 0]
          },
          {
            name: "Process Data",
            type: "n8n-nodes-base.set",
            parameters: {
              values: {
                processedAt: "={{new Date().toISOString()}}",
                status: "processed"
              }
            },
            position: [200, 0]
          }
        ],
        connections: {
          "Webhook": {
            "main": [[{"node": "Process Data", "type": "main", "index": 0}]]
          }
        }
      },
      "scheduled-task": {
        name: "Daily Report Generator",
        description: "Runs every day to generate and send a report",
        nodes: [
          {
            name: "Schedule",
            type: "n8n-nodes-base.scheduleTrigger",
            parameters: {
              rule: {
                interval: [{"field": "hours", "value": 24}]
              }
            },
            position: [0, 0]
          },
          {
            name: "Fetch Data",
            type: "n8n-nodes-base.httpRequest",
            parameters: {
              method: "GET",
              url: "https://api.example.com/data"
            },
            position: [200, 0]
          },
          {
            name: "Send Report",
            type: "n8n-nodes-base.gmail",
            parameters: {
              operation: "send",
              toList: "team@company.com",
              subject: "Daily Report",
              message: "={{JSON.stringify($json, null, 2)}}"
            },
            position: [400, 0]
          }
        ],
        connections: {
          "Schedule": {
            "main": [[{"node": "Fetch Data", "type": "main", "index": 0}]]
          },
          "Fetch Data": {
            "main": [[{"node": "Send Report", "type": "main", "index": 0}]]
          }
        }
      },
      "data-processing": {
        name: "Data Transformation Pipeline",
        description: "Processes and transforms data with conditional logic",
        nodes: [
          {
            name: "Manual Trigger",
            type: "n8n-nodes-base.manualTrigger",
            parameters: {},
            position: [0, 0]
          },
          {
            name: "Transform Data",
            type: "n8n-nodes-base.set",
            parameters: {
              values: {
                id: "={{$json.id}}",
                name: "={{$json.firstName}} {{$json.lastName}}",
                email: "={{$json.email.toLowerCase()}}"
              }
            },
            position: [200, 0]
          },
          {
            name: "Check Valid Email",
            type: "n8n-nodes-base.if",
            parameters: {
              conditions: {
                string: [
                  {
                    value1: "={{$json.email}}",
                    operation: "contains",
                    value2: "@"
                  }
                ]
              }
            },
            position: [400, 0]
          }
        ],
        connections: {
          "Manual Trigger": {
            "main": [[{"node": "Transform Data", "type": "main", "index": 0}]]
          },
          "Transform Data": {
            "main": [[{"node": "Check Valid Email", "type": "main", "index": 0}]]
          }
        }
      },
      "notification": {
        name: "Multi-Channel Notification",
        description: "Sends notifications to multiple channels simultaneously",
        nodes: [
          {
            name: "Webhook Trigger",
            type: "n8n-nodes-base.webhook",
            parameters: {
              httpMethod: "POST",
              path: "alert"
            },
            position: [0, 0]
          },
          {
            name: "Slack Notification",
            type: "n8n-nodes-base.slack",
            parameters: {
              operation: "postMessage",
              channel: "#alerts",
              text: "Alert: {{$json.message}}"
            },
            position: [200, -100]
          },
          {
            name: "Email Notification",
            type: "n8n-nodes-base.gmail",
            parameters: {
              operation: "send",
              toList: "admin@company.com",
              subject: "System Alert",
              message: "{{$json.message}}"
            },
            position: [200, 100]
          }
        ],
        connections: {
          "Webhook Trigger": {
            "main": [
              [
                {"node": "Slack Notification", "type": "main", "index": 0},
                {"node": "Email Notification", "type": "main", "index": 0}
              ]
            ]
          }
        }
      },
      "api-integration": {
        name: "API Data Sync",
        description: "Fetches data from one API and syncs it to another system",
        nodes: [
          {
            name: "Schedule Trigger",
            type: "n8n-nodes-base.scheduleTrigger",
            parameters: {
              rule: {
                interval: [{"field": "minutes", "value": 15}]
              }
            },
            position: [0, 0]
          },
          {
            name: "Fetch from API",
            type: "n8n-nodes-base.httpRequest",
            parameters: {
              method: "GET",
              url: "https://api.source.com/data",
              authentication: "headerAuth"
            },
            position: [200, 0]
          },
          {
            name: "Transform for Target",
            type: "n8n-nodes-base.code",
            parameters: {
              language: "javaScript",
              code: `
                const transformed = items.map(item => ({
                  id: item.json.id,
                  name: item.json.name,
                  status: item.json.active ? 'active' : 'inactive',
                  updatedAt: new Date().toISOString()
                }));
                return transformed;
              `
            },
            position: [400, 0]
          },
          {
            name: "Send to Target API",
            type: "n8n-nodes-base.httpRequest",
            parameters: {
              method: "POST",
              url: "https://api.target.com/data",
              sendBody: true,
              bodyParameters: {
                data: "={{$json}}"
              }
            },
            position: [600, 0]
          }
        ],
        connections: {
          "Schedule Trigger": {
            "main": [[{"node": "Fetch from API", "type": "main", "index": 0}]]
          },
          "Fetch from API": {
            "main": [[{"node": "Transform for Target", "type": "main", "index": 0}]]
          },
          "Transform for Target": {
            "main": [[{"node": "Send to Target API", "type": "main", "index": 0}]]
          }
        }
      }
    };
    
    if (useCase && examples[useCase as keyof typeof examples]) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(examples[useCase as keyof typeof examples], null, 2)
          }
        ]
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            availableExamples: Object.keys(examples),
            examples: useCase ? undefined : examples
          }, null, 2)
        }
      ]
    };
  }

  private async handleWorkflowExamplesSearch(args: any) {
    const { nodeTypes = [], keywords = [], maxExamples = 2, includeFullWorkflow = false } = args;
    
    try {
      const examplesDir = path.join(process.cwd(), 'examples', 'workflows');
      
      // Check if examples directory exists
      if (!fs.existsSync(examplesDir)) {
        return {
          content: [
            {
              type: "text",
              text: "No examples directory found. Please create examples/workflows folder with workflow JSON files."
            }
          ]
        };
      }

      // Read all JSON files from examples directory
      const files = fs.readdirSync(examplesDir)
        .filter(file => file.toLowerCase().endsWith('.json'))
        .slice(0, 20); // Limit to prevent too many files

      const matchingWorkflows: any[] = [];
      
      for (const file of files) {
        const filePath = path.join(examplesDir, file);
        
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          if (!fileContent.trim()) {
            continue; // Skip empty files
          }
          
          const workflow = JSON.parse(fileContent);
          let matches = false;
          let matchReasons: string[] = [];

          // Check for node types
          if (nodeTypes.length > 0 && workflow.nodes) {
            const workflowNodeTypes = workflow.nodes.map((node: any) => node.type);
            const foundNodeTypes = nodeTypes.filter((nodeType: string) => 
              workflowNodeTypes.some((wnt: string) => wnt.includes(nodeType) || nodeType.includes(wnt))
            );
            
            if (foundNodeTypes.length > 0) {
              matches = true;
              matchReasons.push(`Contains nodes: ${foundNodeTypes.join(', ')}`);
            }
          }

          // Check for keywords in filename and workflow name
          if (keywords.length > 0) {
            const searchText = `${file} ${workflow.name || ''}`.toLowerCase();
            const foundKeywords = keywords.filter((keyword: string) => 
              searchText.includes(keyword.toLowerCase())
            );
            
            if (foundKeywords.length > 0) {
              matches = true;
              matchReasons.push(`Matches keywords: ${foundKeywords.join(', ')}`);
            }
          }

          // If no specific search criteria, include all
          if (nodeTypes.length === 0 && keywords.length === 0) {
            matches = true;
            matchReasons.push('General workflow example');
          }

          if (matches) {
            const workflowInfo: any = {
              filename: file,
              name: workflow.name || 'Unnamed Workflow',
              matchReasons,
              nodeCount: workflow.nodes ? workflow.nodes.length : 0,
              nodeTypes: workflow.nodes ? [...new Set(workflow.nodes.map((n: any) => n.type))] : []
            };

            if (includeFullWorkflow) {
              workflowInfo.fullWorkflow = workflow;
            } else {
              // Include relevant nodes and connections
              if (workflow.nodes && nodeTypes.length > 0) {
                const relevantNodes = workflow.nodes.filter((node: any) =>
                  nodeTypes.some((nt: string) => node.type.includes(nt) || nt.includes(node.type))
                );
                workflowInfo.relevantNodes = relevantNodes;
                
                // Include connections for relevant nodes
                if (workflow.connections) {
                  const relevantConnections: any = {};
                  relevantNodes.forEach((node: any) => {
                    if (workflow.connections[node.name]) {
                      relevantConnections[node.name] = workflow.connections[node.name];
                    }
                  });
                  workflowInfo.relevantConnections = relevantConnections;
                }
              }
            }

            matchingWorkflows.push(workflowInfo);
          }
        } catch (parseError) {
          console.error(`Error parsing ${file}:`, parseError);
          continue;
        }
      }

      // Sort by relevance (more matching criteria = higher relevance)
      matchingWorkflows.sort((a, b) => b.matchReasons.length - a.matchReasons.length);
      
      // Limit results
      const limitedResults = matchingWorkflows.slice(0, maxExamples);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              searchCriteria: {
                nodeTypes,
                keywords,
                maxExamples,
                includeFullWorkflow
              },
              totalMatches: matchingWorkflows.length,
              returnedExamples: limitedResults.length,
              examples: limitedResults
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching workflow examples: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }

  // ... rest of the existing methods ...

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
            console.error("🚀 Auto-n8n MCP Server started successfully");
  }
}

// Start the server
const server = new N8nMcpServer();
server.start().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
}); 