import React, { useState, useEffect, useCallback } from 'react';
import { WordleGame, LetterState, GameScore } from '../../types/game-types';

// Common 5-letter words for the game
const WORD_LIST = [
  'ABOUT', 'AFTER', 'AGAIN', 'ALLOW', 'ALONE', 'ALONG', 'AMONG', 'ANGRY',
  'BEACH', 'BRAIN', 'BREAD', 'BREAK', 'BRING', 'BUILD', 'CHAIR', 'CHILD',
  'CLEAN', 'CLEAR', 'CLIMB', 'CLOCK', 'CLOSE', 'CLOUD', 'DANCE', 'DREAM',
  'DRINK', 'DRIVE', 'EARLY', 'EARTH', 'EMPTY', 'ENJOY', 'ENTER', 'EQUAL',
  'FIELD', 'FIGHT', 'FINAL', 'FIRST', 'FLOOR', 'FOCUS', 'FORCE', 'FRESH',
  'FRUIT', 'FUNNY', 'GREAT', 'GREEN', 'GROUP', 'HAPPY', 'HEART', 'HEAVY',
  'HOUSE', 'HUMAN', 'LARGE', 'LAUGH', 'LEARN', 'LIGHT', 'LOCAL', 'LUCKY',
  'MONEY', 'MONTH', 'MUSIC', 'NIGHT', 'OCEAN', 'OTHER', 'PAPER', 'PARTY',
  'PEACE', 'PHONE', 'PLACE', 'PLANT', 'POINT', 'POWER', 'QUICK', 'QUIET',
  'READY', 'RIGHT', 'RIVER', 'ROUND', 'SCALE', 'SHARE', 'SHARP', 'SHORT',
  'SMALL', 'SMILE', 'SOLID', 'SOUND', 'SPACE', 'SPEAK', 'SPEND', 'SPORT',
  'START', 'STONE', 'STORE', 'STORY', 'STUDY', 'SUGAR', 'TABLE', 'TEACH',
  'THANK', 'THINK', 'THREE', 'TODAY', 'TRAIN', 'TRUST', 'UNDER', 'UNTIL',
  'WATCH', 'WATER', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WORLD',
  'WRITE', 'YOUNG'
];

interface Props {
  playerName: string;
  onGameComplete: (score: GameScore) => void;
  targetWord?: string; // Optional: use same word for multiplayer
}

