import React, { useState, useEffect } from 'react';
import { ollamaService, OllamaMessage } from '../services/ollama-service';

interface AiGuideProps {
  currentPage: string;
  userName?: string;
  familyMembers?: string[];
  onClose?: () => void;
}

const AiGuideWithOllama: React.FC<AiGuideProps> = ({ 
  currentPage, 
  userName = 'Friend', 
  familyMembers = [],
  onClose 
}) => {
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
        const models = await ollamaService.getModels();
        setAvailableModels(models);
        if (models.length > 0 && !models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      }
    };

    checkOllama();
    const interval = setInterval(checkOllama, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [selectedModel]);

  // Initialize conversation with system prompt
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const systemMessage: OllamaMessage = {
        role: 'system',
        content: `You are Buddy, a friendly AI assistant helping the ${userName} family use their dashboard. 
          Current page: ${currentPage}
          Family members: ${familyMembers.join(', ')}
          Be enthusiastic, use emojis, and explain things simply for both kids and adults.
          Always be encouraging and positive. Give specific, actionable advice.`
      };
      setMessages([systemMessage]);
    }
  }, [isOpen, userName, currentPage, familyMembers, messages.length]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

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
        // Use Ollama for response
        const response = await ollamaService.chat(updatedMessages, {
          model: selectedModel,
          temperature: 0.8
        });

        const assistantMessage: OllamaMessage = {
          role: 'assistant',
          content: response
        };

        setMessages([...updatedMessages, assistantMessage]);
      } else {
        // Fallback response when Ollama is not available
        const fallbackMessage: OllamaMessage = {
          role: 'assistant',
          content: `Hi ${userName}! 🤖 I'm having trouble connecting to my AI brain right now, but I can still help! 

            You're on the ${currentPage} page. Here are some tips:
            
            💡 **Chores**: Track your chores and earn points!
            📚 **Assignments**: Keep track of homework and due dates
            📅 **Calendar**: Never miss important family events
            🏫 **Platforms**: Quick access to school websites
            
            Is there something specific you'd like help with?`
        };

        setMessages([...updatedMessages, fallbackMessage]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: OllamaMessage = {
        role: 'assistant',
        content: 'Oops! I had a little hiccup. Could you try asking that again? 🤔'
      };
      
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating AI Buddy Button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full p-4 shadow-2xl hover:scale-105 transform transition-all"
        >
          <div className="flex items-center">
            <span className="text-3xl mr-2">🤖</span>
            <span className="text-lg font-bold">AI Help</span>
          </div>
        </button>
      )}

      {/* AI Guide Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-96 h-[600px] bg-white rounded-t-3xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-t-3xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-3xl mr-3">🤖</span>
                <div>
                  <h3 className="text-xl font-bold">Buddy AI</h3>
                  <p className="text-sm">
                    {ollamaConnected ? `Connected (${selectedModel})` : 'Offline Mode'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded p-1"
              >
                ✕
              </button>
            </div>

            {/* Model Selector */}
            {ollamaConnected && availableModels.length > 1 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="mt-2 bg-white/20 text-white rounded px-2 py-1 text-sm"
              >
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto h-[calc(100%-180px)]">
            {messages.filter(m => m.role !== 'system').map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                <p className="text-gray-500 mt-2">Thinking...</p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border-2 border-amber-300 rounded-full focus:border-amber-500 focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-full hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
            
            {!ollamaConnected && (
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Install Ollama for AI responses
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AiGuideWithOllama;