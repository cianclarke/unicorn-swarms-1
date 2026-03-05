import { GameEngine } from './engine/GameEngine.js';
import { InputManager } from './engine/InputManager.js';
import { Arena } from './world/Arena.js';
import { CameraSystem } from './world/Camera.js';
import { PlayerUnicorn } from './entities/PlayerUnicorn.js';
import { BotUnicorn } from './entities/BotUnicorn.js';
import { ChargeSystem } from './combat/ChargeSystem.js';
import { DamageSystem } from './combat/DamageSystem.js';
import { JumpSystem } from './combat/JumpSystem.js';
import { HUD } from './ui/HUD.js';
import { Nameplates } from './ui/Nameplates.js';
import { Notifications } from './ui/Notifications.js';
import { MIN_UNICORNS, MAX_UNICORNS, ARENA_SIZE } from './utils/Constants.js';

const canvas = document.getElementById('game-canvas');
const engine = new GameEngine(canvas);

// Build the arena
const arena = new Arena(engine.scene);

// Input
const input = new InputManager();

// Player unicorn
const player = new PlayerUnicorn(engine.scene);
player.position.set(0, 0, 0);

// All unicorns in the game (player + bots)
const allUnicorns = [player];
const bots = [];

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

// Spawn bots to fill session (Req 5: 4-8 unicorns when <4 players)
const humanPlayers = 1;
const totalTarget = MIN_UNICORNS + Math.floor(Math.random() * (MAX_UNICORNS - MIN_UNICORNS + 1));
const botCount = Math.max(0, totalTarget - humanPlayers);

for (let i = 0; i < botCount; i++) {
  const difficulty = 0.4 + Math.random() * 0.6; // 0.4 (easy) to 1.0 (hard)
  const bot = new BotUnicorn(engine.scene, { difficulty });

  // Spread bots around the arena
  const angle = (i / botCount) * Math.PI * 2;
  const radius = 10 + Math.random() * 15;
  bot.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
  bot.rotation.y = angle + Math.PI; // face inward

  chargeSystem.register(bot);
  allUnicorns.push(bot);
  bots.push(bot);
}

// Register systems with the game loop
engine.addSystem({
  fixedUpdate(dt) {
    // Handle charge input
    if (input.charge) {
      chargeSystem.tryCharge(player);
    }

    player.fixedUpdate(dt, input);

    // Update bot AI
    for (const bot of bots) {
      bot.fixedUpdate(dt, allUnicorns, chargeSystem);
    }

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
