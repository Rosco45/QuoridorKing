import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Player, PlayerId, PlayerCount } from '../types/game';
import type { ThemeConfig } from '../types/themes';
import { THEMES } from '../types/themes';
import { Trophy, RotateCcw, Crown, Sparkles, Film } from 'lucide-react';

interface VictoryModalProps {
  winnerId: PlayerId | null;
  players: Record<PlayerId, Player>;
  playerCount?: PlayerCount;
  turnCount: number;
  theme?: ThemeConfig;
  onRestart: () => void;
  onOpenReplay: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winnerId,
  players,
  playerCount = 2,
  turnCount,
  theme = THEMES.wood,
  onRestart,
  onOpenReplay,
}) => {
  useEffect(() => {
    if (winnerId) {
      // Confetti burst
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [winnerId]);

  if (!winnerId || !players[winnerId]) return null;

  const winner = players[winnerId];
  const maxWalls = playerCount === 4 ? 5 : 10;

  const winnerColors: Record<PlayerId, string> = {
    1: theme.accentP1,
    2: theme.accentP2,
    3: theme.accentP3,
    4: theme.accentP4,
  };

  const accent = winnerColors[winnerId] || '#38bdf8';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-pop-in">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl relative overflow-hidden">
        {/* Glow behind trophy */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accent }}
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Trophy Badge */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Trophy className="w-9 h-9 text-amber-400" />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-amber-400 mb-1">
            <Crown className="w-4 h-4" />
            <span>Victoire Royale</span>
            <Sparkles className="w-4 h-4" />
          </div>

          <h2
            className="text-2xl font-black mb-1 truncate max-w-full"
            style={{ color: accent }}
          >
            {winner.name} a Gagné !
          </h2>

          <p className="text-xs text-slate-400 mb-6">
            Ligne de but adverse atteinte avec maestria !
          </p>

          {/* Game Stats */}
          <div className="w-full grid grid-cols-2 gap-2 mb-6 text-left">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tours joués</span>
              <strong className="text-base text-slate-100 font-bold">{turnCount} tours</strong>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Murs restants</span>
              <strong className="text-base text-slate-100 font-bold">
                {winner.wallsRemaining} / {maxWalls}
              </strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2">
            <button
              onClick={onOpenReplay}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-2"
            >
              <Film className="w-4 h-4 text-sky-400" />
              <span>Revoir la partie (Replay)</span>
            </button>

            <button
              onClick={onRestart}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rejouer une partie</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
