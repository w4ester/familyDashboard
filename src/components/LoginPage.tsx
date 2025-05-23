import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For demo purposes, accept any non-empty username/password
    if (username.trim() && password.trim()) {
      // Store username in localStorage to simulate a logged-in user
      localStorage.setItem('userName', username);
      localStorage.setItem('hasCompletedOnboarding', 'true');
      onLogin();
    } else {
      setErrorMessage('Please enter both username and password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Family Dashboard
          </h1>
          <p className="text-xl text-gray-700">
            Sign in to your family account
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-lg mb-2 text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-3 rounded-xl border-2 border-purple-300 focus:border-purple-500 text-lg"
            />
          </div>

          <div className="mb-6">
            <label className="block text-lg mb-2 text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-xl border-2 border-purple-300 focus:border-purple-500 text-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-lg"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Demo credentials: any username and password
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;