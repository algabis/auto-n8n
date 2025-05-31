export interface N8nWorkflow {
    id?: string;
    name: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
    nodes: N8nNode[];
    connections: Record<string, any>;
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
    parameters?: Record<string, any>;
    credentials?: Record<string, any>;
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
    data?: {
        resultData?: {
            runData?: Record<string, any>;
            error?: any;
        };
    };
    finished?: boolean;
    mode?: 'cli' | 'error' | 'integrated' | 'internal' | 'manual' | 'retry' | 'trigger' | 'webhook';
    retryOf?: number | null;
    retrySuccessId?: number | null;
    startedAt: string;
    stoppedAt?: string;
    workflowId: number;
    waitTill?: string | null;
    customData?: Record<string, any>;
    workflowData?: N8nWorkflow;
    status?: 'error' | 'success' | 'waiting';
}
export interface N8nCredential {
    id?: string;
    name: string;
    type: string;
    data?: Record<string, any>;
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
export interface N8nAuditReport {
    [key: string]: {
        risk: string;
        sections: Array<{
            title: string;
            description: string;
            recommendation: string;
            location?: Array<{
                kind: string;
                id?: string;
                name?: string;
                workflowId?: string;
                workflowName?: string;
                nodeId?: string;
                nodeName?: string;
                nodeType?: string;
                packageUrl?: string;
            }>;
        }>;
    };
}
export interface PaginatedResponse<T> {
    data: T[];
    nextCursor?: string;
}
export interface WorkflowListParams {
    active?: boolean;
    tags?: string;
    name?: string;
    projectId?: string;
    excludePinnedData?: boolean;
    limit?: number;
    cursor?: string;
}
export interface ExecutionListParams {
    includeData?: boolean;
    status?: 'error' | 'success' | 'waiting';
    workflowId?: string;
    projectId?: string;
    limit?: number;
    cursor?: string;
}
export interface TagListParams {
    limit?: number;
    cursor?: string;
}
export interface VariableListParams {
    limit?: number;
    cursor?: string;
}
export interface ProjectListParams {
    limit?: number;
    cursor?: string;
}
export interface UserListParams {
    limit?: number;
    cursor?: string;
    includeRole?: boolean;
    projectId?: string;
}
export interface AuditOptions {
    additionalOptions?: {
        daysAbandonedWorkflow?: number;
        categories?: ('credentials' | 'database' | 'nodes' | 'filesystem' | 'instance')[];
    };
}
