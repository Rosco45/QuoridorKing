import type { AIDifficulty, AIAction, Player, Wall, WallOrientation } from '../types/game';
import { getValidPawnMoves } from './rules';
import { validateWallPlacement, getShortestPathDistanceToGoal } from './pathfinding';
import { INTERSECTIONS_SIZE, hasPlayerReachedGoal } from './coordinates';

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
  difficulty: AIDifficulty,
  allActivePlayers: Player[] = [humanPlayer, aiPlayer]
): AIAction {
  const aiPos = aiPlayer.position;
  const humanPos = humanPlayer.position;
  const aiGoal = aiPlayer.targetGoal;
  const humanGoal = humanPlayer.targetGoal;

  const opponentPositions = allActivePlayers
    .filter((p) => p.id !== aiPlayer.id)
    .map((p) => p.position);

  // 1. Get all legal pawn moves for AI
  const legalPawnMoves = getValidPawnMoves(aiPos, opponentPositions, walls);

  if (legalPawnMoves.length === 0) {
    return { type: 'move', to: aiPos };
  }

  // Current shortest path distances
  const curAIDist = getShortestPathDistanceToGoal(aiPos, aiGoal, walls);
  const curHumanDist = getShortestPathDistanceToGoal(humanPos, humanGoal, walls);

  // Immediate win check: if any pawn move reaches target goal, take it!
  const winningMove = legalPawnMoves.find((m) => hasPlayerReachedGoal(m, aiGoal));
  if (winningMove) {
    return { type: 'move', to: winningMove };
  }

  // Find pawn moves sorted by how much they reduce AI distance
  const ratedPawnMoves = legalPawnMoves.map((move) => {
    const dist = getShortestPathDistanceToGoal(move, aiGoal, walls);
    return {
      move,
      dist,
      delta: curAIDist - dist,
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
            allActivePlayers
          );

          if (validation.isValid) {
            const simulatedWalls: Wall[] = [
              ...walls,
              { id: 'sim', x, y, orientation: ori, placedBy: aiPlayer.id },
            ];

            const newHumanDist = getShortestPathDistanceToGoal(humanPos, humanGoal, simulatedWalls);
            const newAIDist = getShortestPathDistanceToGoal(aiPos, aiGoal, simulatedWalls);

            const deltaHuman = newHumanDist - curHumanDist;
            const deltaAI = newAIDist - curAIDist;

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

  const beneficialWalls = candidateWalls.filter(
    (w) => w.deltaHuman > 0 && w.deltaAI <= w.deltaHuman
  );
  beneficialWalls.sort((a, b) => b.score - a.score);

  // 1. FACILE (Easy)
  if (difficulty === 'easy') {
    const wantWall = Math.random() < 0.2 && candidateWalls.length > 0;

    if (wantWall) {
      const randomWall = candidateWalls[Math.floor(Math.random() * candidateWalls.length)];
      return {
        type: 'wall',
        x: randomWall.x,
        y: randomWall.y,
        orientation: randomWall.orientation,
      };
    }

    if (Math.random() < 0.85 || ratedPawnMoves.length === 1) {
      return { type: 'move', to: bestPawnMove };
    } else {
      const randomMove = legalPawnMoves[Math.floor(Math.random() * legalPawnMoves.length)];
      return { type: 'move', to: randomMove };
    }
  }

  // 2. NORMAL (Medium)
  if (difficulty === 'medium') {
    if (curHumanDist === 1 && beneficialWalls.length > 0) {
      const blocker = beneficialWalls[0];
      return {
        type: 'wall',
        x: blocker.x,
        y: blocker.y,
        orientation: blocker.orientation,
      };
    }

    const isHumanAhead = curHumanDist < curAIDist;

    if (isHumanAhead && beneficialWalls.length > 0) {
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

    return { type: 'move', to: bestPawnMove };
  }

  // 3. DIFFICILE (Hard)
  if (curHumanDist === 1 && beneficialWalls.length > 0) {
    const bestBlocker = beneficialWalls[0];
    return {
      type: 'wall',
      x: bestBlocker.x,
      y: bestBlocker.y,
      orientation: bestBlocker.orientation,
    };
  }

  if (curAIDist === 1) {
    return { type: 'move', to: bestPawnMove };
  }

  if (beneficialWalls.length > 0) {
    const topWall = beneficialWalls[0];

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

  return { type: 'move', to: bestPawnMove };
}
