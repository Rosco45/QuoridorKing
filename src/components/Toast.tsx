import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export type ToastType = 'error' | 'warning' | 'info' | 'success';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const icons = {
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  };

  const borders = {
    error: 'border-rose-500/60 bg-rose-950/90 text-rose-200',
    warning: 'border-amber-500/60 bg-amber-950/90 text-amber-200',
    info: 'border-sky-500/60 bg-sky-950/90 text-sky-200',
    success: 'border-emerald-500/60 bg-emerald-950/90 text-emerald-200',
  };

  return (
    <div
      onClick={onDismiss}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start gap-3 cursor-pointer animate-pop-in transition-all ${borders[toast.type]}`}
      role="alert"
    >
      {icons[toast.type]}
      <div className="flex-1">
        <h4 className="font-bold text-xs leading-none mb-1">{toast.title}</h4>
        <p className="text-[11px] leading-tight opacity-90">{toast.description}</p>
      </div>
    </div>
  );
};
