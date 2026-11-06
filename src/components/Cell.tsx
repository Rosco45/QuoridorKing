import React from 'react';
import type { Player } from '../types/game';
import type { ThemeConfig } from '../types/themes';
import { THEMES } from '../types/themes';

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
  isP3GoalCol?: boolean;
  isP4GoalCol?: boolean;
  theme?: ThemeConfig;
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
  isP3GoalCol,
  isP4GoalCol,
  theme = THEMES.wood,
  onSelect,
}) => {
  const radius = 8;
  const centerX = pixelX + size / 2;
  const centerY = pixelY + size / 2;
  const pawnRadius = size * 0.36;

  // Colors per player ID
  const playerAccent = playerOnCell
    ? playerOnCell.id === 1
      ? theme.accentP1
      : playerOnCell.id === 2
      ? theme.accentP2
      : playerOnCell.id === 3
      ? theme.accentP3
      : theme.accentP4
    : '#fff';

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
        fill={isValidMove ? theme.cellValidMove : theme.cellDefault}
        stroke={isValidMove ? '#10b981' : theme.cellBorder}
        strokeWidth={isValidMove ? 2 : 1}
        className="transition-colors duration-150"
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
        stroke="rgba(255, 255, 255, 0.05)"
        strokeWidth="1"
      />

      {/* Goal Line Accent Bars */}
      {isP1GoalRow && (
        <line
          x1={pixelX + 6}
          y1={pixelY + 3}
          x2={pixelX + size - 6}
          y2={pixelY + 3}
          stroke={theme.accentP1}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.7}
        />
      )}
      {isP2GoalRow && (
        <line
          x1={pixelX + 6}
          y1={pixelY + size - 3}
          x2={pixelX + size - 6}
          y2={pixelY + size - 3}
          stroke={theme.accentP2}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.7}
        />
      )}
      {isP3GoalCol && (
        <line
          x1={pixelX + size - 3}
          y1={pixelY + 6}
          x2={pixelX + size - 3}
          y2={pixelY + size - 6}
          stroke={theme.accentP3}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.7}
        />
      )}
      {isP4GoalCol && (
        <line
          x1={pixelX + 3}
          y1={pixelY + 6}
          x2={pixelX + 3}
          y2={pixelY + size - 6}
          stroke={theme.accentP4}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.7}
        />
      )}

      {/* Valid Move Indicator (pulsing target ring & dot) */}
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

      {/* Player Pawn (supports P1, P2, P3, P4) */}
      {playerOnCell && (
        <g
          className={`player-pawn transition-transform duration-200 ${
            isActivePlayerPawn ? 'filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]' : ''
          }`}
        >
          {/* Active Player Pulsing Glow Halo */}
          {isActivePlayerPawn && (
            <circle
              cx={centerX}
              cy={centerY}
              r={pawnRadius + 6}
              fill="none"
              stroke={playerAccent}
              strokeWidth="2.5"
              opacity="0.8"
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

          {/* Pawn Outer Base */}
          <circle
            cx={centerX}
            cy={centerY}
            r={pawnRadius}
            fill={playerAccent}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* Pawn Gradient Core */}
          <circle
            cx={centerX - pawnRadius * 0.2}
            cy={centerY - pawnRadius * 0.2}
            r={pawnRadius * 0.72}
            fill="#0f172a"
            opacity="0.85"
          />

          {/* Player Number Badge */}
          <text
            x={centerX}
            y={centerY + 1}
            fill="#ffffff"
            fontSize="12"
            fontWeight="900"
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none font-mono"
          >
            {playerOnCell.id}
          </text>

          {/* Specular Highlight */}
          <ellipse
            cx={centerX - pawnRadius * 0.35}
            cy={centerY - pawnRadius * 0.35}
            rx={pawnRadius * 0.25}
            ry={pawnRadius * 0.14}
            fill="rgba(255, 255, 255, 0.6)"
            transform={`rotate(-30 ${centerX - pawnRadius * 0.35} ${centerY - pawnRadius * 0.35})`}
          />
        </g>
      )}
    </g>
  );
};
