import React, { useState } from 'react';
import type { GameMode, AIDifficulty, PlayerCount, BlitzTimerSetting, PlayerId, PlayerSlotConfig, VictoryCondition } from '../types/game';
import { X, Users, Zap, Shield, Flame, Check, Globe, Timer, Bot, User, Play, Compass, Target } from 'lucide-react';

interface ModeModalProps {
  isOpen: boolean;
  currentMode: GameMode;
  currentDifficulty: AIDifficulty;
  playerCount: PlayerCount;
  victoryCondition?: VictoryCondition;
  blitzTimer: BlitzTimerSetting;
  onSelectMode: (
    mode: GameMode,
    difficulty: AIDifficulty,
    count: PlayerCount,
    customSlots?: Record<PlayerId, PlayerSlotConfig>,
    victoryCondition?: VictoryCondition
  ) => void;
  onSelectTimer: (timer: BlitzTimerSetting) => void;
  onOpenOnline: () => void;
  onClose: () => void;
}

const DEFAULT_BOT_NAMES: Record<PlayerId, string> = {
  1: 'Bot Prime',
  2: 'Bot Alpha',
  3: 'Bot Titan',
  4: 'Bot Orion',
};

const DEFAULT_HUMAN_NAMES: Record<PlayerId, string> = {
  1: 'Joueur 1 (Bleu)',
  2: 'Joueur 2 (Orange)',
  3: 'Joueur 3 (Vert)',
  4: 'Joueur 4 (Violet)',
};

