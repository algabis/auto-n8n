export declare class Server {
    constructor(info: {
        name: string;
        description: string;
        version: string;
    }, options: {
        capabilities: {
            tools: object;
            resources: object;
        };
    });
    connect(transport: any): Promise<void>;
    setRequestHandler(schema: any, handler: (request: any) => Promise<any>): void;
}
export declare class StdioServerTransport {
    constructor();
}
export declare const CallToolRequestSchema: unique symbol;
export declare const ListToolsRequestSchema: unique symbol;
