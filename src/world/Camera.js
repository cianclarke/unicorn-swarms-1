import * as THREE from 'three';
import {
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_SMOOTHING,
} from '../utils/Constants.js';

export class CameraSystem {
  constructor(camera) {
    this.camera = camera;
    this.target = null;
    this._idealPos = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();
  }

  follow(unicorn) {
    this.target = unicorn;
  }

  update(dt) {
    if (!this.target) return;

    const pos = this.target.position;
    const forward = this.target.getForwardDirection();

    // Ideal position: behind and above the unicorn
    this._idealPos.set(
      pos.x - forward.x * CAMERA_DISTANCE,
      pos.y + CAMERA_HEIGHT,
      pos.z - forward.z * CAMERA_DISTANCE
    );

    // Smoothly lerp camera position
    this.camera.position.lerp(this._idealPos, CAMERA_SMOOTHING);

    // Look at a point slightly above the unicorn
    this._lookTarget.set(pos.x, pos.y + 1.5, pos.z);
    this.camera.lookAt(this._lookTarget);
  }
}
