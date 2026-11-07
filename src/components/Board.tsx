import React from 'react';
import type { ActionMode, Player, PlayerId, PlayerCount, Position, Wall as WallType, WallOrientation, WallPreview, VictoryCondition } from '../types/game';
import type { ThemeConfig } from '../types/themes';
import { THEMES } from '../types/themes';
import { Cell } from './Cell';
import { Wall } from './Wall';

interface BoardProps {
  players: Record<PlayerId, Player>;
  activePlayerId: PlayerId;
  playerCount?: PlayerCount;
  walls: WallType[];
  validMoves: Position[];
  wallPreview: WallPreview | null;
  currentMode: ActionMode;
  selectedOrientation: WallOrientation;
  theme?: ThemeConfig;
  victoryCondition?: VictoryCondition;
  lastBotAction?: { type: 'move' | 'wall'; position?: Position; wall?: { x: number; y: number; orientation: WallOrientation } } | null;
  onCellClick: (x: number, y: number) => void;
  onIntersectionClick: (x: number, y: number) => void;
  onConfirmWall: () => void;
}

export const Board: React.FC<BoardProps> = ({
  players,
  activePlayerId,
  playerCount = 2,
  walls,
  validMoves,
  wallPreview,
  currentMode,
  selectedOrientation: _selectedOrientation,
  theme = THEMES.wood,
  victoryCondition = 'classic',
  lastBotAction,
  onCellClick,
  onIntersectionClick,
  onConfirmWall,
}) => {
  const CELL_SIZE = 54;
  const GROOVE_SIZE = 12;
  const PADDING = 24;
  const BOARD_DIMENSION = 9 * CELL_SIZE + 8 * GROOVE_SIZE + PADDING * 2; // 630
  const STEP = CELL_SIZE + GROOVE_SIZE; // 66

  // Coordinates labels
  const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  const rowNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  // Map players by coordinate key "x,y"
  const playersByPos = new Map<string, Player>();
  for (const p of Object.values(players)) {
    if (p) {
      playersByPos.set(`${p.position.x},${p.position.y}`, p);
    }
  }

  // Set of valid move strings "x,y"
  const validMoveKeys = new Set(validMoves.map((m) => `${m.x},${m.y}`));

  return (
    <div className="relative w-full h-full max-h-full max-w-full aspect-square flex items-center justify-center p-0.5 select-none">
      <svg
        viewBox={`0 0 ${BOARD_DIMENSION} ${BOARD_DIMENSION}`}
        className="w-full h-full max-h-full max-w-full drop-shadow-2xl overflow-visible touch-none"
      >
        <defs>
          {/* Dynamic theme board background gradient */}
          <radialGradient id="boardBg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor={theme.boardBgGradient.start} />
            <stop offset="100%" stopColor={theme.boardBgGradient.end} />
          </radialGradient>

          {/* Border rim gradient */}
          <linearGradient id="boardRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.boardRimGradient.start} />
            <stop offset="50%" stopColor={theme.boardRimGradient.mid} />
            <stop offset="100%" stopColor={theme.boardRimGradient.end} />
          </linearGradient>

          {/* Player 1 Goal Bar Gradient (Top row y=0) */}
          <linearGradient id="p1GoalGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor={theme.accentP1} stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* Player 2 Goal Bar Gradient (Bottom row y=8) */}
          <linearGradient id="p2GoalGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor={theme.accentP2} stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* Player 3 Goal Bar Gradient (Right col x=8) */}
          <linearGradient id="p3GoalGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor={theme.accentP3} stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* Player 4 Goal Bar Gradient (Left col x=0) */}
          <linearGradient id="p4GoalGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor={theme.accentP4} stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* Vortex Spiral Gradient */}
          <linearGradient id="vortexSpiralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Board Outer Frame & Shadow */}
        <rect
          x={4}
          y={4}
          width={BOARD_DIMENSION - 8}
          height={BOARD_DIMENSION - 8}
          rx={20}
          ry={20}
          fill="url(#boardBg)"
          stroke="url(#boardRim)"
          strokeWidth="3.5"
        />

        {/* Outer Inset Border */}
        <rect
          x={14}
          y={14}
          width={BOARD_DIMENSION - 28}
          height={BOARD_DIMENSION - 28}
          rx={14}
          ry={14}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
        />

        {/* Player 1 Goal Area Glow (Top row y=0 is target for P1 in classic mode) */}
        {victoryCondition === 'classic' && (
          <rect
            x={PADDING}
            y={PADDING - 8}
            width={9 * CELL_SIZE + 8 * GROOVE_SIZE}
            height={CELL_SIZE + 8}
            rx={8}
            fill="url(#p1GoalGlow)"
            className="pointer-events-none"
          />
        )}

        {/* Player 2 Goal Area Glow (Bottom row y=8 is target for P2 in classic mode) */}
        {victoryCondition === 'classic' && (
          <rect
            x={PADDING}
            y={PADDING + 8 * STEP}
            width={9 * CELL_SIZE + 8 * GROOVE_SIZE}
            height={CELL_SIZE + 8}
            rx={8}
            fill="url(#p2GoalGlow)"
            className="pointer-events-none"
          />
        )}

        {/* 3 & 4-Player Goal Areas (P3 right col x=8, P4 left col x=0 in classic mode) */}
        {victoryCondition === 'classic' && playerCount >= 3 && (
          <rect
            x={PADDING + 8 * STEP}
            y={PADDING}
            width={CELL_SIZE + 8}
            height={9 * CELL_SIZE + 8 * GROOVE_SIZE}
            rx={8}
            fill="url(#p3GoalGlow)"
            className="pointer-events-none"
          />
        )}
        {victoryCondition === 'classic' && playerCount === 4 && (
          <rect
            x={PADDING - 8}
            y={PADDING}
            width={CELL_SIZE + 8}
            height={9 * CELL_SIZE + 8 * GROOVE_SIZE}
            rx={8}
            fill="url(#p4GoalGlow)"
            className="pointer-events-none"
          />
        )}

        {/* Column Coordinates Labels (A - I) */}
        {colLetters.map((letter, i) => (
          <text
            key={`col-${letter}`}
            x={PADDING + i * STEP + CELL_SIZE / 2}
            y={PADDING - 9}
            fill="#64748b"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none font-mono"
          >
            {letter}
          </text>
        ))}

        {/* Row Coordinates Labels (1 - 9) */}
        {rowNumbers.map((num, i) => (
          <text
            key={`row-${num}`}
            x={PADDING - 11}
            y={PADDING + i * STEP + CELL_SIZE / 2}
            fill="#64748b"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none font-mono"
          >
            {num}
          </text>
        ))}

        {/* 81 Board Cells */}
        {Array.from({ length: 9 }).map((_, y) =>
          Array.from({ length: 9 }).map((_, x) => {
            const pixelX = PADDING + x * STEP;
            const pixelY = PADDING + y * STEP;
            const posKey = `${x},${y}`;
            const playerOnCell = playersByPos.get(posKey);
            const isActivePawn = playerOnCell?.id === activePlayerId;
            const isValidMove = currentMode === 'pawn' && validMoveKeys.has(posKey);

            return (
              <Cell
                key={`cell-${x}-${y}`}
                x={x}
                y={y}
                pixelX={pixelX}
                pixelY={pixelY}
                size={CELL_SIZE}
                playerOnCell={playerOnCell}
                isActivePlayerPawn={isActivePawn}
                isValidMove={isValidMove}
                isP1GoalRow={victoryCondition === 'classic' && y === 0}
                isP2GoalRow={victoryCondition === 'classic' && y === 8}
                isP3GoalCol={victoryCondition === 'classic' && playerCount >= 3 && x === 8}
                isP4GoalCol={victoryCondition === 'classic' && playerCount === 4 && x === 0}
                isVortexCenter={victoryCondition === 'vortex' && x === 4 && y === 4}
                theme={theme}
                onSelect={onCellClick}
              />
            );
          })
        )}

        {/* 8x8 Intersection Guides & Generous Touch Targets */}
        {Array.from({ length: 8 }).map((_, wy) =>
          Array.from({ length: 8 }).map((_, wx) => {
            const centerX = PADDING + wx * STEP + CELL_SIZE + GROOVE_SIZE / 2;
            const centerY = PADDING + wy * STEP + CELL_SIZE + GROOVE_SIZE / 2;
            const isSelected =
              wallPreview && wallPreview.x === wx && wallPreview.y === wy;

            return (
              <g
                key={`intersection-${wx}-${wy}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onIntersectionClick(wx, wy);
                }}
                className="cursor-pointer"
              >
                {/* Visual groove intersection dot */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={currentMode === 'wall' ? 4 : 2}
                  fill={
                    isSelected
                      ? theme.accentP1
                      : currentMode === 'wall'
                      ? theme.grooveIntersection
                      : theme.grooveColor
                  }
                  className="transition-all duration-150"
                />

                {/* In wall mode, show subtle crosshair for visual guide */}
                {currentMode === 'wall' && (
                  <g opacity="0.3" className="pointer-events-none">
                    <line
                      x1={centerX - 5}
                      y1={centerY}
                      x2={centerX + 5}
                      y2={centerY}
                      stroke={theme.grooveIntersection}
                      strokeWidth="1"
                    />
                    <line
                      x1={centerX}
                      y1={centerY - 5}
                      x2={centerX}
                      y2={centerY + 5}
                      stroke={theme.grooveIntersection}
                      strokeWidth="1"
                    />
                  </g>
                )}

                {/* Generous invisible touch target (42px diameter) for easy tapping on mobile */}
                <rect
                  x={centerX - 21}
                  y={centerY - 21}
                  width={42}
                  height={42}
                  fill="transparent"
                  className="touch-manipulation"
                />
              </g>
            );
          })
        )}

        {/* Existing Placed Walls */}
        {walls.map((w) => (
          <Wall
            key={w.id}
            x={w.x}
            y={w.y}
            orientation={w.orientation}
            placedBy={w.placedBy}
            theme={theme}
            cellSize={CELL_SIZE}
            grooveSize={GROOVE_SIZE}
            padding={PADDING}
          />
        ))}

        {/* Active Wall Preview */}
        {wallPreview && (
          <Wall
            x={wallPreview.x}
            y={wallPreview.y}
            orientation={wallPreview.orientation}
            isPreview={true}
            isValidPreview={wallPreview.isValid}
            theme={theme}
            onClick={() => {
              if (wallPreview.isValid) {
                onConfirmWall();
              }
            }}
            cellSize={CELL_SIZE}
            grooveSize={GROOVE_SIZE}
            padding={PADDING}
          />
        )}

        {/* Bot Last Action Highlight Indicator */}
        {lastBotAction && lastBotAction.type === 'move' && lastBotAction.position && (
          <circle
            cx={PADDING + lastBotAction.position.x * STEP + CELL_SIZE / 2}
            cy={PADDING + lastBotAction.position.y * STEP + CELL_SIZE / 2}
            r={CELL_SIZE / 2 - 2}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeDasharray="4 4"
            className="animate-spin pointer-events-none opacity-80"
          />
        )}
      </svg>
    </div>
  );
};
