import React, { useState, useEffect, useRef } from 'react';
import { familyMemoryService } from '../services/family-memory';
import { FamilyContext, AIMessage, FamilyMemory } from '../core/models/family-memory';

interface FamilyAIProps {
  familyId: string;
  userId: string;
  userName?: string;
  onMemoryCreated?: (memory: FamilyMemory) => void;
}

interface ConversationState {
  messages: AIMessage[];
  isLoading: boolean;
  context: Partial<FamilyContext>;
}

const FamilyAI: React.FC<FamilyAIProps> = ({ 
  familyId, 
  userId, 
  userName = 'Family Member',
  onMemoryCreated 
}) => {
  const [conversation, setConversation] = useState<ConversationState>({
    messages: [],
    isLoading: false,
    context: {}
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFamilyContext();
    setupMemoryListeners();
  }, [familyId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const loadFamilyContext = async () => {
    try {
      const context = await familyMemoryService.getFamilyContext(familyId, userId);
      setConversation(prev => ({ ...prev, context }));
    } catch (error) {
      console.error('Failed to load family context:', error);
    }
  };

  const setupMemoryListeners = () => {
    familyMemoryService.on('memoryStored', (memory: FamilyMemory) => {
      if (memory.familyId === familyId && onMemoryCreated) {
        onMemoryCreated(memory);
      }
    });

    familyMemoryService.on('milestoneAchieved', ({ memory, insight }) => {
      if (memory.familyId === familyId) {
        addSystemMessage(`🎉 Family milestone: ${memory.content}`);
      }
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || conversation.isLoading) return;

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      familyContext: conversation.context
    };

    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true
    }));

    setInputMessage('');

    try {
      // Generate AI response with family context
      const aiResponse = await generateAIResponse(userMessage, conversation.context);
      
      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, aiResponse],
        isLoading: false
      }));

      // Learn from the interaction
      await learnFromInteraction(userMessage, aiResponse);

    } catch (error) {
      console.error('AI response failed:', error);
      const errorMessage: AIMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble right now, but I'm still here to help! Try asking me something else.",
        timestamp: new Date().toISOString()
      };

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false
      }));
    }
  };

  const generateAIResponse = async (userMessage: AIMessage, context: Partial<FamilyContext>): Promise<AIMessage> => {
    // This would integrate with your AI service (Ollama, OpenAI, etc.)
    // For now, we'll create a smart context-aware response

    const relatedMemories = await familyMemoryService.searchMemories(familyId, {
      query: userMessage.content,
      limit: 5
    });

    let responseContent = '';
    const metadata: any = {
      confidence: 0.8,
      sources: relatedMemories,
      relatedKnowledge: []
    };

    // Context-aware responses
    if (userMessage.content.toLowerCase().includes('chore')) {
      responseContent = await generateChoreResponse(userMessage, context, relatedMemories);
    } else if (userMessage.content.toLowerCase().includes('homework') || userMessage.content.toLowerCase().includes('school')) {
      responseContent = await generateEducationResponse(userMessage, context, relatedMemories);
    } else if (userMessage.content.toLowerCase().includes('schedule') || userMessage.content.toLowerCase().includes('calendar')) {
      responseContent = await generateScheduleResponse(userMessage, context, relatedMemories);
    } else {
      responseContent = await generateGeneralResponse(userMessage, context, relatedMemories);
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
      familyContext: context,
      metadata
    };
  };

  const generateChoreResponse = async (message: AIMessage, context: Partial<FamilyContext>, memories: FamilyMemory[]): Promise<string> => {
    const choreMemories = memories.filter(m => m.category === 'chores');
    
    if (message.content.toLowerCase().includes('help') || message.content.toLowerCase().includes('suggest')) {
      return `Based on your family's patterns, here are some chore suggestions:\n\n• Morning tasks work best for your family\n• ${userName} seems to prefer organizing tasks\n• Consider rotating weekly cleaning duties\n\nWould you like me to help set up a chore schedule?`;
    }

    return `I can help with chores! I've noticed your family has completed ${choreMemories.length} chores recently. What would you like to know about managing household tasks?`;
  };

  const generateEducationResponse = async (message: AIMessage, context: Partial<FamilyContext>, memories: FamilyMemory[]): Promise<string> => {
    const schoolMemories = memories.filter(m => m.category === 'school');
    
    return `I'm here to help with education! I can:\n\n• Help break down assignments into manageable steps\n• Suggest study schedules based on your family's routine\n• Track learning progress across subjects\n• Provide age-appropriate explanations\n\nWhat subject or assignment would you like help with?`;
  };

  const generateScheduleResponse = async (message: AIMessage, context: Partial<FamilyContext>, memories: FamilyMemory[]): Promise<string> => {
    return `I can help optimize your family schedule! Based on your patterns:\n\n• Your family is most active in the mornings\n• Weekends work well for family activities\n• Everyone seems to prefer structured routines\n\nWhat would you like to schedule or reorganize?`;
  };

  const generateGeneralResponse = async (message: AIMessage, context: Partial<FamilyContext>, memories: FamilyMemory[]): Promise<string> => {
    return `Hi ${userName}! I'm your family's AI assistant. I remember our conversations and learn about your family's preferences over time.\n\nI can help with:\n• 🏠 Household management and chores\n• 📚 School assignments and learning\n• 📅 Family scheduling and activities\n• 🎯 Goal setting and tracking\n• 🎉 Celebrating achievements\n\nWhat would you like to work on today?`;
  };

  const learnFromInteraction = async (userMessage: AIMessage, aiResponse: AIMessage) => {
    // Store conversation and extract knowledge
    const memory = await familyMemoryService.storeMemory({
      content: `${userName} asked: "${userMessage.content}" - AI helped with: ${aiResponse.content.substring(0, 100)}...`,
      category: 'general',
      tags: ['ai-conversation', 'help'],
      relatedMembers: [userId],
      privacy: 'family'
    }, familyId, userId);

    // Update context for future conversations
    await loadFamilyContext();
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: AIMessage = {
      id: `sys_${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, systemMessage]
    }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
      >
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🤖</span>
          <span className="font-medium">Family AI</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-96 bg-white rounded-lg shadow-xl border border-amber-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="font-semibold">Family AI Assistant</h3>
            <p className="text-xs opacity-90">Powered by your family's data</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-amber-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <span className="text-4xl mb-2 block">👋</span>
            <p>Hi {userName}! I'm your family's AI assistant.</p>
            <p className="text-sm mt-1">Ask me anything about your family's activities!</p>
          </div>
        )}

        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-amber-500 text-white'
                  : message.role === 'system'
                  ? 'bg-rose-100 text-rose-800 text-sm'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-line">{message.content}</p>
              {message.metadata?.sources && message.metadata.sources.length > 0 && (
                <div className="text-xs mt-1 opacity-75">
                  💭 Remembering {message.metadata.sources.length} family moment{message.metadata.sources.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ))}

        {conversation.isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your family..."
            className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
            disabled={conversation.isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || conversation.isLoading}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default FamilyAI;