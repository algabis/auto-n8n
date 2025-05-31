export interface PaginatedResponse<T> {
    data: T[];
    nextCursor?: string;
}
export interface N8nTag {
    id?: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
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
export interface N8nWorkflow {
    id?: string;
    name: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
    nodes: N8nNode[];
    connections: Record<string, any>;
    settings: N8nWorkflowSettings;
    staticData?: string | Record<string, any> | null;
    tags?: N8nTag[];
}
export interface N8nExecution {
    id: number;
    data?: Record<string, any>;
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
    status?: string;
}
export interface N8nCredential {
    id?: string;
    name: string;
    type: string;
    data?: Record<string, any>;
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
export interface N8nUserCreateRequest {
    email: string;
    role: 'global:admin' | 'global:member';
}
export interface N8nUserCreateResponse {
    user: {
        id: string;
        email: string;
        inviteAcceptUrl: string;
        emailSent: boolean;
    };
    error?: string;
}
export interface N8nSourceControlPullRequest {
    force?: boolean;
    variables?: Record<string, string>;
}
export interface N8nImportResult {
    variables?: {
        added: string[];
        changed: string[];
    };
    credentials?: Array<{
        id: string;
        name: string;
        type: string;
    }>;
    workflows?: Array<{
        id: string;
        name: string;
    }>;
    tags?: {
        tags: Array<{
            id: string;
            name: string;
        }>;
        mappings: Array<{
            workflowId: string;
            tagId: string;
        }>;
    };
}
export interface N8nClientConfig {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
    retries?: number;
}
export declare class N8nClient {
    private client;
    private config;
    constructor(config: N8nClientConfig);
    private setupInterceptors;
    private handleApiError;
    getWorkflows(params?: {
        active?: boolean;
        tags?: string;
        name?: string;
        projectId?: string;
        excludePinnedData?: boolean;
        limit?: number;
        cursor?: string;
    }): Promise<PaginatedResponse<N8nWorkflow>>;
    getWorkflow(id: string, excludePinnedData?: boolean): Promise<N8nWorkflow>;
    createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow>;
    updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow>;
    deleteWorkflow(id: string): Promise<N8nWorkflow>;
    activateWorkflow(id: string): Promise<N8nWorkflow>;
    deactivateWorkflow(id: string): Promise<N8nWorkflow>;
    transferWorkflow(id: string, destinationProjectId: string): Promise<void>;
    getWorkflowTags(id: string): Promise<N8nTag[]>;
    updateWorkflowTags(id: string, tagIds: string[]): Promise<N8nTag[]>;
    getExecutions(params?: {
        includeData?: boolean;
        status?: 'error' | 'success' | 'waiting';
        workflowId?: string;
        projectId?: string;
        limit?: number;
        cursor?: string;
    }): Promise<PaginatedResponse<N8nExecution>>;
    getExecution(id: string, includeData?: boolean): Promise<N8nExecution>;
    deleteExecution(id: string): Promise<N8nExecution>;
    getTags(params?: {
        limit?: number;
        cursor?: string;
    }): Promise<PaginatedResponse<N8nTag>>;
    getTag(id: string): Promise<N8nTag>;
    createTag(tag: {
        name: string;
    }): Promise<N8nTag>;
    updateTag(id: string, tag: {
        name: string;
    }): Promise<N8nTag>;
    deleteTag(id: string): Promise<N8nTag>;
    getVariables(params?: {
        limit?: number;
        cursor?: string;
    }): Promise<PaginatedResponse<N8nVariable>>;
    createVariable(variable: {
        key: string;
        value: string;
    }): Promise<void>;
    updateVariable(id: string, variable: {
        key: string;
        value: string;
    }): Promise<void>;
    deleteVariable(id: string): Promise<void>;
    getProjects(params?: {
        limit?: number;
        cursor?: string;
    }): Promise<PaginatedResponse<N8nProject>>;
    createProject(project: {
        name: string;
    }): Promise<void>;
    updateProject(id: string, project: {
        name: string;
    }): Promise<void>;
    deleteProject(id: string): Promise<void>;
    getUsers(params?: {
        limit?: number;
        cursor?: string;
        includeRole?: boolean;
        projectId?: string;
    }): Promise<PaginatedResponse<N8nUser>>;
    getUser(identifier: string, includeRole?: boolean): Promise<N8nUser>;
    createUsers(users: N8nUserCreateRequest[]): Promise<N8nUserCreateResponse[]>;
    deleteUser(identifier: string): Promise<void>;
    changeUserRole(identifier: string, newRoleName: 'global:admin' | 'global:member'): Promise<void>;
    pullFromSourceControl(pullRequest: N8nSourceControlPullRequest): Promise<N8nImportResult>;
    createCredential(credential: {
        name: string;
        type: string;
        data: Record<string, any>;
    }): Promise<N8nCredential>;
    deleteCredential(id: string): Promise<N8nCredential>;
    getCredentialSchema(credentialTypeName: string): Promise<Record<string, any>>;
    transferCredential(id: string, destinationProjectId: string): Promise<void>;
    generateAudit(options?: {
        additionalOptions?: {
            daysAbandonedWorkflow?: number;
            categories?: ('credentials' | 'database' | 'nodes' | 'filesystem' | 'instance')[];
        };
    }): Promise<Record<string, any>>;
}
