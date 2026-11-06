import type { PlayerId, PlayerCount, Position, TargetGoal, Player } from '../types/game';

export const BOARD_SIZE = 9;
export const INTERSECTIONS_SIZE = 8;
export const MAX_WALLS_2P = 10;
export const MAX_WALLS_4P = 5;

export const INITIAL_POSITIONS: Record<PlayerId, Position> = {
  1: { x: 4, y: 8 }, // Player 1 (Bottom): targets row 0
  2: { x: 4, y: 0 }, // Player 2 (Top): targets row 8
  3: { x: 0, y: 4 }, // Player 3 (Left): targets col 8
  4: { x: 8, y: 4 }, // Player 4 (Right): targets col 0
};

export const TARGET_GOALS: Record<PlayerId, TargetGoal> = {
  1: { type: 'row', value: 0, description: 'Ligne Haut (1)' },
  2: { type: 'row', value: 8, description: 'Ligne Bas (9)' },
  3: { type: 'col', value: 8, description: 'Colonne Droite (I)' },
  4: { type: 'col', value: 0, description: 'Colonne Gauche (A)' },
};

export function isWithinBoard(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

export function isWithinIntersections(x: number, y: number): boolean {
  return x >= 0 && x < INTERSECTIONS_SIZE && y >= 0 && y < INTERSECTIONS_SIZE;
}

export function arePositionsEqual(p1: Position, p2: Position): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}

export function hasPlayerReachedGoal(pos: Position, goal?: TargetGoal): boolean {
  if (!goal || !pos) return false;
  if (goal.type === 'row') {
    return pos.y === goal.value;
  } else {
    return pos.x === goal.value;
  }
}

/**
 * Returns the next player in turn order.
 * In 2-player mode: 1 -> 2 -> 1
 * In 4-player mode: clockwise around the board:
 * 1 (Bottom) -> 3 (Left) -> 2 (Top) -> 4 (Right) -> 1 (Bottom)
 */
export function getNextPlayerId(current: PlayerId, playerCount: PlayerCount): PlayerId {
  if (playerCount === 2) {
    return current === 1 ? 2 : 1;
  }
  const clockwiseOrder: PlayerId[] = [1, 3, 2, 4];
  const idx = clockwiseOrder.indexOf(current);
  return clockwiseOrder[(idx + 1) % clockwiseOrder.length];
}

export function createInitialPlayers(
  playerCount: PlayerCount,
  gameMode: 'pass-and-play' | 'ai' | 'online',
  customNames?: Partial<Record<PlayerId, string>>
): Record<PlayerId, Player> {
  const wallsCount = playerCount === 2 ? MAX_WALLS_2P : MAX_WALLS_4P;

  const defaultNames: Record<PlayerId, string> = {
    1: customNames?.[1] || 'Joueur 1 (Bleu)',
    2: customNames?.[2] || (gameMode === 'ai' ? 'IA King' : 'Joueur 2 (Orange)'),
    3: customNames?.[3] || 'Joueur 3 (Vert)',
    4: customNames?.[4] || 'Joueur 4 (Violet)',
  };

  const colors: Record<PlayerId, { color: string; glow: string }> = {
    1: { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)' }, // Cyan
    2: { color: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' }, // Orange
    3: { color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }, // Emerald Green
    4: { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' }, // Purple
  };

  const players: Partial<Record<PlayerId, Player>> = {};

  const activeIds: PlayerId[] = playerCount === 2 ? [1, 2] : [1, 2, 3, 4];

  for (const id of activeIds) {
    players[id] = {
      id,
      name: defaultNames[id],
      position: { ...INITIAL_POSITIONS[id] },
      wallsRemaining: wallsCount,
      color: colors[id].color,
      glowColor: colors[id].glow,
      targetGoal: TARGET_GOALS[id],
      isAI: gameMode === 'ai' && id !== 1,
    };
  }

  return players as Record<PlayerId, Player>;
}
