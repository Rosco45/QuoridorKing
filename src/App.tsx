import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type {
  ActionMode,
  Player,
  PlayerId,
  PlayerCount,
  Position,
  Wall,
  WallOrientation,
  WallPreview,
  GameMode,
  AIDifficulty,
  BlitzTimerSetting,
  ThemeId,
  ReplayStep,
  TargetGoal,
} from './types/game';
import { THEMES } from './types/themes';
import {
  createInitialPlayers,
  hasPlayerReachedGoal,
  getNextPlayerId,
  TARGET_GOALS,
} from './engine/coordinates';
import { getValidPawnMoves } from './engine/rules';
import { validateWallPlacement, getShortestPathDistanceToGoal } from './engine/pathfinding';
import { quoridorAI } from './engine/QuoridorAI';
import { soundManager } from './engine/sounds';
import { hapticManager } from './engine/haptics';
import { multiplayerService } from './engine/multiplayer';

import { HUD } from './components/HUD';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Toast, type ToastMessage } from './components/Toast';
import { RulesModal } from './components/RulesModal';
import { VictoryModal } from './components/VictoryModal';
import { ModeModal } from './components/ModeModal';
import { MobileQRModal } from './components/MobileQRModal';
import { PauseModal } from './components/PauseModal';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { ReplayModal } from './components/ReplayModal';

interface SavedGameData {
  players: Record<PlayerId, Player>;
  activePlayerId: PlayerId;
  playerCount: PlayerCount;
  walls: Wall[];
  turnCount: number;
  winner: PlayerId | null;
  replaySteps: ReplayStep[];
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  elapsedSeconds: number;
}

const sanitizeSavedPlayers = (
  rawPlayers: Record<string, Partial<Player>>
): Record<PlayerId, Player> | null => {
  if (!rawPlayers || typeof rawPlayers !== 'object') return null;
  const p1 = rawPlayers['1'] || rawPlayers[1];
  const p2 = rawPlayers['2'] || rawPlayers[2];
  if (!p1 || !p2 || !p1.position || !p2.position) return null;

  const sanitized: Record<PlayerId, Player> = {} as Record<PlayerId, Player>;
  for (const id of [1, 2, 3, 4] as PlayerId[]) {
    const rawP = rawPlayers[id] || rawPlayers[String(id)];
    if (rawP && rawP.position) {
      sanitized[id] = {
        id,
        name: rawP.name || `Joueur ${id}`,
        position: { x: rawP.position.x ?? 4, y: rawP.position.y ?? (id === 1 ? 8 : 0) },
        wallsRemaining: typeof rawP.wallsRemaining === 'number' ? rawP.wallsRemaining : 10,
        color: rawP.color || (id === 1 ? '#38bdf8' : id === 2 ? '#f97316' : id === 3 ? '#10b981' : '#a855f7'),
        glowColor: rawP.glowColor || 'rgba(56, 189, 248, 0.4)',
        targetGoal: rawP.targetGoal?.type ? (rawP.targetGoal as TargetGoal) : TARGET_GOALS[id],
        isAI: !!rawP.isAI,
      };
    }
  }
  return sanitized;
};

const getInitialSavedGame = (): SavedGameData | null => {
  try {
    const raw = localStorage.getItem('quoridor_saved_game');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.players && parsed.activePlayerId && Array.isArray(parsed.walls)) {
        const sanitized = sanitizeSavedPlayers(parsed.players);
        if (sanitized) {
          return {
            ...parsed,
            players: sanitized,
            playerCount: parsed.playerCount === 4 ? 4 : 2,
            replaySteps: Array.isArray(parsed.replaySteps) ? parsed.replaySteps : [],
          };
        }
      }
    }
  } catch {
    // Ignore error
  }
  try {
    localStorage.removeItem('quoridor_saved_game');
  } catch {
    // ignore
  }
  return null;
};

