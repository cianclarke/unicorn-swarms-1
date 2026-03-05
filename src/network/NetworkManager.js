import { NET_DEFAULT_PORT } from '../utils/Constants.js';

const MSG = {
  JOIN: 'join',
  LEAVE: 'leave',
  INPUT: 'input',
  STATE: 'state',
  EVENT: 'event',
  PING: 'ping',
  PONG: 'pong',
};

export { MSG };

export class NetworkManager {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.playerId = null;
    this.latency = 0;
    this._listeners = new Map();
    this._pingInterval = null;
    this._lastPingTime = 0;
    this._seq = 0;
  }

  connect(url) {
    if (!url) {
      const host = window.location.hostname || 'localhost';
      url = `ws://${host}:${NET_DEFAULT_PORT}`;
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connected = true;
        this._startPing();
        resolve();
      };

      this.ws.onerror = (err) => {
        reject(err);
      };

      this.ws.onclose = () => {
        this.connected = false;
        this._stopPing();
        this._emit('disconnect');
      };

      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        this._handleMessage(msg);
      };
    });
  }

  disconnect() {
    if (this.ws) {
      this._stopPing();
      this.ws.close();
      this.ws = null;
      this.connected = false;
      this.playerId = null;
    }
  }

  sendInput(inputState) {
    this._seq++;
    this.send({
      type: MSG.INPUT,
      seq: this._seq,
      input: inputState,
    });
    return this._seq;
  }

  send(data) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
  }

  off(event, callback) {
    const cbs = this._listeners.get(event);
    if (cbs) {
      const idx = cbs.indexOf(callback);
      if (idx !== -1) cbs.splice(idx, 1);
    }
  }

  _emit(event, data) {
    const cbs = this._listeners.get(event);
    if (cbs) {
      for (const cb of cbs) cb(data);
    }
  }

  _handleMessage(msg) {
    switch (msg.type) {
      case MSG.JOIN:
        this.playerId = msg.playerId;
        this._emit('join', msg);
        break;
      case MSG.LEAVE:
        this._emit('leave', msg);
        break;
      case MSG.STATE:
        this._emit('state', msg);
        break;
      case MSG.EVENT:
        this._emit('event', msg);
        break;
      case MSG.PONG:
        this.latency = Date.now() - this._lastPingTime;
        break;
      default:
        this._emit(msg.type, msg);
    }
  }

  _startPing() {
    this._pingInterval = setInterval(() => {
      this._lastPingTime = Date.now();
      this.send({ type: MSG.PING, t: this._lastPingTime });
    }, 2000);
  }

  _stopPing() {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
  }

  get seq() {
    return this._seq;
  }
}
