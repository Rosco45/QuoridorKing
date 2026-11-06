export type PlayerId = 1 | 2;

export type WallOrientation = 'horizontal' | 'vertical';

export type GameMode = 'pass-and-play' | 'ai';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

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

export interface Player {
  id: PlayerId;
  name: string;
  position: Position;
  wallsRemaining: number;
  color: string;
  glowColor: string;
  targetRow: number; // Player 1 targets y = 0, Player 2 targets y = 8
  isAI?: boolean;
}

export type ActionMode = 'pawn' | 'wall';

export interface GameState {
  players: {
    1: Player;
    2: Player;
  };
  activePlayer: PlayerId;
  walls: Wall[];
  turnCount: number;
  winner: PlayerId | null;
  history: GameHistoryEntry[];
}

export interface GameHistoryEntry {
  players: {
    1: Player;
    2: Player;
  };
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
