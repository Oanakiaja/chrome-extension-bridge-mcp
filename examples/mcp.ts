import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Tools } from "../src/tools";
import { Resources } from "../src/resource";
import { WSClient } from "../src/ws";

const port = 54319;
const ws = new WSClient().connect(port);
const tools = new Tools(ws);
const resources = new Resources(ws);

// Create an MCP server
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

server.resource("userAgent", "useragent://chrome", async (uri) => {
  const { content } = await resources.callExtension("navigator.userAgent");
  return {
    contents: [
      {
        uri: uri.href,
        text: content[0].text,
      },
    ],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);

process.on("SIGINT", () => {
  console.log("SIGINT 信号接收");
  ws.disconnect();
  process.exit(0);
});
