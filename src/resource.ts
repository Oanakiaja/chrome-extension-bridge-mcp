import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WSClient } from "./ws";
import { McpExportBridge } from "./bridge";

export type Resource<T extends Record<string, unknown>> = {
  name: string;
  ResourceTemplate: ResourceTemplate; 
  handler: (uri: URL, params: T) => Promise<{contents: {uri: string, text: string}[] }>;
}

function resource(functionChain: string) {
  return `mcp:resource.${functionChain}` as `mcp:resource.${string}`;
}

class Resources extends McpExportBridge {
  constructor(ws: WSClient) {
    super(ws, resource);
  }
}

export { Resources }