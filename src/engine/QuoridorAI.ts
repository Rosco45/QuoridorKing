import type { AIDifficulty, AIAction, Player, Wall, WallOrientation } from '../types/game';
import { getValidPawnMoves } from './rules';
import { validateWallPlacement, getShortestPathDistanceToGoal } from './pathfinding';
import { INTERSECTIONS_SIZE, hasPlayerReachedGoal } from './coordinates';

export interface EvaluatedWallCandidate {
  x: number;
  y: number;
  orientation: WallOrientation;
  deltaThreat: number;
  totalOppDelta: number;
  deltaBot: number;
  score: number;
}

export class QuoridorAI {
  /**
   * Computes the next action (pawn move or wall placement) for the active Bot
   * in a 2, 3, or 4 players game, adhering to all Quoridor rules and Golden Rule checks.
   */
  public computeAction(
    activeBot: Player,
    allActivePlayers: Player[],
    walls: Wall[],
    difficulty: AIDifficulty = activeBot.aiDifficulty || 'medium'
  ): AIAction {
    const botPos = activeBot.position;
    const botGoal = activeBot.targetGoal;

    const opponents = allActivePlayers.filter((p) => p.id !== activeBot.id);
    const opponentPositions = opponents.map((p) => p.position);

    // 1. All legal pawn moves for this Bot
    const legalPawnMoves = getValidPawnMoves(botPos, opponentPositions, walls);
    if (legalPawnMoves.length === 0) {
      return { type: 'move', to: botPos };
    }

    // 2. Current shortest BFS distances
    const curBotDist = getShortestPathDistanceToGoal(botPos, botGoal, walls);

    // Evaluate each opponent's current distance to their goal
    const oppDistances = opponents.map((opp) => ({
      player: opp,
      dist: getShortestPathDistanceToGoal(opp.position, opp.targetGoal, walls),
    }));

    // Find the opponent closest to their goal (the most threatening)
    oppDistances.sort((a, b) => a.dist - b.dist);
    const mostThreatening = oppDistances[0] || null;
    const minOppDist = mostThreatening ? mostThreatening.dist : 999;

    // 3. Immediate Win Condition: If any pawn move reaches target goal, take it!
    const winningMove = legalPawnMoves.find((m) => hasPlayerReachedGoal(m, botGoal));
    if (winningMove) {
      return { type: 'move', to: winningMove };
    }

    // Rate legal pawn moves by how much they decrease bot distance
    const ratedPawnMoves = legalPawnMoves.map((m) => {
      const d = getShortestPathDistanceToGoal(m, botGoal, walls);
      return {
        move: m,
        dist: d,
        advance: curBotDist - d, // Positive means getting closer
      };
    });
    ratedPawnMoves.sort((a, b) => b.advance - a.advance);
    const bestPawnMove = ratedPawnMoves[0].move;

    // 4. Candidate walls evaluation (only if bot has walls remaining)
    const candidateWalls: EvaluatedWallCandidate[] = [];

    if (activeBot.wallsRemaining > 0) {
      const orientations: WallOrientation[] = ['horizontal', 'vertical'];

      for (let y = 0; y < INTERSECTIONS_SIZE; y++) {
        for (let x = 0; x < INTERSECTIONS_SIZE; x++) {
          for (const ori of orientations) {
            // Golden Rule validation: ensures NO active player (2, 3, or 4) is blocked
            const validation = validateWallPlacement(
              x,
              y,
              ori,
              walls,
              allActivePlayers
            );

            if (validation.isValid) {
              const simWalls: Wall[] = [
                ...walls,
                { id: 'sim', x, y, orientation: ori, placedBy: activeBot.id },
              ];

              const newBotDist = getShortestPathDistanceToGoal(botPos, botGoal, simWalls);
              const deltaBot = newBotDist - curBotDist;

              let deltaThreat = 0;
              let totalOppDelta = 0;

              for (const opp of opponents) {
                const curD = getShortestPathDistanceToGoal(opp.position, opp.targetGoal, walls);
                const newD = getShortestPathDistanceToGoal(opp.position, opp.targetGoal, simWalls);
                const delta = newD - curD;
                totalOppDelta += delta;

                if (mostThreatening && opp.id === mostThreatening.player.id) {
                  deltaThreat = delta;
                }
              }

              // Utility score: prioritize slowing down the lead opponent while not hurting the bot
              const score = deltaThreat * 25 + totalOppDelta * 10 - deltaBot * 18;

              candidateWalls.push({
                x,
                y,
                orientation: ori,
                deltaThreat,
                totalOppDelta,
                deltaBot,
                score,
              });
            }
          }
        }
      }
    }

    // Filter beneficial walls (slows down opponent without hurting bot more)
    const beneficialWalls = candidateWalls.filter(
      (w) => w.deltaThreat > 0 && w.deltaBot <= w.deltaThreat
    );
    beneficialWalls.sort((a, b) => b.score - a.score);

    // ==========================================
    // 5. Decision according to difficulty level
    // ==========================================

    // --- LEVEL 1: FACILE (Novice) ---
    if (difficulty === 'easy') {
      // 25% chance to try a random legal wall
      const wantWall = Math.random() < 0.25 && candidateWalls.length > 0;
      if (wantWall) {
        const randomWall = candidateWalls[Math.floor(Math.random() * candidateWalls.length)];
        return {
          type: 'wall',
          x: randomWall.x,
          y: randomWall.y,
          orientation: randomWall.orientation,
        };
      }

      // 75% chance to advance towards goal
      if (Math.random() < 0.85 || ratedPawnMoves.length === 1) {
        return { type: 'move', to: bestPawnMove };
      } else {
        const randomMove = legalPawnMoves[Math.floor(Math.random() * legalPawnMoves.length)];
        return { type: 'move', to: randomMove };
      }
    }

    // --- LEVEL 2: MOYEN (Stratège Débutant) ---
    if (difficulty === 'medium') {
      // Emergency: opponent is 1 step away from winning!
      if (minOppDist === 1 && beneficialWalls.length > 0) {
        const blocker = beneficialWalls[0];
        return {
          type: 'wall',
          x: blocker.x,
          y: blocker.y,
          orientation: blocker.orientation,
        };
      }

      // If an opponent is at 3 moves or less and is ahead or tied
      const isOpponentThreatening = minOppDist <= 3 && minOppDist <= curBotDist;

      if (isOpponentThreatening && beneficialWalls.length > 0) {
        if (Math.random() < 0.75) {
          const topSlice = beneficialWalls.slice(0, 3);
          const chosen = topSlice[Math.floor(Math.random() * topSlice.length)];
          return {
            type: 'wall',
            x: chosen.x,
            y: chosen.y,
            orientation: chosen.orientation,
          };
        }
      } else if (beneficialWalls.length > 0 && beneficialWalls[0].deltaThreat >= 2) {
        if (Math.random() < 0.45) {
          const chosen = beneficialWalls[0];
          return {
            type: 'wall',
            x: chosen.x,
            y: chosen.y,
            orientation: chosen.orientation,
          };
        }
      }

      // Default: advance via shortest BFS path
      return { type: 'move', to: bestPawnMove };
    }

    // --- LEVEL 3: DIFFICILE (Heuristique Minimax / Écart de distance) ---
    // 1. Critical defense: opponent is 1 step from victory!
    if (minOppDist === 1 && beneficialWalls.length > 0) {
      const bestBlocker = beneficialWalls[0];
      return {
        type: 'wall',
        x: bestBlocker.x,
        y: bestBlocker.y,
        orientation: bestBlocker.orientation,
      };
    }

    // 2. Critical offense: Bot is 1 step away from victory!
    if (curBotDist === 1) {
      return { type: 'move', to: bestPawnMove };
    }

    // 3. Minimax-style heuristic evaluation:
    // Lead advantage = (Distance of nearest opponent) - (Distance of bot)
    // Higher advantage is better for the bot!
    if (beneficialWalls.length > 0) {
      const topWall = beneficialWalls[0];

      const shouldPlaceWall =
        topWall.deltaThreat >= 3 ||
        (topWall.deltaThreat >= 2 && topWall.deltaBot === 0) ||
        (minOppDist <= 3 && topWall.deltaThreat >= 1) ||
        (minOppDist < curBotDist && topWall.score >= 20);

      if (shouldPlaceWall) {
        return {
          type: 'wall',
          x: topWall.x,
          y: topWall.y,
          orientation: topWall.orientation,
        };
      }
    }

    // Move along best path
    return { type: 'move', to: bestPawnMove };
  }
}

export const quoridorAI = new QuoridorAI();

/**
 * Backward compatibility helper for existing callers
 */
export function computeAIMove(
  aiPlayer: Player,
  humanOrOpponent: Player,
  walls: Wall[],
  difficulty: AIDifficulty = 'medium',
  allActivePlayers: Player[] = [humanOrOpponent, aiPlayer]
): AIAction {
  return quoridorAI.computeAction(aiPlayer, allActivePlayers, walls, difficulty);
}