const WordleGameComponent: React.FC<Props> = ({ playerName, onGameComplete, targetWord }) => {
  const [game, setGame] = useState<WordleGame | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [message, setMessage] = useState('');
  const [usedLetters, setUsedLetters] = useState<Map<string, LetterState['state']>>(new Map());

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, [targetWord]);

  const startNewGame = () => {
    const word = targetWord || WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    const newGame: WordleGame = {
      id: Date.now().toString(),
      word: word.toUpperCase(),
      maxAttempts: 6,
      currentAttempts: 0,
      guesses: [],
      letterStates: [],
      isComplete: false,
      isWon: false,
      startedAt: new Date().toISOString()
    };
    setGame(newGame);
    setCurrentGuess('');
    setMessage('');
    setUsedLetters(new Map());
  };

  const evaluateGuess = (guess: string, targetWord: string): LetterState[] => {
    const result: LetterState[] = [];
    const targetLetters = targetWord.split('');
    const guessLetters = guess.split('');
    
    // First pass: mark correct letters
    guessLetters.forEach((letter, i) => {
      if (letter === targetLetters[i]) {
        result[i] = { letter, state: 'correct' };
        targetLetters[i] = '*'; // Mark as used
      } else {
        result[i] = { letter, state: 'absent' };
      }
    });
    
    // Second pass: mark present letters
    guessLetters.forEach((letter, i) => {
      if (result[i].state === 'absent') {
        const targetIndex = targetLetters.indexOf(letter);
        if (targetIndex !== -1) {
          result[i].state = 'present';
          targetLetters[targetIndex] = '*'; // Mark as used
        }
      }
    });
    
    return result;
  };

  const updateUsedLetters = (letterStates: LetterState[]) => {
    const newUsedLetters = new Map(usedLetters);
    letterStates.forEach(({ letter, state }) => {
      const currentState = newUsedLetters.get(letter);
      // Only update if new state is "better" (correct > present > absent)
      if (!currentState || 
          (currentState === 'absent' && state !== 'absent') ||
          (currentState === 'present' && state === 'correct')) {
        newUsedLetters.set(letter, state);
      }
    });
    setUsedLetters(newUsedLetters);
  };

  const handleSubmitGuess = () => {
    if (!game || game.isComplete) return;
    
    const guess = currentGuess.toUpperCase();
    
    // Validation
    if (guess.length !== 5) {
      setMessage('Word must be 5 letters');
      return;
    }
    
    if (!/^[A-Z]+$/.test(guess)) {
      setMessage('Only letters allowed');
      return;
    }
    
    // Evaluate guess
    const letterStates = evaluateGuess(guess, game.word);
    updateUsedLetters(letterStates);
    
    const newGuesses = [...game.guesses, guess];
    const newLetterStates = [...game.letterStates, letterStates];
    const isWon = guess === game.word;
    const attempts = game.currentAttempts + 1;
    const isComplete = isWon || attempts >= game.maxAttempts;
    
    const updatedGame: WordleGame = {
      ...game,
      guesses: newGuesses,
      letterStates: newLetterStates,
      currentAttempts: attempts,
      isComplete,
      isWon,
      completedAt: isComplete ? new Date().toISOString() : undefined
    };
    
    setGame(updatedGame);
    setCurrentGuess('');
    
    if (isComplete) {
      const timeInSeconds = Math.floor(
        (new Date().getTime() - new Date(game.startedAt).getTime()) / 1000
      );
      
      const score: GameScore = {
        id: Date.now().toString(),
        gameType: 'wordle',
        playerId: playerName,
        playerName: playerName,
        score: isWon ? (7 - attempts) * 100 : 0, // More points for fewer guesses
        attempts: attempts,
        timeInSeconds,
        completedAt: new Date().toISOString(),
        word: game.word
      };
      
      onGameComplete(score);
      
      if (isWon) {
        setMessage(`🎉 Correct! You got it in ${attempts} ${attempts === 1 ? 'try' : 'tries'}!`);
      } else {
        setMessage(`Game over! The word was ${game.word}`);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitGuess();
    } else if (e.key === 'Backspace') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + e.key.toUpperCase());
    }
  };

  const getLetterStateClass = (state: LetterState['state']) => {
    switch (state) {
      case 'correct': return 'bg-green-500 text-white';
      case 'present': return 'bg-yellow-500 text-white';
      case 'absent': return 'bg-gray-400 text-white';
      default: return 'bg-gray-200';
    }
  };

  const getKeyboardLetterState = (letter: string): LetterState['state'] => {
    return usedLetters.get(letter) || 'unused';
  };

  if (!game) return null;

  return (
    <div className="max-w-md mx-auto p-4" onKeyDown={handleKeyPress} tabIndex={0}>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">Wordle Challenge</h2>
        <p className="text-gray-600">Player: {playerName}</p>
        <p className="text-sm text-gray-500">Attempt {game.currentAttempts + 1} of {game.maxAttempts}</p>
      </div>

      {/* Game Board */}
      <div className="mb-6">
        {Array.from({ length: game.maxAttempts }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, colIndex) => {
              const guess = game.guesses[rowIndex];
              const letterState = game.letterStates[rowIndex]?.[colIndex];
              const isCurrentRow = rowIndex === game.currentAttempts;
              const currentLetter = isCurrentRow ? currentGuess[colIndex] : '';
              
              return (
                <div
                  key={colIndex}
                  className={`
                    w-14 h-14 border-2 flex items-center justify-center text-xl font-bold
                    ${letterState ? getLetterStateClass(letterState.state) : 'border-gray-300'}
                    ${isCurrentRow && !game.isComplete ? 'border-gray-400' : ''}
                  `}
                >
                  {letterState?.letter || currentLetter || ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className="text-center mb-4">
          <p className={`font-semibold ${game.isWon ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        </div>
      )}

      {/* Virtual Keyboard */}
      <div className="space-y-2">
        {[
          ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
          ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
          ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
        ].map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map(key => {
              const letterState = key.length === 1 ? getKeyboardLetterState(key) : 'unused';
              
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'ENTER') {
                      handleSubmitGuess();
                    } else if (key === '⌫') {
                      setCurrentGuess(prev => prev.slice(0, -1));
                    } else if (!game.isComplete && currentGuess.length < 5) {
                      setCurrentGuess(prev => prev + key);
                    }
                  }}
                  className={`
                    ${key.length > 1 ? 'px-3' : 'w-10'} h-12 rounded font-semibold
                    ${letterState === 'unused' ? 'bg-gray-300 hover:bg-gray-400' : getLetterStateClass(letterState)}
                    ${game.isComplete ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  disabled={game.isComplete}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Play Again Button */}
      {game.isComplete && (
        <div className="text-center mt-6">
          <button
            onClick={startNewGame}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default WordleGameComponent;