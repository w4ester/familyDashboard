import React, { useState, useEffect } from 'react';
import { GameRewardBalance, GameRewardHistory } from '../types/game-types';
import { ChoreAssignment } from '../types/chore-types';

interface Props {
  familyMembers: string[];
  onStartRewardGame: (playerId: string) => void;
}

// Service for managing game rewards
export const gameRewardService = {
  // Get balance for a player
  getBalance(playerId: string): GameRewardBalance {
    const balances = JSON.parse(localStorage.getItem('game-reward-balances') || '{}');
    return balances[playerId] || {
      playerId,
      playerName: playerId,
      availableSessions: 0,
      pendingSessions: 0,
      usedSessions: 0,
      history: []
    };
  },

  // Update balance
  updateBalance(playerId: string, update: Partial<GameRewardBalance>) {
    const balances = JSON.parse(localStorage.getItem('game-reward-balances') || '{}');
    balances[playerId] = { ...this.getBalance(playerId), ...update };
    localStorage.setItem('game-reward-balances', JSON.stringify(balances));
  },

  // Add reward when chore is verified
  addReward(playerId: string, choreAssignment: ChoreAssignment) {
    if (!choreAssignment.gameReward) return;
    
    const balance = this.getBalance(playerId);
    const historyEntry: GameRewardHistory = {
      id: Date.now().toString(),
      playerId,
      type: 'earned',
      sessions: choreAssignment.gameReward.sessions,
      choreAssignmentId: choreAssignment.id,
      timestamp: new Date().toISOString(),
      description: `Earned ${choreAssignment.gameReward.sessions} game session(s) for completing "${choreAssignment.choreName}"`
    };
    
    this.updateBalance(playerId, {
      availableSessions: balance.availableSessions + choreAssignment.gameReward.sessions,
      history: [historyEntry, ...balance.history]
    });
  },

  // Use a reward session
  useReward(playerId: string, gameSessionId: string): boolean {
    const balance = this.getBalance(playerId);
    if (balance.availableSessions <= 0) return false;
    
    const historyEntry: GameRewardHistory = {
      id: Date.now().toString(),
      playerId,
      type: 'used',
      sessions: 1,
      gameSessionId,
      timestamp: new Date().toISOString(),
      description: 'Used 1 game session'
    };
    
    this.updateBalance(playerId, {
      availableSessions: balance.availableSessions - 1,
      usedSessions: balance.usedSessions + 1,
      history: [historyEntry, ...balance.history]
    });
    
    return true;
  }
};

const GameRewardManager: React.FC<Props> = ({ familyMembers, onStartRewardGame }) => {
  const [balances, setBalances] = useState<GameRewardBalance[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showHistory, setShowHistory] = useState<string | null>(null);

  useEffect(() => {
    loadBalances();
    // Reload periodically to catch external updates
    const interval = setInterval(loadBalances, 2000);
    return () => clearInterval(interval);
  }, [familyMembers]);

  const loadBalances = () => {
    const newBalances = familyMembers.map(member => gameRewardService.getBalance(member));
    setBalances(newBalances);
  };

  const handleUseReward = (playerId: string) => {
    if (gameRewardService.useReward(playerId, 'manual-' + Date.now())) {
      onStartRewardGame(playerId);
      loadBalances();
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">🎮 Game Rewards</h2>
      
      {/* Instructions */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm">
          Complete tasks to earn game sessions! When you finish a task with game rewards, 
          you'll get tokens to play family games together.
        </p>
      </div>

      {/* Balances */}
      <div className="space-y-4">
        {balances.map(balance => (
          <div key={balance.playerId} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{balance.playerName}</h3>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Available: <strong className="text-green-600">{balance.availableSessions}</strong></span>
                  <span>Used: {balance.usedSessions}</span>
                  {balance.pendingSessions > 0 && (
                    <span>Pending: <em className="text-yellow-600">{balance.pendingSessions}</em></span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {balance.availableSessions > 0 && (
                  <button
                    onClick={() => handleUseReward(balance.playerId)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Play Game 🎮
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(showHistory === balance.playerId ? null : balance.playerId)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {showHistory === balance.playerId ? 'Hide' : 'Show'} History
                </button>
              </div>
            </div>

            {/* History */}
            {showHistory === balance.playerId && balance.history.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Recent Activity:</h4>
                <div className="space-y-1 text-sm">
                  {balance.history.slice(0, 5).map(entry => (
                    <div key={entry.id} className="flex justify-between">
                      <span className={entry.type === 'earned' ? 'text-green-600' : 'text-gray-600'}>
                        {entry.type === 'earned' ? '✅' : '🎮'} {entry.description}
                      </span>
                      <span className="text-gray-500">{formatDate(entry.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold mb-2">📊 Reward Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {balances.reduce((sum, b) => sum + b.availableSessions, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {balances.reduce((sum, b) => sum + b.usedSessions, 0)}
            </div>
            <div className="text-sm text-gray-600">Games Played</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {balances.reduce((sum, b) => sum + b.history.filter(h => h.type === 'earned').length, 0)}
            </div>
            <div className="text-sm text-gray-600">Tasks Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRewardManager;