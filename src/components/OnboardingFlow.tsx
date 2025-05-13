import React, { useState } from 'react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  action?: () => void;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onAddFamilyMember: (name: string, age?: number) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onAddFamilyMember }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [familyName, setFamilyName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberAge, setMemberAge] = useState('');
  const [memberRole, setMemberRole] = useState('child');
  const [addedMembers, setAddedMembers] = useState<Array<{name: string, age?: number, role: string}>>([]);
  
  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: "Welcome to Your Family Dashboard! 🏠",
      description: "Let's set up your family's command center in just a few fun steps!",
      icon: "🎉"
    },
    {
      id: 1,
      title: "Name Your Family 👨‍👩‍👧‍👦",
      description: "Give your family a fun name! It could be your last name or something creative!",
      icon: "✏️"
    },
    {
      id: 2,
      title: "Add Family Members 👥",
      description: "Who's in your awesome family? Add everyone who'll use the dashboard!",
      icon: "➕"
    },
    {
      id: 3,
      title: "You're All Set! 🚀",
      description: "Your family dashboard is ready! Let's start organizing and having fun!",
      icon: "🎯"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddMember = () => {
    if (memberName.trim()) {
      const newMember = {
        name: memberName,
        age: memberAge ? parseInt(memberAge) : undefined,
        role: memberRole
      };
      
      setAddedMembers([...addedMembers, newMember]);
      onAddFamilyMember(memberName, newMember.age);
      
      // Reset form
      setMemberName('');
      setMemberAge('');
      setMemberRole('child');
    }
  };

  const roleEmojis = {
    parent: '👨‍👩‍👧',
    child: '👶',
    teen: '🧑‍🎓',
    grandparent: '👴'
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="text-8xl animate-bounce">{step.icon}</div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {step.title}
            </h2>
            <p className="text-xl text-gray-700">{step.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-blue-100 p-4 rounded-xl">
                <span className="text-3xl">📅</span>
                <p className="mt-2 font-medium">Calendar</p>
              </div>
              <div className="bg-green-100 p-4 rounded-xl">
                <span className="text-3xl">✅</span>
                <p className="mt-2 font-medium">Chores</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-xl">
                <span className="text-3xl">📚</span>
                <p className="mt-2 font-medium">School</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-xl">
                <span className="text-3xl">🤖</span>
                <p className="mt-2 font-medium">AI Helper</p>
              </div>
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">{step.icon}</div>
              <h2 className="text-3xl font-bold mb-2">{step.title}</h2>
              <p className="text-lg text-gray-700">{step.description}</p>
            </div>
            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="The Awesome Family..."
                className="w-full px-6 py-4 text-xl border-2 border-purple-300 rounded-2xl focus:border-purple-500 text-center"
              />
              <div className="mt-4 grid grid-cols-2 gap-4">
                {['The Super Squad', 'Team Awesome', 'The Happy Bunch', 'Family United'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setFamilyName(suggestion)}
                    className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">{step.icon}</div>
              <h2 className="text-3xl font-bold mb-2">{step.title}</h2>
              <p className="text-lg text-gray-700">{step.description}</p>
            </div>
            
            {/* Add Member Form */}
            <div className="max-w-md mx-auto space-y-4">
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Family member's name..."
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={memberAge}
                  onChange={(e) => setMemberAge(e.target.value)}
                  placeholder="Age (optional)"
                  className="px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500"
                />
                
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500"
                >
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="teen">Teen</option>
                  <option value="grandparent">Grandparent</option>
                </select>
              </div>
              
              <button
                onClick={handleAddMember}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Add Family Member ➕
              </button>
            </div>
            
            {/* Added Members List */}
            {addedMembers.length > 0 && (
              <div className="max-w-md mx-auto">
                <h3 className="font-bold text-lg mb-3">Your Family:</h3>
                <div className="space-y-2">
                  {addedMembers.map((member, index) => (
                    <div key={index} className="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{roleEmojis[member.role]}</span>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          {member.age && <p className="text-sm text-gray-600">Age: {member.age}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="text-8xl animate-bounce">{step.icon}</div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {step.title}
            </h2>
            <p className="text-xl text-gray-700">{step.description}</p>
            
            {familyName && (
              <div className="text-2xl font-bold text-purple-600 mb-4">
                Welcome, {familyName}! 🎊
              </div>
            )}
            
            <div className="max-w-lg mx-auto">
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-2xl">
                <h3 className="text-2xl font-bold mb-4">Quick Start Tips:</h3>
                <ul className="text-left space-y-3 text-lg">
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">🏃</span>
                    <span>Start by adding your first chore or assignment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">📅</span>
                    <span>Add important family events to the calendar</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">🤖</span>
                    <span>Use Buddy (AI helper) anytime you need help!</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">🏆</span>
                    <span>Check the leaderboard to see who's winning!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Step {currentStep + 1} of {steps.length}</h3>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 ${
              currentStep === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
            }`}
          >
            ← Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentStep === 1 && !familyName.trim()}
            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 ${
              (currentStep === 1 && !familyName.trim())
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
            }`}
          >
            {currentStep === steps.length - 1 ? 'Start Dashboard! 🚀' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;