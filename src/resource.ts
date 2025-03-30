import { WSClient } from "./ws";
import { McpExportBridge } from "./bridge";

function resource(functionChain: string) {
  return `mcp:resource.${functionChain}` as `mcp:resource.${string}`;
}

class Resources extends McpExportBridge {
  constructor(ws: WSClient) {
    super(ws, resource);
  }
}

export { Resources }