// Application configuration management

export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  mcp: {
    serverUrl: string;
    apiKey?: string;
    enabled: boolean;
  };
  ai: {
    providers: {
      openai?: {
        apiKey: string;
        model: string;
      };
      claude?: {
        apiKey: string;
        model: string;
      };
      ollama?: {
        baseUrl: string;
        model: string;
      };
    };
    defaultProvider: 'openai' | 'claude' | 'ollama';
    maxTokens: number;
    temperature: number;
  };
  features: {
    chores: boolean;
    assignments: boolean;
    calendar: boolean;
    mealPlanning: boolean;
    rewards: boolean;
    ai: boolean;
    analytics: boolean;
  };
  storage: {
    type: 'localStorage' | 'mcp' | 'cloud';
    syncInterval: number;
    maxCacheSize: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    animations: boolean;
    compactMode: boolean;
  };
}

class ConfigurationManager {
  private config: AppConfig;
  private readonly defaults: AppConfig = {
    api: {
      baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
      timeout: 30000,
      retryAttempts: 3
    },
    mcp: {
      serverUrl: process.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:3001',
      apiKey: process.env.REACT_APP_MCP_API_KEY,
      enabled: true
    },
    ai: {
      providers: {
        openai: process.env.REACT_APP_OPENAI_API_KEY ? {
          apiKey: process.env.REACT_APP_OPENAI_API_KEY,
          model: 'gpt-4'
        } : undefined,
        claude: process.env.REACT_APP_CLAUDE_API_KEY ? {
          apiKey: process.env.REACT_APP_CLAUDE_API_KEY,
          model: 'claude-3-opus-20240229'
        } : undefined,
        ollama: {
          baseUrl: process.env.REACT_APP_OLLAMA_URL || 'http://localhost:11434',
          model: 'llama2'
        }
      },
      defaultProvider: 'ollama',
      maxTokens: 1024,
      temperature: 0.7
    },
    features: {
      chores: true,
      assignments: true,
      calendar: true,
      mealPlanning: false,
      rewards: false,
      ai: true,
      analytics: false
    },
    storage: {
      type: 'mcp',
      syncInterval: 30000,
      maxCacheSize: 10 * 1024 * 1024 // 10MB
    },
    ui: {
      theme: 'light',
      animations: true,
      compactMode: false
    }
  };

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    // Try to load from localStorage first
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        return this.mergeConfigs(this.defaults, parsed);
      } catch (error) {
        console.error('Error parsing saved config:', error);
      }
    }

    // Load from environment variables
    return this.defaults;
  }

  private mergeConfigs(defaults: any, overrides: any): any {
    const merged = { ...defaults };
    
    for (const key in overrides) {
      if (typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
        merged[key] = this.mergeConfigs(defaults[key] || {}, overrides[key]);
      } else {
        merged[key] = overrides[key];
      }
    }
    
    return merged;
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  getAll(): AppConfig {
    return { ...this.config };
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  update(updates: Partial<AppConfig>): void {
    this.config = this.mergeConfigs(this.config, updates);
    this.saveConfig();
  }

  private saveConfig(): void {
    localStorage.setItem('appConfig', JSON.stringify(this.config));
  }

  reset(): void {
    this.config = this.defaults;
    localStorage.removeItem('appConfig');
  }

  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  getApiUrl(path: string): string {
    const baseUrl = this.config.api.baseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  getMcpUrl(path: string): string {
    const baseUrl = this.config.mcp.serverUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
}

// Export singleton instance
export const config = new ConfigurationManager();

// Export convenience functions
export const getConfig = <K extends keyof AppConfig>(key: K): AppConfig[K] => config.get(key);
export const isFeatureEnabled = (feature: keyof AppConfig['features']): boolean => config.isFeatureEnabled(feature);
export const getApiUrl = (path: string): string => config.getApiUrl(path);
export const getMcpUrl = (path: string): string => config.getMcpUrl(path);
