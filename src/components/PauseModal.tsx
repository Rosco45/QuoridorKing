import React from 'react';
import type { Player, PlayerId, GameMode, AIDifficulty } from '../types/game';
import { Play, RotateCcw, HelpCircle, Bot, Users, Clock, CheckCircle2, Sliders } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  players: Record<PlayerId, Player>;
  activePlayerId: PlayerId;
  turnCount: number;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  elapsedSeconds: number;
  onResume: () => void;
  onRestart: () => void;
  onOpenModeModal: () => void;
  onOpenRules: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  players,
  activePlayerId,
  turnCount,
  gameMode,
  aiDifficulty,
  elapsedSeconds,
  onResume,
  onRestart,
  onOpenModeModal,
  onOpenRules,
}) => {
  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const difficultyNames: Record<AIDifficulty, string> = {
    easy: 'Facile (Débutant)',
    medium: 'Normal (Stratège)',
    hard: 'Difficile (Expert)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-pop-in select-none">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl w-full max-w-sm p-5 shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-none">Partie en Pause</h3>
              <span className="text-[10px] text-slate-400">Progression sauvegardée</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-sky-400">
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Auto-save notification badge */}
        <div className="my-3 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="leading-tight text-[11px]">
            Votre partie est <strong>sauvegardée automatiquement</strong>. Vous pouvez fermer ou actualiser la page sans rien perdre !
          </span>
        </div>

        {/* Current match summary cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Mode</span>
            <div className="flex items-center gap-1 font-bold text-slate-200 mt-0.5 truncate">
              {gameMode === 'ai' ? (
                <>
                  <Bot className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="truncate">IA ({difficultyNames[aiDifficulty].split(' ')[0]})</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Pass & Play</span>
                </>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Tour en cours</span>
            <span className="font-bold text-slate-200 mt-0.5 block truncate">
              Tour {turnCount} ({players[activePlayerId].name.split(' ')[0]})
            </span>
          </div>
        </div>

        {/* Walls state */}
        <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-slate-300">J1 : <strong>{players[1].wallsRemaining} murs</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-300">J2 : <strong>{players[2].wallsRemaining} murs</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ring-2 ring-emerald-400/40"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Reprendre la partie</span>
          </button>

          {/* Quick auxiliary options */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={() => {
                onResume();
                onOpenModeModal();
              }}
              className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 active:scale-95 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Modes</span>
            </button>

            <button
              onClick={() => {
                onResume();
                onOpenRules();
              }}
              className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 active:scale-95 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Règles</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Voulez-vous vraiment recommencer une nouvelle partie ?')) {
                  onRestart();
                  onResume();
                }
              }}
              className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700/80 active:scale-95 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Rejouer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
