import {
  JUMP_VELOCITY,
  GRAVITY,
  JUMP_COOLDOWN,
} from '../utils/Constants.js';

export class JumpSystem {
  constructor(unicorn, input) {
    this.unicorn = unicorn;
    this.input = input;
    this.verticalVelocity = 0;
    this.airborne = false;
    this.cooldownRemaining = 0;
    this._wasJumpPressed = false;
  }

  fixedUpdate(dt) {
    const jumpPressed = this.input.jump;
    const justPressed = jumpPressed && !this._wasJumpPressed;
    this._wasJumpPressed = jumpPressed;

    // Cooldown tick
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining -= dt;
    }

    // Initiate jump on press (not held), if grounded and cooldown expired
    if (justPressed && !this.airborne && this.cooldownRemaining <= 0) {
      this.verticalVelocity = JUMP_VELOCITY;
      this.airborne = true;
      this.unicorn.state = 'airborne';
    }

    // Apply gravity while airborne
    if (this.airborne) {
      this.verticalVelocity += GRAVITY * dt;
      this.unicorn.position.y += this.verticalVelocity * dt;

      // Landing
      if (this.unicorn.position.y <= 0) {
        this.unicorn.position.y = 0;
        this.verticalVelocity = 0;
        this.airborne = false;
        this.cooldownRemaining = JUMP_COOLDOWN;
        if (this.unicorn.state === 'airborne') {
          this.unicorn.state = 'idle';
        }
      }
    }
  }
}
