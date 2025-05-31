# n8n MCP Server Technical Specification

## Architecture Overview

The n8n MCP Server is built as a TypeScript/Node.js application that implements the Model Context Protocol (MCP) to interface with self-hosted n8n instances through their REST API. The server acts as a bridge between AI assistants and n8n workflow automation.

## Project Structure

```
n8n-mcp-server/
├── src/
│   ├── server.ts              # Main MCP server entry point
│   ├── n8n-client.ts          # n8n API client wrapper
│   ├── tools/                 # MCP tool implementations
│   │   ├── workflow-tools.ts  # Workflow CRUD operations
│   │   ├── execution-tools.ts # Execution monitoring
│   │   └── debug-tools.ts     # Debugging utilities
│   ├── resources/             # MCP resource implementations
│   │   ├── workflow-library.ts
│   │   └── execution-logs.ts
│   ├── types/                 # TypeScript type definitions
│   │   ├── n8n-api.ts         # n8n API response types
│   │   └── mcp-types.ts       # MCP-specific types
│   └── utils/                 # Utility functions
│       ├── auth.ts            # Authentication helpers
│       ├── validation.ts      # Input validation
│       └── error-handler.ts   # Error handling
├── tests/                     # Test suite
├── docs/                      # Documentation
├── examples/                  # Usage examples
└── package.json
```

## Core Components

### 1. MCP Server Setup

```typescript
// src/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { N8nClient } from "./n8n-client.js";
import { registerWorkflowTools } from "./tools/workflow-tools.js";
import { registerExecutionTools } from "./tools/execution-tools.js";
import { registerDebugTools } from "./tools/debug-tools.js";
import { registerResources } from "./resources/index.js";

class N8nMcpServer {
  private server: McpServer;
  private n8nClient: N8nClient;

  constructor() {
    this.server = new McpServer({
      name: "n8n-workflow-manager",
      description: "MCP server for n8n workflow automation and debugging",
      version: "1.0.0"
    });
    
    this.n8nClient = new N8nClient({
      baseUrl: process.env.N8N_BASE_URL!,
      apiKey: process.env.N8N_API_KEY!,
      timeout: 30000
    });
  }

  async initialize() {
    // Register tools
    await registerWorkflowTools(this.server, this.n8nClient);
    await registerExecutionTools(this.server, this.n8nClient);
    await registerDebugTools(this.server, this.n8nClient);
    
    // Register resources
    await registerResources(this.server, this.n8nClient);
    
    // Setup transport and start server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start server
const server = new N8nMcpServer();
server.initialize().catch(console.error);
```

### 2. Type Definitions

```typescript
// src/types/n8n-api.ts - Based on OpenAPI specification

export interface N8nWorkflow {
  id?: string;
  name: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  nodes: N8nNode[];
  connections: object;
  settings: N8nWorkflowSettings;
  staticData?: string | object | null;
  tags?: N8nTag[];
}

export interface N8nNode {
  id?: string;
  name: string;
  webhookId?: string;
  disabled?: boolean;
  notesInFlow?: boolean;
  notes?: string;
  type: string;
  typeVersion?: number;
  executeOnce?: boolean;
  alwaysOutputData?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  continueOnFail?: boolean;
  onError?: string;
  position?: number[];
  parameters?: object;
  credentials?: object;
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nWorkflowSettings {
  saveExecutionProgress?: boolean;
  saveManualExecutions?: boolean;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  executionTimeout?: number;
  errorWorkflow?: string;
  timezone?: string;
  executionOrder?: string;
}

export interface N8nExecution {
  id: number;
  data?: object;
  finished?: boolean;
  mode?: 'cli' | 'error' | 'integrated' | 'internal' | 'manual' | 'retry' | 'trigger' | 'webhook';
  retryOf?: number | null;
  retrySuccessId?: number | null;
  startedAt: string;
  stoppedAt?: string;
  workflowId: number;
  waitTill?: string | null;
  customData?: object;
  workflowData?: N8nWorkflow;
}

export interface N8nCredential {
  id?: string;
  name: string;
  type: string;
  data?: object;
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nTag {
  id?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nVariable {
  id?: string;
  key: string;
  value: string;
  type?: string;
}

export interface N8nProject {
  id?: string;
  name: string;
  type?: string;
}

export interface N8nUser {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isPending?: boolean;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}
```

### 3. n8n API Client

