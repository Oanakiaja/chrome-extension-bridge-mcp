import { WebSocketServer, type WebSocket } from "ws";
import { uuid } from "./utils/uuid";

class WSClient {
  _ws: WebSocketServer;
  _socket: WebSocket; // one single socket from connection
  _callbacks: Map<string, (value: unknown) => void>;

  constructor() {
    this._callbacks = new Map();
  }

  connect(port: number) {
    this._ws = new WebSocketServer({
      port,
    });

    this._ws.on("error", () => {
      // Error handler remains but without console.log
    });

    this._ws.on("close", () => {
      // Connection closed handler without console.log
    });

    this._ws.on("connection", (ws) => {
      // Save socket object, establish single connection
      if (this._socket) {
        this._socket.close();
      }
      this._socket = ws;
      this._socket.on("message", (event) => {
        try {
          const response = JSON.parse(event.toString());
          if (this._callbacks.has(response.id)) {
            const resolve = this._callbacks.get(response.id)!;
            resolve(response);
            this._callbacks.delete(response.id);
          }
        } catch {
          // Parse response failed handler without console.error
        }
      });
    });

    return this;
  }

  private _call(
    method: `mcp:tool.${string}` | `mcp:resource.${string}`,
    params?: Record<string, unknown>
  ) {
    return new Promise((resolve, reject) => {
      if (!this._socket) {
        reject(new Error("No web socket connection"));
        return;
      }

      const id = uuid();
      this._callbacks.set(id, resolve);
      const message = {
        id,
        method,
        params: params || {},
      };
      this._socket.send(JSON.stringify(message));
    });
  }

  async send(
    method: `mcp:tool.${string}` | `mcp:resource.${string}`,
    params?: Record<string, unknown>
  ): Promise<{
    content: {
      type: "text";
      text: string;
    }[];
    isError?: true;
  }> {
    try {
      const { result = "", error } = (await this._call(method, params)) as {
        result: string;
        error: string;
      };
      if (error) {
        throw new Error(error as string);
      }
      return {
        content: [
          {
            type: "text",
            text: result,
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
