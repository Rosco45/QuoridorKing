import type { Position, Wall, WallOrientation } from '../types/game';
import { isWithinBoard, isWithinIntersections } from './coordinates';

/**
 * Checks if movement between two directly adjacent orthogonal cells is blocked by any wall.
 */
export function isMoveBlockedByWall(
  from: Position,
  to: Position,
  walls: Wall[]
): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Horizontal movement between (from.x, from.y) and (to.x, to.y)
  if (dy === 0 && Math.abs(dx) === 1) {
    const leftX = Math.min(from.x, to.x);
    const y = from.y;

    // Blocked if there's a vertical wall at (leftX, y) or (leftX, y - 1)
    return walls.some(
      (w) =>
        w.orientation === 'vertical' &&
        w.x === leftX &&
        (w.y === y || w.y === y - 1)
    );
  }

  // Vertical movement between (from.x, from.y) and (to.x, to.y)
  if (dx === 0 && Math.abs(dy) === 1) {
    const topY = Math.min(from.y, to.y);
    const x = from.x;

    // Blocked if there's a horizontal wall at (x, topY) or (x - 1, topY)
    return walls.some(
      (w) =>
        w.orientation === 'horizontal' &&
        w.y === topY &&
        (w.x === x || w.x === x - 1)
    );
  }

  return true;
}

/**
 * Checks if two positions are orthogonal neighbors.
 */
export function areNeighbors(p1: Position, p2: Position): boolean {
  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

/**
 * Computes all legal pawn moves for a player at currentPosition,
 * given opponentPosition and placed walls.
 */
export function getValidPawnMoves(
  currentPos: Position,
  opponentPos: Position,
  walls: Wall[]
): Position[] {
  const validMoves: Position[] = [];
  const orthogonalDirections = [
    { dx: 0, dy: -1 }, // Up
    { dx: 0, dy: 1 },  // Down
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 },  // Right
  ];

  for (const dir of orthogonalDirections) {
    const target: Position = { x: currentPos.x + dir.dx, y: currentPos.y + dir.dy };

    // Off-board check
    if (!isWithinBoard(target.x, target.y)) continue;

    // Wall obstruction between current and target
    if (isMoveBlockedByWall(currentPos, target, walls)) continue;

    // If opponent is NOT at target, this is a standard legal move
    if (target.x !== opponentPos.x || target.y !== opponentPos.y) {
      validMoves.push(target);
      continue;
    }

    // Opponent is directly adjacent! Check jump moves:
    const straightTarget: Position = {
      x: opponentPos.x + dir.dx,
      y: opponentPos.y + dir.dy,
    };

    const isStraightWithinBoard = isWithinBoard(straightTarget.x, straightTarget.y);
    const isStraightBlockedByWall =
      !isStraightWithinBoard ||
      isMoveBlockedByWall(opponentPos, straightTarget, walls);

    if (isStraightWithinBoard && !isStraightBlockedByWall) {
      // Direct jump over opponent is legal
      validMoves.push(straightTarget);
    } else {
      // Direct jump is blocked by a wall or board edge:
      // Official rule: Player can jump diagonally to either perpendicular side
      const perpDirs =
        dir.dx === 0
          ? [
              { dx: -1, dy: 0 },
              { dx: 1, dy: 0 },
            ]
          : [
              { dx: 0, dy: -1 },
              { dx: 0, dy: 1 },
            ];

      for (const perp of perpDirs) {
        const diagTarget: Position = {
          x: opponentPos.x + perp.dx,
          y: opponentPos.y + perp.dy,
        };

        if (!isWithinBoard(diagTarget.x, diagTarget.y)) continue;

        // Diagonal jump requires moving from opponent cell to diagonal cell without wall obstruction
        if (!isMoveBlockedByWall(opponentPos, diagTarget, walls)) {
          validMoves.push(diagTarget);
        }
      }
    }
  }

  return validMoves;
}

export interface WallValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates wall geometric placement (coordinates, overlaps, crossings).
 * Does not check BFS golden rule (handled separately).
 */
export function checkWallGeometry(
  x: number,
  y: number,
  orientation: WallOrientation,
  existingWalls: Wall[]
): WallValidationResult {
  if (!isWithinIntersections(x, y)) {
    return { isValid: false, reason: 'Emplacement en dehors du plateau.' };
  }

  // Check collision with existing walls
  for (const w of existingWalls) {
    // 1. Cross collision: Horizontal and vertical walls intersecting at the exact same coordinate
    if (w.x === x && w.y === y && w.orientation !== orientation) {
      return {
        isValid: false,
        reason: 'Un mur transversal croise déjà cette intersection.',
      };
    }

    // 2. Exact overlap
    if (w.x === x && w.y === y && w.orientation === orientation) {
      return { isValid: false, reason: 'Un mur existe déjà à cet endroit.' };
    }

    // 3. Partial overlap along the same line
    if (orientation === 'horizontal' && w.orientation === 'horizontal') {
      if (w.y === y && (w.x === x - 1 || w.x === x + 1)) {
        return {
          isValid: false,
          reason: 'Chevauchement avec un mur horizontal existant.',
        };
      }
    }

    if (orientation === 'vertical' && w.orientation === 'vertical') {
      if (w.x === x && (w.y === y - 1 || w.y === y + 1)) {
        return {
          isValid: false,
          reason: 'Chevauchement avec un mur vertical existant.',
        };
      }
    }
  }

  return { isValid: true };
}
