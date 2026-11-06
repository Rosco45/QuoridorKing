import React from 'react';
import type { ThemeId } from '../types/game';
import { THEMES } from '../types/themes';
import { X, Palette, Vibrate, Check } from 'lucide-react';
import { hapticManager } from '../engine/haptics';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  currentTheme: ThemeId;
  hapticsEnabled: boolean;
  onSelectTheme: (themeId: ThemeId) => void;
  onToggleHaptics: () => void;
  onClose: () => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  currentTheme,
  hapticsEnabled,
  onSelectTheme,
  onToggleHaptics,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-pop-in select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100">Thèmes & Préférences</h3>
              <span className="text-[10px] text-slate-400">Personnalisez votre expérience de jeu</span>
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

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Section 1: Themes */}
          <div>
            <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
              Thème Visuel du Plateau :
            </label>
            <div className="space-y-2">
              {Object.values(THEMES).map((th) => {
                const isSelected = currentTheme === th.id;
                return (
                  <div
                    key={`theme-opt-${th.id}`}
                    onClick={() => {
                      onSelectTheme(th.id);
                      hapticManager.move();
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-400/50 shadow-lg'
                        : 'bg-slate-850 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Theme Preview Dot Matrix */}
                      <div
                        className="w-10 h-10 rounded-xl border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-inner"
                        style={{
                          background: `linear-gradient(135deg, ${th.boardBgGradient.start}, ${th.boardBgGradient.end})`,
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-sm shadow-md"
                          style={{ backgroundColor: th.wallDefault }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-100">{th.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700/60 text-slate-300 font-semibold">
                            {th.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{th.description}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="p-0.5 rounded-full bg-amber-500 text-slate-950 shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Haptic Feedback */}
          <div className="pt-2 border-t border-slate-800">
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Vibrate className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-200">Retour Haptique (Vibrations)</h4>
                  <p className="text-[11px] text-slate-400">
                    Vibrations tactiles lors des déplacements et poses de murs.
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => {
                  onToggleHaptics();
                  if (!hapticsEnabled) hapticManager.jump();
                }}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors relative ${
                  hapticsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                aria-label="Activer ou désactiver les vibrations"
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform ${
                    hapticsEnabled ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
