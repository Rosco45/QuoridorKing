import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in QuoridorKing:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('quoridor_saved_game');
      localStorage.removeItem('quoridor_game_mode');
      localStorage.removeItem('quoridor_dock_side');
      localStorage.removeItem('quoridor_theme');
      localStorage.removeItem('quoridor_blitz_timer');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[100dvh] flex items-center justify-center p-4 bg-[#0d0e12] text-slate-100 select-none">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-rose-300">
                Oups ! Une erreur est survenue
              </h2>
              <p className="text-xs text-slate-400">
                Une ancienne sauvegarde locale ou un paramètre incompatible a causé un problème d'affichage.
              </p>
            </div>

            {this.state.error && (
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-rose-400 font-mono text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser les données et relancer</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
