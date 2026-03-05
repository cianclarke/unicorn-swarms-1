import { Unicorn } from './Unicorn.js';
import {
  BASE_MOVE_SPEED,
  FORWARD_SPEED_BONUS,
  BACKWARD_SPEED_PENALTY,
  ROTATION_SPEED,
  ARENA_SIZE,
} from '../utils/Constants.js';

export class PlayerUnicorn extends Unicorn {
  constructor(scene) {
    super(scene, { isPlayer: true });
    this._isPlayer = true;
    this.name = 'Player';
  }

  fixedUpdate(dt, input) {
    if (this.state === 'eliminated') return;

    // Don't allow rotation or movement override while charging
    if (this.state === 'charging') return;

    // Rotation
    if (input.left) this.rotation.y += ROTATION_SPEED * dt;
    if (input.right) this.rotation.y -= ROTATION_SPEED * dt;

    // Movement
    const forward = this.getForwardDirection();
    let speed = 0;

    if (input.forward) {
      speed = BASE_MOVE_SPEED * FORWARD_SPEED_BONUS;
      if (this.state !== 'airborne') this.state = 'moving';
    } else if (input.backward) {
      speed = -BASE_MOVE_SPEED * BACKWARD_SPEED_PENALTY;
      if (this.state !== 'airborne') this.state = 'moving';
    } else if (!input.left && !input.right) {
      if (this.state !== 'airborne') this.state = 'idle';
    }

    if (speed !== 0) {
      this.position.x += forward.x * speed * dt;
      this.position.z += forward.z * speed * dt;
    }

    // Clamp to arena bounds
    const limit = ARENA_SIZE - 1;
    this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
    this.position.z = Math.max(-limit, Math.min(limit, this.position.z));
  }
}
