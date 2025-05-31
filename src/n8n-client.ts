import axios, { AxiosInstance, AxiosResponse } from "axios";

// API Response types
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

// User management interfaces (Enterprise feature)
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

// Source control interfaces
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
  }): Promise<PaginatedResponse<N8nWorkflow>> {
    const response = await this.client.get('/workflows', { params });
    return response.data;
  }

  async getWorkflow(id: string, excludePinnedData?: boolean): Promise<N8nWorkflow> {
    const response = await this.client.get(`/workflows/${id}`, { 
      params: { excludePinnedData } 
    });
    return response.data;
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    const response = await this.client.post('/workflows', workflow);
    return response.data;
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    const response = await this.client.put(`/workflows/${id}`, workflow);
    return response.data;
  }

  async deleteWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await this.client.delete(`/workflows/${id}`);
    return response.data;
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
  
  async getExecutions(params?: {
    includeData?: boolean;
    status?: 'error' | 'success' | 'waiting';
    workflowId?: string;
    projectId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<N8nExecution>> {
    const response = await this.client.get('/executions', { params });
    return response.data;
  }

  async getExecution(id: string, includeData?: boolean): Promise<N8nExecution> {
    const response = await this.client.get(`/executions/${id}`, {
      params: { includeData }
    });
    return response.data;
  }

  async deleteExecution(id: string): Promise<N8nExecution> {
    const response = await this.client.delete(`/executions/${id}`);
    return response.data;
  }

  // Tags operations
  async getTags(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<N8nTag>> {
    const response = await this.client.get('/tags', { params });
    return response.data;
  }

  async getTag(id: string): Promise<N8nTag> {
    const response = await this.client.get(`/tags/${id}`);
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

  async deleteTag(id: string): Promise<N8nTag> {
    const response = await this.client.delete(`/tags/${id}`);
    return response.data;
  }

  // Variables operations
  async getVariables(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<N8nVariable>> {
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
  }): Promise<PaginatedResponse<N8nProject>> {
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

  // User management operations (Enterprise)
  async getUsers(params?: {
    limit?: number;
    cursor?: string;
    includeRole?: boolean;
    projectId?: string;
  }): Promise<PaginatedResponse<N8nUser>> {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  async getUser(identifier: string, includeRole?: boolean): Promise<N8nUser> {
    const response = await this.client.get(`/users/${identifier}`, {
      params: { includeRole }
    });
    return response.data;
  }

  async createUsers(users: N8nUserCreateRequest[]): Promise<N8nUserCreateResponse[]> {
    const response = await this.client.post('/users', users);
    return response.data;
  }

  async deleteUser(identifier: string): Promise<void> {
    await this.client.delete(`/users/${identifier}`);
  }

  async changeUserRole(identifier: string, newRoleName: 'global:admin' | 'global:member'): Promise<void> {
    await this.client.patch(`/users/${identifier}/role`, { newRoleName });
  }

  // Source control operations
  async pullFromSourceControl(pullRequest: N8nSourceControlPullRequest): Promise<N8nImportResult> {
    const response = await this.client.post('/source-control/pull', pullRequest);
    return response.data;
  }

  // Credential operations
  async createCredential(credential: {
    name: string;
    type: string;
    data: Record<string, any>;
  }): Promise<N8nCredential> {
    const response = await this.client.post('/credentials', credential);
    return response.data;
  }

  async deleteCredential(id: string): Promise<N8nCredential> {
    const response = await this.client.delete(`/credentials/${id}`);
    return response.data;
  }

  async getCredentialSchema(credentialTypeName: string): Promise<Record<string, any>> {
    const response = await this.client.get(`/credentials/schema/${credentialTypeName}`);
    return response.data;
  }

  async transferCredential(id: string, destinationProjectId: string): Promise<void> {
    await this.client.put(`/credentials/${id}/transfer`, { destinationProjectId });
  }

  // Audit operations
  async generateAudit(options?: {
    additionalOptions?: {
      daysAbandonedWorkflow?: number;
      categories?: ('credentials' | 'database' | 'nodes' | 'filesystem' | 'instance')[];
    };
  }): Promise<Record<string, any>> {
    const response = await this.client.post('/audit', options || {});
    return response.data;
  }
} 