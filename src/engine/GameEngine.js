import * as THREE from 'three';
import { PHYSICS_TIMESTEP } from '../utils/Constants.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);

    this.clock = new THREE.Clock();
    this.accumulator = 0;
    this.running = false;
    this.systems = [];

    window.addEventListener('resize', () => this._onResize());
  }

  addSystem(system) {
    this.systems.push(system);
  }

  start() {
    this.running = true;
    this.clock.start();
    this._loop();
  }

  stop() {
    this.running = false;
  }

  _loop() {
    if (!this.running) return;
    requestAnimationFrame(() => this._loop());

    const delta = Math.min(this.clock.getDelta(), 0.1); // cap at 100ms
    this.accumulator += delta;

    // Fixed timestep physics updates
    while (this.accumulator >= PHYSICS_TIMESTEP) {
      for (const system of this.systems) {
        if (system.fixedUpdate) {
          system.fixedUpdate(PHYSICS_TIMESTEP);
        }
      }
      this.accumulator -= PHYSICS_TIMESTEP;
    }

    // Variable-rate updates (rendering, interpolation)
    for (const system of this.systems) {
      if (system.update) {
        system.update(delta);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
