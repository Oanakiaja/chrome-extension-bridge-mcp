const RPCErrorCodes = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  ServerError: -32000,
}


const MCPCallTag= {
  Tool: 'mcp:tool',
  Resource: 'mcp:resource',
}


/**
 * @typedef {Object} RPCError
 * @property {string} message
 * @property {string} code
 * @property {object} data
 */
class RPCError extends Error {
  message;
  code;
  data;

  /**
   * @param {string} message
   * @param {string} code
   * @param {object} data
   */
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
  }

  /**
   * @returns {string}
   */
  toString() {
    return `${this.code}: ${this.message}: ${this.data}`;
  }

  /**
   * @returns {object}
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      data: this.data
    };
  }
}

/**
 * @typedef {Object} RPCResponse
 * @property {string} id
 * @property {object} result
 */
class RPCResponse {
  id;
  result;

  constructor(id, result) {
    this.id = id;
    this.result = result;
  }

  /**
   * @returns {string}
   */
  toString() {
    return `${this.id}: ${this.result}`;
  }

  /**
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      result: this.result || '' // 如果 result 为 undefined，则返回空字符串, JSONRPC required
    };
  }
}

class WS {
  /**
   * @type {WebSocket}
   */
  _ws;
  _retries = 0;
  _maxRetries = 3;

  /**
   * Connect to the MCP server
   * @param {string} url - The URL of the MCP server
   */
  connect(url) {
    this._ws = new WebSocket(url);
    this._ws.onopen = () => {
      console.log('connected to MCP server', url);
    } 
    this._ws.onmessage = async (event) => {
      try {
        console.log('收到服务器响应:', event);
        const { id, method, params } = JSON.parse(event.data);
        const res = await this.handle(method, params);
        this.response(id, res);
      } catch (e) {
        console.error(e);
        this.error(null, e instanceof RPCError ? e : new RPCError(RPCErrorCodes.InternalError, e.message, e));
      }    
    }

    this._ws.onerror = (event) => {
      if (this._retries < this._maxRetries) {
        this._retries++;
        setTimeout(() => {
          this._ws = new WebSocket(url);
        }, this._retries * 1000);
      } else {
        this.error(null, new RPCError(RPCErrorCodes.InternalError, event.message));
      }
    }
  }

  disconnect() {
    this._ws.close();
  }
  
  /**
   * handle MCP server request
   * @param {string} method - method path, format as "object.innerObject.func" or "object.innerObject.attribute"
   * @param {Array} params - parameters array
   * @returns {Promise<any>} method execution result or attribute value
   */
  async handle(method, params = []) {
    try {
      const parts = method.split('.');
      const mcpMethod = parts.shift();
      let current = window;
      let i = 0;
      // mcp:resource.navigator.userAgent
      
      while (i < parts.length - 1) {
        const part = parts[i];
        if (!current[part]) {
          throw new RPCError(
            RPCErrorCodes.MethodNotFound,
            `Object '${parts.slice(0, i + 1).join('.')}' not found in context`,
            { path: parts.slice(0, i + 1).join('.') }
          );
        }
        current = current[part];
        i++;
      }
      
      const lastPart = parts[parts.length - 1];
      const target = current[lastPart];
      
      // resource Return value
      if (mcpMethod === MCPCallTag.Resource) {
        if (target === undefined) {
          throw new RPCError(
            RPCErrorCodes.MethodNotFound,
            `Resource '${method}' not found`,
            { method }
          );
        }
        return target;
      }
      
      if(mcpMethod === MCPCallTag.Tool) {
        if (typeof target !== 'function') {
          throw new RPCError(
            RPCErrorCodes.MethodNotFound,
            `Method '${method}' is not a function`,
            { method }
          );
        }
        
        return await target.apply(current, params);
      } 

      throw new RPCError(
        RPCErrorCodes.MethodNotFound,
        `Method '${method}' is not a valid type`,
        { method }
      );

    } catch (error) {
      if (error instanceof RPCError) {
        throw error;
      }
      
      throw new RPCError(
        RPCErrorCodes.InternalError,
        `Error processing '${method}': ${error.message}`,
        { method, error: error.message }
      );
    }
  }

  /**
   * send success response
   * @param {string} id - request id
   * @param {any} result - response result
   */
  response(id, result) {
    console.log('发送成功响应:', id, result);
    const response = new RPCResponse(id, result);
    this._ws.send(JSON.stringify(response.toJSON()));
  }

  /**
   * send error response
   * @param {string} id - request id
   * @param {RPCError} error - error object
   */
  error(id, error) {
    console.error('error', id, error);
    this._ws.send(JSON.stringify({ id, error: error.toJSON() }));
  } 
}

// 立即执行的调试代码
(function debugExtension() {
  console.log('扩展内容脚本加载 - 时间:', new Date().toISOString());
  document.addEventListener('DOMContentLoaded', () => {
    console.log('页面 DOM 已加载 - URL:', window.location.href);
  });
  
  // 创建一个视觉元素确认扩展正在运行
  try {
    const debugElement = document.createElement('div');
    debugElement.style.position = 'fixed';
    debugElement.style.top = '10px';
    debugElement.style.right = '10px';
    debugElement.style.zIndex = '9999';
    debugElement.style.background = 'rgba(255,0,0,0.3)';
    debugElement.style.padding = '5px';
    debugElement.style.borderRadius = '3px';
    debugElement.style.fontSize = '12px';
    debugElement.textContent = 'MCP扩展已加载';
    
    // 等待DOM准备好
    if (document.body) {
      document.body.appendChild(debugElement);
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(debugElement);
      });
    }
  } catch (e) {
    console.error('创建调试元素失败:', e);
  }
})();

console.log('McpExtensionClient');
const McpExtensionClient = new WS();
McpExtensionClient.connect('ws://localhost:54319');
window.McpExtensionClient = McpExtensionClient;
console.log('McpExtensionClient Established');
console.log(McpExtensionClient)