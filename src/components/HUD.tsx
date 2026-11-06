import React from 'react';
import type { Player, PlayerId, GameMode, AIDifficulty } from '../types/game';
import { Volume2, VolumeX, RotateCcw, HelpCircle, Trophy, ArrowUp, ArrowDown, Bot, Users, Smartphone, Pause } from 'lucide-react';

interface HUDProps {
  players: Record<PlayerId, Player>;
  activePlayerId: PlayerId;
  turnCount: number;
  isMuted: boolean;
  p1Distance: number;
  p2Distance: number;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  isAIThinking: boolean;
  onToggleMute: () => void;
  onResetGame: () => void;
  onOpenRules: () => void;
  onOpenModeModal: () => void;
  onOpenQRModal: () => void;
  onOpenPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  players,
  activePlayerId,
  turnCount,
  isMuted,
  p1Distance,
  p2Distance,
  gameMode,
  aiDifficulty,
  isAIThinking,
  onToggleMute,
  onResetGame,
  onOpenRules,
  onOpenModeModal,
  onOpenQRModal,
  onOpenPause,
}) => {
  const p1 = players[1];
  const p2 = players[2];

  // Helper to render wall reserve gauge
  const renderWallGauges = (remaining: number, isP1: boolean) => {
    return (
      <div className="flex items-center gap-[2.5px] mt-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={`wall-bar-${i}`}
            className={`h-3 w-1.5 rounded-sm transition-all duration-200 ${
              i < remaining
                ? isP1
                  ? 'bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.6)]'
                  : 'bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.6)]'
                : 'bg-slate-700/50'
            }`}
          />
        ))}
      </div>
    );
  };

  const difficultyLabels: Record<AIDifficulty, { label: string; color: string }> = {
    easy: { label: 'Facile', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40' },
    medium: { label: 'Normal', color: 'text-amber-300 bg-amber-500/20 border-amber-500/40' },
    hard: { label: 'Difficile', color: 'text-rose-300 bg-rose-500/20 border-rose-500/40' },
  };

  return (
    <header className="w-full max-w-xl mx-auto px-3 pt-2 pb-1 flex flex-col gap-2 select-none">
      {/* Top Bar: Title, Mode Selector, and Quick Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="bg-amber-500/20 p-1 rounded-lg border border-amber-500/30">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
            QuoridorKing
          </span>
          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            T{turnCount}
          </span>
        </div>

        {/* Center Mode Button */}
        <button
          onClick={onOpenModeModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border shadow-sm active:scale-95 ${
            gameMode === 'ai'
              ? `${difficultyLabels[aiDifficulty].color} border`
              : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
          }`}
          title="Changer de mode de jeu et de difficulté"
        >
          {gameMode === 'ai' ? (
            <>
              <Bot className="w-3.5 h-3.5" />
              <span>IA : {difficultyLabels[aiDifficulty].label}</span>
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5" />
              <span>2 Joueurs</span>
            </>
          )}
          <span className="text-[10px] opacity-60">▾</span>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenPause}
            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 active:scale-95 transition-all border border-amber-500/30"
            title="Mettre en pause la partie"
            aria-label="Pause"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={onOpenQRModal}
            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 active:scale-95 transition-all border border-emerald-500/30"
            title="Ouvrir sur mobile (QR Code)"
            aria-label="Ouvrir sur mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all border border-slate-700/60"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            aria-label="Contrôle du son"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onOpenRules}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all border border-slate-700/60"
            title="Règles du jeu"
            aria-label="Règles du jeu"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </button>
          <button
            onClick={onResetGame}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all border border-slate-700/60"
            title="Recommencer la partie"
            aria-label="Recommencer la partie"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Players Battle Cards */}
      <div className="grid grid-cols-2 gap-2">
        {/* Player 1 Card (Cyan) */}
        <div
          className={`relative p-2 rounded-xl transition-all duration-300 border ${
            activePlayerId === 1
              ? 'bg-sky-950/40 border-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/50'
              : 'bg-slate-900/60 border-slate-800 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] flex items-center justify-center font-bold text-[9px] text-slate-950">
                1
              </div>
              <span className="font-bold text-xs text-sky-200 truncate">
                {gameMode === 'ai' ? 'Vous (Bleu)' : p1.name}
              </span>
            </div>
            {activePlayerId === 1 && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                Actif
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-300">
            <span>Murs: <strong>{p1.wallsRemaining}</strong></span>
            <span className="flex items-center gap-0.5 text-sky-400 text-[10px]">
              <ArrowUp className="w-3 h-3" />
              {p1Distance >= 0 ? `${p1Distance} pas` : 'Bloqué'}
            </span>
          </div>

          {renderWallGauges(p1.wallsRemaining, true)}
        </div>

        {/* Player 2 Card (Orange - Human or AI) */}
        <div
          className={`relative p-2 rounded-xl transition-all duration-300 border ${
            activePlayerId === 2
              ? 'bg-orange-950/40 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.25)] ring-1 ring-orange-400/50'
              : 'bg-slate-900/60 border-slate-800 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316] flex items-center justify-center font-bold text-[9px] text-slate-950">
                2
              </div>
              <span className="font-bold text-xs text-orange-200 truncate flex items-center gap-1">
                {gameMode === 'ai' ? (
                  <>
                    <Bot className="w-3.5 h-3.5 text-orange-400" />
                    <span>IA King</span>
                  </>
                ) : (
                  p2.name
                )}
              </span>
            </div>
            {activePlayerId === 2 && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse">
                {isAIThinking ? 'Calcul...' : 'Actif'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-300">
            <span>Murs: <strong>{p2.wallsRemaining}</strong></span>
            <span className="flex items-center gap-0.5 text-orange-400 text-[10px]">
              <ArrowDown className="w-3 h-3" />
              {p2Distance >= 0 ? `${p2Distance} pas` : 'Bloqué'}
            </span>
          </div>

          {renderWallGauges(p2.wallsRemaining, false)}
        </div>
      </div>
    </header>
  );
};
