import { WebSocketServer, type WebSocket } from "ws";
import { uuid } from "./utils/uuid";

class WSClient {
  _ws: WebSocketServer;
  _socket: WebSocket; // one single socket from conne
  _callbacks: Map<string, (value: unknown) => void>;

  constructor() {
    this._callbacks = new Map();
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
      if (this._socket) {
        return;
      }

      this._ws.on("message", (event) => {
        try {
          const response = JSON.parse(event.toString());
          console.log("收到服务器响应:", response);
          if (this._callbacks.has(response.id)) {
            this._callbacks.get(response.id)?.(response.result);
            this._callbacks.delete(response.id);
          }
        } catch (err) {
          console.error("解析响应失败:", err);
        }
      });

      // 保存 socket 对象 ，建立单点连接
      this._socket = ws;
    });

    return this;
  }

  private _call({
    method,
    params,
  }: {
    method: `mcp:tool.${string}` | `mcp:resource.${string}`;
    params: unknown[];
  }) {
      return new Promise((resolve, reject) => {
      if (!this._socket) {
        reject(new Error("没有 web 端 socket 连接"));
        return;
      }

      const id = uuid();
      this._callbacks.set(id, resolve);
      const message = {
        id,
        method,
        params,
      };
      this._socket.send(JSON.stringify(message));
    });
  }

  async send({
    method,
    params,
  }: {
    method: `mcp:tool.${string}` | `mcp:resource.${string}`;
    params: unknown[];
  }) : Promise<{
    content: {
      type: 'text';
      text: string;
    }[];
    isError?: true;
  }> {
    try {
      const { result, error } = (await this._call({ method, params })) as {
        result: unknown;
        error: unknown;
      };
      if (error) {
        throw new Error(error as string);
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (err: unknown) {
      return {
        content: [
          {
            type: "text",
            text: (err as Error)?.message,
          },
        ],
        isError: true,
      };
    }
  }

  disconnect() {
    this._ws.close();
  }
}

export { WSClient };