```typescript
// src/n8n-client.ts
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { 
  N8nWorkflow, 
  N8nExecution, 
  N8nCredential, 
  N8nTag, 
  N8nVariable, 
  N8nProject 
} from "./types/n8n-api.js";

export interface N8nClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
}

export class N8nClient {
  private client: AxiosInstance;
  private config: N8nClientConfig;

  constructor(config: N8nClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.baseUrl}/api/v1`,
      timeout: config.timeout || 30000,
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      switch (status) {
        case 401:
          return new Error('Authentication failed. Check your API key.');
        case 403:
          return new Error('Insufficient permissions for this operation.');
        case 404:
          return new Error('Resource not found.');
        case 429:
          return new Error('Rate limit exceeded. Please retry later.');
        default:
          return new Error(`API Error (${status}): ${message}`);
      }
    }
    return new Error(`Network Error: ${error.message}`);
  }

  // Workflow operations
  async getWorkflows(params?: {
    active?: boolean;
    tags?: string;
    name?: string;
    projectId?: string;
    excludePinnedData?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nWorkflow[]; nextCursor?: string }> {
    const response = await this.client.get('/workflows', { params });
    return response.data;
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await this.client.get(`/workflows/${id}`);
    return response.data;
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    const response = await this.client.post('/workflows', workflow);
    return response.data;
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    const response = await this.client.patch(`/workflows/${id}`, workflow);
    return response.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.client.delete(`/workflows/${id}`);
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await this.client.post(`/workflows/${id}/activate`);
    return response.data;
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await this.client.post(`/workflows/${id}/deactivate`);
    return response.data;
  }

  // Additional workflow operations from API spec
  async transferWorkflow(id: string, destinationProjectId: string): Promise<void> {
    await this.client.put(`/workflows/${id}/transfer`, { destinationProjectId });
  }

  async getWorkflowTags(id: string): Promise<N8nTag[]> {
    const response = await this.client.get(`/workflows/${id}/tags`);
    return response.data;
  }

  async updateWorkflowTags(id: string, tagIds: string[]): Promise<N8nTag[]> {
    const response = await this.client.put(`/workflows/${id}/tags`, 
      tagIds.map(id => ({ id }))
    );
    return response.data;
  }

  // NOTE: Direct workflow execution endpoint is not available in the n8n API
  // Workflows are executed through triggers (webhooks, schedules, etc.)
  
  async getExecutions(params?: {
    includeData?: boolean;
    status?: 'error' | 'success' | 'waiting';
    workflowId?: string;
    projectId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nExecution[]; nextCursor?: string }> {
    const response = await this.client.get('/executions', { params });
    return response.data;
  }

  async getExecution(id: string): Promise<N8nExecution> {
    const response = await this.client.get(`/executions/${id}`);
    return response.data;
  }

  async deleteExecution(id: string): Promise<void> {
    await this.client.delete(`/executions/${id}`);
  }

  // Credentials operations (if authorized)
  async createCredential(credential: {
    name: string;
    type: string;
    data: object;
  }): Promise<{ id: string; name: string; type: string; createdAt: string; updatedAt: string }> {
    const response = await this.client.post('/credentials', credential);
    return response.data;
  }

  async deleteCredential(id: string): Promise<void> {
    await this.client.delete(`/credentials/${id}`);
  }

  async getCredentialSchema(credentialTypeName: string): Promise<object> {
    const response = await this.client.get(`/credentials/schema/${credentialTypeName}`);
    return response.data;
  }

  // Tags operations
  async getTags(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nTag[]; nextCursor?: string }> {
    const response = await this.client.get('/tags', { params });
    return response.data;
  }

  async createTag(tag: { name: string }): Promise<N8nTag> {
    const response = await this.client.post('/tags', tag);
    return response.data;
  }

  async updateTag(id: string, tag: { name: string }): Promise<N8nTag> {
    const response = await this.client.put(`/tags/${id}`, tag);
    return response.data;
  }

  async deleteTag(id: string): Promise<void> {
    await this.client.delete(`/tags/${id}`);
  }

  // Variables operations
  async getVariables(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nVariable[]; nextCursor?: string }> {
    const response = await this.client.get('/variables', { params });
    return response.data;
  }

  async createVariable(variable: { key: string; value: string }): Promise<void> {
    await this.client.post('/variables', variable);
  }

  async updateVariable(id: string, variable: { key: string; value: string }): Promise<void> {
    await this.client.put(`/variables/${id}`, variable);
  }

  async deleteVariable(id: string): Promise<void> {
    await this.client.delete(`/variables/${id}`);
  }

  // Projects operations (Enterprise)
  async getProjects(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nProject[]; nextCursor?: string }> {
    const response = await this.client.get('/projects', { params });
    return response.data;
  }

  async createProject(project: { name: string }): Promise<void> {
    await this.client.post('/projects', project);
  }

  async updateProject(id: string, project: { name: string }): Promise<void> {
    await this.client.put(`/projects/${id}`, project);
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  // Audit operations
  async generateAudit(options?: {
    additionalOptions?: {
      daysAbandonedWorkflow?: number;
      categories?: ('credentials' | 'database' | 'nodes' | 'filesystem' | 'instance')[];
    };
  }): Promise<object> {
    const response = await this.client.post('/audit', options || {});
    return response.data;
  }
}
```

### 3. Workflow Management Tools

```typescript
// src/tools/workflow-tools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { N8nClient } from "../n8n-client.js";
import { WorkflowBuilder } from "../utils/workflow-builder.js";

export async function registerWorkflowTools(server: McpServer, n8nClient: N8nClient) {
  // Get workflows with filtering
  server.tool(
    "workflow_list",
    {
      active: z.boolean().optional(),
      tags: z.string().optional().describe("Comma-separated list of tag names"),
      name: z.string().optional().describe("Filter by workflow name"),
      projectId: z.string().optional().describe("Filter by project ID"),
      excludePinnedData: z.boolean().optional().describe("Exclude pinned data from response"),
      limit: z.number().min(1).max(250).default(100),
      cursor: z.string().optional().describe("Pagination cursor")
    },
    async (params) => {
      try {
        const result = await n8nClient.getWorkflows({
          active: params.active,
          tags: params.tags,
          name: params.name,
          projectId: params.projectId,
          excludePinnedData: params.excludePinnedData,
          limit: params.limit,
          cursor: params.cursor
        });

        const workflows = result.data;

        return {
          content: [{
            type: "text",
            text: `Found ${workflows.length} workflows:\n\n` +
              workflows.map(w => 
                `• ${w.name} (ID: ${w.id}) - ${w.active ? 'Active' : 'Inactive'}\n` +
                `  Tags: ${w.tags?.map(t => t.name).join(', ') || 'None'}\n` +
                `  Created: ${new Date(w.createdAt).toLocaleString()}`
              ).join('\n\n') +
              (result.nextCursor ? `\n\nNext cursor: ${result.nextCursor}` : '')
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching workflows: ${error.message}`
          }]
        };
      }
    }
  );

  // Get detailed workflow information
  server.tool(
    "workflow_get",
    {
      id: z.string().describe("Workflow ID")
    },
    async (params) => {
      try {
        const workflow = await n8nClient.getWorkflow(params.id);
        
        return {
          content: [{
            type: "text",
            text: `Workflow: ${workflow.name}\n` +
              `ID: ${workflow.id}\n` +
              `Status: ${workflow.active ? 'Active' : 'Inactive'}\n` +
              `Nodes: ${workflow.nodes?.length || 0}\n` +
              `Connections: ${Object.keys(workflow.connections || {}).length}\n` +
              `Tags: ${workflow.tags?.map(t => t.name).join(', ') || 'None'}\n` +
              `Created: ${new Date(workflow.createdAt).toLocaleString()}\n` +
              `Updated: ${new Date(workflow.updatedAt).toLocaleString()}\n\n` +
              `Nodes:\n${workflow.nodes?.map(node => 
                `  • ${node.name} (${node.type})`
              ).join('\n') || 'No nodes'}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching workflow: ${error.message}`
          }]
        };
      }
    }
  );

  // Create new workflow
  server.tool(
    "workflow_create",
    {
      name: z.string().describe("Workflow name"),
      description: z.string().optional().describe("Workflow description"),
      nodes: z.array(z.object({
        name: z.string(),
        type: z.string(),
        parameters: z.record(z.any()).optional(),
        position: z.array(z.number()).optional()
      })).optional(),
      connections: z.record(z.any()).optional(),
      tags: z.array(z.string()).optional(),
      active: z.boolean().default(false)
    },
    async (params) => {
      try {
        const workflowData = {
          name: params.name,
          nodes: params.nodes || [],
          connections: params.connections || {},
          tags: params.tags?.map(name => ({ name })),
          active: params.active,
          settings: {
            saveExecutionProgress: true,
            saveManualExecutions: true,
            saveDataErrorExecution: "all",
            saveDataSuccessExecution: "all"
          }
        };

        const workflow = await n8nClient.createWorkflow(workflowData);
        
        return {
          content: [{
            type: "text",
            text: `Successfully created workflow "${workflow.name}" with ID: ${workflow.id}\n` +
              `Status: ${workflow.active ? 'Active' : 'Inactive'}\n` +
              `Nodes: ${workflow.nodes?.length || 0}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error creating workflow: ${error.message}`
          }]
        };
      }
    }
  );

  // Note: Direct workflow execution is not available via the n8n API
  // Workflows are triggered through webhooks, schedules, or manual execution in the UI

  // Activate/Deactivate workflow
  server.tool(
    "workflow_toggle",
    {
      id: z.string().describe("Workflow ID"),
      active: z.boolean().describe("Whether to activate or deactivate the workflow")
    },
    async (params) => {
      try {
        const workflow = params.active 
          ? await n8nClient.activateWorkflow(params.id)
          : await n8nClient.deactivateWorkflow(params.id);
        
        return {
          content: [{
            type: "text",
            text: `Workflow "${workflow.name}" has been ${params.active ? 'activated' : 'deactivated'}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error toggling workflow: ${error.message}`
          }]
        };
      }
    }
  );
}
```

### 4. Execution Monitoring Tools

```typescript
// src/tools/execution-tools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { N8nClient } from "../n8n-client.js";

export async function registerExecutionTools(server: McpServer, n8nClient: N8nClient) {
  // Get execution history
  server.tool(
    "execution_list",
    {
      includeData: z.boolean().optional().describe("Include execution data in response"),
      workflowId: z.string().optional(),
      status: z.enum(['error', 'success', 'waiting']).optional(),
      projectId: z.string().optional().describe("Filter by project ID"),
      limit: z.number().min(1).max(250).default(100),
      cursor: z.string().optional().describe("Pagination cursor")
    },
    async (params) => {
      try {
        const result = await n8nClient.getExecutions({
          includeData: params.includeData,
          workflowId: params.workflowId,
          status: params.status,
          projectId: params.projectId,
          limit: params.limit,
          cursor: params.cursor
        });

        const executions = result.data;

        return {
          content: [{
            type: "text",
            text: `Found ${executions.length} executions:\n\n` +
              executions.map(exec => 
                `• Execution ${exec.id}\n` +
                `  Workflow: ${exec.workflowData?.name || exec.workflowId}\n` +
                `  Status: ${exec.status}\n` +
                `  Started: ${new Date(exec.startedAt).toLocaleString()}\n` +
                `  ${exec.finishedAt ? `Finished: ${new Date(exec.finishedAt).toLocaleString()}` : 'Still running'}\n` +
                `  Duration: ${exec.finishedAt ? 
                    `${Math.round((new Date(exec.finishedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000)}s` : 
                    'N/A'}`
              ).join('\n\n')
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching executions: ${error.message}`
          }]
        };
      }
    }
  );

  // Get detailed execution information
  server.tool(
    "execution_get",
    {
      id: z.string().describe("Execution ID")
    },
    async (params) => {
      try {
        const execution = await n8nClient.getExecution(params.id);
        
        const nodeExecutions = execution.data?.resultData?.runData || {};
        const nodeCount = Object.keys(nodeExecutions).length;
        const hasErrors = execution.status === 'error';
        
        let detailText = `Execution ${execution.id}\n` +
          `Workflow: ${execution.workflowData?.name || execution.workflowId}\n` +
          `Status: ${execution.status}\n` +
          `Started: ${new Date(execution.startedAt).toLocaleString()}\n`;
        
        if (execution.finishedAt) {
          detailText += `Finished: ${new Date(execution.finishedAt).toLocaleString()}\n`;
          detailText += `Duration: ${Math.round((new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s\n`;
        }
        
        detailText += `Nodes executed: ${nodeCount}\n\n`;
        
        if (hasErrors && execution.data?.resultData?.error) {
          detailText += `Error Details:\n${JSON.stringify(execution.data.resultData.error, null, 2)}\n\n`;
        }
        
        detailText += `Node Execution Summary:\n`;
        Object.entries(nodeExecutions).forEach(([nodeName, nodeData]: [string, any]) => {
          const nodeRuns = Array.isArray(nodeData) ? nodeData : [nodeData];
          detailText += `  • ${nodeName}: ${nodeRuns.length} run(s)\n`;
          nodeRuns.forEach((run: any, index: number) => {
            if (run.error) {
              detailText += `    Run ${index + 1}: ERROR - ${run.error.message}\n`;
            } else {
              detailText += `    Run ${index + 1}: SUCCESS - ${run.data?.main?.[0]?.length || 0} items\n`;
            }
          });
        });
        
        return {
          content: [{
            type: "text",
            text: detailText
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching execution: ${error.message}`
          }]
        };
      }
    }
  );
}
```

### 5. Environment Configuration

```bash
# .env
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key-here
LOG_LEVEL=info
MAX_RETRY_ATTEMPTS=3
REQUEST_TIMEOUT=30000
CACHE_TTL=300
```

### 6. Package Configuration

```json
{
  "name": "n8n-mcp-server",
  "version": "1.0.0",
  "description": "MCP server for n8n workflow automation and debugging",
  "main": "dist/server.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "typescript": "^5.2.0",
    "tsx": "^4.0.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "eslint": "^8.52.0",
    "@typescript-eslint/eslint-plugin": "^6.9.0",
    "@typescript-eslint/parser": "^6.9.0",
    "prettier": "^3.0.0"
  }
}
```

This technical specification provides a comprehensive foundation for implementing the n8n MCP server with proper error handling, type safety, and extensible architecture.
