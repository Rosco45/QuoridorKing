import { describe, it, expect } from 'vitest';
import { getValidPawnMoves, checkWallGeometry } from '../rules';
import { hasPathToGoal, validateWallPlacement } from '../pathfinding';
import { TARGET_GOALS } from '../coordinates';
import type { Position, Wall, Player } from '../../types/game';

describe('Quoridor Game Engine Tests', () => {
  describe('Pawn Movement & Jumps (2 to 4 Players)', () => {
    it('returns 3 moves for Player 1 from initial position (4, 8) at bottom edge', () => {
      const p1Pos: Position = { x: 4, y: 8 };
      const opponents: Position[] = [{ x: 4, y: 0 }];
      const walls: Wall[] = [];

      const moves = getValidPawnMoves(p1Pos, opponents, walls);
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
      const p1Pos: Position = { x: 4, y: 4 };
      const opponents: Position[] = [{ x: 4, y: 3 }];
      const walls: Wall[] = [];

      const moves = getValidPawnMoves(p1Pos, opponents, walls);
      expect(moves).toEqual(
        expect.arrayContaining([
          { x: 4, y: 2 }, // Direct Jump
          { x: 3, y: 4 }, // Left
          { x: 5, y: 4 }, // Right
          { x: 4, y: 5 }, // Down
        ])
      );
      expect(moves).not.toEqual(expect.arrayContaining([{ x: 4, y: 3 }]));
    });

    it('performs diagonal jumps when straight jump is blocked by a horizontal wall behind opponent', () => {
      const p1Pos: Position = { x: 4, y: 4 };
      const opponents: Position[] = [{ x: 4, y: 3 }];
      const wallBehindP2: Wall = {
        id: 'w1',
        x: 4,
        y: 2,
        orientation: 'horizontal',
        placedBy: 1,
      };

      const moves = getValidPawnMoves(p1Pos, opponents, [wallBehindP2]);

      expect(moves).not.toEqual(expect.arrayContaining([{ x: 4, y: 2 }]));
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

    it('performs diagonal jumps in 4-player mode when straight jump is blocked by a third player pawn', () => {
      // P1 at (4, 4), Opponent A at (4, 3), Opponent B directly behind at (4, 2)
      const p1Pos: Position = { x: 4, y: 4 };
      const opponents: Position[] = [
        { x: 4, y: 3 }, // Opponent A
        { x: 4, y: 2 }, // Opponent B blocking straight jump!
      ];

      const moves = getValidPawnMoves(p1Pos, opponents, []);

      // Cannot land on (4, 2) since Opponent B is already there
      expect(moves).not.toEqual(expect.arrayContaining([{ x: 4, y: 2 }]));
      // Diagonal jumps around Opponent A are allowed!
      expect(moves).toEqual(
        expect.arrayContaining([
          { x: 3, y: 3 }, // Diag left
          { x: 5, y: 3 }, // Diag right
        ])
      );
    });
  });

  describe('Wall Geometry & Intersections', () => {
    it('prevents overlapping walls in same orientation', () => {
      const existing: Wall[] = [
        { id: 'w1', x: 2, y: 2, orientation: 'horizontal', placedBy: 1 },
      ];

      expect(checkWallGeometry(2, 2, 'horizontal', existing).isValid).toBe(false);
      expect(checkWallGeometry(1, 2, 'horizontal', existing).isValid).toBe(false);
      expect(checkWallGeometry(3, 2, 'horizontal', existing).isValid).toBe(false);
      expect(checkWallGeometry(4, 2, 'horizontal', existing).isValid).toBe(true);
    });

    it('prevents perpendicular crossing at the same intersection', () => {
      const existing: Wall[] = [
        { id: 'w1', x: 3, y: 3, orientation: 'horizontal', placedBy: 1 },
      ];

      const res = checkWallGeometry(3, 3, 'vertical', existing);
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('croise');
    });
  });

  describe('Golden Rule (BFS Path Validation for 2 to 4 Players)', () => {
    const createPlayer = (id: 1 | 2 | 3 | 4, pos: Position): Player => ({
      id,
      name: `Joueur ${id}`,
      position: pos,
      wallsRemaining: 5,
      color: '#fff',
      glowColor: '#fff',
      targetGoal: TARGET_GOALS[id],
    });

    it('verifies all 4 players have unblocked path on an empty board', () => {
      const p1 = createPlayer(1, { x: 4, y: 8 });
      const p2 = createPlayer(2, { x: 4, y: 0 });
      const p3 = createPlayer(3, { x: 0, y: 4 });
      const p4 = createPlayer(4, { x: 8, y: 4 });

      expect(hasPathToGoal(p1.position, p1.targetGoal, [])).toBe(true);
      expect(hasPathToGoal(p2.position, p2.targetGoal, [])).toBe(true);
      expect(hasPathToGoal(p3.position, p3.targetGoal, [])).toBe(true);
      expect(hasPathToGoal(p4.position, p4.targetGoal, [])).toBe(true);
    });

    it('rejects a wall that completely blocks Player 3 (column goal x=8)', () => {
      // P3 is at (0, 4), targets col 8
      // Box P3 in corner:
      // Vertical wall at (0, 3) and (0, 4) blocking right exit to col 1
      const p1 = createPlayer(1, { x: 4, y: 8 });
      const p3 = createPlayer(3, { x: 0, y: 0 }); // In corner

      const walls: Wall[] = [
        { id: '1', x: 0, y: 0, orientation: 'horizontal', placedBy: 1 }, // blocks (0,0)-(0,1)
      ];

      // Placing a vertical wall at (0, 0) would cross or block
      const result = validateWallPlacement(0, 0, 'vertical', walls, [p1, p3]);
      expect(result.isValid).toBe(false);
    });
  });
});
