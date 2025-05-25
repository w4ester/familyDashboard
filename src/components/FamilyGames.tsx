import React, { useState, useEffect } from 'react';
import WordleGame from './games/WordleGame';
import ConnectionsGame from './games/ConnectionsGame';
import GameRewardManager, { gameRewardService } from './GameRewardManager';
import { GameScore, GameSession } from '../types/game-types';

interface Props {
  familyMembers: string[];
}

const FamilyGames: React.FC<Props> = ({ familyMembers }) => {
  const [gameMode, setGameMode] = useState<'menu' | 'solo' | 'challenge'>('menu');
  const [selectedGame, setSelectedGame] = useState<'wordle' | 'connections' | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [challengeWord, setChallengeWord] = useState('');
  const [challengePuzzle, setChallengePuzzle] = useState('');
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<GameScore[]>([]);
  const [recentScores, setRecentScores] = useState<GameScore[]>([]);

  // Load scores from localStorage
  useEffect(() => {
    const savedScores = localStorage.getItem('family-game-scores');
    if (savedScores) {
      const scores: GameScore[] = JSON.parse(savedScores);
      setRecentScores(scores.slice(-10).reverse()); // Last 10 scores
      updateLeaderboard(scores);
    }
  }, []);

  const updateLeaderboard = (allScores: GameScore[]) => {
    // Group scores by player and game type, get best score for each
    const bestScores = new Map<string, GameScore>();
    
    allScores.forEach(score => {
      const key = `${score.playerName}-${score.gameType}`;
      const existing = bestScores.get(key);
      if (!existing || score.score > existing.score) {
        bestScores.set(key, score);
      }
    });
    
    const leaderboardScores = Array.from(bestScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    setLeaderboard(leaderboardScores);
  };

  const handleGameComplete = (score: GameScore) => {
    // Save score
    const savedScores = localStorage.getItem('family-game-scores');
    const allScores: GameScore[] = savedScores ? JSON.parse(savedScores) : [];
    allScores.push(score);
    localStorage.setItem('family-game-scores', JSON.stringify(allScores));
    
    // Update displays
    setRecentScores([score, ...recentScores.slice(0, 9)]);
    updateLeaderboard(allScores);
    
    // If in challenge mode, update session
    if (currentSession && gameMode === 'challenge') {
      const updatedSession = {
        ...currentSession,
        scores: [...currentSession.scores, score]
      };
      setCurrentSession(updatedSession);
      
      // Check if all players have played
      const playersPlayed = new Set(updatedSession.scores.map(s => s.playerName));
      if (playersPlayed.size >= currentSession.players.length) {
        // Challenge complete
        updatedSession.isActive = false;
        updatedSession.endedAt = new Date().toISOString();
        
        // Save session
        const savedSessions = localStorage.getItem('family-game-sessions');
        const allSessions: GameSession[] = savedSessions ? JSON.parse(savedSessions) : [];
        allSessions.push(updatedSession);
        localStorage.setItem('family-game-sessions', JSON.stringify(allSessions));
      }
    }
  };

  const startSoloGame = (player: string, game: 'wordle' | 'connections' = 'wordle') => {
    setCurrentPlayer(player);
    setGameMode('solo');
    setSelectedGame(game);
  };

  const startChallenge = (host: string, game: 'wordle' | 'connections' = 'wordle') => {
    if (game === 'wordle') {
      // Generate a random word for all players to try
      const words = ['BEACH', 'BRAIN', 'CHAIR', 'DREAM', 'FRESH', 'HAPPY', 'LIGHT', 'MUSIC', 'PARTY', 'SMILE'];
      const word = words[Math.floor(Math.random() * words.length)];
      setChallengeWord(word);
    } else {
      // Select a random puzzle ID for connections
      const puzzleIds = ['1', '2', '3'];
      const puzzleId = puzzleIds[Math.floor(Math.random() * puzzleIds.length)];
      setChallengePuzzle(puzzleId);
    }
    
    const session: GameSession = {
      id: Date.now().toString(),
      hostId: host,
      hostName: host,
      gameType: game,
      players: familyMembers,
      currentWord: game === 'wordle' ? challengeWord : undefined,
      scores: [],
      startedAt: new Date().toISOString(),
      isActive: true
    };
    
    setCurrentSession(session);
    setGameMode('challenge');
    setSelectedGame(game);
    setCurrentPlayer(host);
  };

  const handleStartRewardGame = (playerId: string) => {
    setCurrentPlayer(playerId);
    setGameMode('solo');
    setSelectedGame('wordle');
  };

  const renderMenu = () => (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center mb-8">Family Game Time! 🎮</h2>
      
      {/* Game Rewards Manager */}
      <div className="mb-8">
        <GameRewardManager 
          familyMembers={familyMembers} 
          onStartRewardGame={handleStartRewardGame}
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Solo Play */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Solo Play</h3>
          <p className="text-gray-600 mb-4">Practice your skills with solo games</p>
          <div className="space-y-3">
            <select
              className="w-full p-2 border rounded"
              onChange={(e) => {
                const [player, game] = e.target.value.split('|');
                if (player && game) startSoloGame(player, game as 'wordle' | 'connections');
              }}
              defaultValue=""
            >
              <option value="">Select Player & Game</option>
              {familyMembers.map(member => (
                <optgroup key={member} label={member}>
                  <option value={`${member}|wordle`}>🔤 Wordle</option>
                  <option value={`${member}|connections`}>🔗 Connections</option>
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        
        {/* Challenge Mode */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Family Challenge</h3>
          <p className="text-gray-600 mb-4">Everyone tries the same puzzle!</p>
          <div className="space-y-3">
            <select
              className="w-full p-2 border rounded"
              onChange={(e) => {
                const [player, game] = e.target.value.split('|');
                if (player && game) startChallenge(player, game as 'wordle' | 'connections');
              }}
              defaultValue=""
            >
              <option value="">Select Host & Game</option>
              {familyMembers.map(member => (
                <optgroup key={member} label={member}>
                  <option value={`${member}|wordle`}>🔤 Wordle Challenge</option>
                  <option value={`${member}|connections`}>🔗 Connections Challenge</option>
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">🏆 Leaderboard</h3>
        {leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.map((score, index) => (
              <div key={score.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</span>
                  <span className="font-medium">{score.playerName}</span>
                  <span className="text-sm text-gray-500">({score.gameType})</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{score.score} pts</div>
                  <div className="text-xs text-gray-500">{score.attempts} tries</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No scores yet. Start playing to see the leaderboard!</p>
        )}
      </div>
      
      {/* Recent Games */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">📊 Recent Games</h3>
        {recentScores.length > 0 ? (
          <div className="space-y-2">
            {recentScores.map(score => (
              <div key={score.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div>
                  <span className="font-medium">{score.playerName}</span>
                  <span className="text-gray-500 ml-2">played {score.gameType}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{score.score} pts</span>
                  <span className="text-gray-500 ml-2">({score.attempts} tries)</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent games. Start playing!</p>
        )}
      </div>
    </div>
  );

  const renderGame = () => {
    if (selectedGame === 'wordle') {
      return (
        <div>
          {/* Game Header */}
          <div className="bg-white rounded-lg shadow p-4 mb-4 max-w-md mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{gameMode === 'challenge' ? 'Challenge Mode' : 'Solo Mode'}</h3>
                {currentSession && (
                  <p className="text-sm text-gray-600">
                    Players: {currentSession.scores.length}/{currentSession.players.length}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setGameMode('menu');
                  setSelectedGame(null);
                  setCurrentSession(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Menu
              </button>
            </div>
          </div>
          
          {/* Challenge Progress */}
          {currentSession && gameMode === 'challenge' && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 max-w-md mx-auto">
              <h4 className="font-medium mb-2">Challenge Progress:</h4>
              <div className="space-y-1">
                {currentSession.players.map(player => {
                  const playerScore = currentSession.scores.find(s => s.playerName === player);
                  return (
                    <div key={player} className="flex justify-between text-sm">
                      <span>{player}</span>
                      <span>
                        {playerScore ? `✓ ${playerScore.score} pts` : 
                         player === currentPlayer ? '🎮 Playing...' : '⏳ Waiting...'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* The Game */}
          <WordleGame
            playerName={currentPlayer}
            onGameComplete={(score) => {
              handleGameComplete(score);
              
              if (gameMode === 'challenge' && currentSession) {
                // Move to next player
                const currentIndex = currentSession.players.indexOf(currentPlayer);
                const nextIndex = currentIndex + 1;
                
                if (nextIndex < currentSession.players.length) {
                  setCurrentPlayer(currentSession.players[nextIndex]);
                } else {
                  // All players done, show results
                  setTimeout(() => {
                    setGameMode('menu');
                    setSelectedGame(null);
                    setCurrentSession(null);
                  }, 3000);
                }
              }
            }}
            targetWord={gameMode === 'challenge' ? challengeWord : undefined}
          />
        </div>
      );
    }
    
    if (selectedGame === 'connections') {
      return (
        <div>
          {/* Game Header */}
          <div className="bg-white rounded-lg shadow p-4 mb-4 max-w-2xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{gameMode === 'challenge' ? 'Challenge Mode' : 'Solo Mode'}</h3>
                {currentSession && (
                  <p className="text-sm text-gray-600">
                    Players: {currentSession.scores.length}/{currentSession.players.length}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setGameMode('menu');
                  setSelectedGame(null);
                  setCurrentSession(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Menu
              </button>
            </div>
          </div>
          
          {/* Challenge Progress */}
          {currentSession && gameMode === 'challenge' && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 max-w-2xl mx-auto">
              <h4 className="font-medium mb-2">Challenge Progress:</h4>
              <div className="space-y-1">
                {currentSession.players.map(player => {
                  const playerScore = currentSession.scores.find(s => s.playerName === player);
                  return (
                    <div key={player} className="flex justify-between text-sm">
                      <span>{player}</span>
                      <span>
                        {playerScore ? `✓ ${playerScore.score} pts` : 
                         player === currentPlayer ? '🎮 Playing...' : '⏳ Waiting...'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* The Game */}
          <ConnectionsGame
            playerName={currentPlayer}
            onGameComplete={(score) => {
              handleGameComplete(score);
              
              if (gameMode === 'challenge' && currentSession) {
                // Move to next player
                const currentIndex = currentSession.players.indexOf(currentPlayer);
                const nextIndex = currentIndex + 1;
                
                if (nextIndex < currentSession.players.length) {
                  setCurrentPlayer(currentSession.players[nextIndex]);
                } else {
                  // All players done, show results
                  setTimeout(() => {
                    setGameMode('menu');
                    setSelectedGame(null);
                    setCurrentSession(null);
                  }, 3000);
                }
              }
            }}
            puzzleId={gameMode === 'challenge' ? challengePuzzle : undefined}
          />
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {gameMode === 'menu' ? renderMenu() : renderGame()}
    </div>
  );
};

export default FamilyGames;