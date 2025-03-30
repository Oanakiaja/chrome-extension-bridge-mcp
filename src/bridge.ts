import { WSClient } from "./ws";

class McpExportBridge {
  ws: WSClient;
  prefix: (str: string) =>  `mcp:tool.${string}` | `mcp:resource.${string}`;

  constructor(ws: WSClient, prefix: (str: string) =>  `mcp:tool.${string}` | `mcp:resource.${string}` ) {
    this.ws = ws;
    this.prefix = prefix;
  }

  async callExtension(method: string, ...params: unknown[]) {
    const message = {
      method: this.prefix(method),
      params: params,
    };
    const response = await this.ws.send(message);
    return response
  }
}

export { McpExportBridge };
