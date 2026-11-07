export type PlayerId = 1 | 2 | 3 | 4;

export type PlayerCount = 2 | 3 | 4;

export type WallOrientation = 'horizontal' | 'vertical';

export type GameMode = 'pass-and-play' | 'ai' | 'online';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type BlitzTimerSetting = 0 | 15 | 30 | 45; // 0 = disabled

export type ThemeId = 'wood' | 'cyberpunk' | 'marble';

export interface Position {
  x: number; // 0 to 8 (columns, left to right)
  y: number; // 0 to 8 (rows, top to bottom)
}

export interface Wall {
  id: string;
  x: number; // 0 to 7 (intersection coordinate)
  y: number; // 0 to 7
  orientation: WallOrientation;
  placedBy: PlayerId;
}

export type TargetGoalType = 'row' | 'col';

export interface TargetGoal {
  type: TargetGoalType;
  value: number; // row index or column index
  description: string;
}

export interface PlayerSlotConfig {
  id: PlayerId;
  type: 'human' | 'bot';
  name: string;
  difficulty: AIDifficulty;
}

export interface Player {
  id: PlayerId;
  name: string;
  position: Position;
  wallsRemaining: number;
  color: string;
  glowColor: string;
  targetGoal: TargetGoal;
  isAI?: boolean;
  aiDifficulty?: AIDifficulty;
}

export type ActionMode = 'pawn' | 'wall';

export interface ReplayStep {
  stepNumber: number;
  turnNumber: number;
  playerId: PlayerId;
  actionType: 'move' | 'wall';
  from?: Position;
  to?: Position;
  wall?: { x: number; y: number; orientation: WallOrientation };
  playersState: Record<PlayerId, { position: Position; wallsRemaining: number }>;
  wallsState: Wall[];
  description: string;
}

export interface GameHistoryEntry {
  players: Record<PlayerId, Player>;
  activePlayer: PlayerId;
  walls: Wall[];
  turnCount: number;
  lastActionDescription: string;
}

export interface WallPreview {
  x: number;
  y: number;
  orientation: WallOrientation;
  isValid: boolean;
  validationError?: string;
}

export type AIAction =
  | { type: 'move'; to: Position }
  | { type: 'wall'; x: number; y: number; orientation: WallOrientation };

// --- Online Multiplayer Types ---
export type CoinSide = 'heads' | 'tails'; // Pile ou Face

export interface PeerPlayerInfo {
  peerId: string;
  name: string;
  playerNumber: PlayerId;
  isHost: boolean;
  isReady: boolean;
}

export interface CoinFlipState {
  hostChoice: CoinSide | null;
  result: CoinSide | null;
  winnerPlayerId: PlayerId | null;
  flipping: boolean;
}

export type NetworkMessage =
  | { type: 'SYNC_LOBBY'; players: PeerPlayerInfo[]; playerCount: PlayerCount; timerSetting: BlitzTimerSetting; coinFlip: CoinFlipState }
  | { type: 'COIN_FLIP_CHOICE'; choice: CoinSide }
  | { type: 'COIN_FLIP_TRIGGER'; result: CoinSide; winnerPlayerId: PlayerId }
  | { type: 'START_GAME'; startPlayerId: PlayerId }
  | { type: 'GAME_MOVE'; playerId: PlayerId; to: Position }
  | { type: 'GAME_WALL'; playerId: PlayerId; x: number; y: number; orientation: WallOrientation }
  | { type: 'GAME_TIMEOUT'; playerId: PlayerId }
  | { type: 'GAME_RESTART' };
