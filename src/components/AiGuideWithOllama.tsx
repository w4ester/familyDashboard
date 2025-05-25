import React, { useState, useEffect } from 'react';
import { ollamaService, OllamaMessage } from '../services/ollama-service';
import { aiChoreToolkit, ChoreCreationRequest } from '../services/ai-chore-toolkit';

interface AiGuideProps {
  currentPage: string;
  userName?: string;
  familyMembers?: string[];
  onClose?: () => void;
  onChoreCreated?: (chores: ChoreCreationRequest[]) => void;
}

const AiGuideWithOllama: React.FC<AiGuideProps> = ({ 
  currentPage, 
  userName = 'Friend', 
  familyMembers = [],
  onClose,
  onChoreCreated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<OllamaMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama2');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [choreCreationMode, setChoreCreationMode] = useState(false);
  const [createdChores, setCreatedChores] = useState<ChoreCreationRequest[]>([]);

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
      // Check if this is a chore creation request
      const choreKeywords = ['chore', 'task', 'create', 'add', 'assign', 'point'];
      const isChoreRequest = choreKeywords.some(keyword => 
        userInput.toLowerCase().includes(keyword)
      );

      if (isChoreRequest && ollamaConnected && currentPage.includes('Chores')) {
        // Use AI Chore Toolkit
        const choreResponse = await aiChoreToolkit.createChoresFromText(
          userInput,
          familyMembers,
          [], // TODO: Pass existing chores
          selectedModel
        );

        setCreatedChores(choreResponse.chores);

        const assistantMessage: OllamaMessage = {
          role: 'assistant',
          content: `🎯 **Chore Creation Assistant**\n\n${choreResponse.explanation}\n\n**Created Chores:**\n${choreResponse.chores.map(c => 
            `• **${c.choreName}** ${c.assignedTo ? `for ${c.assignedTo}` : ''} - ${c.pointValue} points (${c.frequency})`
          ).join('\n')}\n\n${choreResponse.suggestions ? '**Suggestions:**\n' + choreResponse.suggestions.map(s => `💡 ${s}`).join('\n') : ''}\n\n*Would you like me to add these chores to your family dashboard?*`
        };

        setMessages([...updatedMessages, assistantMessage]);
        setChoreCreationMode(true);
        return;
      }

      if (ollamaConnected) {
        // Enhanced system prompt for family assistant
        const enhancedMessages: OllamaMessage[] = [
          {
            role: 'system',
            content: `You are Buddy, a friendly AI family assistant! 🤖✨

**Context:**
- Family: ${userName}'s family
- Members: ${familyMembers.join(', ') || 'Getting to know you!'}
- Current page: ${currentPage}
- I can help with: chores, homework, schedules, family activities

**Special Powers:**
- 🎯 Create chores with points (just ask "create chores for...")
- 📚 Help with homework organization
- 📅 Plan family activities
- 🏆 Track achievements and celebrate wins

Be enthusiastic, encouraging, and use emojis! Give specific, actionable advice.`
          },
          ...updatedMessages.slice(1) // Skip the original system message
        ];

        const response = await ollamaService.chat(enhancedMessages, {
          model: selectedModel,
          temperature: 0.8
        });

        const assistantMessage: OllamaMessage = {
          role: 'assistant',
          content: response
        };

        setMessages([...updatedMessages, assistantMessage]);
      } else {
        // Enhanced fallback response
        const fallbackMessage: OllamaMessage = {
          role: 'assistant',
          content: `Hi ${userName}! 🤖 I'm having trouble connecting to my AI brain right now, but I can still help! \n\nYou're on the ${currentPage} page. Here's what I can help with:\n\n🎯 **Chores & Points** - Track tasks and earn rewards!\n📚 **School Assignments** - Stay on top of homework\n📅 **Family Calendar** - Never miss important events\n🏫 **School Platforms** - Quick access to school sites\n\n*Try asking: "Help me create chores" or "How do I use the points system?"*`
        };

        setMessages([...updatedMessages, fallbackMessage]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: OllamaMessage = {
        role: 'assistant',
        content: '🤔 Oops! I had a little hiccup. Could you try asking that again?'
      };
      
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmChores = () => {
    if (onChoreCreated && createdChores.length > 0) {
      onChoreCreated(createdChores);
      
      const confirmMessage: OllamaMessage = {
        role: 'assistant',
        content: `🎉 **Success!** I've added ${createdChores.length} chores to your family dashboard!\n\nThey should appear in your chores list now. Great job setting up your family's task system! 💪`
      };
      
      setMessages([...messages, confirmMessage]);
      setChoreCreationMode(false);
      setCreatedChores([]);
    }
  };

  const handleCancelChores = () => {
    const cancelMessage: OllamaMessage = {
      role: 'assistant',
      content: `No problem! The chores weren't added. Feel free to ask me to create different chores anytime! 😊`
    };
    
    setMessages([...messages, cancelMessage]);
    setChoreCreationMode(false);
    setCreatedChores([]);
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

            {/* Chore Confirmation Buttons */}
            {choreCreationMode && createdChores.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-amber-800 font-semibold mb-3">🎯 Add these chores to your dashboard?</p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleConfirmChores}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center"
                  >
                    ✅ Yes, Add Chores
                  </button>
                  <button
                    onClick={handleCancelChores}
                    className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors flex items-center"
                  >
                    ❌ Cancel
                  </button>
                </div>
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