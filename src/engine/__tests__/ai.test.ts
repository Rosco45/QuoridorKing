import { describe, it, expect } from 'vitest';
import { computeAIMove } from '../ai';
import { quoridorAI } from '../QuoridorAI';
import { TARGET_GOALS, createInitialPlayers } from '../coordinates';
import type { Player, Wall } from '../../types/game';
import { validateWallPlacement } from '../pathfinding';

describe('AI Engine Tests (Facile, Normal, Difficile)', () => {
  const baseHuman: Player = {
    id: 1,
    name: 'Humain',
    position: { x: 4, y: 8 },
    wallsRemaining: 10,
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    targetGoal: TARGET_GOALS[1],
  };

  const baseAI: Player = {
    id: 2,
    name: 'IA',
    position: { x: 4, y: 0 },
    wallsRemaining: 10,
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    targetGoal: TARGET_GOALS[2],
    isAI: true,
  };

  it('computes a valid action for each difficulty on starting board', () => {
    const difficulties = ['easy', 'medium', 'hard'] as const;

    for (const diff of difficulties) {
      const action = computeAIMove(baseAI, baseHuman, [], diff);
      expect(action).toBeDefined();

      if (action.type === 'move') {
        expect(action.to.y).toBeGreaterThanOrEqual(0);
        expect(action.to.y).toBeLessThanOrEqual(8);
      } else {
        expect(action.x).toBeGreaterThanOrEqual(0);
        expect(action.x).toBeLessThanOrEqual(7);
        expect(action.y).toBeGreaterThanOrEqual(0);
        expect(action.y).toBeLessThanOrEqual(7);
      }
    }
  });

  it('immediately moves into the target row to win when adjacent', () => {
    const nearWinAI: Player = {
      ...baseAI,
      position: { x: 2, y: 7 }, // 1 step from targetGoal row 8!
    };

    const action = computeAIMove(nearWinAI, baseHuman, [], 'hard');
    expect(action.type).toBe('move');
    if (action.type === 'move') {
      expect(action.to.y).toBe(8); // Reaches winning baseline!
    }
  });

  it('difficile AI attempts to block human when human is 1 step from winning', () => {
    const nearWinHuman: Player = {
      ...baseHuman,
      position: { x: 4, y: 1 }, // 1 step from targetGoal row 0!
    };

    const action = computeAIMove(baseAI, nearWinHuman, [], 'hard');
    expect(action.type).toBe('wall');
  });

  it('supports 3 players mode with QuoridorAI', () => {
    const players3p = createInitialPlayers(3, 'ai');
    const bot = players3p[2]; // Slot 2 is Bot
    const allPlayers = Object.values(players3p);

    const action = quoridorAI.computeAction(bot, allPlayers, [], 'hard');
    expect(action).toBeDefined();

    if (action.type === 'move') {
      expect(action.to).toBeDefined();
    } else {
      // If AI placed a wall, it MUST be valid for all 3 players under Golden Rule
      const validation = validateWallPlacement(
        action.x,
        action.y,
        action.orientation,
        [],
        allPlayers
      );
      expect(validation.isValid).toBe(true);
    }
  });

  it('supports 4 players mode with QuoridorAI and multiple bots', () => {
    const players4p = createInitialPlayers(4, 'ai');
    const bot3 = players4p[3]; // Slot 3 Bot Titan
    const allPlayers = Object.values(players4p);

    const action = quoridorAI.computeAction(bot3, allPlayers, [], 'medium');
    expect(action).toBeDefined();

    if (action.type === 'wall') {
      const validation = validateWallPlacement(
        action.x,
        action.y,
        action.orientation,
        [],
        allPlayers
      );
      expect(validation.isValid).toBe(true);
    }
  });

  it('respects the Golden Rule and never places an illegal blocking wall in 3-player or 4-player game', () => {
    const players3p = createInitialPlayers(3, 'ai');
    const bot = players3p[3]; // Player 3 (Left to Right)
    const allPlayers = Object.values(players3p);

    // Provide existing walls that almost trap a player
    const walls: Wall[] = [
      { id: 'w1', x: 0, y: 3, orientation: 'horizontal', placedBy: 1 },
      { id: 'w2', x: 0, y: 4, orientation: 'horizontal', placedBy: 1 },
    ];

    const action = quoridorAI.computeAction(bot, allPlayers, walls, 'hard');
    expect(action).toBeDefined();

    if (action.type === 'wall') {
      const val = validateWallPlacement(action.x, action.y, action.orientation, walls, allPlayers);
      expect(val.isValid).toBe(true);
    }
  });
});
