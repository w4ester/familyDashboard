/**
 * MCP Integration Service
 * Connects to various MCP servers for extended functionality
 */

// MCP Server configurations
const MCP_SERVERS = {
  filesystem: {
    url: 'http://localhost:3001', // mcp-server-filesystem
    name: 'filesystem'
  },
  memory: {
    url: 'http://localhost:3002', // mcp-server-memory
    name: 'memory'
  },
  github: {
    url: 'http://localhost:3003', // mcp-server-github
    name: 'github'
  },
  browser: {
    url: 'http://localhost:3004', // mcp-server-browser or puppeteer
    name: 'browser'
  }
};

// Generic MCP call function
async function callMcpServer(server: keyof typeof MCP_SERVERS, method: string, params: any = {}) {
  const serverConfig = MCP_SERVERS[server];
  
  try {
    const response = await fetch(serverConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return data.result;
  } catch (error) {
    console.error(`MCP ${server} error:`, error);
    return null;
  }
}

// Filesystem MCP functions
export const mcpFilesystem = {
  async readFile(path: string) {
    return callMcpServer('filesystem', 'tools/call', {
      name: 'read_file',
      arguments: { path }
    });
  },

  async writeFile(path: string, content: string) {
    return callMcpServer('filesystem', 'tools/call', {
      name: 'write_file',
      arguments: { path, content }
    });
  },

  async listDirectory(path: string) {
    return callMcpServer('filesystem', 'tools/call', {
      name: 'list_directory',
      arguments: { path }
    });
  }
};

// Memory MCP functions
export const mcpMemory = {
  async saveMemory(key: string, value: any) {
    return callMcpServer('memory', 'tools/call', {
      name: 'save_memory',
      arguments: { key, value: JSON.stringify(value) }
    });
  },

  async getMemory(key: string) {
    const result = await callMcpServer('memory', 'tools/call', {
      name: 'get_memory',
      arguments: { key }
    });
    
    return result ? JSON.parse(result.content[0].text) : null;
  },

  async searchMemories(query: string) {
    return callMcpServer('memory', 'tools/call', {
      name: 'search_memories',
      arguments: { query }
    });
  }
};

// GitHub MCP functions
export const mcpGitHub = {
  async createIssue(repo: string, title: string, body: string) {
    return callMcpServer('github', 'tools/call', {
      name: 'create_issue',
      arguments: { repo, title, body }
    });
  },

  async getIssues(repo: string) {
    return callMcpServer('github', 'tools/call', {
      name: 'list_issues',
      arguments: { repo }
    });
  },

  async createPR(repo: string, title: string, body: string, branch: string) {
    return callMcpServer('github', 'tools/call', {
      name: 'create_pull_request',
      arguments: { repo, title, body, head: branch }
    });
  }
};

// Browser/Puppeteer MCP functions
export const mcpBrowser = {
  async screenshot(url: string) {
    return callMcpServer('browser', 'tools/call', {
      name: 'screenshot',
      arguments: { url }
    });
  },

  async scrape(url: string, selector?: string) {
    return callMcpServer('browser', 'tools/call', {
      name: 'scrape',
      arguments: { url, selector }
    });
  },

  async navigate(url: string) {
    return callMcpServer('browser', 'tools/call', {
      name: 'navigate',
      arguments: { url }
    });
  }
};

// Combined service for easy access
export const mcpServices = {
  filesystem: mcpFilesystem,
  memory: mcpMemory,
  github: mcpGitHub,
  browser: mcpBrowser,
  
  // Check which servers are available
  async checkConnections() {
    const results: Record<string, boolean> = {};
    
    for (const [name, config] of Object.entries(MCP_SERVERS)) {
      try {
        const response = await fetch(config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/list'
          })
        });
        
        results[name] = response.ok;
      } catch (error) {
        results[name] = false;
      }
    }
    
    return results;
  }
};