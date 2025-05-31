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
  tags: z.string().optional(),
  name: z.string().optional(),
  projectId: z.string().optional(),
  excludePinnedData: z.boolean().optional(),
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
  })).optional(),
  connections: z.record(z.any()).optional(),
  settings: z.object({
    saveExecutionProgress: z.boolean().optional(),
    saveManualExecutions: z.boolean().optional(),
    saveDataErrorExecution: z.enum(['all', 'none']).optional(),
    saveDataSuccessExecution: z.enum(['all', 'none']).optional(),
    executionTimeout: z.number().optional(),
    timezone: z.string().optional()
  }).optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().default(false).optional()
});

// Execution schemas
export const executionListSchema = z.object({
  includeData: z.boolean().optional(),
  status: z.enum(['error', 'success', 'waiting']).optional(),
  workflowId: z.string().optional(),
  projectId: z.string().optional(),
  ...paginationSchema.shape
});

// Tag schemas
export const tagCreateSchema = z.object({
  name: z.string().min(1, 'Tag name is required')
});

// Variable schemas
export const variableCreateSchema = z.object({
  key: z.string().min(1, 'Variable key is required'),
  value: z.string()
});

// Project schemas
export const projectCreateSchema = z.object({
  name: z.string().min(1, 'Project name is required')
});

// User schemas
export const userCreateSchema = z.object({
  users: z.array(z.object({
    email: z.string().email('Valid email is required'),
    role: z.enum(['global:admin', 'global:member'], {
      errorMap: () => ({ message: "Role must be 'global:admin' or 'global:member'" })
    })
  })).min(1, 'At least one user is required')
});

export const userRoleChangeSchema = z.object({
  identifier: z.string().min(1, 'User identifier is required'),
  newRoleName: z.enum(['global:admin', 'global:member'], {
    errorMap: () => ({ message: "Role must be 'global:admin' or 'global:member'" })
  })
});

export const userListSchema = z.object({
  limit: z.number().min(1).max(250).default(100).optional(),
  cursor: z.string().optional(),
  includeRole: z.boolean().optional(),
  projectId: z.string().optional()
});

// Credential schemas
export const credentialCreateSchema = z.object({
  name: z.string().min(1, 'Credential name is required'),
  type: z.string().min(1, 'Credential type is required'),
  data: z.record(z.any())
});

export const credentialSchemaGetSchema = z.object({
  credentialTypeName: z.string().min(1, 'Credential type name is required')
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
  id: z.string().min(1, 'Resource ID is required'),
  destinationProjectId: z.string().min(1, 'Destination project ID is required')
});

// Source control schemas
export const sourceControlPullSchema = z.object({
  force: z.boolean().optional(),
  variables: z.record(z.string()).optional()
});

// Utility functions
export function validateAndTransform<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join(', ');
      throw new Error(`Validation failed: ${formattedErrors}`);
    }
    throw error;
  }
}

export function createErrorResponse(message: string, details?: any) {
  return {
    content: [{
      type: "text" as const,
      text: `❌ Error: ${message}${details ? `\n\nDetails: ${JSON.stringify(details, null, 2)}` : ''}`
    }]
  };
}

export function createSuccessResponse(message: string, details?: string) {
  return {
    content: [{
      type: "text",
      text: details ? `${message}\n\n${details}` : message
    }]
  };
} 