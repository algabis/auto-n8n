import { z } from 'zod';
// Common validation schemas
export const workflowIdSchema = z.string().min(1, 'Workflow ID is required');
export const executionIdSchema = z.string().min(1, 'Execution ID is required');
export const tagIdSchema = z.string().min(1, 'Tag ID is required');
export const variableIdSchema = z.string().min(1, 'Variable ID is required');
export const projectIdSchema = z.string().min(1, 'Project ID is required');
export const userIdSchema = z.string().min(1, 'User ID is required');
export const credentialIdSchema = z.string().min(1, 'Credential ID is required');
// Pagination schemas
export const paginationSchema = z.object({
    limit: z.number().min(1).max(250).default(100).optional(),
    cursor: z.string().optional()
});
// Workflow schemas
export const workflowListSchema = z.object({
    active: z.boolean().optional(),
    tags: z.string().optional().describe('Comma-separated list of tag names'),
    name: z.string().optional().describe('Filter by workflow name'),
    projectId: z.string().optional().describe('Filter by project ID'),
    excludePinnedData: z.boolean().optional().describe('Exclude pinned data from response'),
    ...paginationSchema.shape
});
export const workflowCreateSchema = z.object({
    name: z.string().min(1, 'Workflow name is required'),
    nodes: z.array(z.object({
        name: z.string(),
        type: z.string(),
        parameters: z.record(z.any()).optional(),
        position: z.array(z.number()).optional(),
        credentials: z.record(z.any()).optional()
    })).optional().default([]),
    connections: z.record(z.any()).optional().default({}),
    settings: z.object({
        saveExecutionProgress: z.boolean().optional().default(true),
        saveManualExecutions: z.boolean().optional().default(true),
        saveDataErrorExecution: z.enum(['all', 'none']).optional().default('all'),
        saveDataSuccessExecution: z.enum(['all', 'none']).optional().default('all'),
        executionTimeout: z.number().optional(),
        timezone: z.string().optional()
    }).optional().default({}),
    tags: z.array(z.string()).optional(),
    active: z.boolean().default(false)
});
// Execution schemas
export const executionListSchema = z.object({
    includeData: z.boolean().optional().describe('Include execution data in response'),
    status: z.enum(['error', 'success', 'waiting']).optional(),
    workflowId: z.string().optional(),
    projectId: z.string().optional().describe('Filter by project ID'),
    ...paginationSchema.shape
});
// Tag schemas
export const tagCreateSchema = z.object({
    name: z.string().min(1, 'Tag name is required')
});
// Variable schemas
export const variableCreateSchema = z.object({
    key: z.string().min(1, 'Variable key is required'),
    value: z.string().min(1, 'Variable value is required')
});
// Project schemas
export const projectCreateSchema = z.object({
    name: z.string().min(1, 'Project name is required')
});
// User schemas
export const userCreateSchema = z.array(z.object({
    email: z.string().email('Valid email is required'),
    role: z.enum(['global:admin', 'global:member']).default('global:member')
}));
export const userRoleChangeSchema = z.object({
    newRoleName: z.enum(['global:admin', 'global:member'])
});
// Credential schemas
export const credentialCreateSchema = z.object({
    name: z.string().min(1, 'Credential name is required'),
    type: z.string().min(1, 'Credential type is required'),
    data: z.record(z.any()).describe('Credential data object')
});
// Audit schemas
export const auditGenerateSchema = z.object({
    additionalOptions: z.object({
        daysAbandonedWorkflow: z.number().optional(),
        categories: z.array(z.enum(['credentials', 'database', 'nodes', 'filesystem', 'instance'])).optional()
    }).optional()
});
// Transfer schemas
export const transferSchema = z.object({
    destinationProjectId: z.string().min(1, 'Destination project ID is required')
});
// Utility functions
export function validateAndTransform(schema, data) {
    try {
        return schema.parse(data);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
            throw new Error(`Validation error: ${issues.join(', ')}`);
        }
        throw error;
    }
}
export function createErrorResponse(message, details) {
    return {
        content: [{
                type: "text",
                text: `❌ Error: ${message}${details ? `\n\nDetails: ${JSON.stringify(details, null, 2)}` : ''}`
            }]
    };
}
export function createSuccessResponse(message, data) {
    return {
        content: [{
                type: "text",
                text: `✅ ${message}${data ? `\n\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}` : ''}`
            }]
    };
}
//# sourceMappingURL=validation.js.map