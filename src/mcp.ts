import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Tools } from "./tools";
import { WSClient } from "./ws";

const port = 54319;
const ws = new WSClient().connect(port);
const tools = new Tools(ws);

// // Create an MCP server
const server = new McpServer({
  name: "Extension-Socket-Server",
  version: "1.0.0",
});

// Add an addition tool

server.tool(
  "alert",
  "use window.alert",
  { message: z.string() },
  async ({ message }) => {
    const response = await tools.callExtension("alert", message);
    return response;
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

process.on("SIGINT", () => {
  console.log("SIGINT 信号接收");
  ws.disconnect();
  process.exit(0);
});
