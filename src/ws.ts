import { WebSocketServer } from "ws";
import { uuid } from "./utils";

class WSClient {
  _ws: WebSocketServer;
  _callbacks: Record<
    string,
    { resolve: (result: unknown) => void; reject: (error: unknown) => void }
  >;

  constructor() {
    this._callbacks = {};
  }

  connect(port: number) {
    this._ws = new WebSocketServer({
      port,
    });

    this._ws.on("error", (error) => {
      console.error("WebSocket 错误:", error);
    });

    this._ws.on("close", () => {
      console.log("连接已关闭");
    });

    this._ws.on("connection", (ws) => {
      console.log("已连接到 MCP 服务器");

      this._ws.on("message", (event) => {
        try {
          const response = JSON.parse(event.toString());
          console.log("收到服务器响应:", response);
          if (response.id in this._callbacks) {
            this._callbacks[response.id].resolve(response.result);
            delete this._callbacks[response.id];
          } 
        } catch (err) {
          console.error("解析响应失败:", err);
        }
      });

      const pingMessage = {
        id: "0",
        method: "mcp:resource.navigator.userAgent",
        params: [],
      };

      ws.send(JSON.stringify(pingMessage));
    });

    return this;
  }

  send({
    method,
    params,
  }: {
    method: `mcp:tool.${string}` | `mcp:resource.${string}`;
    params: unknown[];
  }) {
    const message = {
      id: uuid(),
      method,
      params,
    };
    this._ws.clients.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  }

  disconnect() {
    this._ws.close();
  }
}

export { WSClient };
