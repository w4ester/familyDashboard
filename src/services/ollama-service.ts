/**
 * Ollama Service for AI Integration
 * Connects to local Ollama instance for LLM capabilities
 */

const OLLAMA_API_URL = 'http://localhost:11434/api';

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaOptions {
  model?: string;
  temperature?: number;
  stream?: boolean;
}

class OllamaService {
  private defaultModel = 'llama2'; // Change to your preferred model

  /**
   * Check if Ollama is running
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama not available:', error);
      return false;
    }
  }

  /**
   * Get list of available models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/tags`);
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Generate a completion
   */
  async generate(prompt: string, options: OllamaOptions = {}): Promise<string> {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7
          }
        })
      });

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error generating completion:', error);
      throw error;
    }
  }

  /**
   * Chat with the model (maintains context)
   */
  async chat(messages: OllamaMessage[], options: OllamaOptions = {}): Promise<string> {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages,
          stream: false,
          options: {
            temperature: options.temperature || 0.7
          }
        })
      });

      const data = await response.json();
      return data.message.content;
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings
   */
  async embeddings(prompt: string, options: OllamaOptions = {}): Promise<number[]> {
    try {
      const response = await fetch(`${OLLAMA_API_URL}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          prompt
        })
      });

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }
}

export const ollamaService = new OllamaService();