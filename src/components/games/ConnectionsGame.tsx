import React, { useState, useEffect } from 'react';
import { GameScore } from '../../types/game-types';

interface ConnectionsItem {
  word: string;
  category: string;
  difficulty: 'yellow' | 'green' | 'blue' | 'purple'; // yellow=easy, purple=hard
}

interface ConnectionsCategory {
  name: string;
  items: string[];
  difficulty: 'yellow' | 'green' | 'blue' | 'purple';
  revealed: boolean;
}

interface ConnectionsPuzzle {
  id: string;
  categories: ConnectionsCategory[];
  shuffledItems: ConnectionsItem[];
}

// Family-friendly puzzle sets
const PUZZLE_SETS: ConnectionsPuzzle[] = [
  {
    id: '1',
    categories: [
      {
        name: 'PIZZA TOPPINGS',
        items: ['PEPPERONI', 'MUSHROOM', 'SAUSAGE', 'OLIVES'],
        difficulty: 'yellow',
        revealed: false
      },
      {
        name: 'SCHOOL SUPPLIES',
        items: ['PENCIL', 'ERASER', 'RULER', 'GLUE'],
        difficulty: 'green',
        revealed: false
      },
      {
        name: 'THINGS THAT FLY',
        items: ['AIRPLANE', 'BIRD', 'KITE', 'BUTTERFLY'],
        difficulty: 'blue',
        revealed: false
      },
      {
        name: 'BOARD GAMES',
        items: ['MONOPOLY', 'SCRABBLE', 'CHESS', 'CHECKERS'],
        difficulty: 'purple',
        revealed: false
      }
    ],
    shuffledItems: []
  },
  {
    id: '2',
    categories: [
      {
        name: 'COLORS',
        items: ['RED', 'BLUE', 'GREEN', 'YELLOW'],
        difficulty: 'yellow',
        revealed: false
      },
      {
        name: 'PETS',
        items: ['DOG', 'CAT', 'FISH', 'HAMSTER'],
        difficulty: 'green',
        revealed: false
      },
      {
        name: 'BREAKFAST FOODS',
        items: ['CEREAL', 'PANCAKES', 'EGGS', 'TOAST'],
        difficulty: 'blue',
        revealed: false
      },
      {
        name: 'DISNEY MOVIES',
        items: ['FROZEN', 'MOANA', 'TANGLED', 'BRAVE'],
        difficulty: 'purple',
        revealed: false
      }
    ],
    shuffledItems: []
  },
  {
    id: '3',
    categories: [
      {
        name: 'FRUITS',
        items: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE'],
        difficulty: 'yellow',
        revealed: false
      },
      {
        name: 'SPORTS',
        items: ['SOCCER', 'BASKETBALL', 'TENNIS', 'SWIMMING'],
        difficulty: 'green',
        revealed: false
      },
      {
        name: 'WEATHER',
        items: ['SUNNY', 'RAINY', 'CLOUDY', 'SNOWY'],
        difficulty: 'blue',
        revealed: false
      },
      {
        name: 'MUSICAL INSTRUMENTS',
        items: ['PIANO', 'GUITAR', 'DRUMS', 'VIOLIN'],
        difficulty: 'purple',
        revealed: false
      }
    ],
    shuffledItems: []
  }
];

interface Props {
  playerName: string;
  onGameComplete: (score: GameScore) => void;
  puzzleId?: string;
}

