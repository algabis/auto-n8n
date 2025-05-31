import axios from "axios";
export class N8nClient {
    client;
    config;
    constructor(config) {
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
    setupInterceptors() {
        // Request interceptor for logging
        this.client.interceptors.request.use((config) => {
            console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            console.error('API Error:', error.response?.data || error.message);
            return Promise.reject(this.handleApiError(error));
        });
    }
    handleApiError(error) {
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
    async getWorkflows(params) {
        const response = await this.client.get('/workflows', { params });
        return response.data;
    }
    async getWorkflow(id, excludePinnedData) {
        const response = await this.client.get(`/workflows/${id}`, {
            params: { excludePinnedData }
        });
        return response.data;
    }
    async createWorkflow(workflow) {
        const response = await this.client.post('/workflows', workflow);
        return response.data;
    }
    async updateWorkflow(id, workflow) {
        const response = await this.client.put(`/workflows/${id}`, workflow);
        return response.data;
    }
    async deleteWorkflow(id) {
        const response = await this.client.delete(`/workflows/${id}`);
        return response.data;
    }
    async activateWorkflow(id) {
        const response = await this.client.post(`/workflows/${id}/activate`);
        return response.data;
    }
    async deactivateWorkflow(id) {
        const response = await this.client.post(`/workflows/${id}/deactivate`);
        return response.data;
    }
    // Additional workflow operations from API spec
    async transferWorkflow(id, destinationProjectId) {
        await this.client.put(`/workflows/${id}/transfer`, { destinationProjectId });
    }
    async getWorkflowTags(id) {
        const response = await this.client.get(`/workflows/${id}/tags`);
        return response.data;
    }
    async updateWorkflowTags(id, tagIds) {
        const response = await this.client.put(`/workflows/${id}/tags`, tagIds.map(id => ({ id })));
        return response.data;
    }
    async getExecutions(params) {
        const response = await this.client.get('/executions', { params });
        return response.data;
    }
    async getExecution(id, includeData) {
        const response = await this.client.get(`/executions/${id}`, {
            params: { includeData }
        });
        return response.data;
    }
    async deleteExecution(id) {
        const response = await this.client.delete(`/executions/${id}`);
        return response.data;
    }
    // Tags operations
    async getTags(params) {
        const response = await this.client.get('/tags', { params });
        return response.data;
    }
    async getTag(id) {
        const response = await this.client.get(`/tags/${id}`);
        return response.data;
    }
    async createTag(tag) {
        const response = await this.client.post('/tags', tag);
        return response.data;
    }
    async updateTag(id, tag) {
        const response = await this.client.put(`/tags/${id}`, tag);
        return response.data;
    }
    async deleteTag(id) {
        const response = await this.client.delete(`/tags/${id}`);
        return response.data;
    }
    // Variables operations
    async getVariables(params) {
        const response = await this.client.get('/variables', { params });
        return response.data;
    }
    async createVariable(variable) {
        await this.client.post('/variables', variable);
    }
    async updateVariable(id, variable) {
        await this.client.put(`/variables/${id}`, variable);
    }
    async deleteVariable(id) {
        await this.client.delete(`/variables/${id}`);
    }
    // Projects operations (Enterprise)
    async getProjects(params) {
        const response = await this.client.get('/projects', { params });
        return response.data;
    }
    async createProject(project) {
        await this.client.post('/projects', project);
    }
    async updateProject(id, project) {
        await this.client.put(`/projects/${id}`, project);
    }
    async deleteProject(id) {
        await this.client.delete(`/projects/${id}`);
    }
    // User management operations (Enterprise)
    async getUsers(params) {
        const response = await this.client.get('/users', { params });
        return response.data;
    }
    async getUser(identifier, includeRole) {
        const response = await this.client.get(`/users/${identifier}`, {
            params: { includeRole }
        });
        return response.data;
    }
    async createUsers(users) {
        const response = await this.client.post('/users', users);
        return response.data;
    }
    async deleteUser(identifier) {
        await this.client.delete(`/users/${identifier}`);
    }
    async changeUserRole(identifier, newRoleName) {
        await this.client.patch(`/users/${identifier}/role`, { newRoleName });
    }
    // Source control operations
    async pullFromSourceControl(pullRequest) {
        const response = await this.client.post('/source-control/pull', pullRequest);
        return response.data;
    }
    // Credential operations
    async createCredential(credential) {
        const response = await this.client.post('/credentials', credential);
        return response.data;
    }
    async deleteCredential(id) {
        const response = await this.client.delete(`/credentials/${id}`);
        return response.data;
    }
    async getCredentialSchema(credentialTypeName) {
        const response = await this.client.get(`/credentials/schema/${credentialTypeName}`);
        return response.data;
    }
    async transferCredential(id, destinationProjectId) {
        await this.client.put(`/credentials/${id}/transfer`, { destinationProjectId });
    }
    // Audit operations
    async generateAudit(options) {
        const response = await this.client.post('/audit', options || {});
        return response.data;
    }
}
//# sourceMappingURL=n8n-client.js.map