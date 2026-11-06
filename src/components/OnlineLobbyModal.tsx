import React, { useState, useEffect } from 'react';
import type { PlayerCount, BlitzTimerSetting, PeerPlayerInfo, CoinSide, CoinFlipState, PlayerId } from '../types/game';
import { X, Check, Share2, Users, Wifi, Play, Coins } from 'lucide-react';
import { multiplayerService } from '../engine/multiplayer';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onStartGame: (roomCode: string, myPlayerId: PlayerId, count: PlayerCount, startingPlayerId: PlayerId) => void;
  onClose: () => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onStartGame,
  onClose,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('quoridor_player_name') || 'Joueur';
  });
  const [joinCode, setJoinCode] = useState<string>('');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<PlayerCount>(2);
  const [selectedTimer, setSelectedTimer] = useState<BlitzTimerSetting>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Lobby Live State
  const [isInLobby, setIsInLobby] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>('');
  const [peers, setPeers] = useState<PeerPlayerInfo[]>([]);
  const [lobbyPlayerCount, setLobbyPlayerCount] = useState<PlayerCount>(2);
  const [coinFlip, setCoinFlip] = useState<CoinFlipState>({
    hostChoice: null,
    result: null,
    winnerPlayerId: null,
    flipping: false,
  });

  // Pre-fill room code from URL query param if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setJoinCode(roomParam.toUpperCase());
        setTab('join');
      }
    }
  }, [isOpen]);

  // Set callbacks on multiplayerService
  useEffect(() => {
    multiplayerService.setCallbacks({
      onLobbyUpdate: (updatedPeers, count, _timer, updatedCoinFlip) => {
        setPeers([...updatedPeers]);
        setLobbyPlayerCount(count);
        setCoinFlip({ ...updatedCoinFlip });
      },
      onCoinFlipUpdate: (flipState) => {
        setCoinFlip({ ...flipState });
      },
      onGameStart: (startPlayerId) => {
        onStartGame(
          multiplayerService.currentRoomId,
          multiplayerService.myPlayerId,
          multiplayerService.playerCount,
          startPlayerId
        );
      },
      onError: (err) => {
        setErrorMsg(err);
      },
    });
  }, [onStartGame]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const inviteUrl = `${window.location.origin}/?room=${roomId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Rejoins ma partie de QuoridorKing !',
          text: `Rejoins mon salon QuoridorKing avec le code ${roomId}`,
          url: inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        // ignore
      }
    }
  };

  const handleCreate = async () => {
    if (!playerName.trim()) return;
    setIsConnecting(true);
    setErrorMsg('');
    try {
      localStorage.setItem('quoridor_player_name', playerName.trim());
      const room = await multiplayerService.createRoom(
        playerName.trim(),
        selectedPlayerCount,
        selectedTimer
      );
      setRoomId(room);
      setIsHost(true);
      setIsInLobby(true);
      setLobbyPlayerCount(selectedPlayerCount);
      setPeers([...multiplayerService.peers]);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Erreur lors de la création du salon');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim() || !joinCode.trim()) return;
    setIsConnecting(true);
    setErrorMsg('');
    try {
      localStorage.setItem('quoridor_player_name', playerName.trim());
      await multiplayerService.joinRoom(joinCode.trim().toUpperCase(), playerName.trim());
      setRoomId(joinCode.trim().toUpperCase());
      setIsHost(false);
      setIsInLobby(true);
      setPeers([...multiplayerService.peers]);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Impossible de rejoindre le salon');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleHostCoinChoice = (choice: CoinSide) => {
    multiplayerService.setHostCoinChoice(choice);
  };

  const handleTriggerCoinFlip = () => {
    multiplayerService.triggerCoinFlip();
  };

  const handleStartGame = () => {
    multiplayerService.startGame();
  };

  const handleLeaveLobby = () => {
    multiplayerService.destroy();
    setIsInLobby(false);
    setPeers([]);
    setRoomId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-pop-in select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100">Multijoueur en Ligne (P2P)</h3>
              <span className="text-[10px] text-slate-400">Sans serveur • WebRTC direct</span>
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

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {!isInLobby ? (
            /* Creation / Join View */
            <div className="space-y-4">
              {/* Pseudo Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Votre Pseudo :
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ex: RoiQuoridor"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Tabs Create vs Join */}
              <div className="flex border-b border-slate-800 p-0.5 bg-slate-950 rounded-xl gap-1">
                <button
                  onClick={() => setTab('create')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    tab === 'create' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Créer un Salon
                </button>
                <button
                  onClick={() => setTab('join')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    tab === 'join' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Rejoindre
                </button>
              </div>

              {tab === 'create' ? (
                <div className="space-y-3.5">
                  {/* Player Count */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nombre de Joueurs :
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedPlayerCount(2)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          selectedPlayerCount === 2
                            ? 'bg-purple-950/40 border-purple-500 text-purple-300 ring-1 ring-purple-400/40'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Duel (2 Joueurs)</span>
                      </button>
                      <button
                        onClick={() => setSelectedPlayerCount(4)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          selectedPlayerCount === 4
                            ? 'bg-purple-950/40 border-purple-500 text-purple-300 ring-1 ring-purple-400/40'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Bataille (4 Joueurs)</span>
                      </button>
                    </div>
                  </div>

                  {/* Timer Blitz */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Pendule Blitz (par coup) :
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {([0, 15, 30, 45] as BlitzTimerSetting[]).map((t) => (
                        <button
                          key={`timer-btn-${t}`}
                          onClick={() => setSelectedTimer(t)}
                          className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all ${
                            selectedTimer === t
                              ? 'bg-amber-950/40 border-amber-500 text-amber-300 ring-1 ring-amber-400/40'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400'
                          }`}
                        >
                          {t === 0 ? 'Sans' : `${t}s`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={isConnecting || !playerName.trim()}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isConnecting ? 'Création en cours...' : 'Ouvrir le Salon'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Code du Salon :
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Ex: QK-9X4A"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-purple-400 font-mono text-sm font-bold tracking-widest text-center focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    onClick={handleJoin}
                    disabled={isConnecting || !playerName.trim() || !joinCode.trim()}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isConnecting ? 'Connexion en cours...' : 'Rejoindre la Partie'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Active Lobby Waiting Room View */
            <div className="space-y-4">
              {/* Room Code Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Code du Salon :
                  </span>
                  <span className="text-lg font-mono font-black text-purple-400 tracking-wider">
                    {roomId}
                  </span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold active:scale-95 transition-all shadow"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copié !' : 'Partager'}</span>
                </button>
              </div>

              {/* Connected Players List */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-300 block">
                  Joueurs Connectés ({peers.length}/{lobbyPlayerCount}) :
                </span>
                <div className="space-y-1.5">
                  {peers.map((p) => (
                    <div
                      key={p.peerId}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-slate-950"
                          style={{
                            backgroundColor:
                              p.playerNumber === 1
                                ? '#38bdf8'
                                : p.playerNumber === 2
                                ? '#f97316'
                                : p.playerNumber === 3
                                ? '#10b981'
                                : '#a855f7',
                          }}
                        >
                          {p.playerNumber}
                        </div>
                        <span className="font-bold text-xs text-slate-200">{p.name}</span>
                        {p.isHost && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Hôte
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Prêt
                      </span>
                    </div>
                  ))}

                  {/* Empty slots placeholders */}
                  {Array.from({ length: Math.max(0, lobbyPlayerCount - peers.length) }).map((_, idx) => (
                    <div
                      key={`empty-slot-${idx}`}
                      className="p-2.5 rounded-xl border border-dashed border-slate-800 text-slate-500 flex items-center gap-2 text-xs"
                    >
                      <div className="w-6 h-6 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-[10px]">
                        ?
                      </div>
                      <span className="italic">En attente d'un joueur...</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2-Player Coin Flip Mini-Game */}
              {lobbyPlayerCount === 2 && peers.length === 2 && (
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>Tirage au Sort : Pile ou Face</span>
                  </div>

                  {isHost && !coinFlip.result && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-300">
                        Choisissez votre face pour déterminer qui commence :
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleHostCoinChoice('heads')}
                          className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                            coinFlip.hostChoice === 'heads'
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-300'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          👑 Pile
                        </button>
                        <button
                          onClick={() => handleHostCoinChoice('tails')}
                          className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                            coinFlip.hostChoice === 'tails'
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-300'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          ⚜️ Face
                        </button>
                      </div>

                      {coinFlip.hostChoice && (
                        <button
                          onClick={handleTriggerCoinFlip}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition-all mt-2"
                        >
                          Lancer la pièce ! 🪙
                        </button>
                      )}
                    </div>
                  )}

                  {!isHost && !coinFlip.result && (
                    <p className="text-[11px] text-slate-400 italic">
                      L'hôte effectue le tirage à pile ou face...
                    </p>
                  )}

                  {/* Coin Flip Result Announcement */}
                  {coinFlip.result && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/50 animate-pop-in">
                      <span className="text-xl block mb-1">
                        {coinFlip.result === 'heads' ? '👑 PILE' : '⚜️ FACE'}
                      </span>
                      <p className="text-xs font-bold text-emerald-400">
                        {coinFlip.winnerPlayerId === 1
                          ? `${peers[0]?.name || 'Joueur 1'} a gagné et joue en premier !`
                          : `${peers[1]?.name || 'Joueur 2'} a gagné et joue en premier !`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Start Game Button (Host only) */}
              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={peers.length < lobbyPlayerCount}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {peers.length < lobbyPlayerCount
                      ? `En attente de ${lobbyPlayerCount - peers.length} joueur(s)...`
                      : 'Lancer la Partie !'}
                  </span>
                </button>
              )}

              {!isHost && (
                <div className="text-center p-2 text-xs text-slate-400 italic">
                  En attente que l'hôte lance la partie...
                </div>
              )}

              {/* Leave Lobby Button */}
              <button
                onClick={handleLeaveLobby}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold border border-slate-700"
              >
                Quitter le Salon
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
