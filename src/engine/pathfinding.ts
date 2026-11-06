import type { Position, Wall, WallOrientation } from '../types/game';
import { BOARD_SIZE } from './coordinates';
import { checkWallGeometry, isMoveBlockedByWall, type WallValidationResult } from './rules';

/**
 * Checks if a player has at least one valid unblocked path to reach their target row
 * using Breadth-First Search (BFS).
 */
export function hasPathToTarget(
  start: Position,
  targetRow: number,
  walls: Wall[]
): boolean {
  if (start.y === targetRow) return true;

  const visited = Array.from({ length: BOARD_SIZE }, () =>
    new Array<boolean>(BOARD_SIZE).fill(false)
  );
  const queue: Position[] = [{ x: start.x, y: start.y }];
  visited[start.y][start.x] = true;

  const directions = [
    { dx: 0, dy: -1 }, // Up
    { dx: 0, dy: 1 },  // Down
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 },  // Right
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.y === targetRow) {
      return true;
    }

    for (const dir of directions) {
      const nextX = current.x + dir.dx;
      const nextY = current.y + dir.dy;

      // Board boundary check
      if (nextX < 0 || nextX >= BOARD_SIZE || nextY < 0 || nextY >= BOARD_SIZE) {
        continue;
      }

      if (visited[nextY][nextX]) {
        continue;
      }

      const nextPos: Position = { x: nextX, y: nextY };

      // Wall obstruction check between current and nextPos
      if (!isMoveBlockedByWall(current, nextPos, walls)) {
        visited[nextY][nextX] = true;
        queue.push(nextPos);
      }
    }
  }

  return false;
}

/**
 * Returns shortest path distance from start to target row, or -1 if unreachable.
 */
export function getShortestPathDistance(
  start: Position,
  targetRow: number,
  walls: Wall[]
): number {
  if (start.y === targetRow) return 0;

  const visited = Array.from({ length: BOARD_SIZE }, () =>
    new Array<number>(BOARD_SIZE).fill(-1)
  );
  const queue: Position[] = [{ x: start.x, y: start.y }];
  visited[start.y][start.x] = 0;

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = visited[current.y][current.x];

    if (current.y === targetRow) {
      return currentDist;
    }

    for (const dir of directions) {
      const nextX = current.x + dir.dx;
      const nextY = current.y + dir.dy;

      if (nextX < 0 || nextX >= BOARD_SIZE || nextY < 0 || nextY >= BOARD_SIZE) {
        continue;
      }

      if (visited[nextY][nextX] !== -1) {
        continue;
      }

      const nextPos: Position = { x: nextX, y: nextY };
      if (!isMoveBlockedByWall(current, nextPos, walls)) {
        visited[nextY][nextX] = currentDist + 1;
        queue.push(nextPos);
      }
    }
  }

  return -1;
}

/**
 * Golden Rule Validation:
 * 1. Checks geometric placement (overlap, intersection collision, boundaries).
 * 2. Simulates the wall placement and runs BFS pathfinding for both players.
 * If either player's path to their goal row is completely cut off, the wall is rejected.
 */
export function validateWallPlacement(
  x: number,
  y: number,
  orientation: WallOrientation,
  existingWalls: Wall[],
  p1Pos: Position,
  p2Pos: Position,
  p1TargetRow: number = 0,
  p2TargetRow: number = 8
): WallValidationResult {
  // Step 1: Geometry check
  const geomResult = checkWallGeometry(x, y, orientation, existingWalls);
  if (!geomResult.isValid) {
    return geomResult;
  }

  // Step 2: Golden Rule (Path obstruction check via BFS)
  const candidateWall: Wall = {
    id: 'simulation_wall',
    x,
    y,
    orientation,
    placedBy: 1,
  };

  const simulatedWalls = [...existingWalls, candidateWall];

  const p1HasPath = hasPathToTarget(p1Pos, p1TargetRow, simulatedWalls);
  if (!p1HasPath) {
    return {
      isValid: false,
      reason: "Règle d'or : Ce mur enferme le Joueur 1 sans aucun chemin vers son but !",
    };
  }

  const p2HasPath = hasPathToTarget(p2Pos, p2TargetRow, simulatedWalls);
  if (!p2HasPath) {
    return {
      isValid: false,
      reason: "Règle d'or : Ce mur enferme le Joueur 2 sans aucun chemin vers son but !",
    };
  }

  return { isValid: true };
}
