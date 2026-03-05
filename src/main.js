import { GameEngine } from './engine/GameEngine.js';
import { Arena } from './world/Arena.js';

const canvas = document.getElementById('game-canvas');
const engine = new GameEngine(canvas);

// Build the arena
const arena = new Arena(engine.scene);

// Position camera for initial view
engine.camera.position.set(0, 15, 30);
engine.camera.lookAt(0, 0, 0);

engine.start();
