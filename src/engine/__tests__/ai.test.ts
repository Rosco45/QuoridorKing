import { describe, it, expect } from 'vitest';
import { computeAIMove } from '../ai';
import { TARGET_GOALS } from '../coordinates';
import type { Player } from '../../types/game';

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
});
