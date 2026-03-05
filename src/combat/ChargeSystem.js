import * as THREE from 'three';
import {
  CHARGE_SPEED_MULTIPLIER,
  CHARGE_DURATION,
  CHARGE_COOLDOWN,
  CHARGE_DAMAGE,
  HIT_RADIUS,
  BASE_MOVE_SPEED,
  FORWARD_SPEED_BONUS,
} from '../utils/Constants.js';

export class ChargeSystem {
  constructor(damageSystem, hud) {
    this.damageSystem = damageSystem;
    this.hud = hud;
    this._chargers = new Map(); // unicorn -> charge state
    this._particles = [];
  }

  register(unicorn) {
    this._chargers.set(unicorn, {
      charging: false,
      cooldown: 0,
      timer: 0,
      lockedDirection: new THREE.Vector3(),
      hits: 0,
    });
  }

  tryCharge(unicorn) {
    const state = this._chargers.get(unicorn);
    if (!state) return;
    if (state.charging || state.cooldown > 0) return;
    if (unicorn.state === 'eliminated' || unicorn.state === 'airborne') return;

    state.charging = true;
    state.timer = CHARGE_DURATION;
    state.lockedDirection.copy(unicorn.getForwardDirection());
    unicorn.state = 'charging';
  }

  fixedUpdate(dt, unicorns) {
    for (const [unicorn, state] of this._chargers) {
      if (unicorn.state === 'eliminated') continue;

      if (state.charging) {
        // Move in locked direction at charge speed
        const speed = BASE_MOVE_SPEED * FORWARD_SPEED_BONUS * CHARGE_SPEED_MULTIPLIER;
        unicorn.position.x += state.lockedDirection.x * speed * dt;
        unicorn.position.z += state.lockedDirection.z * speed * dt;

        // Check collision against other unicorns
        for (const other of unicorns) {
          if (other === unicorn) continue;
          if (other.state === 'eliminated') continue;
          if (other.state === 'airborne') continue; // airborne immunity

          const dist = unicorn.position.distanceTo(other.position);
          if (dist < HIT_RADIUS * 2) {
            const eliminated = this.damageSystem.applyDamage(unicorn, other, CHARGE_DAMAGE);
            state.hits++;
            if (unicorn._isPlayer) {
              this.hud.setHits(state.hits);
            }
          }
        }

        state.timer -= dt;
        if (state.timer <= 0) {
          state.charging = false;
          state.cooldown = CHARGE_COOLDOWN;
          unicorn.state = 'idle';
        }
      } else if (state.cooldown > 0) {
        state.cooldown = Math.max(0, state.cooldown - dt);
      }

      // Update HUD for player
      if (unicorn._isPlayer) {
        this.hud.setChargeCooldown(state.cooldown);
        this.hud.setHealth(unicorn.health);
      }
    }
  }

  update(dt, scene) {
    // Update visual effects for active charges
    for (const [unicorn, state] of this._chargers) {
      if (state.charging) {
        this._spawnSpeedLines(unicorn, scene);
      }
    }

    // Update and remove expired particles
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this._particles.splice(i, 1);
      } else {
        p.mesh.material.opacity = p.life / p.maxLife;
        p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
      }
    }
  }

  _spawnSpeedLines(unicorn, scene) {
    const dir = unicorn.getForwardDirection();
    for (let i = 0; i < 2; i++) {
      const geo = new THREE.BoxGeometry(0.05, 0.05, 0.6);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.7,
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Position behind the unicorn with random offset
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        0.3 + Math.random() * 1.0,
        0
      );
      mesh.position.copy(unicorn.position).add(offset);
      mesh.lookAt(mesh.position.clone().add(dir));

      scene.add(mesh);
      const maxLife = 0.3;
      this._particles.push({
        mesh,
        velocity: dir.clone().multiplyScalar(-3),
        life: maxLife,
        maxLife,
      });
    }
  }

  isCharging(unicorn) {
    const state = this._chargers.get(unicorn);
    return state ? state.charging : false;
  }

  getCooldown(unicorn) {
    const state = this._chargers.get(unicorn);
    return state ? state.cooldown : 0;
  }
}
