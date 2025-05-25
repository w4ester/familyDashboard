import React, { useState, useEffect } from 'react';
import { ollamaService, OllamaMessage } from '../services/ollama-service';
import { familyToolsAPI } from '../services/family-tools-api';

interface AiGuidePierupProps {
  currentPage: string;
  userName?: string;
  familyMembers?: string[];
  onClose?: () => void;
  onStateUpdate?: (updates: any) => void;
}

function AiGuidePierup({ 
  currentPage, 
  userName = 'Friend', 
  familyMembers = [],
  onClose,
  onStateUpdate
}: AiGuidePierupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<OllamaMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama2');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Check Ollama connection
  useEffect(() => {
    const checkOllama = async () => {
      const connected = await ollamaService.checkConnection();
      setOllamaConnected(connected);
      
      if (connected) {
        const models = await ollamaService.listModels();
        setAvailableModels(models);
        if (models.length > 0 && !models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      }
    };

    checkOllama();
    const interval = setInterval(checkOllama, 30000);
    return () => clearInterval(interval);
  }, [selectedModel]);

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const systemMessage: OllamaMessage = {
        role: 'system',
        content: `You are Buddy, a friendly AI assistant helping the ${userName} family use their dashboard. 
          Current page: ${currentPage}
          Family members: ${familyMembers.join(', ')}
          
          You have access to these tools:
          - create_chore: Create chores with points
          - create_calendar_event: Add events to the calendar
          - create_assignment: Add school assignments
          - add_family_member: Add new family members
          
          IMPORTANT: When a user asks to create something, I will parse their request and call the appropriate tool.
          The user should use natural language like:
          - "Create a chore for Dado to unload dishes worth 5 points"
          - "Add dentist appointment for Lily on 2025-05-25 at 2:30pm"
          - "Create math homework for Abel due tomorrow"
          
          You should acknowledge their request and explain what will happen.`
      };
      setMessages([systemMessage]);
    }
  }, [isOpen, userName, currentPage, familyMembers]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (onClose && isOpen) {
      onClose();
    }
  };

  const executeTool = async (toolName: string, args: any) => {
    console.log('🔧 Executing tool via API:', toolName, args);
    
    const response = await familyToolsAPI.executeTool({
      toolName,
      parameters: args
    });

    if (response.success && response.stateUpdates && onStateUpdate) {
      // Update the parent component's state with the new data
      onStateUpdate(response.stateUpdates);
    }

    return response;
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const userMessage: OllamaMessage = {
      role: 'user',
      content: userInput
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      if (ollamaConnected) {
        // Use function calling
        const toolMessages = [
          ...updatedMessages,
          {
            role: 'system' as const,
            content: 'Use the available tools to help the user. Always confirm what you did after using a tool.'
          }
        ];

        // For now, use regular chat and parse for tool requests
        const response = await ollamaService.chat(toolMessages, {
          model: selectedModel,
          temperature: 0.7
        });

        // Parse the user's request to find tool actions
        let toolExecuted = false;
        const lowerInput = userInput.toLowerCase();

        // Better pattern matching for chore creation
        const chorePatterns = [
          /create\s+(?:a\s+)?chore\s+for\s+(\w+)\s+to\s+(.+?)\s+worth\s+(\d+)\s+points?/i,
          /(?:add|create)\s+(?:a\s+)?chore\s+"([^"]+)"\s+for\s+(\w+)(?:\s+worth\s+(\d+)\s+points?)?/i,
          /(\w+)\s+(?:should|needs to)\s+(.+?)(?:\s+for\s+(\d+)\s+points?)?/i
        ];

        for (const pattern of chorePatterns) {
          const match = userInput.match(pattern);
          if (match) {
            // Reorder based on which pattern matched
            let person, choreName, points;
            if (pattern === chorePatterns[0]) {
              [, person, choreName, points] = match;
            } else if (pattern === chorePatterns[1]) {
              [, choreName, person, points] = match;
            } else {
              [, person, choreName, points] = match;
            }
            
            const result = await executeTool('create_chore', {
              choreName: choreName.trim(),
              assignedTo: person,
              points: parseInt(points) || 2
            });
            
            toolExecuted = true;
            const message = result.success 
              ? `✅ Created chore "${choreName}" for ${person} (${result.result?.points || points} points)`
              : `❌ Failed to create chore: ${result.error}`;
              
            setMessages([...updatedMessages, {
              role: 'assistant',
              content: message
            }]);
            break;
          }
        }
        
        // Check for calendar event
        if (!toolExecuted && lowerInput.includes('add') && (lowerInput.includes('appointment') || lowerInput.includes('event'))) {
          const eventMatch = userInput.match(/(.+?)\s+for\s+(\w+)\s+on\s+(\S+)(?:\s+at\s+(\S+))?/i);
          
          if (eventMatch) {
            const title = eventMatch[1].replace(/add|appointment|event/gi, '').trim();
            const person = eventMatch[2];
            const date = eventMatch[3];
            const time = eventMatch[4] || '';
            
            const result = await executeTool('create_calendar_event', {
              title,
              date,
              time,
              person
            });
            
            toolExecuted = true;
            const message = result.success 
              ? `📅 Added "${title}" for ${person} on ${date}`
              : `❌ Failed to create event: ${result.error}`;
              
            setMessages([...updatedMessages, {
              role: 'assistant',
              content: message
            }]);
          }
        }
        
        // If no tool was executed, just show the LLM response
        if (!toolExecuted) {
          setMessages([...updatedMessages, {
            role: 'assistant',
            content: response
          }]);
        }
      } else {
        // Ollama not connected
        const assistantMessage: OllamaMessage = {
          role: 'assistant',
          content: '🔌 Ollama is not connected. Please make sure Ollama is running on your computer.'
        };
        setMessages([...updatedMessages, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: OllamaMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.'
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* AI Guide Button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 z-50"
        title="AI Family Guide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {/* AI Guide Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-end p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Buddy - AI Family Assistant</h3>
                <p className="text-sm opacity-90">Powered by PierUP-style Tools</p>
              </div>
              <button
                onClick={handleToggle}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Connection Status */}
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${ollamaConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {ollamaConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {ollamaConnected && availableModels.length > 0 && (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.slice(1).map((message, index) => (
                <div
                  key={index}
                  className={`${
                    message.role === 'user' 
                      ? 'ml-auto bg-orange-100 text-gray-800' 
                      : 'mr-auto bg-gray-100 text-gray-800'
                  } max-w-[80%] p-3 rounded-lg`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="mr-auto bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                  placeholder="Ask me to create chores, events, or assignments..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !userInput.trim()}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Try: "Create a chore for Dado to unload dishes worth 5 points"
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AiGuidePierup;