export const App: React.FC = () => {
  const initialSaved = useMemo(() => getInitialSavedGame(), []);

  // --- Themes & Haptics ---
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('quoridor_theme') as ThemeId;
      if (saved && THEMES[saved]) return saved;
    } catch {
      // ignore
    }
    return 'wood';
  });

  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => {
    return hapticManager.isEnabled();
  });

  const currentTheme = THEMES[themeId] || THEMES.wood;

  const handleSelectTheme = useCallback((newTheme: ThemeId) => {
    setThemeId(newTheme);
    try {
      localStorage.setItem('quoridor_theme', newTheme);
    } catch {
      // ignore
    }
    hapticManager.vibrateTap();
  }, []);

  const handleToggleHaptics = useCallback(() => {
    const updated = hapticManager.toggle();
    setHapticsEnabled(updated);
    if (updated) {
      hapticManager.vibrateTap();
    }
  }, []);

  // --- Game Settings ---
  const [playerCount, setPlayerCount] = useState<PlayerCount>(() => {
    if (initialSaved?.playerCount) return initialSaved.playerCount;
    return 2;
  });

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

  const [victoryCondition, setVictoryCondition] = useState<import('./types/game').VictoryCondition>(() => {
    try {
      const saved = localStorage.getItem('quoridor_victory_condition');
      return saved === 'vortex' ? 'vortex' : 'classic';
    } catch {
      return 'classic';
    }
  });

  const [blitzTimer, setBlitzTimer] = useState<BlitzTimerSetting>(() => {
    try {
      const saved = localStorage.getItem('quoridor_blitz_timer');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if ([0, 15, 30, 45].includes(val)) return val as BlitzTimerSetting;
      }
    } catch {
      // ignore
    }
    return 0;
  });

  const [turnSecondsLeft, setTurnSecondsLeft] = useState<number>(blitzTimer || 0);

  // --- Game State ---
  const [players, setPlayers] = useState<Record<PlayerId, Player>>(() => {
    if (initialSaved?.players) return initialSaved.players;
    return createInitialPlayers(playerCount, gameMode);
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

  const [replaySteps, setReplaySteps] = useState<ReplayStep[]>(() => {
    return initialSaved?.replaySteps ?? [];
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    return initialSaved?.elapsedSeconds ?? 0;
  });

  // Interaction State
  const [currentMode, setCurrentMode] = useState<ActionMode>('pawn');
  const [selectedOrientation, setSelectedOrientation] = useState<WallOrientation>('horizontal');
  const [wallPreview, setWallPreview] = useState<WallPreview | null>(null);
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);
  const [lastBotAction, setLastBotAction] = useState<{
    type: 'move' | 'wall';
    position?: Position;
    wall?: { x: number; y: number; orientation: WallOrientation };
  } | null>(null);
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
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState<boolean>(false);
  const [isReplayOpen, setIsReplayOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted);

  // Online Multiplayer State
  const [onlineRoomCode, setOnlineRoomCode] = useState<string | null>(null);
  const [onlinePlayerId, setOnlinePlayerId] = useState<PlayerId | null>(null);

  const showToast = useCallback((type: ToastMessage['type'], title: string, description: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      title,
      description,
    });
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, 3800);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // --- Auto-detect room parameter from URL on mount ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setIsOnlineModalOpen(true);
      }
    }
  }, []);

  // --- Auto-Save Game State to localStorage ---
  useEffect(() => {
    if (gameMode === 'online') return;
    try {
      const stateToSave: SavedGameData = {
        players,
        activePlayerId,
        playerCount,
        walls,
        turnCount,
        winner,
        replaySteps,
        gameMode,
        aiDifficulty,
        elapsedSeconds,
      };
      localStorage.setItem('quoridor_saved_game', JSON.stringify(stateToSave));
    } catch {
      // Ignore storage errors
    }
  }, [
    players,
    activePlayerId,
    playerCount,
    walls,
    turnCount,
    winner,
    replaySteps,
    gameMode,
    aiDifficulty,
    elapsedSeconds,
  ]);

  // --- Game Timer Loop ---
  useEffect(() => {
    if (isPaused || winner !== null) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, winner]);

  // --- Blitz Clock Countdown Loop ---
  useEffect(() => {
    if (blitzTimer === 0 || winner !== null || isPaused || isAIThinking) return;

    const interval = setInterval(() => {
      setTurnSecondsLeft((prev) => {
        if (prev <= 1) {
          hapticManager.vibrateInvalid();
          soundManager.playError();
          const nextPlayer = getNextPlayerId(activePlayerId, playerCount);
          setActivePlayerId(nextPlayer);
          showToast(
            'warning',
            'Temps écoulé !',
            `Le temps de réflexion de ${players[activePlayerId]?.name || 'Joueur'} a expiré. Tour passé.`
          );

          if (gameMode === 'online') {
            multiplayerService.sendTimeout();
          }

          return blitzTimer;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    blitzTimer,
    activePlayerId,
    playerCount,
    winner,
    isPaused,
    isAIThinking,
    gameMode,
    players,
    showToast,
  ]);

  // Reset clock when active player changes
  useEffect(() => {
    if (blitzTimer > 0) {
      setTurnSecondsLeft(blitzTimer);
    }
  }, [activePlayerId, blitzTimer]);

  // Reset function
  const resetGame = useCallback(
    (
      count: PlayerCount,
      mode: GameMode,
      diff: AIDifficulty = aiDifficulty,
      customSlots?: Record<PlayerId, import('./types/game').PlayerSlotConfig>,
      condition: import('./types/game').VictoryCondition = count >= 3 ? victoryCondition : 'classic'
    ) => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      setIsAIThinking(false);
      setLastBotAction(null);

      const resolvedCondition = count >= 3 ? condition : 'classic';
      setVictoryCondition(resolvedCondition);
      try {
        localStorage.setItem('quoridor_victory_condition', resolvedCondition);
      } catch {
        // ignore
      }

      const freshPlayers = createInitialPlayers(count, mode, undefined, customSlots, resolvedCondition);
      setPlayerCount(count);
      setGameMode(mode);
      setAiDifficulty(diff);
      setPlayers(freshPlayers);
      setActivePlayerId(1);
      setWalls([]);
      setTurnCount(1);
      setWinner(null);
      setWallPreview(null);
      setCurrentMode('pawn');
      setReplaySteps([]);
      setElapsedSeconds(0);
      setTurnSecondsLeft(blitzTimer || 0);

      soundManager.playTap();
      hapticManager.vibrateTap();

      try {
        localStorage.removeItem('quoridor_saved_game');
      } catch {
        // ignore
      }
    },
    [aiDifficulty, blitzTimer, victoryCondition]
  );

  // Distance calculations
  const distances = useMemo(() => {
    const distMap: Record<PlayerId, number> = { 1: -1, 2: -1, 3: -1, 4: -1 };
    const pList =
      playerCount === 4
        ? ([1, 2, 3, 4] as PlayerId[])
        : playerCount === 3
        ? ([1, 2, 3] as PlayerId[])
        : ([1, 2] as PlayerId[]);
    for (const id of pList) {
      if (players[id]) {
        distMap[id] = getShortestPathDistanceToGoal(
          players[id].position,
          players[id].targetGoal,
          walls
        );
      }
    }
    return distMap;
  }, [players, walls, playerCount]);

  // Legal pawn moves for active player
  const validPawnMoves = useMemo(() => {
    if (winner || isPaused) return [];
    if (gameMode === 'ai' && activePlayerId === 2) return [];
    if (gameMode === 'online' && onlinePlayerId !== activePlayerId) return [];

    const activeP = players[activePlayerId];
    if (!activeP) return [];

    const opponentPositions = Object.values(players)
      .filter((p) => p.id !== activePlayerId)
      .map((p) => p.position);

    return getValidPawnMoves(activeP.position, opponentPositions, walls);
  }, [winner, isPaused, gameMode, activePlayerId, onlinePlayerId, players, walls]);

  // Helper to record a step in replay history
  const createReplayStep = useCallback(
    (
      actionType: 'move' | 'wall',
      pId: PlayerId,
      desc: string,
      from?: Position,
      to?: Position,
      wall?: Wall
    ): ReplayStep => {
      const playersState: Record<PlayerId, { position: Position; wallsRemaining: number }> = {
        1: { position: { ...players[1].position }, wallsRemaining: players[1].wallsRemaining },
        2: { position: { ...players[2].position }, wallsRemaining: players[2].wallsRemaining },
        3: {
          position: players[3] ? { ...players[3].position } : { x: 0, y: 0 },
          wallsRemaining: players[3]?.wallsRemaining ?? 0,
        },
        4: {
          position: players[4] ? { ...players[4].position } : { x: 0, y: 0 },
          wallsRemaining: players[4]?.wallsRemaining ?? 0,
        },
      };

      if (actionType === 'move' && to) {
        playersState[pId] = {
          position: { ...to },
          wallsRemaining: players[pId]?.wallsRemaining ?? 0,
        };
      } else if (actionType === 'wall') {
        playersState[pId] = {
          position: { ...players[pId].position },
          wallsRemaining: Math.max(0, (players[pId]?.wallsRemaining ?? 1) - 1),
        };
      }

      return {
        stepNumber: replaySteps.length + 1,
        turnNumber: turnCount,
        playerId: pId,
        actionType,
        from,
        to,
        wall: wall ? { x: wall.x, y: wall.y, orientation: wall.orientation } : undefined,
        playersState,
        wallsState: [...walls, ...(wall ? [wall] : [])],
        description: desc,
      };
    },
    [replaySteps.length, turnCount, players, walls]
  );

  // Handle cell click (Pawn Move)
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (winner || isPaused || isAIThinking) return;
      if (gameMode === 'ai' && activePlayerId === 2) return;
      if (gameMode === 'online' && onlinePlayerId !== activePlayerId) return;

      const activeP = players[activePlayerId];
      if (!activeP) return;

      if (activeP.position.x === x && activeP.position.y === y) {
        setCurrentMode('pawn');
        setWallPreview(null);
        soundManager.playTap();
        hapticManager.vibrateTap();
        return;
      }

      if (currentMode === 'wall' && wallPreview) {
        setWallPreview(null);
        return;
      }

      const isValid = validPawnMoves.some((m) => m.x === x && m.y === y);
      if (!isValid) {
        if (currentMode === 'pawn') {
          soundManager.playError();
          hapticManager.vibrateInvalid();
          showToast(
            'warning',
            'Coup non autorisé',
            'Déplacez votre pion sur une case libre ou sautez par-dessus un joueur adjacent.'
          );
        }
        return;
      }

      const dx = Math.abs(x - activeP.position.x);
      const dy = Math.abs(y - activeP.position.y);
      const isJump = dx + dy > 1 || (dx === 1 && dy === 1);

      if (isJump) {
        hapticManager.vibrateJump();
      } else {
        hapticManager.vibrateMove();
      }
      soundManager.playMove();

      const fromPos = { ...activeP.position };
      const toPos: Position = { x, y };

      const step = createReplayStep(
        'move',
        activePlayerId,
        `${activeP.name} avance en ${String.fromCharCode(65 + x)}${y + 1}`,
        fromPos,
        toPos
      );
      setReplaySteps((prev) => [...prev, step]);

      if (gameMode === 'online') {
        multiplayerService.sendMove(toPos);
      }

      const hasWon = hasPlayerReachedGoal(toPos, activeP.targetGoal);

      setPlayers((prev) => ({
        ...prev,
        [activePlayerId]: {
          ...prev[activePlayerId],
          position: toPos,
        },
      }));

      if (hasWon) {
        setWinner(activePlayerId);
        soundManager.playVictory();
        hapticManager.vibrateVictory();
        return;
      }

      const nextId = getNextPlayerId(activePlayerId, playerCount);
      setActivePlayerId(nextId);
      if (nextId === 1) {
        setTurnCount((prev) => prev + 1);
      }
      setWallPreview(null);
    },
    [
      winner,
      isPaused,
      isAIThinking,
      gameMode,
      activePlayerId,
      onlinePlayerId,
      players,
      currentMode,
      wallPreview,
      validPawnMoves,
      playerCount,
      createReplayStep,
      showToast,
    ]
  );

  // Handle intersection click (Wall preview & confirm)
  const handleIntersectionClick = useCallback(
    (wx: number, wy: number) => {
      if (winner || isPaused || isAIThinking) return;
      if (gameMode === 'ai' && activePlayerId === 2) return;
      if (gameMode === 'online' && onlinePlayerId !== activePlayerId) return;

      const activeP = players[activePlayerId];
      if (!activeP) return;

      if (activeP.wallsRemaining <= 0) {
        soundManager.playError();
        hapticManager.vibrateInvalid();
        showToast('error', 'Réserve épuisée', `${activeP.name} n'a plus de murs disponibles.`);
        return;
      }

      if (currentMode !== 'wall') {
        setCurrentMode('wall');
      }

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

      const validation = validateWallPlacement(
        wx,
        wy,
        selectedOrientation,
        walls,
        Object.values(players)
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
        hapticManager.vibrateInvalid();
        showToast('error', 'Placement interdit', validation.reason || 'Ce placement est bloqué.');
      } else {
        soundManager.playTap();
        hapticManager.vibrateTap();
      }
    },
    [
      winner,
      isPaused,
      isAIThinking,
      gameMode,
      activePlayerId,
      onlinePlayerId,
      players,
      currentMode,
      wallPreview,
      selectedOrientation,
      walls,
      showToast,
    ]
  );

  const handleToggleOrientation = useCallback(() => {
    if (isPaused || isAIThinking) return;
    if (gameMode === 'ai' && activePlayerId === 2) return;
    if (gameMode === 'online' && onlinePlayerId !== activePlayerId) return;

    const newOri: WallOrientation = selectedOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    setSelectedOrientation(newOri);
    soundManager.playRotate();
    hapticManager.vibrateTap();

    if (wallPreview) {
      const validation = validateWallPlacement(
        wallPreview.x,
        wallPreview.y,
        newOri,
        walls,
        Object.values(players)
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
        hapticManager.vibrateInvalid();
        showToast('error', 'Orientation bloquée', validation.reason || 'Placement interdit dans cette orientation.');
      }
    }
  }, [
    isPaused,
    isAIThinking,
    gameMode,
    activePlayerId,
    onlinePlayerId,
    selectedOrientation,
    wallPreview,
    walls,
    players,
    showToast,
  ]);

  const handleConfirmWall = useCallback(() => {
    if (!wallPreview || !wallPreview.isValid || winner || isPaused) return;

    const activeP = players[activePlayerId];
    if (!activeP || activeP.wallsRemaining <= 0) {
      soundManager.playError();
      hapticManager.vibrateInvalid();
      return;
    }

    const newWall: Wall = {
      id: `wall_${Date.now()}_${Math.random()}`,
      x: wallPreview.x,
      y: wallPreview.y,
      orientation: wallPreview.orientation,
      placedBy: activePlayerId,
    };

    const step = createReplayStep(
      'wall',
      activePlayerId,
      `${activeP.name} a posé un mur ${newWall.orientation === 'horizontal' ? 'horizontal' : 'vertical'} en (${wallPreview.x}, ${wallPreview.y})`,
      undefined,
      undefined,
      newWall
    );
    setReplaySteps((prev) => [...prev, step]);

    if (gameMode === 'online') {
      multiplayerService.sendWall(newWall.x, newWall.y, newWall.orientation);
    }

    setWalls((prev) => [...prev, newWall]);
    setPlayers((prev) => ({
      ...prev,
      [activePlayerId]: {
        ...prev[activePlayerId],
        wallsRemaining: prev[activePlayerId].wallsRemaining - 1,
      },
    }));

    soundManager.playWallPlace();
    hapticManager.vibrateWallPlaced();
    setWallPreview(null);
    setCurrentMode('pawn');

    const nextId = getNextPlayerId(activePlayerId, playerCount);
    setActivePlayerId(nextId);
    if (nextId === 1) {
      setTurnCount((prev) => prev + 1);
    }
  }, [
    wallPreview,
    winner,
    isPaused,
    players,
    activePlayerId,
    gameMode,
    playerCount,
    createReplayStep,
  ]);

  const handleCancelPreview = useCallback(() => {
    setWallPreview(null);
    soundManager.playTap();
    hapticManager.vibrateTap();
  }, []);

  const handleUndo = useCallback(() => {
    if (replaySteps.length === 0 || isAIThinking || isPaused || gameMode === 'online') return;

    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setIsAIThinking(false);

    let stepsToRollback = 1;
    if (gameMode === 'ai' && replaySteps.length >= 2) {
      stepsToRollback = 2;
    }

    const remainingSteps = replaySteps.slice(0, replaySteps.length - stepsToRollback);

    if (remainingSteps.length === 0) {
      const freshPlayers = createInitialPlayers(playerCount, gameMode);
      setPlayers(freshPlayers);
      setActivePlayerId(1);
      setWalls([]);
      setTurnCount(1);
      setWinner(null);
      setWallPreview(null);
      setCurrentMode('pawn');
      setReplaySteps([]);
    } else {
      const targetStep = remainingSteps[remainingSteps.length - 1];

      setPlayers((prev) => {
        const nextPlayers = { ...prev };
        for (const [idStr, state] of Object.entries(targetStep.playersState)) {
          const id = Number(idStr) as PlayerId;
          if (nextPlayers[id]) {
            nextPlayers[id] = {
              ...nextPlayers[id],
              position: { ...state.position },
              wallsRemaining: state.wallsRemaining,
            };
          }
        }
        return nextPlayers;
      });

      setWalls([...targetStep.wallsState]);
      setTurnCount(targetStep.turnNumber);
      setWinner(null);
      setWallPreview(null);
      setCurrentMode('pawn');

      if (gameMode === 'ai') {
        setActivePlayerId(1);
      } else {
        const nextId = getNextPlayerId(targetStep.playerId, playerCount);
        setActivePlayerId(nextId);
      }

      setReplaySteps(remainingSteps);
    }

    soundManager.playTap();
    hapticManager.vibrateTap();
    showToast('info', 'Coup annulé', 'Le plateau a été ramené au coup précédent.');
  }, [
    replaySteps,
    isAIThinking,
    isPaused,
    gameMode,
    playerCount,
    showToast,
  ]);

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
    hapticManager.vibrateTap();
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    hapticManager.vibrateTap();
  }, []);

  // --- AI Autonomous Loop (Supports 2, 3, or 4 Players with Multiple / Mixed Bots) ---
  useEffect(() => {
    if (winner !== null || isPaused) return;

    const currentActivePlayer = players[activePlayerId];
    if (!currentActivePlayer || !currentActivePlayer.isAI) {
      return;
    }

    setIsAIThinking(true);
    const difficulty = currentActivePlayer.aiDifficulty || aiDifficulty;
    // Simulated thinking delay (400ms to 800ms)
    const delay = difficulty === 'hard' ? 700 : difficulty === 'medium' ? 550 : 450;

    aiTimeoutRef.current = window.setTimeout(() => {
      const activePlayersList = Object.values(players);
      const action = quoridorAI.computeAction(
        currentActivePlayer,
        activePlayersList,
        walls,
        difficulty
      );

      if (action.type === 'move') {
        const fromPos = { ...currentActivePlayer.position };
        const toPos = action.to;

        const step = createReplayStep(
          'move',
          activePlayerId,
          `${currentActivePlayer.name} avance en ${String.fromCharCode(65 + toPos.x)}${toPos.y + 1}`,
          fromPos,
          toPos
        );
        setReplaySteps((prev) => [...prev, step]);

        const hasWon = hasPlayerReachedGoal(toPos, currentActivePlayer.targetGoal);

        setPlayers((prev) => ({
          ...prev,
          [activePlayerId]: {
            ...prev[activePlayerId],
            position: toPos,
          },
        }));

        setLastBotAction({ type: 'move', position: toPos });

        if (hasWon) {
          setWinner(activePlayerId);
          soundManager.playVictory();
          hapticManager.vibrateVictory();
        } else {
          soundManager.playMove();
          hapticManager.vibrateMove();
          const nextId = getNextPlayerId(activePlayerId, playerCount);
          setActivePlayerId(nextId);
          if (nextId === 1) {
            setTurnCount((prev) => prev + 1);
          }
        }
      } else {
        const newWall: Wall = {
          id: `wall_${Date.now()}_${Math.random()}`,
          x: action.x,
          y: action.y,
          orientation: action.orientation,
          placedBy: activePlayerId,
        };

        const step = createReplayStep(
          'wall',
          activePlayerId,
          `${currentActivePlayer.name} pose un mur en (${action.x}, ${action.y})`,
          undefined,
          undefined,
          newWall
        );
        setReplaySteps((prev) => [...prev, step]);

        setWalls((prev) => [...prev, newWall]);
        setPlayers((prev) => ({
          ...prev,
          [activePlayerId]: {
            ...prev[activePlayerId],
            wallsRemaining: prev[activePlayerId].wallsRemaining - 1,
          },
        }));

        setLastBotAction({ type: 'wall', wall: newWall });

        soundManager.playWallPlace();
        hapticManager.vibrateWallPlaced();
        showToast(
          'info',
          `${currentActivePlayer.name} a posé un mur !`,
          `Mur ${action.orientation === 'horizontal' ? 'horizontal' : 'vertical'} en ${String.fromCharCode(
            65 + action.x
          )}${action.y + 1}`
        );

        const nextId = getNextPlayerId(activePlayerId, playerCount);
        setActivePlayerId(nextId);
        if (nextId === 1) {
          setTurnCount((prev) => prev + 1);
        }
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
    activePlayerId,
    winner,
    isPaused,
    players,
    walls,
    aiDifficulty,
    playerCount,
    createReplayStep,
    showToast,
  ]);

  // --- Multiplayer P2P Network Hookups ---
  useEffect(() => {
    multiplayerService.setCallbacks({
      onRemoteMove: (remotePlayerId, to) => {
        soundManager.playMove();
        hapticManager.vibrateMove();

        const remoteP = players[remotePlayerId];
        const fromPos = remoteP ? { ...remoteP.position } : undefined;

        setPlayers((prev) => ({
          ...prev,
          [remotePlayerId]: {
            ...prev[remotePlayerId],
            position: to,
          },
        }));

        if (remoteP) {
          const step = createReplayStep(
            'move',
            remotePlayerId,
            `${remoteP.name} avance en ${String.fromCharCode(65 + to.x)}${to.y + 1}`,
            fromPos,
            to
          );
          setReplaySteps((prev) => [...prev, step]);

          const hasWon = hasPlayerReachedGoal(to, remoteP.targetGoal);
          if (hasWon) {
            setWinner(remotePlayerId);
            soundManager.playVictory();
            hapticManager.vibrateVictory();
            return;
          }
        }

        const nextId = getNextPlayerId(remotePlayerId, playerCount);
        setActivePlayerId(nextId);
        if (nextId === 1) {
          setTurnCount((prev) => prev + 1);
        }
      },
      onRemoteWall: (remotePlayerId, x, y, orientation) => {
        soundManager.playWallPlace();
        hapticManager.vibrateWallPlaced();

        const newWall: Wall = {
          id: `wall_${Date.now()}_${Math.random()}`,
          x,
          y,
          orientation,
          placedBy: remotePlayerId,
        };

        setWalls((prev) => [...prev, newWall]);
        setPlayers((prev) => ({
          ...prev,
          [remotePlayerId]: {
            ...prev[remotePlayerId],
            wallsRemaining: prev[remotePlayerId].wallsRemaining - 1,
          },
        }));

        const remoteP = players[remotePlayerId];
        const step = createReplayStep(
          'wall',
          remotePlayerId,
          `${remoteP?.name || 'Adversaire'} a posé un mur en (${x}, ${y})`,
          undefined,
          undefined,
          newWall
        );
        setReplaySteps((prev) => [...prev, step]);

        const nextId = getNextPlayerId(remotePlayerId, playerCount);
        setActivePlayerId(nextId);
        if (nextId === 1) {
          setTurnCount((prev) => prev + 1);
        }
      },
      onRemoteTimeout: (remotePlayerId) => {
        showToast('info', 'Temps écoulé', `Le joueur ${remotePlayerId} a dépassé son temps imparti.`);
        const nextId = getNextPlayerId(remotePlayerId, playerCount);
        setActivePlayerId(nextId);
      },
      onPeerDisconnect: (_peerId) => {
        showToast('error', 'Déconnexion', "Un joueur s'est déconnecté de la partie en ligne.");
      },
    });
  }, [players, playerCount, createReplayStep, showToast]);

  // When game starts from OnlineLobbyModal
  const handleStartOnlineGame = useCallback(
    (roomCode: string, myPlayerId: PlayerId, count: PlayerCount, startingPlayerId: PlayerId) => {
      setOnlineRoomCode(roomCode);
      setOnlinePlayerId(myPlayerId);
      setPlayerCount(count);
      setGameMode('online');

      const freshPlayers = createInitialPlayers(count, 'online');
      setPlayers(freshPlayers);
      setActivePlayerId(startingPlayerId);
      setWalls([]);
      setTurnCount(1);
      setWinner(null);
      setWallPreview(null);
      setCurrentMode('pawn');
      setReplaySteps([]);
      setElapsedSeconds(0);
      setTurnSecondsLeft(blitzTimer || 0);

      setIsOnlineModalOpen(false);
      showToast('success', 'Partie en Ligne Commencée !', `Vous jouez le Joueur ${myPlayerId}.`);
    },
    [blitzTimer, showToast]
  );

  const activePlayer =
    players[activePlayerId] ||
    players[1] ||
    createInitialPlayers(playerCount, gameMode)[1];

  return (
    <main
      className="w-full h-full min-h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden text-slate-100 relative pt-safe pb-safe pl-safe pr-safe"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${currentTheme.boardBgGradient.start} 0%, #0a0c10 100%)`,
      }}
    >
      {/* Toast Alerts */}
      <Toast toast={toast} onDismiss={dismissToast} />

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Pause Modal */}
      <PauseModal
        isOpen={isPaused}
        players={players}
        activePlayerId={activePlayerId}
        turnCount={turnCount}
        gameMode={gameMode}
        aiDifficulty={aiDifficulty}
        elapsedSeconds={elapsedSeconds}
        onResume={() => setIsPaused(false)}
        onRestart={() => resetGame(playerCount, gameMode, aiDifficulty)}
        onOpenModeModal={() => setIsModeModalOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {/* Mode & Options Modal */}
      <ModeModal
        isOpen={isModeModalOpen}
        currentMode={gameMode}
        currentDifficulty={aiDifficulty}
        playerCount={playerCount}
        victoryCondition={victoryCondition}
        blitzTimer={blitzTimer}
        onSelectMode={(mode, diff, count, customSlots, condition) => {
          resetGame(count, mode, diff, customSlots, condition);
        }}
        onSelectTimer={(t) => {
          setBlitzTimer(t);
          setTurnSecondsLeft(t);
          try {
            localStorage.setItem('quoridor_blitz_timer', t.toString());
          } catch {
            // ignore
          }
        }}
        onOpenOnline={() => setIsOnlineModalOpen(true)}
        onClose={() => setIsModeModalOpen(false)}
      />

      {/* Theme & Settings Modal */}
      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        currentTheme={themeId}
        hapticsEnabled={hapticsEnabled}
        onSelectTheme={handleSelectTheme}
        onToggleHaptics={handleToggleHaptics}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Online Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isOnlineModalOpen}
        onStartGame={handleStartOnlineGame}
        onClose={() => setIsOnlineModalOpen(false)}
      />

      {/* Mobile QR Modal */}
      <MobileQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        networkUrl={typeof window !== 'undefined' ? window.location.href : 'https://quoridor-king.vercel.app'}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        winnerId={isReplayOpen ? null : winner}
        players={players}
        playerCount={playerCount}
        turnCount={turnCount}
        theme={currentTheme}
        onRestart={() => resetGame(playerCount, gameMode, aiDifficulty)}
        onOpenReplay={() => setIsReplayOpen(true)}
      />

      {/* Game Replay Modal (Rendered on top with z-[70] and active when Victory is reviewed) */}
      <ReplayModal
        isOpen={isReplayOpen}
        replaySteps={replaySteps}
        themeId={themeId}
        onClose={() => setIsReplayOpen(false)}
        onRestart={() => {
          setIsReplayOpen(false);
          resetGame(playerCount, gameMode, aiDifficulty);
        }}
      />

      {/* HUD Bar */}
      <HUD
        players={players}
        activePlayerId={activePlayerId}
        playerCount={playerCount}
        turnCount={turnCount}
        isMuted={isMuted}
        distances={distances}
        gameMode={gameMode}
        aiDifficulty={aiDifficulty}
        victoryCondition={victoryCondition}
        isAIThinking={isAIThinking}
        blitzTimer={blitzTimer}
        turnSecondsLeft={turnSecondsLeft}
        theme={currentTheme}
        onlineRoomCode={onlineRoomCode}
        onlinePlayerId={onlinePlayerId}
        onToggleMute={handleToggleMute}
        onResetGame={() => resetGame(playerCount, gameMode, aiDifficulty)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenModeModal={() => setIsModeModalOpen(true)}
        onOpenOnlineLobby={() => setIsOnlineModalOpen(true)}
        onOpenThemeSettings={() => setIsThemeModalOpen(true)}
        onOpenPause={() => setIsPaused(true)}
      />

      {/* Center Section: Board + Docked Controls */}
      <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-1 sm:px-3 py-1 flex items-center justify-center overflow-hidden">
        <div
          className={`w-full h-full flex ${
            dockSide === 'left' ? 'flex-row-reverse' : 'flex-row'
          } items-center justify-center gap-1.5 sm:gap-3 overflow-hidden`}
        >
          {/* Board Container */}
          <div className="flex-1 h-full max-h-full aspect-square flex items-center justify-center min-w-0">
            <Board
              players={players}
              activePlayerId={activePlayerId}
              playerCount={playerCount}
              walls={walls}
              validMoves={validPawnMoves}
              wallPreview={wallPreview}
              currentMode={currentMode}
              selectedOrientation={selectedOrientation}
              theme={currentTheme}
              victoryCondition={victoryCondition}
              lastBotAction={lastBotAction}
              onCellClick={handleCellClick}
              onIntersectionClick={handleIntersectionClick}
              onConfirmWall={handleConfirmWall}
            />
          </div>

          {/* Side Controls */}
          <Controls
            currentMode={currentMode}
            selectedOrientation={selectedOrientation}
            wallPreview={wallPreview}
            wallsRemaining={activePlayer?.wallsRemaining ?? 0}
            canUndo={replaySteps.length > 0 && gameMode !== 'online'}
            dockSide={dockSide}
            disabled={
              isAIThinking ||
              isPaused ||
              (activePlayer?.isAI ?? false) ||
              (gameMode === 'online' && onlinePlayerId !== activePlayerId)
            }
            onSetMode={(mode) => {
              setCurrentMode(mode);
              soundManager.playTap();
              hapticManager.vibrateTap();
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
