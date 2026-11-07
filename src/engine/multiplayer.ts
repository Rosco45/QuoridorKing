import Peer, { type DataConnection } from 'peerjs';
import type {
  PlayerId,
  PlayerCount,
  BlitzTimerSetting,
  Position,
  WallOrientation,
  PeerPlayerInfo,
  CoinSide,
  CoinFlipState,
  NetworkMessage,
} from '../types/game';

export interface MultiplayerCallbacks {
  onLobbyUpdate?: (players: PeerPlayerInfo[], playerCount: PlayerCount, timer: BlitzTimerSetting, coinFlip: CoinFlipState, victoryCondition?: import('../types/game').VictoryCondition) => void;
  onCoinFlipUpdate?: (state: CoinFlipState) => void;
  onGameStart?: (startPlayerId: PlayerId, victoryCondition?: import('../types/game').VictoryCondition) => void;
  onRemoteMove?: (playerId: PlayerId, to: Position) => void;
  onRemoteWall?: (playerId: PlayerId, x: number, y: number, orientation: WallOrientation) => void;
  onRemoteTimeout?: (playerId: PlayerId) => void;
  onRemoteRestart?: () => void;
  onPeerDisconnect?: (peerId: string) => void;
  onConnectionStatus?: (status: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error', message?: string) => void;
  onError?: (err: string) => void;
}

const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ],
  },
};

