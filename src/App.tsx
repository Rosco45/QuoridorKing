import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type {
  ActionMode,
  Player,
  PlayerId,
  Position,
  Wall,
  WallOrientation,
  WallPreview,
  GameHistoryEntry,
  GameMode,
  AIDifficulty,
} from './types/game';
import { INITIAL_POSITIONS, TARGET_ROWS, MAX_WALLS_PER_PLAYER } from './engine/coordinates';
import { getValidPawnMoves } from './engine/rules';
import { validateWallPlacement, getShortestPathDistance } from './engine/pathfinding';
import { computeAIMove } from './engine/ai';
import { soundManager } from './engine/sounds';
import { HUD } from './components/HUD';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Toast, type ToastMessage } from './components/Toast';
import { RulesModal } from './components/RulesModal';
import { VictoryModal } from './components/VictoryModal';
import { ModeModal } from './components/ModeModal';
import { MobileQRModal } from './components/MobileQRModal';
import { PauseModal } from './components/PauseModal';

interface SavedGameData {
  players: Record<PlayerId, Player>;
  activePlayerId: PlayerId;
  walls: Wall[];
  turnCount: number;
  winner: PlayerId | null;
  history: GameHistoryEntry[];
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  elapsedSeconds: number;
}

const getInitialSavedGame = (): SavedGameData | null => {
  try {
    const raw = localStorage.getItem('quoridor_saved_game');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.players && parsed.activePlayerId && Array.isArray(parsed.walls)) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }
  return null;
};

