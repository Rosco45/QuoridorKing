import React from 'react';
import type { GameMode, AIDifficulty, PlayerCount, BlitzTimerSetting } from '../types/game';
import { X, Users, Zap, Shield, Flame, Check, Globe, Timer } from 'lucide-react';

interface ModeModalProps {
  isOpen: boolean;
  currentMode: GameMode;
  currentDifficulty: AIDifficulty;
  playerCount: PlayerCount;
  blitzTimer: BlitzTimerSetting;
  onSelectMode: (mode: GameMode, difficulty: AIDifficulty, count: PlayerCount) => void;
  onSelectTimer: (timer: BlitzTimerSetting) => void;
  onOpenOnline: () => void;
  onClose: () => void;
}

export const ModeModal: React.FC<ModeModalProps> = ({
  isOpen,
  currentMode,
  currentDifficulty,
  playerCount,
  blitzTimer,
  onSelectMode,
  onSelectTimer,
  onOpenOnline,
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
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-100">Modes de Jeu & Options</h3>
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
        <div className="p-4 space-y-4 overflow-y-auto max-h-[75dvh]">
          {/* Section: Mode Local Pass-and-Play */}
          <div>
            <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400 block mb-2 px-1">
              Partie Locale (Pass-and-Play)
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* 2 Joueurs */}
              <div
                onClick={() => {
                  onSelectMode('pass-and-play', currentDifficulty, 2);
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentMode === 'pass-and-play' && playerCount === 2
                    ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-400/50'
                    : 'bg-slate-850 hover:bg-slate-800/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-100">2 Joueurs</span>
                  {currentMode === 'pass-and-play' && playerCount === 2 && (
                    <span className="p-0.5 rounded-full bg-sky-500 text-slate-950">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  10 murs chacun. Duel face-à-face classique.
                </p>
              </div>

              {/* 4 Joueurs */}
              <div
                onClick={() => {
                  onSelectMode('pass-and-play', currentDifficulty, 4);
                  onClose();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentMode === 'pass-and-play' && playerCount === 4
                    ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-400/50'
                    : 'bg-slate-850 hover:bg-slate-800/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-100">4 Joueurs</span>
                  {currentMode === 'pass-and-play' && playerCount === 4 && (
                    <span className="p-0.5 rounded-full bg-sky-500 text-slate-950">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  5 murs chacun. 4 côtés opposés. Règle d'or BFS à 4.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Multijoueur en Ligne P2P */}
          <div>
            <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400 block mb-2 px-1">
              Multijoueur Sans Serveur (P2P / WebRTC)
            </span>

            <div
              onClick={() => {
                onClose();
                onOpenOnline();
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                currentMode === 'online'
                  ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-400/50'
                  : 'bg-gradient-to-r from-purple-950/30 to-indigo-950/30 hover:from-purple-950/50 hover:to-indigo-950/50 border-purple-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-100">Salon Multijoueur P2P</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      WebRTC
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lien d'invitation, mini-jeu pile ou face, 2 à 4 joueurs directs.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-300 shrink-0">Ouvrir →</span>
            </div>
          </div>

          {/* Section: Jouer Contre l'IA */}
          <div>
            <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400 block mb-2 px-1">
              Jouer Contre l'IA King
            </span>

            <div className="space-y-2">
              {/* Facile */}
              <div
                onClick={() => {
                  onSelectMode('ai', 'easy', 2);
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
                  onSelectMode('ai', 'medium', 2);
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
                  onSelectMode('ai', 'hard', 2);
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
                      Redoutable. Évalue tous les blocages et maximise le tempo.
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

          {/* Section: Pendule Blitz */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Timer className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400">
                Pendule Blitz (Temps par coup)
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 0 as BlitzTimerSetting, label: 'Off' },
                { val: 15 as BlitzTimerSetting, label: '15s' },
                { val: 30 as BlitzTimerSetting, label: '30s' },
                { val: 45 as BlitzTimerSetting, label: '45s' },
              ].map((opt) => (
                <button
                  key={`timer-${opt.val}`}
                  onClick={() => onSelectTimer(opt.val)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                    blitzTimer === opt.val
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
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
