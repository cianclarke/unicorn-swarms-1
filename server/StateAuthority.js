const BASE_MOVE_SPEED = 6;
const FORWARD_SPEED_BONUS = 1.2;
const BACKWARD_SPEED_PENALTY = 0.8;
const ROTATION_SPEED = 3;
const CHARGE_SPEED_MULTIPLIER = 2.5;
const CHARGE_DURATION = 1.5;
const CHARGE_COOLDOWN = 4;
const CHARGE_DAMAGE = 25;
const HIT_RADIUS = 1.5;
const MAX_HEALTH = 100;
const ARENA_SIZE = 50;
const JUMP_VELOCITY = 8;
const GRAVITY = -20;
const JUMP_COOLDOWN = 1.5;

let botIdCounter = 1;

export class StateAuthority {
  constructor() {
    this._players = new Map();   // id -> player state
    this._bots = new Map();      // id -> bot state
    this._lastProcessedSeq = new Map(); // playerId -> last seq
  }

  addPlayer(id, spawn) {
    this._players.set(id, {
      id,
      x: spawn.x,
      y: spawn.y,
      z: spawn.z,
      ry: spawn.ry,
      vx: 0,
      vy: 0,
      vz: 0,
      health: MAX_HEALTH,
      state: 'idle',
      name: `Player ${id.slice(1)}`,
      charging: false,
      chargeTimer: 0,
      chargeCooldown: 0,
      chargeDirX: 0,
      chargeDirZ: 0,
      airborne: false,
      verticalVelocity: 0,
      jumpCooldown: 0,
      hits: 0,
    });
    this._lastProcessedSeq.set(id, 0);
  }

  removePlayer(id) {
    this._players.delete(id);
    this._lastProcessedSeq.delete(id);
  }

  removeAllBots() {
    this._bots.clear();
  }

  adjustBots(targetCount) {
    const currentCount = this._bots.size;
    if (currentCount < targetCount) {
      for (let i = currentCount; i < targetCount; i++) {
        this._spawnBot();
      }
    } else if (currentCount > targetCount) {
      const ids = Array.from(this._bots.keys());
      for (let i = 0; i < currentCount - targetCount; i++) {
        this._bots.delete(ids[ids.length - 1 - i]);
      }
    }
  }

  _spawnBot() {
    const id = `bot${botIdCounter++}`;
    const angle = Math.random() * Math.PI * 2;
    const radius = 10 + Math.random() * 15;
    this._bots.set(id, {
      id,
      x: Math.sin(angle) * radius,
      y: 0,
      z: Math.cos(angle) * radius,
      ry: angle + Math.PI,
      health: MAX_HEALTH,
      state: 'idle',
      name: id,
      charging: false,
      chargeTimer: 0,
      chargeCooldown: 0,
      chargeDirX: 0,
      chargeDirZ: 0,
      airborne: false,
      verticalVelocity: 0,
      jumpCooldown: 0,
      hits: 0,
      // AI state
      _aiTimer: 0,
      _roamDir: angle,
    });
  }

  applyInput(playerId, seq, input) {
    const player = this._players.get(playerId);
    if (!player) return;

    this._lastProcessedSeq.set(playerId, seq);
    this._applyInputToEntity(player, input);
  }

  _applyInputToEntity(entity, input, dt = 1 / 60) {
    if (entity.state === 'eliminated') return;

    // Handle jump
    if (input.jump && !entity.airborne && entity.jumpCooldown <= 0 && entity.state !== 'charging') {
      entity.verticalVelocity = JUMP_VELOCITY;
      entity.airborne = true;
      entity.state = 'airborne';
    }

    // Handle charge
    if (input.charge && !entity.charging && entity.chargeCooldown <= 0
        && entity.state !== 'eliminated' && entity.state !== 'airborne') {
      entity.charging = true;
      entity.chargeTimer = CHARGE_DURATION;
      const ry = entity.ry;
      entity.chargeDirX = Math.sin(ry);
      entity.chargeDirZ = Math.cos(ry);
      entity.state = 'charging';
    }

    // Don't allow movement/rotation override while charging
    if (entity.state === 'charging') return;

    // Rotation
    if (input.left) entity.ry += ROTATION_SPEED * dt;
    if (input.right) entity.ry -= ROTATION_SPEED * dt;

    // Movement
    const sinRy = Math.sin(entity.ry);
    const cosRy = Math.cos(entity.ry);
    let speed = 0;

    if (input.forward) {
      speed = BASE_MOVE_SPEED * FORWARD_SPEED_BONUS;
      if (entity.state !== 'airborne') entity.state = 'moving';
    } else if (input.backward) {
      speed = -BASE_MOVE_SPEED * BACKWARD_SPEED_PENALTY;
      if (entity.state !== 'airborne') entity.state = 'moving';
    } else if (!input.left && !input.right) {
      if (entity.state !== 'airborne') entity.state = 'idle';
    }

    if (speed !== 0) {
      entity.x += sinRy * speed * dt;
      entity.z += cosRy * speed * dt;
    }

    // Clamp to arena
    const limit = ARENA_SIZE - 1;
    entity.x = Math.max(-limit, Math.min(limit, entity.x));
    entity.z = Math.max(-limit, Math.min(limit, entity.z));
  }

