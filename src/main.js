import { GameEngine } from './engine/GameEngine.js';
import { InputManager } from './engine/InputManager.js';
import { Arena } from './world/Arena.js';
import { CameraSystem } from './world/Camera.js';
import { PlayerUnicorn } from './entities/PlayerUnicorn.js';
import { ChargeSystem } from './combat/ChargeSystem.js';
import { DamageSystem } from './combat/DamageSystem.js';
import { JumpSystem } from './combat/JumpSystem.js';
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

// All unicorns in the game (player + bots added later)
const allUnicorns = [player];

// Jump system
const jumpSystem = new JumpSystem(player, input);

// Third-person camera
const cameraSystem = new CameraSystem(engine.camera);
cameraSystem.follow(player);

// UI overlays
const hud = new HUD();
const nameplates = new Nameplates(engine.camera);
const notifications = new Notifications();

// Combat systems
const damageSystem = new DamageSystem(notifications);
const chargeSystem = new ChargeSystem(damageSystem, hud);
chargeSystem.register(player);

// Register systems with the game loop
engine.addSystem({
  fixedUpdate(dt) {
    // Handle charge input
    if (input.charge) {
      chargeSystem.tryCharge(player);
    }

    player.fixedUpdate(dt, input);
    chargeSystem.fixedUpdate(dt, allUnicorns);
    jumpSystem.fixedUpdate(dt);
  },
  update(dt) {
    cameraSystem.update(dt);
    chargeSystem.update(dt, engine.scene);
  },
});
engine.addSystem(hud);
engine.addSystem(nameplates);
engine.addSystem(notifications);

// Expose systems for other modules to use
engine.hud = hud;
engine.nameplates = nameplates;
engine.notifications = notifications;
engine.chargeSystem = chargeSystem;
engine.damageSystem = damageSystem;
engine.allUnicorns = allUnicorns;

engine.start();