const ConnectionsGame: React.FC<Props> = ({ playerName, onGameComplete, puzzleId }) => {
  const [puzzle, setPuzzle] = useState<ConnectionsPuzzle | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [solvedCategories, setSolvedCategories] = useState<ConnectionsCategory[]>([]);
  const [showMessage, setShowMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    initializePuzzle();
  }, [puzzleId]);

  const initializePuzzle = () => {
    // Select puzzle
    let selectedPuzzle: ConnectionsPuzzle;
    if (puzzleId && PUZZLE_SETS.find(p => p.id === puzzleId)) {
      selectedPuzzle = JSON.parse(JSON.stringify(PUZZLE_SETS.find(p => p.id === puzzleId)));
    } else {
      selectedPuzzle = JSON.parse(JSON.stringify(PUZZLE_SETS[Math.floor(Math.random() * PUZZLE_SETS.length)]));
    }

    // Create shuffled items
    const allItems: ConnectionsItem[] = [];
    selectedPuzzle.categories.forEach(category => {
      category.items.forEach(item => {
        allItems.push({
          word: item,
          category: category.name,
          difficulty: category.difficulty
        });
      });
    });

    // Shuffle items
    for (let i = allItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
    }

    selectedPuzzle.shuffledItems = allItems;
    setPuzzle(selectedPuzzle);
    setSelectedItems([]);
    setMistakes(0);
    setSolvedCategories([]);
    setShowMessage('');
    setGameOver(false);
  };

  const toggleItemSelection = (word: string) => {
    if (gameOver || solvedCategories.some(cat => cat.items.includes(word))) return;

    if (selectedItems.includes(word)) {
      setSelectedItems(selectedItems.filter(item => item !== word));
    } else if (selectedItems.length < 4) {
      setSelectedItems([...selectedItems, word]);
    }
  };

  const checkSubmission = () => {
    if (!puzzle || selectedItems.length !== 4) return;

    // Check if all selected items belong to same category
    const firstItemCategory = puzzle.shuffledItems.find(item => item.word === selectedItems[0])?.category;
    const isCorrect = selectedItems.every(word => {
      const item = puzzle.shuffledItems.find(i => i.word === word);
      return item?.category === firstItemCategory;
    });

    if (isCorrect && firstItemCategory) {
      // Correct!
      const category = puzzle.categories.find(cat => cat.name === firstItemCategory)!;
      const solvedCategory = { ...category, revealed: true };
      setSolvedCategories([...solvedCategories, solvedCategory]);
      setSelectedItems([]);
      setShowMessage(`✅ ${category.name}!`);

      // Check if game is won
      if (solvedCategories.length + 1 === 4) {
        handleGameWon();
      }
    } else {
      // Wrong!
      setMistakes(mistakes + 1);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      // Check if one away
      const categoryCounts: { [key: string]: number } = {};
      selectedItems.forEach(word => {
        const item = puzzle.shuffledItems.find(i => i.word === word);
        if (item) {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }
      });

      const hasThreeFromSameCategory = Object.values(categoryCounts).some(count => count === 3);
      if (hasThreeFromSameCategory) {
        setShowMessage('One away...');
      } else {
        setShowMessage('');
      }

      // Check if game is lost
      if (mistakes + 1 >= 4) {
        handleGameLost();
      }
    }
  };

  const handleGameWon = () => {
    setGameOver(true);
    const timeInSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    // Score based on mistakes and time
    const mistakesPenalty = mistakes * 50;
    const timePenalty = Math.min(timeInSeconds, 300); // Cap at 5 minutes
    const baseScore = 500;
    const finalScore = Math.max(baseScore - mistakesPenalty - timePenalty, 100);

    const score: GameScore = {
      id: Date.now().toString(),
      gameType: 'connections',
      playerId: playerName,
      playerName: playerName,
      score: finalScore,
      attempts: mistakes,
      timeInSeconds,
      completedAt: new Date().toISOString()
    };

    onGameComplete(score);
    setShowMessage(`🎉 Perfect! You found all groups with ${mistakes} mistake${mistakes !== 1 ? 's' : ''}!`);
  };

  const handleGameLost = () => {
    setGameOver(true);
    const timeInSeconds = Math.floor((Date.now() - startTime) / 1000);

    // Reveal remaining categories
    if (puzzle) {
      const revealedCategories = puzzle.categories.map(cat => ({
        ...cat,
        revealed: true
      }));
      setSolvedCategories(revealedCategories);
    }

    const score: GameScore = {
      id: Date.now().toString(),
      gameType: 'connections',
      playerId: playerName,
      playerName: playerName,
      score: solvedCategories.length * 100, // 100 points per solved category
      attempts: mistakes,
      timeInSeconds,
      completedAt: new Date().toISOString()
    };

    onGameComplete(score);
    setShowMessage(`Game Over! You found ${solvedCategories.length} out of 4 groups.`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'yellow': return 'bg-yellow-400 text-black';
      case 'green': return 'bg-green-500 text-white';
      case 'blue': return 'bg-blue-500 text-white';
      case 'purple': return 'bg-purple-600 text-white';
      default: return 'bg-gray-400';
    }
  };

  const getMistakesDisplay = () => {
    const filled = '●';
    const empty = '○';
    return Array(4).fill(null).map((_, i) => (
      <span key={i} className={i < mistakes ? 'text-red-500' : 'text-gray-400'}>
        {i < mistakes ? filled : empty}
      </span>
    )).join(' ');
  };

  if (!puzzle) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">Connections</h2>
        <p className="text-gray-600">Find groups of four items that share something in common</p>
        <p className="text-sm text-gray-500 mt-2">Player: {playerName}</p>
      </div>

      {/* Mistakes indicator */}
      <div className="text-center mb-4">
        <span className="text-sm text-gray-600">Mistakes: </span>
        <span className="font-mono text-lg">{getMistakesDisplay()}</span>
      </div>

      {/* Solved categories */}
      {solvedCategories.length > 0 && (
        <div className="space-y-2 mb-4">
          {solvedCategories.map((category, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg text-center ${getDifficultyColor(category.difficulty)}`}
            >
              <div className="font-bold">{category.name}</div>
              <div className="text-sm mt-1">{category.items.join(', ')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Game grid */}
      <div className={`mb-4 ${isShaking ? 'animate-shake' : ''}`}>
        <div className="grid grid-cols-4 gap-2">
          {puzzle.shuffledItems
            .filter(item => !solvedCategories.some(cat => cat.items.includes(item.word)))
            .map((item, index) => (
              <button
                key={index}
                onClick={() => toggleItemSelection(item.word)}
                className={`
                  p-3 rounded-lg font-medium text-sm transition-all
                  ${selectedItems.includes(item.word)
                    ? 'bg-gray-800 text-white scale-95'
                    : 'bg-gray-200 hover:bg-gray-300'
                  }
                  ${gameOver ? 'cursor-not-allowed opacity-50' : ''}
                `}
                disabled={gameOver}
              >
                {item.word}
              </button>
            ))}
        </div>
      </div>

      {/* Message */}
      {showMessage && (
        <div className="text-center mb-4">
          <p className={`font-semibold ${gameOver ? 'text-lg' : ''}`}>{showMessage}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setSelectedItems([])}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          disabled={gameOver || selectedItems.length === 0}
        >
          Deselect All
        </button>
        <button
          onClick={checkSubmission}
          className={`px-6 py-2 rounded font-semibold ${
            selectedItems.length === 4 && !gameOver
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={selectedItems.length !== 4 || gameOver}
        >
          Submit
        </button>
      </div>

      {/* Play Again */}
      {gameOver && (
        <div className="text-center mt-6">
          <button
            onClick={initializePuzzle}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            Play Again
          </button>
        </div>
      )}

    </div>
  );
};

export default ConnectionsGame;