  tick(dt) {
    const allEntities = [
      ...this._players.values(),
      ...this._bots.values(),
    ];

    // Update charging entities
    for (const entity of allEntities) {
      if (entity.state === 'eliminated') continue;

      // Jump cooldown
      if (entity.jumpCooldown > 0) entity.jumpCooldown -= dt;

      // Gravity for airborne
      if (entity.airborne) {
        entity.verticalVelocity += GRAVITY * dt;
        entity.y += entity.verticalVelocity * dt;
        if (entity.y <= 0) {
          entity.y = 0;
          entity.verticalVelocity = 0;
          entity.airborne = false;
          entity.jumpCooldown = JUMP_COOLDOWN;
          if (entity.state === 'airborne') entity.state = 'idle';
        }
      }

      // Charge movement + collision
      if (entity.charging) {
        const speed = BASE_MOVE_SPEED * FORWARD_SPEED_BONUS * CHARGE_SPEED_MULTIPLIER;
        entity.x += entity.chargeDirX * speed * dt;
        entity.z += entity.chargeDirZ * speed * dt;

        // Clamp
        const limit = ARENA_SIZE - 1;
        entity.x = Math.max(-limit, Math.min(limit, entity.x));
        entity.z = Math.max(-limit, Math.min(limit, entity.z));

        // Check hits
        for (const other of allEntities) {
          if (other === entity) continue;
          if (other.state === 'eliminated' || other.state === 'airborne') continue;
          const dx = entity.x - other.x;
          const dz = entity.z - other.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < HIT_RADIUS * 2) {
            other.health = Math.max(0, other.health - CHARGE_DAMAGE);
            entity.hits++;
            if (other.health <= 0) {
              other.state = 'eliminated';
            }
          }
        }

        entity.chargeTimer -= dt;
        if (entity.chargeTimer <= 0) {
          entity.charging = false;
          entity.chargeCooldown = CHARGE_COOLDOWN;
          entity.state = 'idle';
        }
      } else if (entity.chargeCooldown > 0) {
        entity.chargeCooldown = Math.max(0, entity.chargeCooldown - dt);
      }
    }

    // Simple bot AI
    for (const bot of this._bots.values()) {
      if (bot.state === 'eliminated' || bot.state === 'charging' || bot.airborne) continue;

      bot._aiTimer -= dt;
      if (bot._aiTimer > 0) continue;
      bot._aiTimer = 0.3 + Math.random() * 0.4;

      // Find nearest target
      let nearest = null;
      let nearestDist = Infinity;
      for (const other of allEntities) {
        if (other === bot || other.state === 'eliminated') continue;
        const dx = bot.x - other.x;
        const dz = bot.z - other.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = other;
        }
      }

      if (nearest && nearestDist < 12) {
        // Charge if aligned
        const toTargetX = nearest.x - bot.x;
        const toTargetZ = nearest.z - bot.z;
        const targetAngle = Math.atan2(toTargetX, toTargetZ);
        let angleDiff = targetAngle - bot.ry;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) < 0.3 && !bot.charging && bot.chargeCooldown <= 0) {
          bot.charging = true;
          bot.chargeTimer = CHARGE_DURATION;
          bot.chargeDirX = Math.sin(bot.ry);
          bot.chargeDirZ = Math.cos(bot.ry);
          bot.state = 'charging';
        } else {
          // Turn toward target
          bot.ry += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), ROTATION_SPEED * 0.3);
          // Move forward
          bot.x += Math.sin(bot.ry) * BASE_MOVE_SPEED * 0.6 * dt;
          bot.z += Math.cos(bot.ry) * BASE_MOVE_SPEED * 0.6 * dt;
          bot.state = 'moving';
        }
      } else {
        // Roam
        bot._roamDir += (Math.random() - 0.5) * 0.5;
        const angleDiff = bot._roamDir - bot.ry;
        bot.ry += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), ROTATION_SPEED * 0.3);
        bot.x += Math.sin(bot.ry) * BASE_MOVE_SPEED * 0.4 * dt;
        bot.z += Math.cos(bot.ry) * BASE_MOVE_SPEED * 0.4 * dt;
        bot.state = 'moving';
      }

      // Clamp bot to arena
      const limit = ARENA_SIZE - 5;
      if (Math.abs(bot.x) > limit || Math.abs(bot.z) > limit) {
        bot._roamDir = Math.atan2(-bot.x, -bot.z);
      }
      bot.x = Math.max(-(ARENA_SIZE - 1), Math.min(ARENA_SIZE - 1, bot.x));
      bot.z = Math.max(-(ARENA_SIZE - 1), Math.min(ARENA_SIZE - 1, bot.z));

      // Evade incoming charges
      for (const other of allEntities) {
        if (other === bot || !other.charging) continue;
        const dx = bot.x - other.x;
        const dz = bot.z - other.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 10 && !bot.airborne && bot.jumpCooldown <= 0 && Math.random() < 0.5) {
          bot.verticalVelocity = JUMP_VELOCITY;
          bot.airborne = true;
          bot.state = 'airborne';
          break;
        }
      }
    }
  }

  getSnapshot() {
    const players = [];

    for (const p of this._players.values()) {
      players.push({
        id: p.id,
        x: p.x,
        y: p.y,
        z: p.z,
        ry: p.ry,
        health: p.health,
        state: p.state,
        name: p.name,
        hits: p.hits,
      });
    }

    for (const b of this._bots.values()) {
      players.push({
        id: b.id,
        x: b.x,
        y: b.y,
        z: b.z,
        ry: b.ry,
        health: b.health,
        state: b.state,
        name: b.name,
        hits: b.hits,
      });
    }

    const lastProcessedSeqs = {};
    for (const [id, seq] of this._lastProcessedSeq) {
      lastProcessedSeqs[id] = seq;
    }

    return {
      timestamp: Date.now(),
      players,
      lastProcessedSeqs,
    };
  }
}
