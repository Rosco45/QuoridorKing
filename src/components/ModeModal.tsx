import React from 'react';
import type { GameMode, AIDifficulty } from '../types/game';
import { X, Users, Bot, Zap, Shield, Flame, Check } from 'lucide-react';

interface ModeModalProps {
  isOpen: boolean;
  currentMode: GameMode;
  currentDifficulty: AIDifficulty;
  onSelect: (mode: GameMode, difficulty: AIDifficulty) => void;
  onClose: () => void;
}

export const ModeModal: React.FC<ModeModalProps> = ({
  isOpen,
  currentMode,
  currentDifficulty,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-pop-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-100">Mode de Jeu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[75dvh]">
          {/* Mode 1: Pass-and-Play */}
          <div
            onClick={() => {
              onSelect('pass-and-play', currentDifficulty);
              onClose();
            }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              currentMode === 'pass-and-play'
                ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-400/50'
                : 'bg-slate-850 hover:bg-slate-800/80 border-slate-800'
            }`}
          >
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-100">2 Joueurs (Pass-and-Play)</h4>
                {currentMode === 'pass-and-play' && (
                  <span className="p-0.5 rounded-full bg-sky-500 text-slate-950">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deux joueurs sur le même écran. Alternez vos tours pour vous affronter localement.
              </p>
            </div>
          </div>

          {/* Mode 2: Contre l'IA Header */}
          <div className="pt-2">
            <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400 block mb-2 px-1">
              Jouer Contre l'IA (Intelligence Artificielle)
            </span>

            <div className="space-y-2">
              {/* Facile */}
              <div
                onClick={() => {
                  onSelect('ai', 'easy');
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  currentMode === 'ai' && currentDifficulty === 'easy'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-400/50'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-100">Niveau Facile</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                        Débutant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Avance vers le but, pose peu de murs, idéal pour débuter.
                    </p>
                  </div>
                </div>
                {currentMode === 'ai' && currentDifficulty === 'easy' && (
                  <span className="p-0.5 rounded-full bg-emerald-500 text-slate-950 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Normal */}
              <div
                onClick={() => {
                  onSelect('ai', 'medium');
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  currentMode === 'ai' && currentDifficulty === 'medium'
                    ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-400/50'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-100">Niveau Normal</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                        Intermédiaire
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Équilibré. Pose des murs stratégiques pour ralentir votre avancée.
                    </p>
                  </div>
                </div>
                {currentMode === 'ai' && currentDifficulty === 'medium' && (
                  <span className="p-0.5 rounded-full bg-amber-500 text-slate-950 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Difficile */}
              <div
                onClick={() => {
                  onSelect('ai', 'hard');
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  currentMode === 'ai' && currentDifficulty === 'hard'
                    ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-400/50'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-100">Niveau Difficile</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold">
                        Expert
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Redoutable. Évalue tous les blocages possibles et maximise chaque tempo.
                    </p>
                  </div>
                </div>
                {currentMode === 'ai' && currentDifficulty === 'hard' && (
                  <span className="p-0.5 rounded-full bg-rose-500 text-slate-950 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs transition-all border border-slate-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
