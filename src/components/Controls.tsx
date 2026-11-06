import React from 'react';
import type { ActionMode, WallOrientation, WallPreview } from '../types/game';
import { Check, X, RotateCw, User, Shield, Undo2, ArrowLeftRight } from 'lucide-react';

interface ControlsProps {
  currentMode: ActionMode;
  selectedOrientation: WallOrientation;
  wallPreview: WallPreview | null;
  wallsRemaining: number;
  canUndo: boolean;
  dockSide: 'right' | 'left';
  disabled?: boolean;
  onSetMode: (mode: ActionMode) => void;
  onToggleOrientation: () => void;
  onConfirmWall: () => void;
  onCancelPreview: () => void;
  onUndo: () => void;
  onToggleDockSide: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  currentMode,
  selectedOrientation,
  wallPreview,
  wallsRemaining,
  canUndo,
  dockSide,
  disabled = false,
  onSetMode,
  onToggleOrientation,
  onConfirmWall,
  onCancelPreview,
  onUndo,
  onToggleDockSide,
}) => {
  return (
    <aside
      className={`w-[78px] sm:w-32 md:w-36 h-full max-h-full shrink-0 flex flex-col justify-between py-1 px-1 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl select-none transition-all ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Top Section: Main Mode Toggles (Avancer / Mur) */}
      <div className="flex flex-col gap-1.5">
        {/* Label on wider screens */}
        <div className="hidden sm:block text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
          Action
        </div>

        {/* 1. Mode Avancer (Pion) */}
        <button
          onClick={() => {
            if (disabled) return;
            onCancelPreview();
            onSetMode('pawn');
          }}
          disabled={disabled}
          className={`w-full py-2.5 sm:py-3 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all border ${
            currentMode === 'pawn'
              ? 'bg-gradient-to-b sm:bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)] ring-1 ring-sky-300/40'
              : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border-slate-700/70 active:scale-95'
          }`}
          title="Mode Déplacement de Pion"
          aria-label="Mode Déplacement de Pion"
        >
          <div className="relative">
            <User className="w-5 h-5 sm:w-4 sm:h-4 text-sky-200" />
            {currentMode === 'pawn' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-300 animate-ping" />
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-bold leading-none tracking-tight">
            Avancer
          </span>
        </button>

        {/* 2. Mode Mur */}
        <button
          onClick={() => {
            if (disabled || wallsRemaining === 0) return;
            onSetMode('wall');
          }}
          disabled={disabled || wallsRemaining === 0}
          className={`w-full py-2.5 sm:py-3 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all border ${
            currentMode === 'wall'
              ? 'bg-gradient-to-b sm:bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-1 ring-amber-300/40'
              : wallsRemaining > 0
              ? 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border-slate-700/70 active:scale-95'
              : 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed opacity-40'
          }`}
          title={`Mode Poser Mur (${wallsRemaining} restants)`}
          aria-label="Mode Poser Mur"
        >
          <div className="relative">
            <Shield className="w-5 h-5 sm:w-4 sm:h-4 text-amber-200" />
            <span
              className={`absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-black ${
                wallsRemaining > 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {wallsRemaining}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold leading-none tracking-tight mt-0.5 sm:mt-0">
            Mur
          </span>
        </button>

        {/* 3. Orientation Switcher Button (Commutateur H / V) */}
        {(currentMode === 'wall' || wallPreview) && (
          <button
            onClick={() => {
              if (disabled) return;
              onToggleOrientation();
            }}
            disabled={disabled}
            className="w-full py-2 px-1 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/50 text-amber-300 flex flex-col sm:flex-row items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
            title="Changer l'orientation du mur (Horizontal / Vertical)"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-xs font-extrabold font-mono">
                {selectedOrientation === 'horizontal' ? '━ H' : '┃ V'}
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Middle Section: Wall Confirmation Dock when Preview is active */}
      {wallPreview && (
        <div className="my-1 p-1 sm:p-1.5 bg-slate-950/90 rounded-xl border border-sky-500/50 shadow-lg flex flex-col gap-1.5 animate-pop-in">
          <div className="text-[9px] font-bold text-center text-sky-300 uppercase tracking-tighter truncate">
            {wallPreview.isValid ? 'Confirmer ?' : 'Invalide !'}
          </div>

          {/* Validate Button */}
          <button
            onClick={() => {
              if (disabled) return;
              onConfirmWall();
            }}
            disabled={disabled || !wallPreview.isValid}
            className={`w-full py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1 text-[11px] transition-all shadow-md ${
              wallPreview.isValid
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white active:scale-95 ring-2 ring-emerald-400/50 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            <Check className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Valider</span>
          </button>

          {/* Cancel Preview Button */}
          <button
            onClick={() => {
              if (disabled) return;
              onCancelPreview();
            }}
            disabled={disabled}
            className="w-full py-1.5 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 active:scale-95 flex items-center justify-center gap-1 text-[10px]"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Annuler</span>
          </button>
        </div>
      )}

      {/* Bottom Section: Undo & Dock Side Switcher */}
      <div className="flex flex-col gap-1 pt-1 border-t border-slate-800">
        {/* Undo Button */}
        <button
          onClick={() => {
            if (disabled) return;
            onUndo();
          }}
          disabled={disabled || !canUndo}
          className={`w-full py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all border ${
            canUndo && !disabled
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-95'
              : 'bg-slate-900/40 text-slate-600 border-slate-800/40 cursor-not-allowed opacity-40'
          }`}
          title="Annuler le dernier coup"
        >
          <Undo2 className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[9px] sm:text-[10px] font-semibold">Retour</span>
        </button>

        {/* Dock Position Switcher (Left ↔ Right) */}
        <button
          onClick={onToggleDockSide}
          className="w-full py-1 px-1 rounded-lg bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1 text-[9px]"
          title={dockSide === 'right' ? 'Déplacer les commandes à gauche' : 'Déplacer les commandes à droite'}
        >
          <ArrowLeftRight className="w-3 h-3" />
          <span className="hidden sm:inline">{dockSide === 'right' ? 'Gauche' : 'Droite'}</span>
        </button>
      </div>
    </aside>
  );
};
