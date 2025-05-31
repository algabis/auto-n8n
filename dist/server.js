#!/usr/bin/env node
import { Server } from "./modelcontextprotocol-sdk-mock.js";
import { StdioServerTransport } from "./modelcontextprotocol-sdk-mock.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "./modelcontextprotocol-sdk-mock.js";
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
                    description: "List all workflows with filtering options. Use this to browse available workflows, find specific workflows by name/tags, or get an overview of your n8n instance.",
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
                    description: "Get detailed information about a specific workflow including nodes, connections, and settings. Use this to examine workflow structure, debug issues, or understand how a workflow works.",
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
                    description: "Create a new workflow with nodes, connections, and settings. Use this to build automation workflows programmatically or duplicate existing workflow patterns.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Workflow name" },
                            nodes: {
                                type: "array",
                                description: "Array of workflow nodes",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string", description: "Node name" },
                                        type: { type: "string", description: "Node type (e.g., 'n8n-nodes-base.httpRequest')" },
                                        parameters: { type: "object", description: "Node parameters/configuration" },
                                        position: { type: "array", items: { type: "number" }, description: "Node position [x, y]" },
                                        credentials: { type: "object", description: "Node credentials configuration" }
                                    },
                                    required: ["name", "type"]
                                }
                            },
                            connections: { type: "object", description: "Node connections object" },
                            settings: {
                                type: "object",
                                description: "Workflow settings",
                                properties: {
                                    saveExecutionProgress: { type: "boolean" },
                                    saveManualExecutions: { type: "boolean" },
                                    saveDataErrorExecution: { type: "string", enum: ["all", "none"] },
                                    saveDataSuccessExecution: { type: "string", enum: ["all", "none"] },
                                    executionTimeout: { type: "number" },
                                    timezone: { type: "string" }
                                }
                            },
                            tags: { type: "array", items: { type: "string" }, description: "Workflow tags" },
                            active: { type: "boolean", default: false, description: "Whether to activate the workflow immediately" }
                        },
                        required: ["name"]
                    }
                },
                {
                    name: "workflow_update",
                    description: "Update an existing workflow's properties, nodes, connections, or settings. Use this to modify workflows, fix issues, or add new functionality.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Workflow ID" },
                            name: { type: "string", description: "New workflow name" },
                            nodes: { type: "array", description: "Updated nodes array" },
                            connections: { type: "object", description: "Updated connections object" },
                            settings: { type: "object", description: "Updated workflow settings" },
                            active: { type: "boolean", description: "Activation status" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "workflow_delete",
                    description: "Delete a workflow permanently. Use with caution as this action cannot be undone.",
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
                    description: "Activate a workflow to enable automatic execution via triggers (webhooks, schedules, etc.). Use this to start workflow automation.",
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
                    description: "Deactivate a workflow to stop automatic execution. Use this to pause workflow automation without deleting the workflow.",
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
                    description: "Transfer a workflow to another project (Enterprise feature). Use this for project organization and access control.",
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
                    description: "List workflow executions with filtering options. Use this to monitor workflow runs, find failed executions, or analyze execution patterns.",
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
                    description: "Get detailed information about a specific execution including data, errors, and performance metrics. Use this for debugging failed workflows or analyzing execution results.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Execution ID" },
                            includeData: { type: "boolean", description: "Include full execution data" }
                        },
                        required: ["id"]
                    }
                },
                {
                    name: "execution_delete",
                    description: "Delete an execution record. Use this to clean up execution history or remove sensitive data.",
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
                    description: "List all available tags for organizing workflows. Use this to see existing tags before creating or assigning them.",
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
                    description: "Create a new tag for organizing workflows. Use this to establish workflow categorization systems.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Tag name" }
                        },
                        required: ["name"]
                    }
                },
                {
                    name: "tag_update",
                    description: "Update an existing tag's name. Use this to rename tags for better organization.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Tag ID" },
                            name: { type: "string", description: "New tag name" }
                        },
                        required: ["id", "name"]
                    }
                },
                {
                    name: "tag_delete",
                    description: "Delete a tag. This will remove the tag from all workflows that use it.",
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
                    description: "Get all tags assigned to a specific workflow. Use this to see how a workflow is categorized.",
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
                    description: "Update the tags assigned to a workflow. Use this to organize and categorize workflows.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Workflow ID" },
                            tagIds: { type: "array", items: { type: "string" }, description: "Array of tag IDs to assign" }
                        },
                        required: ["id", "tagIds"]
                    }
                },
                // Variable Management Tools
                {
                    name: "variable_list",
                    description: "List all environment variables. Use this to see available variables for workflow configuration.",
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
                    description: "Create a new environment variable. Use this to store configuration values that workflows can access.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            key: { type: "string", description: "Variable key/name" },
                            value: { type: "string", description: "Variable value" }
                        },
                        required: ["key", "value"]
                    }
                },
                {
                    name: "variable_update",
                    description: "Update an existing environment variable. Use this to change configuration values.",
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
                    description: "Delete an environment variable. Use this to remove unused configuration values.",
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
                    description: "List all projects (Enterprise feature). Use this to see project organization and manage access control.",
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
                    description: "Create a new project (Enterprise feature). Use this to organize workflows and manage team access.",
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
                    description: "Update a project's properties (Enterprise feature). Use this to rename or reconfigure projects.",
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
                    description: "Delete a project (Enterprise feature). This will affect all workflows and resources in the project.",
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
                    description: "Create a new credential for workflow authentication. Use this to store API keys, passwords, and other authentication data securely.",
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
                    description: "Delete a credential. This will affect all workflows using this credential.",
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
                    description: "Get the schema for a specific credential type. Use this to understand what data fields are required for different credential types.",
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
                    description: "Transfer a credential to another project (Enterprise feature). Use this for project organization.",
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
                    description: "Generate a comprehensive security audit report. Use this to identify security risks, unused credentials, and potential vulnerabilities in your n8n instance.",
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