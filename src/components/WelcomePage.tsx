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
  
  // Warm greeting messages
  const greetings = [
    "Welcome home to your family dashboard! 🏠",
    "Ready to bring your family together? 🤗",
    "Hello there, wonderful family! 💝",
    "Let's make family life a little easier! ✨"
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Warm Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent mb-4">
            Family Dashboard
          </h1>
          <p className="text-2xl text-gray-700 transition-all duration-1000">
            {currentGreeting}
          </p>
        </div>

        {/* Main Content Area */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Interactive Setup */}
          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              We'd love to get to know you! 
            </h2>
            
            {/* Avatar Selection */}
            <div className="mb-6">
              <p className="text-lg mb-3 text-gray-700">Pick your avatar:</p>
              <div className="grid grid-cols-5 gap-4">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`text-4xl p-3 rounded-xl transition-all duration-200 hover:bg-opacity-80 ${
                      selectedAvatar === avatar 
                        ? 'bg-amber-200 shadow-md' 
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
                className="w-full px-4 py-3 rounded-xl border-2 border-amber-300 focus:border-orange-500 text-lg focus:outline-none transition-colors"
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
                className="w-full px-4 py-3 rounded-xl border-2 border-amber-300 focus:border-orange-500 text-lg focus:outline-none transition-colors"
              />
            </div>

            {/* Get Started Button */}
            <button
              onClick={handleGetPersonalizedGuide}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xl py-4 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Let's get started together! {selectedAvatar}
            </button>
          </div>

          {/* Right Column - Features Preview */}
          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
              What Can You Do Here?
            </h2>

            {/* Feature Cards */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="text-3xl mr-3">🏆</span>
                  Chore Champions
                </h3>
                <p className="text-gray-700">Earn points for completing chores! Compete with family members and become the chore champion!</p>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-xl hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="text-3xl mr-3">📚</span>
                  Homework Helper
                </h3>
                <p className="text-gray-700">Never forget assignments again! Track due dates and get reminders for all your school work.</p>
              </div>

              <div className="bg-gradient-to-r from-rose-50 to-rose-100 p-4 rounded-xl hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="text-3xl mr-3">🎉</span>
                  Family Calendar
                </h3>
                <p className="text-gray-700">Keep track of birthdays, events, and special occasions all in one colorful calendar!</p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl hover:shadow-md transition-shadow duration-200">
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
          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-lg p-8 mb-8 transition-all duration-500 ease-in-out">
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
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-2xl px-12 py-6 rounded-full hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Using Dashboard! 🚀
          </button>
        </div>

        {/* Gentle Floating Elements */}
        <div className="fixed top-20 right-10 text-6xl opacity-40 hover:opacity-70 transition-opacity duration-500">🎈</div>
        <div className="fixed bottom-20 left-10 text-6xl opacity-40 hover:opacity-70 transition-opacity duration-500">⭐</div>
        <div className="fixed top-40 left-20 text-5xl opacity-40 hover:opacity-70 transition-opacity duration-500">🌈</div>
      </div>

    </div>
  );
};

export default WelcomePage;