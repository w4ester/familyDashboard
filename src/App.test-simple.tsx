import React from 'react';
import './App.css';
import FamilyDashboard from './components/FamilyDashboard';
import AiAssistant from './components/AiAssistant';

// Simplified App for testing - skips login/onboarding
function App() {
  return (
    <div className="App">
      <FamilyDashboard />
      <AiAssistant 
        onDataChange={() => {
          console.log('Data changed by AI');
        }}
      />
    </div>
  );
}

export default App;