export class MultiplayerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private heartbeatTimer: number | null = null;
  private isLifecycleHooked: boolean = false;

  public isHost: boolean = false;
  public myPeerId: string = '';
  public myPlayerId: PlayerId = 1;
  public myName: string = '';
  public currentRoomId: string = '';

  public playerCount: PlayerCount = 2;
  public timerSetting: BlitzTimerSetting = 0;
  public victoryCondition: import('../types/game').VictoryCondition = 'classic';
  public peers: PeerPlayerInfo[] = [];
  public coinFlip: CoinFlipState = {
    hostChoice: null,
    result: null,
    winnerPlayerId: null,
    flipping: false,
  };

  private callbacks: MultiplayerCallbacks = {};

  constructor() {
    this.setupMobileLifecycleHooks();
  }

  public setCallbacks(cb: MultiplayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...cb };
  }

  /**
   * Listens for mobile browser lifecycle events (visibilitychange, focus, pageshow).
   * When a user returns from sharing via WhatsApp/Messages/etc., mobile browsers pause
   * WebSockets. We proactively detect tab resume and call peer.reconnect().
   */
  private setupMobileLifecycleHooks() {
    if (this.isLifecycleHooked || typeof window === 'undefined') return;
    this.isLifecycleHooked = true;

    const handleResume = () => {
      if (document.visibilityState === 'visible' && this.currentRoomId && this.peer && !this.peer.destroyed) {
        if (this.peer.disconnected) {
          console.log('[Multiplayer] Tab resumed on mobile, reconnecting signaling socket...');
          this.callbacks.onConnectionStatus?.('reconnecting', 'Reconnexion au serveur...');
          try {
            this.peer.reconnect();
          } catch (e) {
            console.warn('[Multiplayer] Reconnect error on resume:', e);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    window.addEventListener('pageshow', handleResume);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.peer && !this.peer.destroyed) {
        if (this.peer.disconnected && this.currentRoomId) {
          try {
            this.peer.reconnect();
          } catch {
            // ignore
          }
        }
      }
    }, 6000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'QK-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Initializes a new room as Host
   */
  public async createRoom(
    hostName: string,
    playerCount: PlayerCount = 2,
    timerSetting: BlitzTimerSetting = 0,
    victoryCondition: import('../types/game').VictoryCondition = 'classic'
  ): Promise<string> {
    this.destroy();
    this.isHost = true;
    this.myName = hostName || 'Créateur';
    this.playerCount = playerCount;
    this.timerSetting = timerSetting;
    this.victoryCondition = victoryCondition;
    this.myPlayerId = 1;

    const roomId = this.generateRoomCode();
    this.currentRoomId = roomId;

    this.callbacks.onConnectionStatus?.('connecting', 'Création du salon en cours...');

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(roomId, PEER_CONFIG);
        this.peer = peer;

        peer.on('open', (id) => {
          this.myPeerId = id;
          this.peers = [
            {
              peerId: id,
              name: this.myName,
              playerNumber: 1,
              isHost: true,
              isReady: true,
            },
          ];
          this.coinFlip = {
            hostChoice: null,
            result: null,
            winnerPlayerId: null,
            flipping: false,
          };
          this.startHeartbeat();
          this.callbacks.onConnectionStatus?.('connected', 'Salon prêt');
          resolve(roomId);
        });

        peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn);
        });

        peer.on('disconnected', () => {
          console.warn('[Multiplayer] Host disconnected from signaling server, auto-reconnecting...');
          this.callbacks.onConnectionStatus?.('reconnecting', 'Reconnexion au serveur...');
          if (this.currentRoomId && !this.peer?.destroyed) {
            setTimeout(() => {
              if (this.peer?.disconnected && !this.peer?.destroyed) {
                try {
                  this.peer.reconnect();
                } catch {
                  // ignore
                }
              }
            }, 500);
          }
        });

        peer.on('error', (err) => {
          console.error('[Multiplayer] Host Peer error:', err);
          if (err.type === 'unavailable-id') {
            // Very rare collision: retry with fresh code
            this.createRoom(hostName, playerCount, timerSetting).then(resolve).catch(reject);
            return;
          }
          this.callbacks.onError?.(`Erreur de connexion : ${err.message}`);
          this.callbacks.onConnectionStatus?.('error', err.message);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Joins an existing room as a Client with automatic retries in case the host
   * is briefly backgrounded while sharing the link.
   */
  public async joinRoom(roomId: string, clientName: string): Promise<PlayerId> {
    this.destroy();
    this.isHost = false;
    this.myName = clientName || 'Invité';
    this.currentRoomId = roomId.toUpperCase().trim();

    this.callbacks.onConnectionStatus?.('connecting', 'Connexion au serveur...');

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(PEER_CONFIG);
        this.peer = peer;

        peer.on('open', (id) => {
          this.myPeerId = id;
          this.startHeartbeat();
          this.connectToHostWithRetry(this.currentRoomId, 1, 4, resolve, reject);
        });

        peer.on('disconnected', () => {
          console.warn('[Multiplayer] Client disconnected from signaling, auto-reconnecting...');
          if (this.currentRoomId && !this.peer?.destroyed) {
            setTimeout(() => {
              if (this.peer?.disconnected && !this.peer?.destroyed) {
                try {
                  this.peer.reconnect();
                } catch {
                  // ignore
                }
              }
            }, 500);
          }
        });

        peer.on('error', (err) => {
          console.error('[Multiplayer] Client Peer error:', err);
          // If peer-unavailable during connect, connectToHostWithRetry handles it
          if (err.type !== 'peer-unavailable') {
            this.callbacks.onError?.(`Erreur de salon : ${err.message}`);
            this.callbacks.onConnectionStatus?.('error', err.message);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private connectToHostWithRetry(
    targetHostId: string,
    attempt: number,
    maxAttempts: number,
    resolve: (id: PlayerId) => void,
    reject: (err: unknown) => void
  ) {
    if (!this.peer || this.peer.destroyed) return;

    this.callbacks.onConnectionStatus?.(
      'connecting',
      attempt > 1
        ? `Recherche du créateur... (tentative ${attempt}/${maxAttempts})`
        : 'Connexion au salon...'
    );

    let isConnected = false;
    const conn = this.peer.connect(targetHostId, {
      reliable: true,
      metadata: { name: this.myName },
    });

    this.hostConnection = conn;

    const connectionTimeout = window.setTimeout(() => {
      if (!isConnected && attempt < maxAttempts) {
        console.log(`[Multiplayer] Attempt ${attempt} timed out. Retrying in 1.5s...`);
        try {
          conn.close();
        } catch {
          // ignore
        }
        setTimeout(() => {
          this.connectToHostWithRetry(targetHostId, attempt + 1, maxAttempts, resolve, reject);
        }, 1500);
      } else if (!isConnected) {
        const errorMsg = "Impossible de joindre le créateur du salon. Assurez-vous que l'hôte est bien revenu sur la page du jeu.";
        this.callbacks.onError?.(errorMsg);
        this.callbacks.onConnectionStatus?.('error', errorMsg);
        reject(new Error(errorMsg));
      }
    }, 4500);

    conn.on('open', () => {
      isConnected = true;
      clearTimeout(connectionTimeout);
      this.callbacks.onConnectionStatus?.('connected', 'Connecté au salon !');
    });

    conn.on('data', (raw: unknown) => {
      const msg = raw as NetworkMessage;
      this.handleClientMessage(msg, resolve);
    });

    conn.on('close', () => {
      this.callbacks.onPeerDisconnect?.('host');
    });

    conn.on('error', (err) => {
      console.warn(`[Multiplayer] Conn error on attempt ${attempt}:`, err);
      if (!isConnected && attempt < maxAttempts) {
        clearTimeout(connectionTimeout);
        setTimeout(() => {
          this.connectToHostWithRetry(targetHostId, attempt + 1, maxAttempts, resolve, reject);
        }, 1500);
      }
    });
  }

  // --- Host logic ---
  private handleIncomingConnection(conn: DataConnection) {
    if (!this.isHost) return;

    // Check capacity
    const nextPlayerNum = (this.peers.length + 1) as PlayerId;
    if (nextPlayerNum > this.playerCount) {
      conn.close();
      return;
    }

    conn.on('open', () => {
      const clientName = (conn.metadata as { name?: string })?.name || `Joueur ${nextPlayerNum}`;
      this.connections.set(conn.peer, conn);

      // Check if already in list
      const existing = this.peers.find((p) => p.peerId === conn.peer);
      if (!existing) {
        this.peers.push({
          peerId: conn.peer,
          name: clientName,
          playerNumber: nextPlayerNum,
          isHost: false,
          isReady: true,
        });
      }

      this.broadcastLobbySync();
    });

    conn.on('data', (raw: unknown) => {
      const msg = raw as NetworkMessage;
      this.handleHostReceivedMessage(conn.peer, msg);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.peers = this.peers.filter((p) => p.peerId !== conn.peer);
      // Re-index remaining players
      this.peers.forEach((p, idx) => {
        p.playerNumber = (idx + 1) as PlayerId;
      });
      this.broadcastLobbySync();
      this.callbacks.onPeerDisconnect?.(conn.peer);
    });
  }

  private handleHostReceivedMessage(_fromPeerId: string, msg: NetworkMessage) {
    if (msg.type === 'COIN_FLIP_CHOICE') {
      // Guest choice
    } else if (msg.type === 'GAME_MOVE') {
      this.broadcast(msg);
      this.callbacks.onRemoteMove?.(msg.playerId, msg.to);
    } else if (msg.type === 'GAME_WALL') {
      this.broadcast(msg);
      this.callbacks.onRemoteWall?.(msg.playerId, msg.x, msg.y, msg.orientation);
    } else if (msg.type === 'GAME_TIMEOUT') {
      this.broadcast(msg);
      this.callbacks.onRemoteTimeout?.(msg.playerId);
    } else if (msg.type === 'GAME_RESTART') {
      this.broadcast(msg);
      this.callbacks.onRemoteRestart?.();
    }
  }

  // --- Client logic ---
  private handleClientMessage(msg: NetworkMessage, resolveJoin?: (id: PlayerId) => void) {
    if (msg.type === 'SYNC_LOBBY') {
      this.peers = msg.players;
      this.playerCount = msg.playerCount;
      this.timerSetting = msg.timerSetting;
      this.coinFlip = msg.coinFlip;
      if (msg.victoryCondition) {
        this.victoryCondition = msg.victoryCondition;
      }

      const me = this.peers.find((p) => p.peerId === this.myPeerId);
      if (me) {
        this.myPlayerId = me.playerNumber;
        resolveJoin?.(me.playerNumber);
      }

      this.callbacks.onLobbyUpdate?.(this.peers, this.playerCount, this.timerSetting, this.coinFlip, this.victoryCondition);
    } else if (msg.type === 'COIN_FLIP_TRIGGER') {
      this.coinFlip = {
        hostChoice: this.coinFlip.hostChoice,
        result: msg.result,
        winnerPlayerId: msg.winnerPlayerId,
        flipping: false,
      };
      this.callbacks.onCoinFlipUpdate?.(this.coinFlip);
    } else if (msg.type === 'START_GAME') {
      if (msg.victoryCondition) {
        this.victoryCondition = msg.victoryCondition;
      }
      this.callbacks.onGameStart?.(msg.startPlayerId, this.victoryCondition);
    } else if (msg.type === 'GAME_MOVE') {
      this.callbacks.onRemoteMove?.(msg.playerId, msg.to);
    } else if (msg.type === 'GAME_WALL') {
      this.callbacks.onRemoteWall?.(msg.playerId, msg.x, msg.y, msg.orientation);
    } else if (msg.type === 'GAME_TIMEOUT') {
      this.callbacks.onRemoteTimeout?.(msg.playerId);
    } else if (msg.type === 'GAME_RESTART') {
      this.callbacks.onRemoteRestart?.();
    }
  }

  // --- Actions ---

  public setHostCoinChoice(choice: CoinSide) {
    if (!this.isHost) return;
    this.coinFlip = {
      ...this.coinFlip,
      hostChoice: choice,
      result: null,
      winnerPlayerId: null,
      flipping: false,
    };
    this.broadcastLobbySync();
  }

  public triggerCoinFlip() {
    if (!this.isHost || !this.coinFlip.hostChoice) return;

    const result: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails';
    const winnerPlayerId: PlayerId = this.coinFlip.hostChoice === result ? 1 : 2;

    this.coinFlip = {
      ...this.coinFlip,
      result,
      winnerPlayerId,
      flipping: true,
    };

    const msg: NetworkMessage = {
      type: 'COIN_FLIP_TRIGGER',
      result,
      winnerPlayerId,
    };

    this.broadcast(msg);
    this.callbacks.onCoinFlipUpdate?.(this.coinFlip);
  }

  public startGame() {
    if (!this.isHost) return;

    let startPlayerId: PlayerId = 1;
    if (this.playerCount === 2 && this.coinFlip.winnerPlayerId) {
      startPlayerId = this.coinFlip.winnerPlayerId;
    }

    const msg: NetworkMessage = {
      type: 'START_GAME',
      startPlayerId,
      victoryCondition: this.victoryCondition,
    };

    this.broadcast(msg);
    this.callbacks.onGameStart?.(startPlayerId, this.victoryCondition);
  }

  public sendMove(to: Position) {
    const msg: NetworkMessage = {
      type: 'GAME_MOVE',
      playerId: this.myPlayerId,
      to,
    };
    this.send(msg);
  }

  public sendWall(x: number, y: number, orientation: WallOrientation) {
    const msg: NetworkMessage = {
      type: 'GAME_WALL',
      playerId: this.myPlayerId,
      x,
      y,
      orientation,
    };
    this.send(msg);
  }

  public sendTimeout() {
    const msg: NetworkMessage = {
      type: 'GAME_TIMEOUT',
      playerId: this.myPlayerId,
    };
    this.send(msg);
  }

  public sendRestart() {
    const msg: NetworkMessage = {
      type: 'GAME_RESTART',
    };
    this.send(msg);
  }

  private send(msg: NetworkMessage) {
    if (this.isHost) {
      this.broadcast(msg);
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(msg);
    }
  }

  private broadcast(msg: NetworkMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  private broadcastLobbySync() {
    const msg: NetworkMessage = {
      type: 'SYNC_LOBBY',
      players: this.peers,
      playerCount: this.playerCount,
      timerSetting: this.timerSetting,
      coinFlip: this.coinFlip,
      victoryCondition: this.victoryCondition,
    };
    this.broadcast(msg);
    this.callbacks.onLobbyUpdate?.(this.peers, this.playerCount, this.timerSetting, this.coinFlip, this.victoryCondition);
  }

  public destroy() {
    this.stopHeartbeat();
    this.connections.forEach((c) => {
      try {
        c.close();
      } catch {
        // ignore
      }
    });
    this.connections.clear();
    if (this.hostConnection) {
      try {
        this.hostConnection.close();
      } catch {
        // ignore
      }
      this.hostConnection = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }
    this.peers = [];
    this.currentRoomId = '';
  }
}

export const multiplayerService = new MultiplayerService();
