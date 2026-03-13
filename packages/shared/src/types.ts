export type GameCategory = 'KOREAN_WORDS' | 'HANGUL_LETTERS';

export type RoomStatus = 'LOBBY' | 'ROUND_ACTIVE' | 'ROUND_RESULT' | 'GAME_OVER';

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  isHost: boolean;
  answeredThisRound: boolean;
}

export interface GameSettings {
  category: GameCategory;
  totalRounds: number;
  timeLimit: number; // seconds per round
}

export interface PublicQuestion {
  id: string;
  prompt: string;        // emoji or Hangul character shown on screen
  promptType: 'emoji' | 'hangul' | 'romanization';
  categoryHint: string;  // e.g. "동물 (Animal)"
  options: string[];     // 4 answer options
}

export interface RoomStateDTO {
  roomId: string;
  roomCode: string;
  hostId: string;
  players: PlayerState[];
  status: RoomStatus;
  settings: GameSettings;
  currentRound: number;
  currentQuestion?: PublicQuestion;
  roundWinner?: { id: string; name: string } | null;
  correctAnswer?: string; // only revealed in ROUND_RESULT / GAME_OVER
  roundExpiresAt?: number; // unix ms timestamp
}
