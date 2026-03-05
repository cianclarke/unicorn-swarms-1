import * as THREE from 'three';
import { Unicorn } from './Unicorn.js';
import {
  BASE_MOVE_SPEED,
  FORWARD_SPEED_BONUS,
  ROTATION_SPEED,
  ARENA_SIZE,
  HIT_RADIUS,
  BOT_DODGE_CHANCE,
} from '../utils/Constants.js';

const BOT_NAMES = [
  'Shadow', 'Blaze', 'Storm', 'Frost',
  'Thunder', 'Ember', 'Venom', 'Phantom',
];

const AI_STATE = {
  ROAM: 'roam',
  PURSUE: 'pursue',
  CHARGE: 'charge',
  EVADE: 'evade',
};

const FOV_ANGLE = Math.PI * 0.6;       // ~108 degree field of view
const PURSUE_RANGE = 25;               // distance to start pursuing
const CHARGE_RANGE = 12;               // distance to initiate charge
const CHARGE_ALIGN_ANGLE = 0.3;        // radians (~17 degrees) alignment threshold
const EVADE_DETECT_RANGE = 10;         // detect incoming charger within this distance
const ROAM_CHANGE_INTERVAL = 2;        // seconds between random direction changes

export class BotUnicorn extends Unicorn {
  constructor(scene, { name, difficulty = 1.0 } = {}) {
    super(scene, { isPlayer: false });
    this._isPlayer = false;
    this.name = name || BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];

    // Difficulty: multiplier on reaction delay (lower = harder, faster reactions)
    this.difficulty = difficulty;
    this._reactionDelay = 0.2 + (1 - difficulty) * 0.5; // 0.2s (hard) to 0.7s (easy)
    this._reactionTimer = 0;

    // AI state
    this._aiState = AI_STATE.ROAM;
    this._target = null;
    this._roamDir = Math.random() * Math.PI * 2;
    this._roamTimer = 0;

