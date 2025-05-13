import React, { useState, useEffect } from 'react';
// Import for OpenAI API - will be created
// import { openaiApi } from '../services/openai-api';

interface AiGuideProps {
  currentPage: string;
  userName?: string;
  familyMembers?: string[];
  onClose?: () => void;
}

const AiGuide: React.FC<AiGuideProps> = ({ 
  currentPage, 
  userName = 'Friend', 
  familyMembers = [],
  onClose 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [isMiniMode, setIsMiniMode] = useState(false);
  
  // Guide avatar states for animation
  const [currentExpression, setCurrentExpression] = useState('😊');
  const expressions = ['😊', '🤔', '🎉', '💡', '🌟'];
  
  // Page-specific help templates
  const pageHelp = {
    'chores': {
      title: 'Chore Champions',
      tips: [
        'Track your chores and earn points!',
        'Complete more chores to become the family champion',
        'Different chores have different point values'
      ]
    },
    'assignments': {
      title: 'Homework Helper',
      tips: [
        'Add all your school assignments here',
        'Mark them complete when done',
        'Use colors for different subjects'
      ]
    },
    'calendar': {
      title: 'Family Calendar',
      tips: [
        'Add important family events',
        'Never miss a birthday or appointment',
        'Color-code events by family member'
      ]
    },
    'files': {
      title: 'File Gallery',
      tips: [
        'Store important family documents',
        'Upload photos and memories',
        'Organize files by categories'
      ]
    },
    'platforms': {
      title: 'School Platforms',
      tips: [
        'Quick access to all school websites',
        'Keep login info secure',
        'Customize with your school links'
      ]
    }
  };

  useEffect(() => {
    // Animate expressions
    const interval = setInterval(() => {
      setCurrentExpression(expressions[Math.floor(Math.random() * expressions.length)]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate initial help message based on current page
    if (isOpen && !message && currentPage) {
      generatePageHelp();
    }
  }, [isOpen, currentPage]);

  const generatePageHelp = async () => {
    setIsLoading(true);
    const pageInfo = pageHelp[currentPage] || { title: 'Dashboard', tips: [] };
    
    try {
      const prompt = `I'm ${userName} on the ${pageInfo.title} page. Give me a fun, encouraging introduction to this feature in 2-3 sentences. Include one specific tip.`;
      
      // const response = await openaiApi.chatCompletion({
      //   prompt,
      //   system_prompt: `You are Buddy, a friendly AI assistant who helps families use their dashboard. 
      // Be enthusiastic, use emojis, and explain things simply for both kids and adults.
      // Always be encouraging and positive.`,
      //   temperature: 0.9
      // });
      
      // For now, use a fallback response
      const response = { content: `Hi ${userName}! ${currentExpression} Welcome to ${pageInfo.title}!\n\n${pageInfo.tips[0]}\n\nHere's a pro tip: ${pageInfo.tips[1] || 'Explore all the features to get the most out of this page!'}\n\nNeed help with anything specific? Just ask me! 🚀` };
      
      setMessage(response.content);
    } catch (error) {
      // Fallback message
      setMessage(`Hi ${userName}! ${currentExpression} Welcome to ${pageInfo.title}! ${pageInfo.tips[0]} Need help with anything specific?`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;
    
    setIsLoading(true);
    try {
      const context = `User is on the ${currentPage} page of the family dashboard. Family members: ${familyMembers.join(', ')}`;
      const prompt = `${userName} asks: "${userQuestion}". ${context}`;
      
      // const response = await openaiApi.chatCompletion({
      //   prompt,
      //   system_prompt: `You are Buddy, a helpful AI assistant for a family dashboard. 
      // Answer questions clearly and helpfully, keeping responses brief and friendly.
      // Use emojis and simple language suitable for both kids and adults.`,
      //   temperature: 0.8
      // });
      
      // For now, use a fallback response
      const response = { content: `Great question, ${userName}! 🌟\n\nBased on what you asked about "${userQuestion}", here's my advice:\n\nThis feature helps you ${pageInfo.tips[0].toLowerCase()} You can also ${pageInfo.tips[1]?.toLowerCase() || 'explore more options in the menu'}\n\nIs there anything else you'd like to know? I'm here to help! 😊` };
      
      setMessage(response.content);
      setUserQuestion('');
    } catch (error) {
      setMessage("I'm having trouble connecting right now, but I'm still here to help! What would you like to know?");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !message) {
      generatePageHelp();
    }
  };

  const toggleMiniMode = () => {
    setIsMiniMode(!isMiniMode);
  };

  return (
    <>
      {/* Floating AI Buddy Button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-4 shadow-2xl hover:scale-110 transform transition-all animate-bounce"
        >
          <div className="flex items-center">
            <span className="text-3xl mr-2">{currentExpression}</span>
            <span className="text-lg font-bold">Need Help?</span>
          </div>
        </button>
      )}

      {/* AI Guide Panel */}
      {isOpen && (
        <div className={`fixed ${isMiniMode ? 'bottom-4 right-4 w-80' : 'bottom-0 right-0 w-96 h-96'} bg-white rounded-t-3xl shadow-2xl transform transition-all ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-t-3xl flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{currentExpression}</span>
              <div>
                <h3 className="text-xl font-bold">Hi, I'm Buddy!</h3>
                <p className="text-sm">Your AI Helper</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={toggleMiniMode}
                className="text-white hover:bg-white/20 rounded p-1"
              >
                {isMiniMode ? '⬆️' : '⬇️'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded p-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMiniMode && (
            <div className="p-4 h-full flex flex-col">
              {/* Message Display */}
              <div className="flex-1 overflow-y-auto mb-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-2xl p-4 mb-4">
                    <p className="text-gray-800 whitespace-pre-line">{message}</p>
                  </div>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setUserQuestion("How do I use this page?")}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  📖 How to use
                </button>
                <button
                  onClick={() => setUserQuestion("Show me tips")}
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  💡 Pro tips
                </button>
                <button
                  onClick={() => setUserQuestion("What's fun here?")}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  🎮 Fun features
                </button>
                <button
                  onClick={() => setUserQuestion("Help me start")}
                  className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  🚀 Get started
                </button>
              </div>

              {/* Question Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2 border-2 border-purple-300 rounded-full focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={handleAskQuestion}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  Ask
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AiGuide;