import { StateAuthority } from './StateAuthority.js';

const MAX_PLAYERS = 8;
const TICK_RATE = 20; // Hz
const TICK_INTERVAL = 1000 / TICK_RATE;
const MIN_UNICORNS = 4;

let nextId = 1;

export class GameRoom {
  constructor() {
    this._players = new Map(); // id -> { ws, name }
    this._state = new StateAuthority();
    this._tickTimer = null;
    this._startTick();
  }

  get playerCount() {
    return this._players.size;
  }

  addPlayer(ws) {
    if (this._players.size >= MAX_PLAYERS) return null;

    const id = `p${nextId++}`;
    this._players.set(id, { ws, name: `Player ${nextId - 1}` });

    // Initialize player state on authority
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnRadius = 5 + Math.random() * 10;
    this._state.addPlayer(id, {
      x: Math.sin(spawnAngle) * spawnRadius,
      y: 0,
      z: Math.cos(spawnAngle) * spawnRadius,
      ry: spawnAngle + Math.PI,
    });

    // Notify the joining player
    this._send(ws, {
      type: 'join',
      playerId: id,
      players: this._state.getSnapshot().players,
    });

    // Notify others
    this._broadcast({
      type: 'event',
      event: 'playerJoined',
      playerId: id,
    }, id);

    this._updateBots();
    return id;
  }

  removePlayer(id) {
    this._players.delete(id);
    this._state.removePlayer(id);

    this._broadcast({
      type: 'leave',
      playerId: id,
    });

    this._updateBots();

    if (this._players.size === 0) {
      this._state.removeAllBots();
    }
  }

  handleMessage(playerId, msg) {
    switch (msg.type) {
      case 'input':
        this._state.applyInput(playerId, msg.seq, msg.input);
        break;
      case 'ping':
        this._sendTo(playerId, { type: 'pong', t: msg.t });
        break;
    }
  }

  _updateBots() {
    const humanCount = this._players.size;
    if (humanCount === 0) return;

    const totalTarget = Math.max(MIN_UNICORNS, humanCount);
    const botsNeeded = Math.max(0, totalTarget - humanCount);
    this._state.adjustBots(botsNeeded);
  }

  _startTick() {
    this._tickTimer = setInterval(() => {
      this._state.tick(TICK_INTERVAL / 1000);
      const snapshot = this._state.getSnapshot();
      this._broadcast({ type: 'state', ...snapshot });
    }, TICK_INTERVAL);
  }

  _send(ws, data) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    }
  }

  _sendTo(playerId, data) {
    const player = this._players.get(playerId);
    if (player) this._send(player.ws, data);
  }

  _broadcast(data, excludeId) {
    const json = JSON.stringify(data);
    for (const [id, { ws }] of this._players) {
      if (id === excludeId) continue;
      if (ws.readyState === 1) {
        ws.send(json);
      }
    }
  }
}
