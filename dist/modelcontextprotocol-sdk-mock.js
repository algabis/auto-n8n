// This file provides mock interfaces for the Model Context Protocol SDK
// to allow the TypeScript compiler to work properly until the real SDK is installed
// Server module
export class Server {
    constructor(info, options) { }
    async connect(transport) { }
    setRequestHandler(schema, handler) { }
}
// Transport module
export class StdioServerTransport {
    constructor() { }
}
// Types module
export const CallToolRequestSchema = Symbol('CallToolRequestSchema');
export const ListToolsRequestSchema = Symbol('ListToolsRequestSchema');
//# sourceMappingURL=modelcontextprotocol-sdk-mock.js.map