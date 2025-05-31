// This file provides mock interfaces for the Model Context Protocol SDK
// to allow the TypeScript compiler to work properly until the real SDK is installed

// Server module
export class Server {
  constructor(
    info: { name: string; description: string; version: string },
    options: { capabilities: { tools: object; resources: object } }
  ) {}

  async connect(transport: any): Promise<void> {}

  setRequestHandler(schema: any, handler: (request: any) => Promise<any>): void {}
}

// Transport module
export class StdioServerTransport {
  constructor() {}
}

// Types module
export const CallToolRequestSchema = Symbol('CallToolRequestSchema');
export const ListToolsRequestSchema = Symbol('ListToolsRequestSchema'); 