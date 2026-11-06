import React, { useState, useEffect } from 'react';
import type { ReplayStep, ThemeId } from '../types/game';
import { THEMES } from '../types/themes';
import { X, Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { Cell } from './Cell';
import { Wall } from './Wall';

interface ReplayModalProps {
  isOpen: boolean;
  replaySteps: ReplayStep[];
  themeId: ThemeId;
  onClose: () => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  isOpen,
  replaySteps,
  themeId,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Reset to last step on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(replaySteps.length > 0 ? replaySteps.length - 1 : 0);
      setIsPlaying(false);
    }
  }, [isOpen, replaySteps.length]);

  // Autoplay loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= replaySteps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, replaySteps.length]);

  if (!isOpen || replaySteps.length === 0) return null;

  const currentStep = replaySteps[currentStepIndex];
  const theme = THEMES[themeId] || THEMES.wood;

  const CELL_SIZE = 54;
  const GROOVE_SIZE = 12;
  const PADDING = 24;
  const BOARD_DIMENSION = 9 * CELL_SIZE + 8 * GROOVE_SIZE + PADDING * 2;
  const STEP = CELL_SIZE + GROOVE_SIZE;

  // Convert current players state to map by position key
  const playersByPos = new Map<string, { id: number; color: string }>();
  if (currentStep?.playersState) {
    Object.entries(currentStep.playersState).forEach(([idStr, pData]) => {
      const pid = Number(idStr);
      const color =
        pid === 1 ? theme.accentP1 : pid === 2 ? theme.accentP2 : pid === 3 ? theme.accentP3 : theme.accentP4;
      playersByPos.set(`${pData.position.x},${pData.position.y}`, {
        id: pid,
        color,
      });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-pop-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[95dvh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">Revue de Partie (Replay)</h3>
              <span className="text-[10px] text-slate-400">
                Coup {currentStepIndex + 1} / {replaySteps.length}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Board Display Area */}
        <div className="flex-1 min-h-0 p-2 flex items-center justify-center">
          <div className="relative w-full aspect-square max-w-[min(82vw,360px)] flex items-center justify-center">
            <svg
              viewBox={`0 0 ${BOARD_DIMENSION} ${BOARD_DIMENSION}`}
              className="w-full h-full drop-shadow-xl overflow-visible pointer-events-none"
            >
              <defs>
                <radialGradient id="replayBoardBg" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor={theme.boardBgGradient.start} />
                  <stop offset="100%" stopColor={theme.boardBgGradient.end} />
                </radialGradient>
              </defs>

              {/* Board Frame */}
              <rect
                x={4}
                y={4}
                width={BOARD_DIMENSION - 8}
                height={BOARD_DIMENSION - 8}
                rx={18}
                ry={18}
                fill="url(#replayBoardBg)"
                stroke={theme.boardRimGradient.start}
                strokeWidth="3"
              />

              {/* 81 Cells */}
              {Array.from({ length: 9 }).map((_, y) =>
                Array.from({ length: 9 }).map((_, x) => {
                  const pixelX = PADDING + x * STEP;
                  const pixelY = PADDING + y * STEP;
                  const posKey = `${x},${y}`;
                  const pOnCell = playersByPos.get(posKey);

                  const mockPlayer = pOnCell
                    ? {
                        id: pOnCell.id as 1 | 2 | 3 | 4,
                        name: `J${pOnCell.id}`,
                        position: { x, y },
                        wallsRemaining: 0,
                        color: pOnCell.color,
                        glowColor: pOnCell.color,
                        targetGoal: { type: 'row' as const, value: 0, description: '' },
                      }
                    : undefined;

                  return (
                    <Cell
                      key={`replay-cell-${x}-${y}`}
                      x={x}
                      y={y}
                      pixelX={pixelX}
                      pixelY={pixelY}
                      size={CELL_SIZE}
                      playerOnCell={mockPlayer}
                      onSelect={() => {}}
                    />
                  );
                })
              )}

              {/* Walls at current step */}
              {currentStep?.wallsState.map((w) => (
                <Wall
                  key={`replay-w-${w.id}`}
                  x={w.x}
                  y={w.y}
                  orientation={w.orientation}
                  placedBy={w.placedBy}
                  cellSize={CELL_SIZE}
                  grooveSize={GROOVE_SIZE}
                  padding={PADDING}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Action Description Banner */}
        <div className="px-4 py-2 bg-slate-950/70 border-t border-b border-slate-800 text-center">
          <p className="text-xs font-semibold text-slate-200 truncate">
            {currentStep?.description || 'Début de partie'}
          </p>
        </div>

        {/* Playback Controls & Slider */}
        <div className="p-3 bg-slate-900 flex flex-col gap-2">
          {/* Timeline Range Slider */}
          <input
            type="range"
            min={0}
            max={replaySteps.length - 1}
            value={currentStepIndex}
            onChange={(e) => {
              setCurrentStepIndex(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between gap-1 max-w-xs mx-auto w-full">
            {/* Start */}
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 active:scale-95 transition-all"
              title="Premier coup"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={() => {
                setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                setIsPlaying(false);
              }}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 active:scale-95 transition-all"
              title="Coup précédent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold active:scale-95 shadow-lg flex items-center justify-center transition-all"
              title={isPlaying ? 'Pause' : 'Lecture automatique'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Next */}
            <button
              onClick={() => {
                setCurrentStepIndex((prev) => Math.min(replaySteps.length - 1, prev + 1));
                setIsPlaying(false);
              }}
              disabled={currentStepIndex === replaySteps.length - 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 active:scale-95 transition-all"
              title="Coup suivant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* End */}
            <button
              onClick={() => {
                setCurrentStepIndex(replaySteps.length - 1);
                setIsPlaying(false);
              }}
              disabled={currentStepIndex === replaySteps.length - 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 active:scale-95 transition-all"
              title="Dernier coup"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
