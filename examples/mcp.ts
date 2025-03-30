import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Client } from "../src/client";

const port = 54319;
const client = new Client(port);

await client.connect();

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
    const response = await client.callToolExtension("alert", message);
    return response;
  }
);

server.resource("userAgent", "useragent://chrome", async (uri) => {
  const { content } = await client.callResourceExtension("navigator.userAgent");
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

process.on("SIGINT", async () => {
  console.log("SIGINT 信号接收");
  await client.dispose();
  process.exit(0);
});
