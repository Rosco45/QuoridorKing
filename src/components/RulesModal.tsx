import React, { useState } from 'react';
import { X, Target, Move, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'jumping' | 'walls'>('basics');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-pop-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-100">Règles Officielles de Quoridor</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 gap-1">
          <button
            onClick={() => setActiveTab('basics')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'basics'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Objectif & Base
          </button>
          <button
            onClick={() => setActiveTab('jumping')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'jumping'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sauts de Pion
          </button>
          <button
            onClick={() => setActiveTab('walls')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'walls'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Murs & Règle d'or
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'basics' && (
            <>
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Target className="w-4 h-4" />
                  <span>But du jeu</span>
                </div>
                <p>
                  Être le premier joueur à atteindre <strong>n'importe quelle case de la ligne opposée</strong> à son point de départ.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li><strong className="text-sky-400">Joueur 1 (Bleu) :</strong> Part du bas (ligne 9) et doit atteindre la ligne 1 (haut).</li>
                  <li><strong className="text-orange-400">Joueur 2 (Orange) :</strong> Part du haut (ligne 1) et doit atteindre la ligne 9 (bas).</li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <Move className="w-4 h-4" />
                  <span>Tour de jeu</span>
                </div>
                <p>À son tour, chaque joueur choisit obligatoirement une action parmi deux :</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                  <li><strong>Déplacer son pion</strong> d'une case (horizontalement ou verticalement).</li>
                  <li><strong>Poser un de ses murs</strong> pour ralentir l'adversaire ou créer un labyrinthe.</li>
                </ol>
              </div>
            </>
          )}

          {activeTab === 'jumping' && (
            <>
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Move className="w-4 h-4" />
                  <span>Saut direct en face-à-face</span>
                </div>
                <p>
                  Lorsque deux pions se retrouvent sur des cases voisines sans mur entre eux :
                </p>
                <p className="text-slate-400 text-[11px]">
                  Le joueur actif peut <strong>sauter directement par-dessus l'adversaire</strong> pour atterrir sur la case située immédiatement derrière lui.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-600/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Esquive diagonale (Bifurcation)</span>
                </div>
                <p>
                  Si la case directement derrière l'adversaire est <strong>bloquée par un mur ou le bord du plateau</strong> :
                </p>
                <p className="text-slate-300 text-[11px]">
                  Le joueur peut alors <strong>bifurquer en diagonale</strong> à droite ou à gauche de l'adversaire (sur une case libre non obstruée par un mur).
                </p>
              </div>
            </>
          )}

          {activeTab === 'walls' && (
            <>
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Dimensions & Pose des Murs</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Chaque joueur dispose d'une réserve de <strong>10 murs</strong> au début de la partie.</li>
                  <li>Chaque mur a une longueur exacte de <strong>2 cases</strong>.</li>
                  <li>Les murs se placent le long des rainures, horizontalement ou verticalement.</li>
                  <li>Il est interdit de croiser ou chevaucher un mur existant.</li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-600/50 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>La Règle d'Or (Golden Rule)</span>
                </div>
                <p className="text-rose-200">
                  <strong>Il est strictement interdit d'enfermer totalement un joueur !</strong>
                </p>
                <p className="text-slate-300 text-[11px]">
                  Un algorithme de recherche de chemin (BFS) vérifie automatiquement chaque coup avant validation. Il doit impérativement subsister au moins un chemin praticable permettant à chaque joueur d'atteindre sa ligne de but.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold text-xs transition-all shadow-lg"
          >
            C'est compris, jouer !
          </button>
        </div>
      </div>
    </div>
  );
};
