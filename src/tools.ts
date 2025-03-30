import { McpExportBridge } from "./bridge";
import { WSClient } from "./ws";

export type Tool<T extends Record<string, unknown>> = {
  name: string;
  params: T;
  handler: (
    params: T
  ) => Promise<{ contents: { uri: string; text: string }[] }>;
};

function tool(functionChain: string) {
  return `mcp:tool.${functionChain}` as `mcp:tool.${string}`;
}


class Tools extends McpExportBridge {
  constructor(ws: WSClient) {
    super(ws, tool);
  }
}

export { Tools };
