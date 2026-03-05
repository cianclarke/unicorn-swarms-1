import { GameEngine } from './engine/GameEngine.js';
import { InputManager } from './engine/InputManager.js';
import { Arena } from './world/Arena.js';
import { CameraSystem } from './world/Camera.js';
import { PlayerUnicorn } from './entities/PlayerUnicorn.js';

const canvas = document.getElementById('game-canvas');
const engine = new GameEngine(canvas);

// Build the arena
const arena = new Arena(engine.scene);

// Input
const input = new InputManager();

// Player unicorn
const player = new PlayerUnicorn(engine.scene);
player.position.set(0, 0, 0);

// Third-person camera
const cameraSystem = new CameraSystem(engine.camera);
cameraSystem.follow(player);

// Register systems with the game loop
engine.addSystem({
  fixedUpdate(dt) {
    player.fixedUpdate(dt, input);
  },
  update(dt) {
    cameraSystem.update(dt);
  },
});

engine.start();
