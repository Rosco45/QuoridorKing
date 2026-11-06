import React from 'react';
import { X, Smartphone, Wifi, ExternalLink, Download } from 'lucide-react';

interface MobileQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkUrl: string;
}

export const MobileQRModal: React.FC<MobileQRModalProps> = ({
  isOpen,
  onClose,
  networkUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-pop-in select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col items-center text-center p-5">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-100">Jouer sur Téléphone</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option 1: APK Direct Download Button */}
        <a
          href="/QuoridorKing.apk"
          download="QuoridorKing.apk"
          className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 mb-3 active:scale-95 ring-2 ring-emerald-400/40"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Télécharger l'APK Android (100% Offline)</span>
        </a>

        {/* Option 2: Browser / PWA */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] mb-3">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Ou jouez sur navigateur via le Wi-Fi local :</span>
        </div>

        {/* QR Code Container */}
        <div className="p-2.5 bg-white rounded-2xl shadow-xl mb-3 border-2 border-slate-700">
          <img
            src="/qrcode.png"
            alt="Scanner pour ouvrir sur smartphone"
            className="w-40 h-40 object-contain"
          />
        </div>

        {/* Direct Link */}
        <div className="w-full mb-3">
          <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sky-400 font-mono text-xs font-bold">
            <span>{networkUrl}</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all border border-slate-700 active:scale-95"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
