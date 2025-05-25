export interface GameScore {
  id: string;
  gameType: 'wordle' | 'connections' | 'trivia' | 'memory';
  playerId: string;
  playerName: string;
  score: number;
  attempts: number;
  timeInSeconds: number;
  completedAt: string;
  word?: string; // For wordle
}

export interface WordleGame {
  id: string;
  word: string;
  maxAttempts: number;
  currentAttempts: number;
  guesses: string[];
  letterStates: LetterState[][];
  isComplete: boolean;
  isWon: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface LetterState {
  letter: string;
  state: 'correct' | 'present' | 'absent' | 'unused';
}

export interface GameSession {
  id: string;
  hostId: string;
  hostName: string;
  gameType: string;
  players: string[];
  currentWord?: string;
  scores: GameScore[];
  startedAt: string;
  endedAt?: string;
  isActive: boolean;
  isRewardSession?: boolean; // Was this a reward for completing task?
  choreAssignmentId?: string; // Which task earned this?
}

export interface GameRewardBalance {
  playerId: string;
  playerName: string;
  availableSessions: number;
  pendingSessions: number; // From tasks not yet verified
  usedSessions: number;
  history: GameRewardHistory[];
}

export interface GameRewardHistory {
  id: string;
  playerId: string;
  type: 'earned' | 'used' | 'expired';
  sessions: number;
  choreAssignmentId?: string;
  gameSessionId?: string;
  timestamp: string;
  description: string;
}