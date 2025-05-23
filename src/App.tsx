import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import FamilyDashboard from './components/FamilyDashboard';
import WelcomePage from './components/WelcomePage';
import OnboardingFlow from './components/OnboardingFlow';
import AiGuide from './components/AiGuide';
import AiGuideWithOllama from './components/AiGuideWithOllama';
import McpDashboard from './components/McpDashboard';
import LoginPage from './components/LoginPage';
import FamilyAI from './components/FamilyAI';
import { ChoreCreationRequest } from './services/ai-chore-toolkit';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const dashboardRef = useRef<any>(null);
  
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

  const handleChoreCreated = (chores: ChoreCreationRequest[]) => {
    console.log('App received created chores:', chores);
    // The FamilyDashboard will handle the actual chore creation
    // through the onAIChoresCreated callback
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
      <FamilyDashboard 
        ref={dashboardRef}
        onPageChange={handlePageChange}
        onAIChoresCreated={handleChoreCreated}
      />
      
      {/* AI Guide with Ollama Integration */}
      <AiGuideWithOllama 
        currentPage={currentPage}
        userName={userName}
        familyMembers={familyMembers}
        onChoreCreated={(chores) => {
          if (dashboardRef.current && dashboardRef.current.handleAIChoreCreation) {
            dashboardRef.current.handleAIChoreCreation(chores);
          }
        }}
      />
      
      {/* Optional: Add MCP Dashboard as a tab */}
      {currentPage === 'mcp' && <McpDashboard />}
    </div>
  );
}

export default App;