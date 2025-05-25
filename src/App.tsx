import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import FamilyDashboard from './components/FamilyDashboard';
import WelcomePage from './components/WelcomePage';
import OnboardingFlow from './components/OnboardingFlow';
import DraggableAiAssistant from './components/DraggableAiAssistant';
import LoginPage from './components/LoginPage';

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
    // Skip onboarding for testing
    // localStorage.clear();
    
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

  const handleChoreCreated = (chores: any[]) => {
    console.log('App received created chores:', chores);
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
      
      {/* Draggable AI Assistant */}
      <DraggableAiAssistant 
        onDataChange={() => {
          // Dashboard will auto-refresh due to interval
          console.log('Data changed by AI');
        }}
      />
    </div>
  );
}

export default App;