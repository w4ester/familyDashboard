import React, { useState, useEffect } from 'react';
// Import for OpenAI API - will be created
// import { openaiApi } from '../services/openai-api';

interface WelcomePageProps {
  onGetStarted: () => void;
  familyMembers: string[];
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted, familyMembers }) => {
  const [showGuide, setShowGuide] = useState(false);
  const [guideMessage, setGuideMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  
  // Avatar options for kids
  const avatarOptions = ['🦁', '🐙', '🦄', '🐸', '🦕', '🐛', '🦋', '🐠', '🐢', '🐨'];
  
  // Fun greeting messages
  const greetings = [
    "Welcome to your amazing family dashboard! 🎉",
    "Ready for some family fun? 🌟",
    "Hello there, awesome family! 👋",
    "Time to organize and have fun together! 🎈"
  ];

  const [currentGreeting, setCurrentGreeting] = useState(greetings[0]);

  useEffect(() => {
    // Rotate greetings every 3 seconds
    const interval = setInterval(() => {
      setCurrentGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleGetPersonalizedGuide = async () => {
    if (!userName.trim()) {
      setGuideMessage("Hi there! I'd love to help you get started! What's your name?");
      return;
    }

    setIsLoading(true);
    setShowGuide(true);

    try {
      const ageInfo = userAge ? `I'm ${userAge} years old.` : '';
      const prompt = `My name is ${userName}. ${ageInfo} I'm new to the family dashboard. Can you give me a fun, friendly introduction to what I can do here? Keep it simple and exciting!`;
      
      const systemPrompt = `You are a friendly family assistant helping someone use the family dashboard for the first time. 
Be warm, encouraging, and explain things in a way that both kids and adults can understand. 
Use emojis and keep it conversational. Mention these features briefly:
- Chore tracking with points (like a game!)
- Calendar for family events
- School assignments helper
- File storage for important stuff
- Fun AI features to help plan activities`;

      // const response = await openaiApi.chatCompletion({
      //   prompt,
      //   system_prompt: systemPrompt,
      //   temperature: 0.9
      // });
      
      // For now, use a fallback message
      const response = { content: `Hi ${userName}! 🎉 Welcome to your Family Dashboard!\n\nI'm so excited to help you get started! Here's what makes this place special:\n\n🏆 **Chore Champions**: Complete chores and earn points - it's like a fun game where everyone wins!\n📚 **Homework Helper**: Never forget an assignment again - I'll help you stay on top of school work!\n📅 **Family Calendar**: Keep track of all the fun events and important dates!\n🤖 **And me, your AI buddy**: I'm here whenever you need help or want to discover new features!\n\nReady to start your family adventure? Click the big button below and let's make organizing fun! 🚀` };

      setGuideMessage(response.content);
    } catch (error) {
      setGuideMessage("Hi there! I'm your family assistant! 🎉 Let me show you around:\n\n" +
        "📋 Track chores and earn points - it's like a fun game!\n" +
        "📅 Keep all your family events in one place\n" +
        "📚 Never forget homework with our assignment tracker\n" +
        "📁 Store important family files safely\n" +
        "🤖 And I'm here to help suggest fun activities!\n\n" +
        "Ready to get started? Click the big button below!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Animated Header */}
        <div className="text-center mb-8 animate-bounce">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Family Dashboard
          </h1>
          <p className="text-2xl text-gray-700 animate-pulse">
            {currentGreeting}
          </p>
        </div>

        {/* Main Content Area */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Interactive Setup */}
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform">
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              Let's Get to Know You! 
            </h2>
            
            {/* Avatar Selection */}
            <div className="mb-6">
              <p className="text-lg mb-3 text-gray-700">Pick your avatar:</p>
              <div className="grid grid-cols-5 gap-4">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`text-4xl p-3 rounded-xl transition-all transform hover:scale-110 ${
                      selectedAvatar === avatar 
                        ? 'bg-blue-200 shadow-lg scale-110' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-lg mb-2 text-gray-700">What's your name?</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-300 focus:border-purple-500 text-lg"
              />
            </div>

            {/* Age Input (Optional) */}
            <div className="mb-6">
              <label className="block text-lg mb-2 text-gray-700">How old are you? (optional)</label>
              <input
                type="number"
                value={userAge}
                onChange={(e) => setUserAge(e.target.value)}
                placeholder="Your age..."
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-300 focus:border-purple-500 text-lg"
              />
            </div>

            {/* Get Started Button */}
            <button
              onClick={handleGetPersonalizedGuide}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-lg"
            >
              Get My Personal Guide! {selectedAvatar}
            </button>
          </div>

          {/* Right Column - Features Preview */}
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
              What Can You Do Here?
            </h2>

            {/* Feature Cards */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl transform hover:scale-105 transition-transform">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="text-3xl mr-3">🏆</span>
                  Chore Champions
                </h3>
                <p className="text-gray-700">Earn points for completing chores! Compete with family members and become the chore champion!</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl transform hover:scale-105 transition-transform">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="text-3xl mr-3">📚</span>
                  Homework Helper
                </h3>
                <p className="text-gray-700">Never forget assignments again! Track due dates and get reminders for all your school work.</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl transform hover:scale-105 transition-transform">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="text-3xl mr-3">🎉</span>
                  Family Calendar
                </h3>
                <p className="text-gray-700">Keep track of birthdays, events, and special occasions all in one colorful calendar!</p>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl transform hover:scale-105 transition-transform">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="text-3xl mr-3">🤖</span>
                  AI Assistant
                </h3>
                <p className="text-gray-700">Get fun activity suggestions and help organizing your family's busy schedule!</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Guide Response */}
        {showGuide && (
          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 mb-8 animate-fadeIn">
            <div className="flex items-start mb-4">
              <div className="text-5xl mr-4">🤖</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Your Personal Family Assistant</h3>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mr-4"></div>
                    <p className="text-lg text-gray-600">Creating your personalized guide...</p>
                  </div>
                ) : (
                  <div className="prose prose-lg">
                    <p className="whitespace-pre-line text-gray-700">{guideMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Start Dashboard Button */}
        <div className="text-center">
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-2xl px-12 py-6 rounded-full hover:from-green-600 hover:to-blue-600 transform hover:scale-110 transition-all shadow-2xl animate-pulse"
          >
            Start Using Dashboard! 🚀
          </button>
        </div>

        {/* Floating Fun Elements */}
        <div className="fixed top-20 right-10 text-6xl animate-float">🎈</div>
        <div className="fixed bottom-20 left-10 text-6xl animate-float-delayed">⭐</div>
        <div className="fixed top-40 left-20 text-5xl animate-float">🌈</div>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 3s ease-in-out infinite;
          animation-delay: 1.5s;
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;