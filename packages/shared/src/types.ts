export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type QuestionType = "LETTER" | "WORD" | "LOGIC";

export type ChapterId =
  | "CH1_CONSONANTS"
  | "CH2_VOWELS"
  | "CH3_SYLLABLE_FORGE"
  | "CH4_WORD_MARKET"
  | "CH5_LOGIC_ARENA"
  | "CH6_ROYAL_ARCHIVE";

export type MiniGameCategory =
  | "RECOGNITION"
  | "MATCHING"
  | "CONSTRUCTION"
  | "LOGIC"
  | "TIMED_REACTION"
  | "COOP_ASSEMBLY";

export type MiniGameType =
  | "LETTER_RECOGNITION"
  | "SPIRIT_CATCH"
  | "ECHO_SHRINE"
  | "SYLLABLE_FORGE"
  | "MARKET_RESTORATION"
  | "SYLLABLE_UNSCRAMBLE"
  | "ARENA_WORDS"
  | "SENTENCE_RESTORATION";

export type GameMode = "STORY_CAMPAIGN" | "VILLAGE_FESTIVAL" | "CLASSROOM";

export type RoomSettingsDTO = {
  noFailureCondition: boolean;
  difficultyOverride: Difficulty | null;
};

export type PlayerPerformanceDTO = {
  userId: string;
  username: string;
  attempts: number;
  correct: number;
  timeouts: number;
};

export type GameStatus =
  | "LOBBY"
  | "ROOM_READY"
  | "TURN_START"
  | "CHALLENGE_CLEARED"
  | "CHALLENGE_FAILED"
  | "LEVEL_COMPLETE";

export type PlayerDTO = {
  userId: string;
  username: string;
  connected: boolean;
  seatIndex: number;
};

export type BaseQuestion = {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  miniGameType: MiniGameType;
  prompt: string;
  chapterId: ChapterId;
  chapterTitle: string;
  questTitle: string;
  miniGameCategory: MiniGameCategory;
};

export type LetterQuestion = BaseQuestion & {
  type: "LETTER";
  options: string[];
  expected: string;
  audioUrl?: string;
  mode: "CLICK" | "TYPE" | "SOUND_MATCH";
};

export type WordQuestion = BaseQuestion & {
  type: "WORD";
  promptType: "IMAGE" | "UNSCRAMBLE" | "SPELL";
  imageUrl?: string;
  word: string;
  syllables: string[];
  options?: string[];
  expected: string;
};

export type LogicQuestion = BaseQuestion & {
  type: "LOGIC";
  rule: "RPS_COUNTER" | "SENTENCE_FILL";
  expected: string;
  context?: Record<string, string>;
};

export type QuestionDTO = LetterQuestion | WordQuestion | LogicQuestion;

export type RoomStateDTO = {
  roomId: string;
  roomCode: string;
  hostUserId: string;
  mode: GameMode;
  settings: RoomSettingsDTO;
  status: GameStatus;
  players: PlayerDTO[];
  playerPerformance: PlayerPerformanceDTO[];
  questId: string;
  requiredSuccesses: number;
  successfulMiniGames: number;
  consecutiveFailures: number;
  averageResponseMs: number;
  level: number;
  chapterId: ChapterId;
  chapterTitle: string;
  questTitle: string;
  learningGoal: string;
  storyGoal: string;
  progressMeter: number;
  teamHealth: number;
  maxTeamHealth: number;
  turnIndex: number;
  activePlayerId: string | null;
  challengeId: string | null;
  currentQuestion: Omit<QuestionDTO, "expected"> | null;
  failedPlayerIds: string[];
  expiresAt: number | null;
};
