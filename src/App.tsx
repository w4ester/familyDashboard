import React, { useState, useEffect } from 'react';
import './App.css';
import FamilyDashboard from './components/FamilyDashboard';
import WelcomePage from './components/WelcomePage';
import OnboardingFlow from './components/OnboardingFlow';
import AiGuide from './components/AiGuide';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    const savedUserName = localStorage.getItem('userName');
    const savedFamilyMembers = localStorage.getItem('familyMembers');
    
    if (hasCompletedOnboarding === 'true') {
      setShowWelcome(false);
      setShowOnboarding(false);
      
      if (savedUserName) {
        setUserName(savedUserName);
      }
      
      if (savedFamilyMembers) {
        setFamilyMembers(JSON.parse(savedFamilyMembers));
      }
    }
  }, []);
  
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
      <AiGuide 
        currentPage={currentPage}
        userName={userName}
        familyMembers={familyMembers}
      />
    </div>
  );
}

export default App;