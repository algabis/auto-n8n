import { z } from 'zod';
export declare const workflowIdSchema: z.ZodString;
export declare const executionIdSchema: z.ZodString;
export declare const tagIdSchema: z.ZodString;
export declare const variableIdSchema: z.ZodString;
export declare const projectIdSchema: z.ZodString;
export declare const userIdSchema: z.ZodString;
export declare const credentialIdSchema: z.ZodString;
export declare const paginationSchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cursor?: string | undefined;
    limit?: number | undefined;
}, {
    cursor?: string | undefined;
    limit?: number | undefined;
}>;
export declare const workflowListSchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    cursor: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodBoolean>;
    tags: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    excludePinnedData: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    active?: boolean | undefined;
    cursor?: string | undefined;
    tags?: string | undefined;
    limit?: number | undefined;
    projectId?: string | undefined;
    excludePinnedData?: boolean | undefined;
}, {
    name?: string | undefined;
    active?: boolean | undefined;
    cursor?: string | undefined;
    tags?: string | undefined;
    limit?: number | undefined;
    projectId?: string | undefined;
    excludePinnedData?: boolean | undefined;
}>;
export declare const workflowCreateSchema: z.ZodObject<{
    name: z.ZodString;
    nodes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        position: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        position?: number[] | undefined;
        credentials?: Record<string, any> | undefined;
        parameters?: Record<string, any> | undefined;
    }, {
        name: string;
        type: string;
        position?: number[] | undefined;
        credentials?: Record<string, any> | undefined;
        parameters?: Record<string, any> | undefined;
    }>, "many">>;
    connections: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    settings: z.ZodOptional<z.ZodObject<{
        saveExecutionProgress: z.ZodOptional<z.ZodBoolean>;
        saveManualExecutions: z.ZodOptional<z.ZodBoolean>;
        saveDataErrorExecution: z.ZodOptional<z.ZodEnum<["all", "none"]>>;
        saveDataSuccessExecution: z.ZodOptional<z.ZodEnum<["all", "none"]>>;
        executionTimeout: z.ZodOptional<z.ZodNumber>;
        timezone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        saveExecutionProgress?: boolean | undefined;
        saveManualExecutions?: boolean | undefined;
        saveDataErrorExecution?: "all" | "none" | undefined;
        saveDataSuccessExecution?: "all" | "none" | undefined;
        executionTimeout?: number | undefined;
        timezone?: string | undefined;
    }, {
        saveExecutionProgress?: boolean | undefined;
        saveManualExecutions?: boolean | undefined;
        saveDataErrorExecution?: "all" | "none" | undefined;
        saveDataSuccessExecution?: "all" | "none" | undefined;
        executionTimeout?: number | undefined;
        timezone?: string | undefined;
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    active?: boolean | undefined;
    nodes?: {
        name: string;
        type: string;
        position?: number[] | undefined;
        credentials?: Record<string, any> | undefined;
        parameters?: Record<string, any> | undefined;
    }[] | undefined;
    connections?: Record<string, any> | undefined;
    settings?: {
        saveExecutionProgress?: boolean | undefined;
        saveManualExecutions?: boolean | undefined;
        saveDataErrorExecution?: "all" | "none" | undefined;
        saveDataSuccessExecution?: "all" | "none" | undefined;
        executionTimeout?: number | undefined;
        timezone?: string | undefined;
    } | undefined;
    tags?: string[] | undefined;
}, {
    name: string;
    active?: boolean | undefined;
    nodes?: {
        name: string;
        type: string;
        position?: number[] | undefined;
        credentials?: Record<string, any> | undefined;
        parameters?: Record<string, any> | undefined;
    }[] | undefined;
    connections?: Record<string, any> | undefined;
    settings?: {
        saveExecutionProgress?: boolean | undefined;
        saveManualExecutions?: boolean | undefined;
        saveDataErrorExecution?: "all" | "none" | undefined;
        saveDataSuccessExecution?: "all" | "none" | undefined;
        executionTimeout?: number | undefined;
        timezone?: string | undefined;
    } | undefined;
    tags?: string[] | undefined;
}>;
export declare const executionListSchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    cursor: z.ZodOptional<z.ZodString>;
    includeData: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodOptional<z.ZodEnum<["error", "success", "waiting"]>>;
    workflowId: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cursor?: string | undefined;
    status?: "error" | "waiting" | "success" | undefined;
    limit?: number | undefined;
    projectId?: string | undefined;
    includeData?: boolean | undefined;
    workflowId?: string | undefined;
}, {
    cursor?: string | undefined;
    status?: "error" | "waiting" | "success" | undefined;
    limit?: number | undefined;
    projectId?: string | undefined;
    includeData?: boolean | undefined;
    workflowId?: string | undefined;
}>;
export declare const tagCreateSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const variableCreateSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    key: string;
    value: string;
}, {
    key: string;
    value: string;
}>;
export declare const projectCreateSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const userCreateSchema: z.ZodObject<{
    users: z.ZodArray<z.ZodObject<{
        email: z.ZodString;
        role: z.ZodEnum<["global:admin", "global:member"]>;
    }, "strip", z.ZodTypeAny, {
        role: "global:admin" | "global:member";
        email: string;
    }, {
        role: "global:admin" | "global:member";
        email: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    users: {
        role: "global:admin" | "global:member";
        email: string;
    }[];
}, {
    users: {
        role: "global:admin" | "global:member";
        email: string;
    }[];
}>;
export declare const userRoleChangeSchema: z.ZodObject<{
    identifier: z.ZodString;
    newRoleName: z.ZodEnum<["global:admin", "global:member"]>;
}, "strip", z.ZodTypeAny, {
    newRoleName: "global:admin" | "global:member";
    identifier: string;
}, {
    newRoleName: "global:admin" | "global:member";
    identifier: string;
}>;
export declare const userListSchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    cursor: z.ZodOptional<z.ZodString>;
    includeRole: z.ZodOptional<z.ZodBoolean>;
    projectId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cursor?: string | undefined;
    limit?: number | undefined;
    projectId?: string | undefined;
    includeRole?: boolean | undefined;
}, {
    cursor?: string | undefined;
    limit?: number | undefined;
    projectId?: string | undefined;
    includeRole?: boolean | undefined;
}>;
export declare const credentialCreateSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: string;
    data: Record<string, any>;
}, {
    name: string;
    type: string;
    data: Record<string, any>;
}>;
export declare const credentialSchemaGetSchema: z.ZodObject<{
    credentialTypeName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    credentialTypeName: string;
}, {
    credentialTypeName: string;
}>;
export declare const auditGenerateSchema: z.ZodObject<{
    additionalOptions: z.ZodOptional<z.ZodObject<{
        daysAbandonedWorkflow: z.ZodOptional<z.ZodNumber>;
        categories: z.ZodOptional<z.ZodArray<z.ZodEnum<["credentials", "database", "nodes", "filesystem", "instance"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        daysAbandonedWorkflow?: number | undefined;
        categories?: ("nodes" | "credentials" | "database" | "filesystem" | "instance")[] | undefined;
    }, {
        daysAbandonedWorkflow?: number | undefined;
        categories?: ("nodes" | "credentials" | "database" | "filesystem" | "instance")[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    additionalOptions?: {
        daysAbandonedWorkflow?: number | undefined;
        categories?: ("nodes" | "credentials" | "database" | "filesystem" | "instance")[] | undefined;
    } | undefined;
}, {
    additionalOptions?: {
        daysAbandonedWorkflow?: number | undefined;
        categories?: ("nodes" | "credentials" | "database" | "filesystem" | "instance")[] | undefined;
    } | undefined;
}>;
export declare const transferSchema: z.ZodObject<{
    id: z.ZodString;
    destinationProjectId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    destinationProjectId: string;
}, {
    id: string;
    destinationProjectId: string;
}>;
export declare const sourceControlPullSchema: z.ZodObject<{
    force: z.ZodOptional<z.ZodBoolean>;
    variables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    force?: boolean | undefined;
    variables?: Record<string, string> | undefined;
}, {
    force?: boolean | undefined;
    variables?: Record<string, string> | undefined;
}>;
export declare function validateAndTransform<T>(schema: z.ZodSchema<T>, data: unknown): T;
export declare function createErrorResponse(message: string, details?: any): {
    content: {
        type: "text";
        text: string;
    }[];
};
export declare function createSuccessResponse(message: string, details?: string): {
    content: {
        type: string;
        text: string;
    }[];
};
