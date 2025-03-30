import { occupiedPort } from "./utils/port";
import { WSClient } from "./ws";
import { Tools } from "./tools";
import { Resources } from "./resource";

export class Client {
  port: number;
  ws: WSClient;
  tools: Tools;
  resources: Resources;
  connected: boolean;

  constructor(port: number) {
    this.port = port;
    this.connected = false;
  }

  async connect() {
    await occupiedPort(this.port);
    this.ws = new WSClient().connect(this.port);
    this.tools = new Tools(this.ws);
    this.resources = new Resources(this.ws);
    this.connected = true;
  }

  async callToolExtension(toolName: string, params: Record<string, unknown>) {
    if (!this.connected) {
      throw new Error("Client is not connected");
    }
    return this.tools.callExtension(toolName, params);
  }

  async callResourceExtension(resourceName: string, params?: Record<string, unknown>) {
    if (!this.connected) {
      throw new Error("Client is not connected");
    }
    return this.resources.callExtension(resourceName, params);
  }

  async dispose() {
    if (!this.connected) {
      throw new Error("Client is not connected");
    }
    this.ws.disconnect();
    await occupiedPort(this.port);
    this.connected = false;
  }
}