export const ModeModal: React.FC<ModeModalProps> = ({
  isOpen,
  currentMode,
  currentDifficulty,
  playerCount: initialPlayerCount,
  victoryCondition: initialVictoryCondition = 'classic',
  blitzTimer,
  onSelectMode,
  onSelectTimer,
  onOpenOnline,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>(
    initialPlayerCount === 3 || initialVictoryCondition === 'vortex' ? 'custom' : 'presets'
  );

  // Custom Lobby State
  const [customCount, setCustomCount] = useState<PlayerCount>(initialPlayerCount);
  const [selectedVictoryCondition, setSelectedVictoryCondition] = useState<VictoryCondition>(
    initialVictoryCondition
  );
  const [slots, setSlots] = useState<Record<PlayerId, PlayerSlotConfig>>({
    1: { id: 1, type: 'human', name: 'Vous', difficulty: 'medium' },
    2: { id: 2, type: 'bot', name: 'Bot Alpha', difficulty: 'medium' },
    3: { id: 3, type: 'bot', name: 'Bot Titan', difficulty: 'medium' },
    4: { id: 4, type: 'bot', name: 'Bot Orion', difficulty: 'hard' },
  });

  if (!isOpen) return null;

  const handleSlotTypeChange = (id: PlayerId, type: 'human' | 'bot') => {
    setSlots((prev) => {
      const prevSlot = prev[id];
      const defaultName = type === 'bot' ? DEFAULT_BOT_NAMES[id] : DEFAULT_HUMAN_NAMES[id];
      return {
        ...prev,
        [id]: {
          ...prevSlot,
          type,
          name: prevSlot.name === DEFAULT_BOT_NAMES[id] || prevSlot.name === DEFAULT_HUMAN_NAMES[id]
            ? defaultName
            : prevSlot.name || defaultName,
        },
      };
    });
  };

  const handleSlotDifficultyChange = (id: PlayerId, difficulty: AIDifficulty) => {
    setSlots((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        difficulty,
      },
    }));
  };

  const handleSlotNameChange = (id: PlayerId, name: string) => {
    setSlots((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        name,
      },
    }));
  };

  const handleLaunchCustom = () => {
    // Determine overall mode
    const activeIds: PlayerId[] = customCount === 2 ? [1, 2] : customCount === 3 ? [1, 2, 3] : [1, 2, 3, 4];
    const hasBots = activeIds.some((id) => slots[id].type === 'bot');
    const mode: GameMode = hasBots ? 'ai' : 'pass-and-play';
    // primary difficulty fallback
    const primaryBot = activeIds.find((id) => slots[id].type === 'bot');
    const diff = primaryBot ? slots[primaryBot].difficulty : 'medium';
    const condition = selectedVictoryCondition;

    onSelectMode(mode, diff, customCount, slots, condition);
    onClose();
  };

  const slotColors: Record<PlayerId, { bg: string; border: string; text: string; dot: string; label: string }> = {
    1: { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-300', dot: '#38bdf8', label: 'Slot 1 (Bas → Haut)' },
    2: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', dot: '#f97316', label: 'Slot 2 (Haut → Bas)' },
    3: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', dot: '#10b981', label: 'Slot 3 (Gauche → Droite)' },
    4: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', dot: '#a855f7', label: 'Slot 4 (Droite → Gauche)' },
  };

  const activeSlotIds: PlayerId[] = customCount === 2 ? [1, 2] : customCount === 3 ? [1, 2, 3] : [1, 2, 3, 4];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-pop-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-100">Modes de Jeu & Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 pb-1 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all border ${
              activeTab === 'presets'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            Modes Rapides
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all border flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>Salon Bots & Joueurs (2 à 4)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'custom' ? (
            /* --- TAB CUSTOM LOBBY (2, 3 or 4 players with mixed bots and humans) --- */
            <div className="space-y-4">
              {/* Player Count Selector */}
              <div>
                <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400 block mb-2 px-1">
                  1. Nombre de Joueurs
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {([2, 3, 4] as PlayerCount[]).map((cnt) => (
                    <button
                      key={`cnt-btn-${cnt}`}
                      onClick={() => setCustomCount(cnt)}
                      className={`py-2 px-2 rounded-2xl font-black text-xs border transition-all flex flex-col items-center justify-center gap-0.5 ${
                        customCount === cnt
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{cnt} Joueurs</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        {cnt === 2 ? '10 murs' : '5 murs'}
                      </span>
                    </button>
                  ))}
                </div>
                {customCount === 3 && (
                  <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 mt-2 leading-relaxed">
                    💡 <strong>Règle officielle à 3 joueurs :</strong> 3 côtés actifs (Bas, Haut, Gauche) avec 5 murs chacun. Le 4ᵉ côté reste libre. La règle d'or vérifie les chemins d'arrivée pour les 3 joueurs.
                  </p>
                )}
              </div>

              {/* Mode de Victoire (Classique vs Vortex Central - disponible de 2 à 4 joueurs) */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400">
                    2. Mode de Victoire
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-semibold">
                    Disponible de 2 à 4 Joueurs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Mode Classique */}
                  <div
                    onClick={() => setSelectedVictoryCondition('classic')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedVictoryCondition === 'classic'
                        ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-400/50'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-sky-400" />
                        <span className="font-bold text-xs text-slate-100">Classique</span>
                      </div>
                      {selectedVictoryCondition === 'classic' && (
                        <span className="p-0.5 rounded-full bg-sky-500 text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Traverser le plateau vers la ligne opposée.
                    </p>
                  </div>

                  {/* Mode Vortex Central */}
                  <div
                    onClick={() => setSelectedVictoryCondition('vortex')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedVictoryCondition === 'vortex'
                        ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-400/50 shadow-md'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-xs text-amber-200">Vortex Central</span>
                      </div>
                      {selectedVictoryCondition === 'vortex' && (
                        <span className="p-0.5 rounded-full bg-amber-400 text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Course vers la case centrale <strong>E5</strong>. Premier arrivé gagne !
                    </p>
                  </div>
                </div>
              </div>

              {/* Slots Configuration */}
              <div>
                <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400 block mb-2 px-1">
                  3. Configuration des Emplacements ({customCount} Joueurs)
                </span>

                <div className="space-y-2.5">
                  {activeSlotIds.map((id) => {
                    const slot = slots[id];
                    const cfg = slotColors[id];

                    return (
                      <div
                        key={`slot-card-${id}`}
                        className={`p-3 rounded-2xl border ${cfg.bg} ${cfg.border} space-y-2`}
                      >
                        {/* Slot Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-slate-950 shrink-0"
                              style={{ backgroundColor: cfg.dot }}
                            >
                              {id}
                            </span>
                            <span className="text-xs font-bold text-slate-200">
                              {cfg.label}
                            </span>
                          </div>

                          {/* Toggle Human / Bot */}
                          <div className="flex items-center bg-slate-900/80 rounded-xl p-0.5 border border-slate-700/80">
                            <button
                              onClick={() => handleSlotTypeChange(id, 'human')}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                slot.type === 'human'
                                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <User className="w-3 h-3" />
                              <span>Humain</span>
                            </button>
                            <button
                              onClick={() => handleSlotTypeChange(id, 'bot')}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                slot.type === 'bot'
                                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Bot className="w-3 h-3" />
                              <span>Bot IA</span>
                            </button>
                          </div>
                        </div>

                        {/* Name Input & Bot Difficulty Selection */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={slot.name}
                            onChange={(e) => handleSlotNameChange(id, e.target.value)}
                            placeholder="Pseudo du joueur"
                            className="flex-1 bg-slate-950/70 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                          />

                          {slot.type === 'bot' && (
                            <div className="flex items-center gap-1 shrink-0">
                              {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => {
                                const labels: Record<AIDifficulty, string> = {
                                  easy: 'Facile',
                                  medium: 'Moyen',
                                  hard: 'Difficile',
                                };
                                const diffColors: Record<AIDifficulty, string> = {
                                  easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
                                  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
                                  hard: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
                                };

                                return (
                                  <button
                                    key={`slot-${id}-diff-${diff}`}
                                    onClick={() => handleSlotDifficultyChange(id, diff)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                      slot.difficulty === diff
                                        ? `${diffColors[diff]} shadow-sm font-black`
                                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                                    }`}
                                  >
                                    {labels[diff]}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Launch Custom Game Button */}
              <button
                onClick={handleLaunchCustom}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Lancer la Partie Personnalisée ({customCount}J)</span>
              </button>
            </div>
          ) : (
            /* --- TAB PRESETS RAPIDES --- */
            <>
              {/* Option Mode de Victoire pour Presets */}
              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">
                    Objectif de Victoire :
                  </span>
                  <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSelectedVictoryCondition('classic')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        selectedVictoryCondition === 'classic'
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Compass className="w-3 h-3" />
                      <span>Classique</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVictoryCondition('vortex')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        selectedVictoryCondition === 'vortex'
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Target className="w-3 h-3" />
                      <span>Vortex Central</span>
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  {selectedVictoryCondition === 'vortex'
                    ? '🎯 Condition : Premier pion sur la case centrale E5 gagne la partie.'
                    : '🏁 Condition : Atteindre la ligne opposée de départ.'}
                </p>
              </div>

              {/* Section: Mode Local Pass-and-Play */}
              <div>
                <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400 block mb-2 px-1">
                  Partie Locale (Pass-and-Play)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {/* 2 Joueurs */}
                  <div
                    onClick={() => {
                      onSelectMode('pass-and-play', currentDifficulty, 2, undefined, selectedVictoryCondition);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      currentMode === 'pass-and-play' && initialPlayerCount === 2
                        ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-400/50'
                        : 'bg-slate-850 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-100">2 Joueurs</span>
                      {currentMode === 'pass-and-play' && initialPlayerCount === 2 && (
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
                      onSelectMode('pass-and-play', currentDifficulty, 4, undefined, selectedVictoryCondition);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      currentMode === 'pass-and-play' && initialPlayerCount === 4
                        ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-400/50'
                        : 'bg-slate-850 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-100">4 Joueurs</span>
                      {currentMode === 'pass-and-play' && initialPlayerCount === 4 && (
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

              {/* Section: Jouer Contre l'IA King 1v1 */}
              <div>
                <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400 block mb-2 px-1">
                  Duel Rapide Contre l'IA (1v1)
                </span>

                <div className="space-y-2">
                  {/* Facile */}
                  <div
                    onClick={() => {
                      onSelectMode('ai', 'easy', 2, undefined, selectedVictoryCondition);
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
                          Avance vers le but (75%), pose peu de murs (25%).
                        </p>
                      </div>
                    </div>
                    {currentMode === 'ai' && currentDifficulty === 'easy' && (
                      <span className="p-0.5 rounded-full bg-emerald-500 text-slate-950 shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Moyen */}
                  <div
                    onClick={() => {
                      onSelectMode('ai', 'medium', 2, undefined, selectedVictoryCondition);
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
                          <h4 className="font-bold text-xs text-slate-100">Niveau Moyen</h4>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                            Stratège
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Bloque les adversaires menaçants à 3 cases du but.
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
                      onSelectMode('ai', 'hard', 2, undefined, selectedVictoryCondition);
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
                            Expert Minimax
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Évalue l'écart de distance et maximise le tempo.
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
            </>
          )}

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
