import React from 'react';
import type { Player } from '../types/game';

interface CellProps {
  x: number;
  y: number;
  pixelX: number;
  pixelY: number;
  size: number;
  playerOnCell?: Player;
  isActivePlayerPawn?: boolean;
  isValidMove?: boolean;
  isP1GoalRow?: boolean;
  isP2GoalRow?: boolean;
  onSelect: (x: number, y: number) => void;
}

export const Cell: React.FC<CellProps> = ({
  x,
  y,
  pixelX,
  pixelY,
  size,
  playerOnCell,
  isActivePlayerPawn,
  isValidMove,
  isP1GoalRow,
  isP2GoalRow,
  onSelect,
}) => {
  const radius = 8;
  const centerX = pixelX + size / 2;
  const centerY = pixelY + size / 2;
  const pawnRadius = size * 0.36;

  return (
    <g
      className="cell-group cursor-pointer transition-all duration-150"
      onClick={() => onSelect(x, y)}
      role="button"
      tabIndex={0}
      aria-label={`Case ${String.fromCharCode(65 + x)}${y + 1}`}
    >
      {/* Base Cell Tile */}
      <rect
        x={pixelX}
        y={pixelY}
        width={size}
        height={size}
        rx={radius}
        ry={radius}
        className={`transition-colors duration-150 ${
          isValidMove
            ? 'fill-[#2d3a35] stroke-emerald-400/80 stroke-2'
            : isP1GoalRow
            ? 'fill-[#1e2330] stroke-sky-500/30 stroke-1'
            : isP2GoalRow
            ? 'fill-[#281e22] stroke-amber-500/30 stroke-1'
            : 'fill-[#1e212b] stroke-slate-700/40 stroke-1'
        }`}
      />

      {/* Subtle Inner Bevel / Highlight */}
      <rect
        x={pixelX + 2}
        y={pixelY + 2}
        width={size - 4}
        height={size - 4}
        rx={radius - 2}
        ry={radius - 2}
        fill="none"
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth="1"
      />

      {/* Goal Line Accent dots or bar indicators */}
      {isP1GoalRow && (
        <line
          x1={pixelX + 6}
          y1={pixelY + 3}
          x2={pixelX + size - 6}
          y2={pixelY + 3}
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.65}
        />
      )}
      {isP2GoalRow && (
        <line
          x1={pixelX + 6}
          y1={pixelY + size - 3}
          x2={pixelX + size - 6}
          y2={pixelY + size - 3}
          stroke="#f97316"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.65}
        />
      )}

      {/* Valid Move Indicator (pulsing ring & target circle) */}
      {isValidMove && (
        <g className="pointer-events-none">
          <circle
            cx={centerX}
            cy={centerY}
            r={size * 0.28}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="4 2"
            opacity="0.8"
          >
            <animate
              attributeName="r"
              values={`${size * 0.24};${size * 0.32};${size * 0.24}`}
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={centerX}
            cy={centerY}
            r={size * 0.14}
            fill="#34d399"
            className="drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          />
        </g>
      )}

      {/* Player Pawn */}
      {playerOnCell && (
        <g
          className={`player-pawn transition-transform duration-200 ${
            isActivePlayerPawn ? 'filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]' : ''
          }`}
        >
          {/* Active Player Halo/Glow */}
          {isActivePlayerPawn && (
            <circle
              cx={centerX}
              cy={centerY}
              r={pawnRadius + 6}
              fill="none"
              stroke={playerOnCell.id === 1 ? '#38bdf8' : '#f97316'}
              strokeWidth="2.5"
              opacity="0.75"
            >
              <animate
                attributeName="r"
                values={`${pawnRadius + 4};${pawnRadius + 9};${pawnRadius + 4}`}
                dur="1.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.4;0.9;0.4"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </circle>
          )}

          {/* Pawn Shadow */}
          <ellipse
            cx={centerX}
            cy={centerY + pawnRadius * 0.55}
            rx={pawnRadius * 0.9}
            ry={pawnRadius * 0.4}
            fill="rgba(0, 0, 0, 0.55)"
          />

          {/* Pawn Outer Ring */}
          <circle
            cx={centerX}
            cy={centerY}
            r={pawnRadius}
            fill={playerOnCell.id === 1 ? '#0284c7' : '#c2410c'}
            stroke={playerOnCell.id === 1 ? '#bae6fd' : '#fed7aa'}
            strokeWidth="2"
          />

          {/* Pawn Gradient Core */}
          <circle
            cx={centerX - pawnRadius * 0.2}
            cy={centerY - pawnRadius * 0.2}
            r={pawnRadius * 0.72}
            fill={playerOnCell.id === 1 ? '#38bdf8' : '#fb923c'}
            opacity="0.9"
          />

          {/* Crown / Number Emblem */}
          <g transform={`translate(${centerX - 9}, ${centerY - 9})`}>
            {playerOnCell.id === 1 ? (
              // Player 1 Crown / Crest (Cyan)
              <path
                d="M3 13h12l-1-7-3 4-2-6-2 6-3-4z"
                fill="#ffffff"
                stroke="#0369a1"
                strokeWidth="0.8"
              />
            ) : (
              // Player 2 Crown / Crest (Orange)
              <path
                d="M3 13h12l-1-7-3 4-2-6-2 6-3-4z"
                fill="#ffffff"
                stroke="#9a3412"
                strokeWidth="0.8"
              />
            )}
          </g>

          {/* Highlight Specular Reflection */}
          <ellipse
            cx={centerX - pawnRadius * 0.35}
            cy={centerY - pawnRadius * 0.35}
            rx={pawnRadius * 0.28}
            ry={pawnRadius * 0.16}
            fill="rgba(255, 255, 255, 0.6)"
            transform={`rotate(-30 ${centerX - pawnRadius * 0.35} ${centerY - pawnRadius * 0.35})`}
          />
        </g>
      )}
    </g>
  );
};
