import React, { useState, useEffect } from 'react';
import './App.css';
import FamilyDashboard from './components/FamilyDashboard';
import WelcomePage from './components/WelcomePage';
import OnboardingFlow from './components/OnboardingFlow';
import AiGuide from './components/AiGuide';
import AiGuideWithOllama from './components/AiGuideWithOllama';
import McpDashboard from './components/McpDashboard';
import LoginPage from './components/LoginPage';
import FamilyAI from './components/FamilyAI';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Check if user is logged in and has completed onboarding
  useEffect(() => {
    // Clear localStorage for demo purposes - remove this line for production
    localStorage.clear();
    
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    const savedUserName = localStorage.getItem('userName');
    const savedFamilyMembers = localStorage.getItem('familyMembers');
    
    if (hasCompletedOnboarding === 'true' && savedUserName) {
      setShowLogin(false);
      setShowWelcome(false);
      setShowOnboarding(false);
      setUserName(savedUserName);
      
      if (savedFamilyMembers) {
        setFamilyMembers(JSON.parse(savedFamilyMembers));
      }
    }
  }, []);
  
  const handleLogin = () => {
    setShowLogin(false);
    setShowWelcome(true);
  };

  const handleGetStarted = () => {
    if (localStorage.getItem('hasCompletedOnboarding') === 'true') {
      setShowWelcome(false);
    } else {
      setShowOnboarding(true);
      setShowWelcome(false);
    }
  };
  
  const handleOnboardingComplete = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('familyMembers', JSON.stringify(familyMembers));
    setShowOnboarding(false);
  };
  
  const handleAddFamilyMember = (name: string, age?: number) => {
    setFamilyMembers([...familyMembers, name]);
    localStorage.setItem('familyMembers', JSON.stringify([...familyMembers, name]));
  };
  
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  if (showLogin) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (showWelcome) {
    return <WelcomePage onGetStarted={handleGetStarted} familyMembers={familyMembers} />;
  }
  
  if (showOnboarding) {
    return (
      <OnboardingFlow 
        onComplete={handleOnboardingComplete}
        onAddFamilyMember={handleAddFamilyMember}
      />
    );
  }
  
  return (
    <div className="App">
      <FamilyDashboard onPageChange={handlePageChange} />
      
      {/* Enhanced Family AI with Memory Integration */}
      <FamilyAI 
        familyId="default-family" // You can make this dynamic based on family ID
        userId={userName || 'current-user'}
        userName={userName}
        onMemoryCreated={(memory) => {
          console.log('New family memory created:', memory);
          // You can add any additional handling here
        }}
      />
      
      {/* Optional: Add MCP Dashboard as a tab */}
      {currentPage === 'mcp' && <McpDashboard />}
    </div>
  );
}

export default App;