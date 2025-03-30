import { WSClient } from "./ws";

export type Tool<T extends Record<string, unknown>> = {
  name: string;
  params: T;
  handler: (
    params: T
  ) => Promise<{ contents: { uri: string; text: string }[] }>;
};

function tool(functionChain: string) {
  return `mcp:tool.${functionChain}`;
}

class Tools {
  ws: WSClient;

  constructor(ws: WSClient) {
    this.ws = ws;
  }

  async callExtension(method: string, ...params: unknown[]) {
    const message = {
      method: tool(method) as `mcp:tool.${string}`,
      params: params,
    };
    const response = await this.ws.send(message);
    return response
  }
}

export { Tools };
