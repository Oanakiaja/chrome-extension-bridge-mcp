import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WSClient } from "./ws";

export type Resource<T extends Record<string, unknown>> = {
  name: string;
  ResourceTemplate: ResourceTemplate; 
  handler: (uri: URL, params: T) => Promise<{contents: {uri: string, text: string}[] }>;
}

function resource(functionChain: string) {
  return `mcp:resource.${functionChain}`;
}


class Resources {
  ws: WSClient;

  constructor(ws: WSClient) {
    this.ws = ws;
  }
  
  _callExtension(method: string, params: unknown[]) {
    const message = {
      method: resource(method) as `mcp:resource.${string}`,
      params: params
    }
    this.ws.send(message)
  }
}

export { Resources }