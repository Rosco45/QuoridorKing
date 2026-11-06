import React from 'react';
import type { Player, PlayerId, PlayerCount, GameMode, AIDifficulty, BlitzTimerSetting } from '../types/game';
import type { ThemeConfig } from '../types/themes';
import { Volume2, VolumeX, RotateCcw, HelpCircle, Trophy, Bot, Users, Globe, Pause, Palette, Timer, ArrowUp, ArrowDown, ArrowRight, ArrowLeft } from 'lucide-react';

interface HUDProps {
  players: Record<PlayerId, Player>;
  activePlayerId: PlayerId;
  playerCount: PlayerCount;
  turnCount: number;
  isMuted: boolean;
  distances: Record<PlayerId, number>;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  isAIThinking: boolean;
  blitzTimer: BlitzTimerSetting;
  turnSecondsLeft: number;
  theme: ThemeConfig;
  onlineRoomCode?: string | null;
  onlinePlayerId?: PlayerId | null;
  onToggleMute: () => void;
  onResetGame: () => void;
  onOpenRules: () => void;
  onOpenModeModal: () => void;
  onOpenOnlineLobby: () => void;
  onOpenThemeSettings: () => void;
  onOpenPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  players,
  activePlayerId,
  playerCount,
  turnCount,
  isMuted,
  distances,
  gameMode,
  aiDifficulty,
  isAIThinking,
  blitzTimer,
  turnSecondsLeft,
  theme,
  onlineRoomCode,
  onlinePlayerId,
  onToggleMute,
  onResetGame,
  onOpenRules,
  onOpenModeModal,
  onOpenOnlineLobby,
  onOpenThemeSettings,
  onOpenPause,
}) => {
  const maxWalls = playerCount === 4 ? 5 : 10;

  const playerConfigs: Record<
    PlayerId,
    {
      color: string;
      label: string;
      directionIcon: React.ReactNode;
      borderActive: string;
      bgActive: string;
    }
  > = {
    1: {
      color: theme.accentP1,
      label: gameMode === 'ai' ? 'Vous (Bleu)' : players[1]?.name || 'J1',
      directionIcon: <ArrowUp className="w-3 h-3" />,
      borderActive: 'border-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-1 ring-sky-400/50',
      bgActive: 'bg-sky-950/40',
    },
    2: {
      color: theme.accentP2,
      label: gameMode === 'ai' ? 'IA King' : players[2]?.name || 'J2',
      directionIcon: <ArrowDown className="w-3 h-3" />,
      borderActive: 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] ring-1 ring-orange-400/50',
      bgActive: 'bg-orange-950/40',
    },
    3: {
      color: theme.accentP3,
      label: players[3]?.name || 'J3',
      directionIcon: <ArrowRight className="w-3 h-3" />,
      borderActive: 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50',
      bgActive: 'bg-emerald-950/40',
    },
    4: {
      color: theme.accentP4,
      label: players[4]?.name || 'J4',
      directionIcon: <ArrowLeft className="w-3 h-3" />,
      borderActive: 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/50',
      bgActive: 'bg-purple-950/40',
    },
  };

  const renderWallGauges = (remaining: number, pId: PlayerId) => {
    const accentColor = playerConfigs[pId].color;
    return (
      <div className="flex items-center gap-[2px] mt-1">
        {Array.from({ length: maxWalls }).map((_, i) => (
          <div
            key={`wall-bar-${pId}-${i}`}
            className="h-2.5 flex-1 max-w-[8px] rounded-xs transition-all duration-200"
            style={{
              backgroundColor: i < remaining ? accentColor : 'rgba(51, 65, 85, 0.4)',
              boxShadow: i < remaining ? `0 0 4px ${accentColor}` : 'none',
            }}
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

  const activePlayerList = (
    playerCount === 4 ? ([1, 2, 3, 4] as PlayerId[]) : ([1, 2] as PlayerId[])
  ).filter((id) => players[id]);

  return (
    <header className="w-full max-w-2xl mx-auto px-2 pt-1.5 pb-1 flex flex-col gap-1.5 select-none">
      {/* Top Header Row */}
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

        {/* Center Mode / Room Badge */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenModeModal}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all border shadow-sm active:scale-95 ${
              gameMode === 'ai'
                ? `${difficultyLabels[aiDifficulty].color} border`
                : gameMode === 'online'
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
            }`}
            title="Changer de mode de jeu"
          >
            {gameMode === 'ai' ? (
              <>
                <Bot className="w-3.5 h-3.5" />
                <span>IA : {difficultyLabels[aiDifficulty].label}</span>
              </>
            ) : gameMode === 'online' ? (
              <>
                <Globe className="w-3.5 h-3.5" />
                <span>En Ligne ({onlineRoomCode || 'Lobby'})</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5" />
                <span>{playerCount} Joueurs</span>
              </>
            )}
            <span className="text-[10px] opacity-60">▾</span>
          </button>

          {gameMode !== 'online' && (
            <button
              onClick={onOpenOnlineLobby}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 active:scale-95 transition-all"
              title="Jouer en ligne avec un ami (P2P)"
            >
              <Globe className="w-3 h-3 text-purple-400" />
              <span>En ligne</span>
            </button>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenThemeSettings}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300 active:scale-95 transition-all border border-slate-700/60"
            title="Thèmes visuels et Haptique"
            aria-label="Thèmes et Réglages"
          >
            <Palette className="w-4 h-4 text-amber-400" />
          </button>
          <button
            onClick={onOpenPause}
            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 active:scale-95 transition-all border border-amber-500/30"
            title="Pause"
            aria-label="Pause"
          >
            <Pause className="w-4 h-4 fill-current" />
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
            aria-label="Règles"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </button>
          <button
            onClick={onResetGame}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all border border-slate-700/60"
            title="Recommencer"
            aria-label="Recommencer"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Players Cards Grid (2 cols for 2 players, 4 cols or 2x2 for 4 players) */}
      <div
        className={`grid gap-1.5 ${
          playerCount === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'
        }`}
      >
        {activePlayerList.map((pId) => {
          const p = players[pId];
          const isActive = activePlayerId === pId;
          const config = playerConfigs[pId];
          const dist = distances[pId] ?? -1;
          const isMyOnlineTurn = gameMode === 'online' && onlinePlayerId === pId;

          return (
            <div
              key={`player-card-${pId}`}
              className={`relative p-2 rounded-xl transition-all duration-300 border ${
                isActive
                  ? `${config.bgActive} ${config.borderActive}`
                  : 'bg-slate-900/60 border-slate-800 opacity-70'
              }`}
            >
              {/* Header inside Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] text-slate-950 shrink-0"
                    style={{
                      backgroundColor: config.color,
                      boxShadow: `0 0 6px ${config.color}`,
                    }}
                  >
                    {pId}
                  </div>
                  <span className="font-bold text-xs truncate text-slate-100">
                    {p.name}
                    {isMyOnlineTurn && <span className="text-[10px] text-sky-300 ml-1">(Vous)</span>}
                  </span>
                </div>

                {isActive && (
                  <div className="flex items-center gap-1 shrink-0">
                    {blitzTimer > 0 && (
                      <span
                        className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded ${
                          turnSecondsLeft <= 5
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        <Timer className="w-2.5 h-2.5" />
                        <span>{turnSecondsLeft}s</span>
                      </span>
                    )}
                    <span
                      className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border animate-pulse"
                      style={{
                        backgroundColor: `${config.color}20`,
                        color: config.color,
                        borderColor: `${config.color}50`,
                      }}
                    >
                      {gameMode === 'ai' && pId === 2 && isAIThinking ? 'IA...' : 'Tour'}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats: Walls & Distance */}
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-300">
                <span>
                  Murs: <strong>{p.wallsRemaining}</strong>
                </span>
                <span
                  className="flex items-center gap-0.5 text-[10px] font-semibold"
                  style={{ color: config.color }}
                >
                  {config.directionIcon}
                  {dist >= 0 ? `${dist} pas` : 'Bloqué'}
                </span>
              </div>

              {/* Blitz Timer progress bar if active */}
              {isActive && blitzTimer > 0 && (
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-300 ${
                      turnSecondsLeft <= 5 ? 'bg-rose-500' : 'bg-amber-400'
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, (turnSecondsLeft / blitzTimer) * 100))}%`,
                    }}
                  />
                </div>
              )}

              {/* Wall gauges */}
              {renderWallGauges(p.wallsRemaining, pId)}
            </div>
          );
        })}
      </div>
    </header>
  );
};
