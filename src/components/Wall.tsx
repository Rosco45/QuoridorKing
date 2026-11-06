import React from 'react';
import type { PlayerId, WallOrientation } from '../types/game';
import type { ThemeConfig } from '../types/themes';
import { THEMES } from '../types/themes';

interface WallProps {
  x: number; // 0 to 7
  y: number; // 0 to 7
  orientation: WallOrientation;
  placedBy?: PlayerId;
  isPreview?: boolean;
  isValidPreview?: boolean;
  theme?: ThemeConfig;
  onClick?: () => void;
  cellSize: number;
  grooveSize: number;
  padding: number;
}

export const Wall: React.FC<WallProps> = ({
  x,
  y,
  orientation,
  placedBy,
  isPreview = false,
  isValidPreview = true,
  theme = THEMES.wood,
  onClick,
  cellSize,
  grooveSize,
  padding,
}) => {
  const step = cellSize + grooveSize;
  const wallThickness = grooveSize;
  const wallLength = cellSize * 2 + grooveSize;
  const radius = 4;

  let pixelX: number;
  let pixelY: number;
  let width: number;
  let height: number;

  if (orientation === 'horizontal') {
    pixelX = padding + x * step;
    pixelY = padding + y * step + cellSize;
    width = wallLength;
    height = wallThickness;
  } else {
    pixelX = padding + x * step + cellSize;
    pixelY = padding + y * step;
    width = wallThickness;
    height = wallLength;
  }

  if (isPreview) {
    return (
      <g
        className="wall-preview cursor-pointer"
        onClick={onClick}
        role="button"
        tabIndex={0}
      >
        {/* Glow effect for preview */}
        <rect
          x={pixelX - 3}
          y={pixelY - 3}
          width={width + 6}
          height={height + 6}
          rx={radius + 2}
          ry={radius + 2}
          fill="none"
          stroke={isValidPreview ? '#38bdf8' : '#ef4444'}
          strokeWidth="3"
          strokeOpacity={0.6}
          className="animate-pulse"
        />

        {/* Preview core */}
        <rect
          x={pixelX}
          y={pixelY}
          width={width}
          height={height}
          rx={radius}
          ry={radius}
          fill={isValidPreview ? 'rgba(56, 189, 248, 0.45)' : 'rgba(239, 68, 68, 0.5)'}
          stroke={isValidPreview ? '#0284c7' : '#b91c1c'}
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Center check or cross icon */}
        <circle
          cx={pixelX + width / 2}
          cy={pixelY + height / 2}
          r={7}
          fill={isValidPreview ? '#0284c7' : '#ef4444'}
        />
        {isValidPreview ? (
          <path
            d={`M${pixelX + width / 2 - 3} ${pixelY + height / 2} l2 2 l4 -4`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d={`M${pixelX + width / 2 - 3} ${pixelY + height / 2 - 3} l6 6 M${pixelX + width / 2 + 3} ${pixelY + height / 2 - 3} l-6 6`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </g>
    );
  }

  // Accent rim based on which player placed it
  const accentRim = placedBy === 1 ? theme.accentP1 : placedBy === 2 ? theme.accentP2 : placedBy === 3 ? theme.accentP3 : theme.accentP4;

  return (
    <g
      className="placed-wall select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
      onClick={onClick}
    >
      {/* Wall Shadow Base */}
      <rect
        x={pixelX + 1}
        y={pixelY + 2}
        width={width}
        height={height}
        rx={radius}
        ry={radius}
        fill={theme.wallShadow}
      />

      {/* Main Wall Body */}
      <rect
        x={pixelX}
        y={pixelY}
        width={width}
        height={height}
        rx={radius}
        ry={radius}
        fill={theme.wallDefault}
        stroke={theme.wallStroke}
        strokeWidth="1"
      />

      {/* 3D Highlight top edge */}
      <rect
        x={pixelX + 1}
        y={pixelY + 1}
        width={width - 2}
        height={Math.max(2, height * 0.35)}
        rx={radius - 1}
        ry={radius - 1}
        fill="rgba(255, 255, 255, 0.25)"
      />

      {/* Player Ownership Center Dot */}
      <circle
        cx={pixelX + width / 2}
        cy={pixelY + height / 2}
        r={3.5}
        fill={accentRim}
        stroke="#1c1917"
        strokeWidth="1"
      />
    </g>
  );
};
