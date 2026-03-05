import * as THREE from 'three';
import { NET_INTERPOLATION_DELAY, NET_PREDICTION_THRESHOLD, PHYSICS_TIMESTEP } from '../utils/Constants.js';

export class StateSync {
  constructor(networkManager) {
    this.network = networkManager;
    this._remoteBuffers = new Map();   // playerId -> [{timestamp, state}]
    this._pendingInputs = [];          // local inputs awaiting server ack
    this._lastServerState = null;
    this._serverTimestamp = 0;
  }

  pushLocalInput(seq, inputSnapshot) {
    this._pendingInputs.push({ seq, input: inputSnapshot });
  }

  onServerState(serverState) {
    this._lastServerState = serverState;
    this._serverTimestamp = serverState.timestamp;

    // Buffer remote player states for interpolation
    for (const player of serverState.players) {
      if (player.id === this.network.playerId) continue;

      if (!this._remoteBuffers.has(player.id)) {
        this._remoteBuffers.set(player.id, []);
      }
      const buffer = this._remoteBuffers.get(player.id);
      buffer.push({
        timestamp: serverState.timestamp,
        state: player,
      });

      // Keep only last 1s of snapshots
      while (buffer.length > 20) {
        buffer.shift();
      }
    }

    // Reconcile local prediction
    this._reconcile(serverState);
  }

  getInterpolatedState(playerId, now) {
    const buffer = this._remoteBuffers.get(playerId);
    if (!buffer || buffer.length < 2) {
      return buffer && buffer.length === 1 ? buffer[0].state : null;
    }

    const renderTime = now - NET_INTERPOLATION_DELAY;

    // Find two snapshots to interpolate between
    let before = null;
    let after = null;
    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i].timestamp <= renderTime && buffer[i + 1].timestamp >= renderTime) {
        before = buffer[i];
        after = buffer[i + 1];
        break;
      }
    }

    if (!before || !after) {
      return buffer[buffer.length - 1].state;
    }

    const range = after.timestamp - before.timestamp;
    const t = range > 0 ? (renderTime - before.timestamp) / range : 0;

    return {
      id: playerId,
      x: before.state.x + (after.state.x - before.state.x) * t,
      y: before.state.y + (after.state.y - before.state.y) * t,
      z: before.state.z + (after.state.z - before.state.z) * t,
      ry: lerpAngle(before.state.ry, after.state.ry, t),
      health: after.state.health,
      state: after.state.state,
      name: after.state.name,
    };
  }

  _reconcile(serverState) {
    const localPlayer = serverState.players.find(
      (p) => p.id === this.network.playerId
    );
    if (!localPlayer) return;

    // Drop inputs already processed by server
    const lastSeq = (serverState.lastProcessedSeqs && serverState.lastProcessedSeqs[this.network.playerId]) || 0;
    this._pendingInputs = this._pendingInputs.filter(
      (inp) => inp.seq > lastSeq
    );

    // If latency is low, no prediction needed
    if (this.network.latency < NET_PREDICTION_THRESHOLD && this._pendingInputs.length === 0) {
      return;
    }

    // Return the server-authoritative position + pending inputs for re-simulation
    return {
      serverPos: { x: localPlayer.x, y: localPlayer.y, z: localPlayer.z },
      serverRy: localPlayer.ry,
      pendingInputs: this._pendingInputs,
    };
  }

  reconcileLocalPlayer(playerUnicorn, applyInputFn) {
    if (!this._lastServerState) return;

    const reconciliation = this._reconcile(this._lastServerState);
    if (!reconciliation) return;

    // Snap to server position
    playerUnicorn.position.set(
      reconciliation.serverPos.x,
      reconciliation.serverPos.y,
      reconciliation.serverPos.z,
    );
    playerUnicorn.rotation.y = reconciliation.serverRy;

    // Re-apply unacknowledged inputs
    for (const pending of reconciliation.pendingInputs) {
      applyInputFn(pending.input, PHYSICS_TIMESTEP);
    }
  }

  removePlayer(playerId) {
    this._remoteBuffers.delete(playerId);
  }

  getRemotePlayerIds() {
    return Array.from(this._remoteBuffers.keys());
  }
}

function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
