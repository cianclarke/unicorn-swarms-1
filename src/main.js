import { GameEngine } from './engine/GameEngine.js';
import { InputManager } from './engine/InputManager.js';
import { Arena } from './world/Arena.js';
import { CameraSystem } from './world/Camera.js';
import { PlayerUnicorn } from './entities/PlayerUnicorn.js';
import { HUD } from './ui/HUD.js';
import { Nameplates } from './ui/Nameplates.js';
import { Notifications } from './ui/Notifications.js';

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

// UI overlays
const hud = new HUD();
const nameplates = new Nameplates(engine.camera);
const notifications = new Notifications();

// Register systems with the game loop
engine.addSystem({
  fixedUpdate(dt) {
    player.fixedUpdate(dt, input);
  },
  update(dt) {
    cameraSystem.update(dt);
  },
});
engine.addSystem(hud);
engine.addSystem(nameplates);
engine.addSystem(notifications);

// Expose UI for other systems to drive
engine.hud = hud;
engine.nameplates = nameplates;
engine.notifications = notifications;

engine.start();
