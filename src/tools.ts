import { McpExportBridge } from "./bridge";
import { WSClient } from "./ws";

function tool(functionChain: string) {
  return `mcp:tool.${functionChain}` as `mcp:tool.${string}`;
}

class Tools extends McpExportBridge {
  constructor(ws: WSClient) {
    super(ws, tool);
  }
}

export { Tools };
