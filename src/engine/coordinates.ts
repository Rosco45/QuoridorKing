import type { Position } from '../types/game';

export const BOARD_SIZE = 9;
export const INTERSECTIONS_SIZE = 8;
export const MAX_WALLS_PER_PLAYER = 10;

export const INITIAL_POSITIONS: Record<1 | 2, Position> = {
  1: { x: 4, y: 8 }, // Player 1 starts at bottom center, targets row 0
  2: { x: 4, y: 0 }, // Player 2 starts at top center, targets row 8
};

export const TARGET_ROWS: Record<1 | 2, number> = {
  1: 0,
  2: 8,
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
