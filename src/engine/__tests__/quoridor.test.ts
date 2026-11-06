import { describe, it, expect } from 'vitest';
import { getValidPawnMoves, checkWallGeometry } from '../rules';
import { hasPathToTarget, validateWallPlacement } from '../pathfinding';
import type { Position, Wall } from '../../types/game';

describe('Quoridor Game Engine Tests', () => {
  describe('Pawn Movement & Jumps', () => {
    it('returns 3 moves for Player 1 from initial position (4, 8) at bottom edge', () => {
      const p1Pos: Position = { x: 4, y: 8 };
      const p2Pos: Position = { x: 4, y: 0 };
      const walls: Wall[] = [];

      const moves = getValidPawnMoves(p1Pos, p2Pos, walls);
      // Valid moves: Up (4, 7), Left (3, 8), Right (5, 8). Down (4, 9) is off-board.
      expect(moves).toHaveLength(3);
      expect(moves).toEqual(
        expect.arrayContaining([
          { x: 4, y: 7 },
          { x: 3, y: 8 },
          { x: 5, y: 8 },
        ])
      );
    });

    it('performs a direct straight jump over adjacent opponent when unblocked', () => {
      // P1 at (4, 4), P2 directly above at (4, 3)
      const p1Pos: Position = { x: 4, y: 4 };
      const p2Pos: Position = { x: 4, y: 3 };
      const walls: Wall[] = [];

      const moves = getValidPawnMoves(p1Pos, p2Pos, walls);
      // Can jump over P2 to (4, 2), plus orthogonal (3, 4), (5, 4), (4, 5)
      expect(moves).toEqual(
        expect.arrayContaining([
          { x: 4, y: 2 }, // Direct Jump
          { x: 3, y: 4 }, // Left
          { x: 5, y: 4 }, // Right
          { x: 4, y: 5 }, // Down
        ])
      );
      // P2's cell (4, 3) itself should NOT be a valid stopping cell
      expect(moves).not.toEqual(expect.arrayContaining([{ x: 4, y: 3 }]));
    });

    it('performs diagonal jumps when straight jump is blocked by a horizontal wall behind opponent', () => {
      // P1 at (4, 4), P2 at (4, 3)
      // Horizontal wall at (4, 2) blocks movement between (4, 2) and (4, 3)
      const p1Pos: Position = { x: 4, y: 4 };
      const p2Pos: Position = { x: 4, y: 3 };
      const wallBehindP2: Wall = {
        id: 'w1',
        x: 4,
        y: 2,
        orientation: 'horizontal',
        placedBy: 1,
      };

      const moves = getValidPawnMoves(p1Pos, p2Pos, [wallBehindP2]);

      // Direct jump (4, 2) is blocked!
      expect(moves).not.toEqual(expect.arrayContaining([{ x: 4, y: 2 }]));

      // Diagonal jumps to side of P2 should be available: (3, 3) and (5, 3)
      expect(moves).toEqual(
        expect.arrayContaining([
          { x: 3, y: 3 }, // Diagonal left
          { x: 5, y: 3 }, // Diagonal right
          { x: 3, y: 4 }, // P1 left
          { x: 5, y: 4 }, // P1 right
          { x: 4, y: 5 }, // P1 down
        ])
      );
    });

    it('performs diagonal jump when opponent is on the board edge', () => {
      // P2 at top edge (4, 0), P1 directly below at (4, 1)
      const p1Pos: Position = { x: 4, y: 1 };
      const p2Pos: Position = { x: 4, y: 0 };
      const walls: Wall[] = [];

      const moves = getValidPawnMoves(p1Pos, p2Pos, walls);
      // Straight jump (4, -1) is off board!
      // Diagonal jumps to sides of P2 are allowed: (3, 0) and (5, 0)
      expect(moves).toEqual(
        expect.arrayContaining([
          { x: 3, y: 0 },
          { x: 5, y: 0 },
          { x: 3, y: 1 },
          { x: 5, y: 1 },
          { x: 4, y: 2 },
        ])
      );
    });
  });

  describe('Wall Geometry & Intersections', () => {
    it('prevents overlapping walls in same orientation', () => {
      const existing: Wall[] = [
        { id: 'w1', x: 2, y: 2, orientation: 'horizontal', placedBy: 1 },
      ];

      // Exact overlap
      const res1 = checkWallGeometry(2, 2, 'horizontal', existing);
      expect(res1.isValid).toBe(false);

      // Partial overlap to left (x=1)
      const res2 = checkWallGeometry(1, 2, 'horizontal', existing);
      expect(res2.isValid).toBe(false);

      // Partial overlap to right (x=3)
      const res3 = checkWallGeometry(3, 2, 'horizontal', existing);
      expect(res3.isValid).toBe(false);

      // Non-overlapping adjacent wall at x=4 is valid
      const res4 = checkWallGeometry(4, 2, 'horizontal', existing);
      expect(res4.isValid).toBe(true);
    });

    it('prevents perpendicular crossing at the same intersection', () => {
      const existing: Wall[] = [
        { id: 'w1', x: 3, y: 3, orientation: 'horizontal', placedBy: 1 },
      ];

      // Vertical wall at exact same intersection (3, 3) crosses through
      const res = checkWallGeometry(3, 3, 'vertical', existing);
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('croise');
    });
  });

  describe('Golden Rule (BFS Path Validation)', () => {
    it('verifies players have unblocked path on an empty board', () => {
      const p1Pos: Position = { x: 4, y: 8 };
      const p2Pos: Position = { x: 4, y: 0 };
      expect(hasPathToTarget(p1Pos, 0, [])).toBe(true);
      expect(hasPathToTarget(p2Pos, 8, [])).toBe(true);
    });

    it('rejects a wall that completely blocks a player from reaching the goal line (Golden Rule)', () => {
      // Build a 2x2 room enclosing cells (3,3)-(4,4)
      // Player 1 is inside at (4, 4)
      // Wall 1: Horizontal at (3, 2) [Top boundary]
      // Wall 2: Horizontal at (3, 4) [Bottom boundary]
      // Wall 3: Vertical at (2, 3) [Left boundary]
      // Wall 4 candidate: Vertical at (4, 3) [Right boundary, closing the room]
      const roomWalls: Wall[] = [
        { id: 'top', x: 3, y: 2, orientation: 'horizontal', placedBy: 1 },
        { id: 'bottom', x: 3, y: 4, orientation: 'horizontal', placedBy: 1 },
        { id: 'left', x: 2, y: 3, orientation: 'vertical', placedBy: 1 },
      ];

      const p1Pos: Position = { x: 4, y: 4 };
      const p2Pos: Position = { x: 4, y: 0 };

      // Wall candidate at (4, 3) vertical has no geometric collisions with the 3 walls
      const geomCheck = checkWallGeometry(4, 3, 'vertical', roomWalls);
      expect(geomCheck.isValid).toBe(true);

      // But it seals P1 inside without any route to goal line y=0!
      const result = validateWallPlacement(
        4,
        3,
        'vertical',
        roomWalls,
        p1Pos,
        p2Pos,
        0,
        8
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Règle d'or");
    });

    it('allows a wall if an alternate path still exists', () => {
      const p1Pos: Position = { x: 4, y: 8 };
      const p2Pos: Position = { x: 4, y: 0 };
      const walls: Wall[] = [
        { id: 'w1', x: 3, y: 0, orientation: 'vertical', placedBy: 1 },
      ];

      const result = validateWallPlacement(
        4,
        0,
        'vertical',
        walls,
        p1Pos,
        p2Pos,
        0,
        8
      );

      // (4, 0) vertical is allowed because (4, 0) can still move down to (4, 1) and escape
      expect(result.isValid).toBe(true);
    });
  });
});