export const App: React.FC = () => {
  const initialSaved = useMemo(() => getInitialSavedGame(), []);

  // --- Game Settings ---
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    if (initialSaved?.gameMode) return initialSaved.gameMode;
    try {
      const saved = localStorage.getItem('quoridor_game_mode');
      return saved === 'pass-and-play' ? 'pass-and-play' : 'ai';
    } catch {
      return 'ai';
    }
  });

  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>(() => {
    if (initialSaved?.aiDifficulty) return initialSaved.aiDifficulty;
    try {
      const saved = localStorage.getItem('quoridor_ai_difficulty');
      return saved === 'easy' || saved === 'medium' || saved === 'hard' ? saved : 'medium';
    } catch {
      return 'medium';
    }
  });

  // --- Game State ---
  const [players, setPlayers] = useState<Record<PlayerId, Player>>(() => {
    if (initialSaved?.players) return initialSaved.players;
    return {
      1: {
        id: 1,
        name: 'Joueur 1 (Bleu)',
        position: { ...INITIAL_POSITIONS[1] },
        wallsRemaining: MAX_WALLS_PER_PLAYER,
        color: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.4)',
        targetRow: TARGET_ROWS[1],
      },
      2: {
        id: 2,
        name: gameMode === 'ai' ? 'IA King' : 'Joueur 2 (Orange)',
        position: { ...INITIAL_POSITIONS[2] },
        wallsRemaining: MAX_WALLS_PER_PLAYER,
        color: '#f97316',
        glowColor: 'rgba(249, 115, 22, 0.4)',
        targetRow: TARGET_ROWS[2],
        isAI: gameMode === 'ai',
      },
    };
  });

  const [activePlayerId, setActivePlayerId] = useState<PlayerId>(() => {
    return initialSaved?.activePlayerId ?? 1;
  });

  const [walls, setWalls] = useState<Wall[]>(() => {
    return initialSaved?.walls ?? [];
  });

  const [turnCount, setTurnCount] = useState<number>(() => {
    return initialSaved?.turnCount ?? 1;
  });

  const [winner, setWinner] = useState<PlayerId | null>(() => {
    return initialSaved?.winner ?? null;
  });

  const [history, setHistory] = useState<GameHistoryEntry[]>(() => {
    return initialSaved?.history ?? [];
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    return initialSaved?.elapsedSeconds ?? 0;
  });

  // Interaction State
  const [currentMode, setCurrentMode] = useState<ActionMode>('pawn');
  const [selectedOrientation, setSelectedOrientation] = useState<WallOrientation>('horizontal');
  const [wallPreview, setWallPreview] = useState<WallPreview | null>(null);
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);
  const aiTimeoutRef = useRef<number | null>(null);

  const [dockSide, setDockSide] = useState<'right' | 'left'>(() => {
    try {
      const saved = localStorage.getItem('quoridor_dock_side');
      return saved === 'left' ? 'left' : 'right';
    } catch {
      return 'right';
    }
  });

  // UI Modals & Alerts
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted);

  const networkUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `http://${window.location.hostname || '192.168.100.74'}:${window.location.port || '5174'}`;
    }
    return 'http://192.168.100.74:5174';
  }, []);

  const showToast = useCallback((type: ToastMessage['type'], title: string, description: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      title,
      description,
    });
    // Auto dismiss after 3.8s
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, 3800);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // --- Auto-Save Game State to localStorage ---
  useEffect(() => {
    try {
      const stateToSave: SavedGameData = {
        players,
        activePlayerId,
        walls,
        turnCount,
        winner,
        history,
        gameMode,
        aiDifficulty,
        elapsedSeconds,
      };
      localStorage.setItem('quoridor_saved_game', JSON.stringify(stateToSave));
    } catch {
      // Ignore storage errors
    }
  }, [players, activePlayerId, walls, turnCount, winner, history, gameMode, aiDifficulty, elapsedSeconds]);

  // --- Game Timer Loop (Pauses when in pause or game finished) ---
  useEffect(() => {
    if (isPaused || winner !== null) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, winner]);

  // Current active player and opponent
  const activePlayer = players[activePlayerId];
  const opponentPlayer = players[activePlayerId === 1 ? 2 : 1];

  // Legal pawn moves for active player
  const validPawnMoves = useMemo(() => {
    if (winner || isPaused || (gameMode === 'ai' && activePlayerId === 2)) return [];
    return getValidPawnMoves(activePlayer.position, opponentPlayer.position, walls);
  }, [activePlayer.position, opponentPlayer.position, walls, winner, isPaused, gameMode, activePlayerId]);

  // Shortest path distances for HUD display
  const p1Distance = useMemo(() => {
    return getShortestPathDistance(players[1].position, players[1].targetRow, walls);
  }, [players, walls]);

  const p2Distance = useMemo(() => {
    return getShortestPathDistance(players[2].position, players[2].targetRow, walls);
  }, [players, walls]);

  // --- State Snapshot Helper for Undo ---
  const saveHistorySnapshot = useCallback(
    (actionDescription: string) => {
      setHistory((prev) => [
        ...prev,
        {
          players: {
            1: { ...players[1], position: { ...players[1].position } },
            2: { ...players[2], position: { ...players[2].position } },
          },
          activePlayer: activePlayerId,
          walls: [...walls],
          turnCount,
          lastActionDescription: actionDescription,
        },
      ]);
    },
    [players, activePlayerId, walls, turnCount]
  );

  // --- Handlers ---

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (winner || isPaused || isAIThinking || (gameMode === 'ai' && activePlayerId === 2)) return;

      // If player clicks their own pawn, switch to pawn mode
      if (activePlayer.position.x === x && activePlayer.position.y === y) {
        setCurrentMode('pawn');
        setWallPreview(null);
        soundManager.playTap();
        return;
      }

      // If user is in wall mode, clicking an unrelated cell cancels the wall preview
      if (currentMode === 'wall' && wallPreview) {
        setWallPreview(null);
        return;
      }

      // Check if target is in valid pawn moves
      const isValid = validPawnMoves.some((m) => m.x === x && m.y === y);

      if (!isValid) {
        // Only trigger error if user is actively in pawn mode
        if (currentMode === 'pawn') {
          soundManager.playError();
          showToast(
            'warning',
            'Coup non autorisé',
            'Déplacez votre pion sur une case adjacente valide ou sautez par-dessus l\'adversaire.'
          );
        }
        return;
      }

      // Valid Pawn Move!
      saveHistorySnapshot(`Déplacement du Joueur ${activePlayerId} en (${String.fromCharCode(65 + x)}${y + 1})`);
      soundManager.playMove();

      const newPosition: Position = { x, y };

      // Check Win Condition
      if (newPosition.y === activePlayer.targetRow) {
        setPlayers((prev) => ({
          ...prev,
          [activePlayerId]: {
            ...prev[activePlayerId],
            position: newPosition,
          },
        }));
        setWinner(activePlayerId);
        soundManager.playVictory();
        return;
      }

      // Update position and pass turn
      setPlayers((prev) => ({
        ...prev,
        [activePlayerId]: {
          ...prev[activePlayerId],
          position: newPosition,
        },
      }));

      // Switch turn
      setActivePlayerId((prev) => (prev === 1 ? 2 : 1));
      if (activePlayerId === 2) {
        setTurnCount((prev) => prev + 1);
      }
      setWallPreview(null);
    },
    [
      winner,
      isPaused,
      isAIThinking,
      gameMode,
      activePlayer,
      activePlayerId,
      currentMode,
      wallPreview,
      validPawnMoves,
      saveHistorySnapshot,
      showToast,
    ]
  );

  const handleIntersectionClick = useCallback(
    (wx: number, wy: number) => {
      if (winner || isPaused || isAIThinking || (gameMode === 'ai' && activePlayerId === 2)) return;

      // Check remaining walls
      if (activePlayer.wallsRemaining <= 0) {
        soundManager.playError();
        showToast('error', 'Réserve épuisée', `${activePlayer.name} n'a plus de murs disponibles.`);
        return;
      }

      // If mode is pawn, switch to wall mode seamlessly
      if (currentMode !== 'wall') {
        setCurrentMode('wall');
      }

      // If player clicked the exact same intersection that already has a valid preview, confirm placement!
      if (
        wallPreview &&
        wallPreview.x === wx &&
        wallPreview.y === wy &&
        wallPreview.orientation === selectedOrientation &&
        wallPreview.isValid
      ) {
        handleConfirmWall();
        return;
      }

      // Test placement
      const validation = validateWallPlacement(
        wx,
        wy,
        selectedOrientation,
        walls,
        players[1].position,
        players[2].position,
        players[1].targetRow,
        players[2].targetRow
      );

      setWallPreview({
        x: wx,
        y: wy,
        orientation: selectedOrientation,
        isValid: validation.isValid,
        validationError: validation.reason,
      });

      if (!validation.isValid) {
        soundManager.playError();
        showToast('error', 'Placement interdit', validation.reason || 'Ce placement de mur est invalide.');
      } else {
        soundManager.playTap();
      }
    },
    [
      winner,
      isPaused,
      isAIThinking,
      gameMode,
      activePlayer,
      activePlayerId,
      currentMode,
      wallPreview,
      selectedOrientation,
      walls,
      players,
      showToast,
    ]
  );

  const handleToggleOrientation = useCallback(() => {
    if (isPaused || isAIThinking || (gameMode === 'ai' && activePlayerId === 2)) return;
    const newOri: WallOrientation = selectedOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    setSelectedOrientation(newOri);
    soundManager.playRotate();

    // If there's an active preview, re-test with new orientation
    if (wallPreview) {
      const validation = validateWallPlacement(
        wallPreview.x,
        wallPreview.y,
        newOri,
        walls,
        players[1].position,
        players[2].position,
        players[1].targetRow,
        players[2].targetRow
      );

      setWallPreview({
        x: wallPreview.x,
        y: wallPreview.y,
        orientation: newOri,
        isValid: validation.isValid,
        validationError: validation.reason,
      });

      if (!validation.isValid) {
        soundManager.playError();
        showToast('error', 'Orientation bloquée', validation.reason || 'Ce placement est interdit dans cette orientation.');
      }
    }
  }, [isPaused, isAIThinking, gameMode, activePlayerId, selectedOrientation, wallPreview, walls, players, showToast]);

  const handleConfirmWall = useCallback(() => {
    if (!wallPreview || !wallPreview.isValid || winner || isPaused) return;

    if (activePlayer.wallsRemaining <= 0) {
      soundManager.playError();
      showToast('error', 'Réserve épuisée', 'Vous n\'avez plus de murs.');
      return;
    }

    saveHistorySnapshot(`Pose de mur par le Joueur ${activePlayerId} en (${wallPreview.x}, ${wallPreview.y})`);

    const newWall: Wall = {
      id: `wall_${Date.now()}_${Math.random()}`,
      x: wallPreview.x,
      y: wallPreview.y,
      orientation: wallPreview.orientation,
      placedBy: activePlayerId,
    };

    setWalls((prev) => [...prev, newWall]);
    setPlayers((prev) => ({
      ...prev,
      [activePlayerId]: {
        ...prev[activePlayerId],
        wallsRemaining: prev[activePlayerId].wallsRemaining - 1,
      },
    }));

    soundManager.playWallPlace();
    setWallPreview(null);
    setCurrentMode('pawn'); // Reset to pawn mode for next turn

    // Toggle player
    setActivePlayerId((prev) => (prev === 1 ? 2 : 1));
    if (activePlayerId === 2) {
      setTurnCount((prev) => prev + 1);
    }
  }, [wallPreview, winner, isPaused, activePlayer.wallsRemaining, saveHistorySnapshot, activePlayerId]);

  const handleCancelPreview = useCallback(() => {
    setWallPreview(null);
    soundManager.playTap();
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || isAIThinking || isPaused) return;

    // In AI mode, if player 1 undos, undo 2 steps back to player 1's turn
    if (gameMode === 'ai' && history.length >= 2) {
      const targetState = history[history.length - 2];
      setPlayers(targetState.players);
      setActivePlayerId(1);
      setWalls(targetState.walls);
      setTurnCount(targetState.turnCount);
      setWinner(null);
      setWallPreview(null);
      setCurrentMode('pawn');
      setHistory((prev) => prev.slice(0, prev.length - 2));
    } else {
      const previousState = history[history.length - 1];
      setPlayers(previousState.players);
      setActivePlayerId(previousState.activePlayer);
      setWalls(previousState.walls);
      setTurnCount(previousState.turnCount);
      setWinner(null);
      setWallPreview(null);
      setCurrentMode('pawn');
      setHistory((prev) => prev.slice(0, prev.length - 1));
    }

    soundManager.playTap();
  }, [history, isAIThinking, isPaused, gameMode]);

  const resetGameWithSettings = useCallback(
    (mode: GameMode, _difficulty?: AIDifficulty) => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      setIsAIThinking(false);

      const freshPlayers: Record<PlayerId, Player> = {
        1: {
          id: 1,
          name: 'Joueur 1 (Bleu)',
          position: { ...INITIAL_POSITIONS[1] },
          wallsRemaining: MAX_WALLS_PER_PLAYER,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.4)',
          targetRow: TARGET_ROWS[1],
        },
        2: {
          id: 2,
          name: mode === 'ai' ? 'IA King' : 'Joueur 2 (Orange)',
          position: { ...INITIAL_POSITIONS[2] },
          wallsRemaining: MAX_WALLS_PER_PLAYER,
          color: '#f97316',
          glowColor: 'rgba(249, 115, 22, 0.4)',
          targetRow: TARGET_ROWS[2],
          isAI: mode === 'ai',
        },
      };

      setPlayers(freshPlayers);
      setActivePlayerId(1);
      setWalls([]);
      setTurnCount(1);
      setWinner(null);
      setWallPreview(null);
      setCurrentMode('pawn');
      setHistory([]);
      setElapsedSeconds(0);
      soundManager.playTap();

      try {
        localStorage.removeItem('quoridor_saved_game');
      } catch {
        // ignore
      }
    },
    []
  );

  const handleResetGame = useCallback(() => {
    resetGameWithSettings(gameMode, aiDifficulty);
  }, [resetGameWithSettings, gameMode, aiDifficulty]);

  const handleSelectModeAndDifficulty = useCallback(
    (newMode: GameMode, newDiff: AIDifficulty) => {
      setGameMode(newMode);
      setAiDifficulty(newDiff);
      try {
        localStorage.setItem('quoridor_game_mode', newMode);
        localStorage.setItem('quoridor_ai_difficulty', newDiff);
      } catch {
        // ignore
      }
      resetGameWithSettings(newMode, newDiff);
    },
    [resetGameWithSettings]
  );

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleToggleDockSide = useCallback(() => {
    setDockSide((prev) => {
      const next = prev === 'right' ? 'left' : 'right';
      try {
        localStorage.setItem('quoridor_dock_side', next);
      } catch {
        // ignore
      }
      return next;
    });
    soundManager.playTap();
  }, []);

  // --- AI Autonomous Play Loop ---
  useEffect(() => {
    if (gameMode !== 'ai' || activePlayerId !== 2 || winner !== null || isPaused) {
      return;
    }

    setIsAIThinking(true);

    const delay = aiDifficulty === 'hard' ? 650 : 500;
    aiTimeoutRef.current = window.setTimeout(() => {
      const action = computeAIMove(players[2], players[1], walls, aiDifficulty);

      if (action.type === 'move') {
        saveHistorySnapshot(
          `Déplacement IA en (${String.fromCharCode(65 + action.to.x)}${action.to.y + 1})`
        );

        if (action.to.y === players[2].targetRow) {
          // AI Wins!
          setPlayers((prev) => ({
            ...prev,
            2: {
              ...prev[2],
              position: action.to,
            },
          }));
          setWinner(2);
          soundManager.playVictory();
        } else {
          setPlayers((prev) => ({
            ...prev,
            2: {
              ...prev[2],
              position: action.to,
            },
          }));
          soundManager.playMove();
          setActivePlayerId(1);
          setTurnCount((prev) => prev + 1);
        }
      } else {
        // AI places a wall
        saveHistorySnapshot(`Pose de mur par l'IA en (${action.x}, ${action.y})`);

        const newWall: Wall = {
          id: `wall_${Date.now()}_${Math.random()}`,
          x: action.x,
          y: action.y,
          orientation: action.orientation,
          placedBy: 2,
        };

        setWalls((prev) => [...prev, newWall]);
        setPlayers((prev) => ({
          ...prev,
          2: {
            ...prev[2],
            wallsRemaining: prev[2].wallsRemaining - 1,
          },
        }));

        soundManager.playWallPlace();
        showToast(
          'info',
          "L'IA a posé un mur !",
          `Mur ${action.orientation === 'horizontal' ? 'horizontal' : 'vertical'} en ${String.fromCharCode(
            65 + action.x
          )}${action.y + 1}`
        );

        setActivePlayerId(1);
        setTurnCount((prev) => prev + 1);
      }

      setIsAIThinking(false);
      aiTimeoutRef.current = null;
    }, delay);

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, [
    gameMode,
    activePlayerId,
    winner,
    isPaused,
    players,
    walls,
    aiDifficulty,
    saveHistorySnapshot,
    showToast,
  ]);

  return (
    <main className="w-full h-full min-h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0f1117] via-[#141721] to-[#0a0c10] text-slate-100 relative pt-safe pb-safe pl-safe pr-safe">
      {/* Dynamic Toast Alerts */}
      <Toast toast={toast} onDismiss={dismissToast} />

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Pause & Saved Game Modal */}
      <PauseModal
        isOpen={isPaused}
        players={players}
        activePlayerId={activePlayerId}
        turnCount={turnCount}
        gameMode={gameMode}
        aiDifficulty={aiDifficulty}
        elapsedSeconds={elapsedSeconds}
        onResume={() => setIsPaused(false)}
        onRestart={handleResetGame}
        onOpenModeModal={() => setIsModeModalOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {/* Game Mode & AI Difficulty Selection Modal */}
      <ModeModal
        isOpen={isModeModalOpen}
        currentMode={gameMode}
        currentDifficulty={aiDifficulty}
        onSelect={handleSelectModeAndDifficulty}
        onClose={() => setIsModeModalOpen(false)}
      />

      {/* Mobile QR Code Modal */}
      <MobileQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        networkUrl={networkUrl}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        winnerId={winner}
        players={players}
        turnCount={turnCount}
        onRestart={handleResetGame}
      />

      {/* Top HUD: Header, Scores, Mode, Turn Indicator, Pause Button */}
      <HUD
        players={players}
        activePlayerId={activePlayerId}
        turnCount={turnCount}
        isMuted={isMuted}
        p1Distance={p1Distance}
        p2Distance={p2Distance}
        gameMode={gameMode}
        aiDifficulty={aiDifficulty}
        isAIThinking={isAIThinking}
        onToggleMute={handleToggleMute}
        onResetGame={handleResetGame}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenModeModal={() => setIsModeModalOpen(true)}
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onOpenPause={() => setIsPaused(true)}
      />

      {/* Center Section: Responsive Vector Game Board with Side Controls */}
      <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-1 sm:px-3 py-1 flex items-center justify-center overflow-hidden">
        <div
          className={`w-full h-full flex ${
            dockSide === 'left' ? 'flex-row-reverse' : 'flex-row'
          } items-center justify-center gap-1.5 sm:gap-3 overflow-hidden`}
        >
          {/* Board Container: Always square and fills maximum available area */}
          <div className="flex-1 h-full max-h-full aspect-square flex items-center justify-center min-w-0">
            <Board
              players={players}
              activePlayerId={activePlayerId}
              walls={walls}
              validMoves={validPawnMoves}
              wallPreview={wallPreview}
              currentMode={currentMode}
              selectedOrientation={selectedOrientation}
              onCellClick={handleCellClick}
              onIntersectionClick={handleIntersectionClick}
              onConfirmWall={handleConfirmWall}
            />
          </div>

          {/* Side Controls: Stationed directly beside the board, never covered */}
          <Controls
            currentMode={currentMode}
            selectedOrientation={selectedOrientation}
            wallPreview={wallPreview}
            wallsRemaining={activePlayer.wallsRemaining}
            canUndo={history.length > 0}
            dockSide={dockSide}
            disabled={isAIThinking || isPaused || (gameMode === 'ai' && activePlayerId === 2)}
            onSetMode={(mode) => {
              setCurrentMode(mode);
              soundManager.playTap();
            }}
            onToggleOrientation={handleToggleOrientation}
            onConfirmWall={handleConfirmWall}
            onCancelPreview={handleCancelPreview}
            onUndo={handleUndo}
            onToggleDockSide={handleToggleDockSide}
          />
        </div>
      </div>
    </main>
  );
};

export default App;
