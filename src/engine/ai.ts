import type { AIDifficulty, AIAction, Player, Wall, WallOrientation } from '../types/game';
import { getValidPawnMoves } from './rules';
import { validateWallPlacement, getShortestPathDistance } from './pathfinding';
import { INTERSECTIONS_SIZE } from './coordinates';

interface EvaluatedWall {
  x: number;
  y: number;
  orientation: WallOrientation;
  deltaHuman: number;
  deltaAI: number;
  score: number;
}

export function computeAIMove(
  aiPlayer: Player,
  humanPlayer: Player,
  walls: Wall[],
  difficulty: AIDifficulty
): AIAction {
  const aiPos = aiPlayer.position;
  const humanPos = humanPlayer.position;
  const aiTarget = aiPlayer.targetRow;
  const humanTarget = humanPlayer.targetRow;

  // 1. Get all legal pawn moves for AI
  const legalPawnMoves = getValidPawnMoves(aiPos, humanPos, walls);

  // If for some reason no moves exist, fallback (should never happen)
  if (legalPawnMoves.length === 0) {
    return { type: 'move', to: aiPos };
  }

  // Current shortest path distances
  const curAIDist = getShortestPathDistance(aiPos, aiTarget, walls);
  const curHumanDist = getShortestPathDistance(humanPos, humanTarget, walls);

  // Immediate win check: if any pawn move reaches target row, take it!
  const winningMove = legalPawnMoves.find((m) => m.y === aiTarget);
  if (winningMove) {
    return { type: 'move', to: winningMove };
  }

  // Find pawn moves sorted by how much they reduce AI distance
  const ratedPawnMoves = legalPawnMoves.map((move) => {
    const dist = getShortestPathDistance(move, aiTarget, walls);
    return {
      move,
      dist,
      delta: curAIDist - dist, // positive if moving closer
    };
  });
  ratedPawnMoves.sort((a, b) => b.delta - a.delta);
  const bestPawnMove = ratedPawnMoves[0].move;

  // 2. Compute candidate legal walls if AI has walls left
  const candidateWalls: EvaluatedWall[] = [];

  if (aiPlayer.wallsRemaining > 0) {
    const orientations: WallOrientation[] = ['horizontal', 'vertical'];

    for (let y = 0; y < INTERSECTIONS_SIZE; y++) {
      for (let x = 0; x < INTERSECTIONS_SIZE; x++) {
        for (const ori of orientations) {
          const validation = validateWallPlacement(
            x,
            y,
            ori,
            walls,
            humanPos,
            aiPos,
            humanTarget,
            aiTarget
          );

          if (validation.isValid) {
            const simulatedWalls: Wall[] = [
              ...walls,
              { id: 'sim', x, y, orientation: ori, placedBy: aiPlayer.id },
            ];

            const newHumanDist = getShortestPathDistance(humanPos, humanTarget, simulatedWalls);
            const newAIDist = getShortestPathDistance(aiPos, aiTarget, simulatedWalls);

            const deltaHuman = newHumanDist - curHumanDist; // > 0 means human slowed down
            const deltaAI = newAIDist - curAIDist; // > 0 means AI slowed down

            const score = deltaHuman * 15 - deltaAI * 12;

            candidateWalls.push({
              x,
              y,
              orientation: ori,
              deltaHuman,
              deltaAI,
              score,
            });
          }
        }
      }
    }
  }

  // Filter walls that actually impede the human without severely hurting AI
  const beneficialWalls = candidateWalls.filter(
    (w) => w.deltaHuman > 0 && w.deltaAI <= w.deltaHuman
  );
  beneficialWalls.sort((a, b) => b.score - a.score);

  // --- Difficulty branch ---

  // 1. FACILE (Easy)
  if (difficulty === 'easy') {
    // 80% chance move pawn along shortest path (or random good move)
    // 20% chance place a random legal wall if available
    const wantWall = Math.random() < 0.2 && candidateWalls.length > 0;

    if (wantWall) {
      // Pick a random legal wall
      const randomWall = candidateWalls[Math.floor(Math.random() * candidateWalls.length)];
      return {
        type: 'wall',
        x: randomWall.x,
        y: randomWall.y,
        orientation: randomWall.orientation,
      };
    }

    // 85% pick best pawn move, 15% pick any legal pawn move
    if (Math.random() < 0.85 || ratedPawnMoves.length === 1) {
      return { type: 'move', to: bestPawnMove };
    } else {
      const randomMove = legalPawnMoves[Math.floor(Math.random() * legalPawnMoves.length)];
      return { type: 'move', to: randomMove };
    }
  }

  // 2. NORMAL (Medium)
  if (difficulty === 'medium') {
    // If human is 1 step from victory, must try to block if possible!
    if (curHumanDist === 1 && beneficialWalls.length > 0) {
      const blocker = beneficialWalls[0];
      return {
        type: 'wall',
        x: blocker.x,
        y: blocker.y,
        orientation: blocker.orientation,
      };
    }

    // If human is leading (curHumanDist < curAIDist)
    const isHumanAhead = curHumanDist < curAIDist;

    if (isHumanAhead && beneficialWalls.length > 0) {
      // 70% chance place one of the top 3 beneficial walls
      if (Math.random() < 0.7) {
        const topSlice = beneficialWalls.slice(0, 3);
        const chosen = topSlice[Math.floor(Math.random() * topSlice.length)];
        return {
          type: 'wall',
          x: chosen.x,
          y: chosen.y,
          orientation: chosen.orientation,
        };
      }
    } else if (beneficialWalls.length > 0 && beneficialWalls[0].deltaHuman >= 2) {
      // High value wall available (+2 human steps)
      if (Math.random() < 0.4) {
        const chosen = beneficialWalls[0];
        return {
          type: 'wall',
          x: chosen.x,
          y: chosen.y,
          orientation: chosen.orientation,
        };
      }
    }

    // Default: advance along shortest path
    return { type: 'move', to: bestPawnMove };
  }

  // 3. DIFFICILE (Hard)
  // Emergency defense: if human is 1 step from winning, AI MUST block if any wall delays them
  if (curHumanDist === 1 && beneficialWalls.length > 0) {
    const bestBlocker = beneficialWalls[0];
    return {
      type: 'wall',
      x: bestBlocker.x,
      y: bestBlocker.y,
      orientation: bestBlocker.orientation,
    };
  }

  // If AI is 1 step from goal, rush to goal!
  if (curAIDist === 1) {
    return { type: 'move', to: bestPawnMove };
  }

  if (beneficialWalls.length > 0) {
    const topWall = beneficialWalls[0];

    // Condition to place wall:
    // 1. It slows the human by at least 2 steps, OR
    // 2. Human is ahead and this wall levels or flips the advantage, OR
    // 3. Human is close to winning (curHumanDist <= 3) and wall slows them by >= 1 step
    const shouldPlaceWall =
      topWall.deltaHuman >= 3 ||
      (topWall.deltaHuman >= 2 && topWall.deltaAI === 0) ||
      (curHumanDist <= 3 && topWall.deltaHuman >= 1) ||
      (curHumanDist < curAIDist && topWall.score >= 20);

    if (shouldPlaceWall) {
      return {
        type: 'wall',
        x: topWall.x,
        y: topWall.y,
        orientation: topWall.orientation,
      };
    }
  }

  // Fallback / default best move: advance pawn along optimal path
  return { type: 'move', to: bestPawnMove };
}
