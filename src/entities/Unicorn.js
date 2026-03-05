import * as THREE from 'three';
import { MAX_HEALTH } from '../utils/Constants.js';
import { createUnicornModel } from './UnicornModel.js';

export class Unicorn {
  constructor(scene, { isPlayer = false } = {}) {
    this.mesh = createUnicornModel({ isPlayer });
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    this.velocity = new THREE.Vector3();
    this.health = MAX_HEALTH;
    this.state = 'idle'; // idle | moving | charging | airborne | eliminated
  }

  get position() { return this.mesh.position; }
  get rotation() { return this.mesh.rotation; }

  getForwardDirection() {
    const dir = new THREE.Vector3(0, 0, 1);
    dir.applyEuler(this.rotation);
    return dir;
  }

  dispose(scene) {
    scene.remove(this.mesh);
  }
}
