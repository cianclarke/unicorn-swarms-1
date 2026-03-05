import { GameEngine } from './engine/GameEngine.js';
import { Arena } from './world/Arena.js';
import { HUD } from './ui/HUD.js';
import { Nameplates } from './ui/Nameplates.js';
import { Notifications } from './ui/Notifications.js';

const canvas = document.getElementById('game-canvas');
const engine = new GameEngine(canvas);

// Build the arena
const arena = new Arena(engine.scene);

// UI overlays
const hud = new HUD();
const nameplates = new Nameplates(engine.camera);
const notifications = new Notifications();

// Register UI systems for per-frame updates
engine.addSystem(hud);
engine.addSystem(nameplates);
engine.addSystem(notifications);

// Expose UI for other systems to drive
engine.hud = hud;
engine.nameplates = nameplates;
engine.notifications = notifications;

// Position camera for initial view
engine.camera.position.set(0, 15, 30);
engine.camera.lookAt(0, 0, 0);

engine.start();