    // Jump state (mirrors JumpSystem for bots)
    this._verticalVelocity = 0;
    this._airborne = false;
    this._jumpCooldown = 0;
  }

  fixedUpdate(dt, allUnicorns, chargeSystem) {
    if (this.state === 'eliminated') return;

    // Tick jump cooldown
    if (this._jumpCooldown > 0) this._jumpCooldown -= dt;

    // Apply gravity if airborne
    if (this._airborne) {
      this._verticalVelocity += -20 * dt; // GRAVITY
      this.position.y += this._verticalVelocity * dt;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this._verticalVelocity = 0;
        this._airborne = false;
        this._jumpCooldown = 1.5; // JUMP_COOLDOWN
        if (this.state === 'airborne') this.state = 'idle';
      }
      return; // Don't make AI decisions while airborne
    }

    // Don't override charging movement
    if (this.state === 'charging') return;

    // Reaction delay — bots don't react instantly
    this._reactionTimer -= dt;
    if (this._reactionTimer > 0) return;

    // Find nearest visible target
    this._target = this._findTarget(allUnicorns);

    // Check for incoming charges (evade takes priority)
    const incomingCharger = this._detectIncomingCharge(allUnicorns, chargeSystem);
    if (incomingCharger) {
      this._aiState = AI_STATE.EVADE;
    } else if (this._target) {
      const dist = this.position.distanceTo(this._target.position);
      const alignment = this._getAlignmentAngle(this._target);

      if (dist < CHARGE_RANGE && alignment < CHARGE_ALIGN_ANGLE) {
        this._aiState = AI_STATE.CHARGE;
      } else if (dist < PURSUE_RANGE) {
        this._aiState = AI_STATE.PURSUE;
      } else {
        this._aiState = AI_STATE.ROAM;
      }
    } else {
      this._aiState = AI_STATE.ROAM;
    }

    // Execute current AI state
    switch (this._aiState) {
      case AI_STATE.ROAM:
        this._doRoam(dt);
        break;
      case AI_STATE.PURSUE:
        this._doPursue(dt);
        break;
      case AI_STATE.CHARGE:
        this._doCharge(chargeSystem);
        break;
      case AI_STATE.EVADE:
        this._doEvade();
        break;
    }

    this._reactionTimer = this._reactionDelay;
  }

  _findTarget(allUnicorns) {
    let nearest = null;
    let nearestDist = Infinity;
    const forward = this.getForwardDirection();

    for (const other of allUnicorns) {
      if (other === this) continue;
      if (other.state === 'eliminated') continue;

      const toOther = new THREE.Vector3().subVectors(other.position, this.position);
      const dist = toOther.length();
      if (dist > PURSUE_RANGE) continue;

      // Check FOV
      toOther.normalize();
      const angle = Math.acos(Math.max(-1, Math.min(1, forward.dot(toOther))));
      if (angle > FOV_ANGLE) continue;

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = other;
      }
    }

    return nearest;
  }

  _getAlignmentAngle(target) {
    const forward = this.getForwardDirection();
    const toTarget = new THREE.Vector3().subVectors(target.position, this.position).normalize();
    return Math.acos(Math.max(-1, Math.min(1, forward.dot(toTarget))));
  }

  _detectIncomingCharge(allUnicorns, chargeSystem) {
    for (const other of allUnicorns) {
      if (other === this) continue;
      if (other.state !== 'charging') continue;
      if (!chargeSystem.isCharging(other)) continue;

      const dist = this.position.distanceTo(other.position);
      if (dist < EVADE_DETECT_RANGE) {
        // Check if the charger is heading toward us
        const otherForward = other.getForwardDirection();
        const toUs = new THREE.Vector3().subVectors(this.position, other.position).normalize();
        const dot = otherForward.dot(toUs);
        if (dot > 0.5) return other; // charger is facing us
      }
    }
    return null;
  }

  _doRoam(dt) {
    this._roamTimer += dt;
    if (this._roamTimer >= ROAM_CHANGE_INTERVAL) {
      this._roamTimer = 0;
      this._roamDir += (Math.random() - 0.5) * Math.PI;
    }

    // Turn toward roam direction
    const angleDiff = this._normalizeAngle(this._roamDir - this.rotation.y);
    this.rotation.y += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), ROTATION_SPEED * dt);

    // Move forward
    const forward = this.getForwardDirection();
    const speed = BASE_MOVE_SPEED * 0.6; // slower roam speed
    this.position.x += forward.x * speed * dt;
    this.position.z += forward.z * speed * dt;

    this.state = 'moving';
    this._clampToArena();

    // Turn away from walls
    const limit = ARENA_SIZE - 5;
    if (Math.abs(this.position.x) > limit || Math.abs(this.position.z) > limit) {
      // Turn toward center
      const toCenter = Math.atan2(-this.position.x, -this.position.z);
      this._roamDir = toCenter;
    }
  }

  _doPursue(dt) {
    if (!this._target) return;

    const toTarget = new THREE.Vector3().subVectors(this._target.position, this.position);
    const targetAngle = Math.atan2(toTarget.x, toTarget.z);

    // Turn toward target
    const angleDiff = this._normalizeAngle(targetAngle - this.rotation.y);
    this.rotation.y += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), ROTATION_SPEED * dt);

    // Move forward
    const forward = this.getForwardDirection();
    const speed = BASE_MOVE_SPEED * FORWARD_SPEED_BONUS;
    this.position.x += forward.x * speed * dt;
    this.position.z += forward.z * speed * dt;

    this.state = 'moving';
    this._clampToArena();
  }

  _doCharge(chargeSystem) {
    chargeSystem.tryCharge(this);
  }

  _doEvade() {
    // Attempt to jump with BOT_DODGE_CHANCE success rate
    if (this._airborne || this._jumpCooldown > 0) return;

    if (Math.random() < BOT_DODGE_CHANCE) {
      this._verticalVelocity = 8; // JUMP_VELOCITY
      this._airborne = true;
      this.state = 'airborne';
    }
  }

  _normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  _clampToArena() {
    const limit = ARENA_SIZE - 1;
    this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
    this.position.z = Math.max(-limit, Math.min(limit, this.position.z));
  }
}
