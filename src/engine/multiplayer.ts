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
  onLobbyUpdate?: (players: PeerPlayerInfo[], playerCount: PlayerCount, timer: BlitzTimerSetting, coinFlip: CoinFlipState) => void;
  onCoinFlipUpdate?: (state: CoinFlipState) => void;
  onGameStart?: (startPlayerId: PlayerId) => void;
  onRemoteMove?: (playerId: PlayerId, to: Position) => void;
  onRemoteWall?: (playerId: PlayerId, x: number, y: number, orientation: WallOrientation) => void;
  onRemoteTimeout?: (playerId: PlayerId) => void;
  onRemoteRestart?: () => void;
  onPeerDisconnect?: (peerId: string) => void;
  onError?: (err: string) => void;
}

export class MultiplayerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;

  public isHost: boolean = false;
  public myPeerId: string = '';
  public myPlayerId: PlayerId = 1;
  public myName: string = '';
  public currentRoomId: string = '';

  public playerCount: PlayerCount = 2;
  public timerSetting: BlitzTimerSetting = 0;
  public peers: PeerPlayerInfo[] = [];
  public coinFlip: CoinFlipState = {
    hostChoice: null,
    result: null,
    winnerPlayerId: null,
    flipping: false,
  };

  private callbacks: MultiplayerCallbacks = {};

  public setCallbacks(cb: MultiplayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...cb };
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
    timerSetting: BlitzTimerSetting = 0
  ): Promise<string> {
    this.destroy();
    this.isHost = true;
    this.myName = hostName || 'Créateur';
    this.playerCount = playerCount;
    this.timerSetting = timerSetting;
    this.myPlayerId = 1;

    const roomId = this.generateRoomCode();
    this.currentRoomId = roomId;

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(roomId, {
          debug: 1,
        });

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
          resolve(roomId);
        });

        peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn);
        });

        peer.on('error', (err) => {
          this.callbacks.onError?.(`Erreur de connexion : ${err.message}`);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Joins an existing room as a Client
   */
  public async joinRoom(roomId: string, clientName: string): Promise<PlayerId> {
    this.destroy();
    this.isHost = false;
    this.myName = clientName || 'Invité';
    this.currentRoomId = roomId.toUpperCase().trim();

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer({ debug: 1 });
        this.peer = peer;

        peer.on('open', (id) => {
          this.myPeerId = id;

          const conn = peer.connect(this.currentRoomId, {
            reliable: true,
            metadata: { name: this.myName },
          });

          this.hostConnection = conn;

          conn.on('open', () => {
            // Handshake will be received via SYNC_LOBBY
          });

          conn.on('data', (raw: unknown) => {
            const msg = raw as NetworkMessage;
            this.handleClientMessage(msg, resolve);
          });

          conn.on('close', () => {
            this.callbacks.onPeerDisconnect?.('host');
          });

          conn.on('error', (err) => {
            this.callbacks.onError?.(`Erreur hôte : ${err.message}`);
            reject(err);
          });
        });

        peer.on('error', (err) => {
          this.callbacks.onError?.(`Impossible de rejoindre le salon : ${err.message}`);
          reject(err);
        });
      } catch (err) {
        reject(err);
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

      this.peers.push({
        peerId: conn.peer,
        name: clientName,
        playerNumber: nextPlayerNum,
        isHost: false,
        isReady: true,
      });

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
      // Guest chose side if applicable
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

      const me = this.peers.find((p) => p.peerId === this.myPeerId);
      if (me) {
        this.myPlayerId = me.playerNumber;
        resolveJoin?.(me.playerNumber);
      }

      this.callbacks.onLobbyUpdate?.(this.peers, this.playerCount, this.timerSetting, this.coinFlip);
    } else if (msg.type === 'COIN_FLIP_TRIGGER') {
      this.coinFlip = {
        ...this.coinFlip,
        result: msg.result,
        winnerPlayerId: msg.winnerPlayerId,
        flipping: true,
      };
      this.callbacks.onCoinFlipUpdate?.(this.coinFlip);
    } else if (msg.type === 'START_GAME') {
      this.callbacks.onGameStart?.(msg.startPlayerId);
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
    };

    this.broadcast(msg);
    this.callbacks.onGameStart?.(startPlayerId);
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
    };
    this.broadcast(msg);
    this.callbacks.onLobbyUpdate?.(this.peers, this.playerCount, this.timerSetting, this.coinFlip);
  }

  public destroy() {
    this.connections.forEach((c) => c.close());
    this.connections.clear();
    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.peers = [];
    this.currentRoomId = '';
  }
}

export const multiplayerService = new MultiplayerService();
