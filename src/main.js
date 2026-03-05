import { LoadingScreen } from './ui/LoadingScreen.js';

const INIT_STEPS = [
  'Creating renderer',
  'Building arena',
  'Spawning player',
  'Connecting network',
  'Spawning bots',
  'Setting up systems',
  'Starting game',
];

const loading = new LoadingScreen();
loading.setSteps(INIT_STEPS);

// Detect WebGL support early for a friendly error message
function checkWebGL() {
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (!gl) {
    loading.showError(
      'Your browser does not support WebGL. Please use a recent version of Chrome, Firefox, Safari, or Edge.'
    );
    return false;
  }
  return true;
}

function getInputSnapshot(input) {
  return {
    forward: input.forward,
    backward: input.backward,
    left: input.left,
    right: input.right,
    charge: input.charge,
    jump: input.jump,
  };
}

async function init() {
  if (!checkWebGL()) return;

  // Step 1: Engine + renderer
  loading.advance('Creating renderer...');
  const { GameEngine } = await import('./engine/GameEngine.js');
  const canvas = document.getElementById('game-canvas');
  const engine = new GameEngine(canvas);

  // Step 2: Arena
  loading.advance('Building arena...');
  const { Arena } = await import('./world/Arena.js');
  const arena = new Arena(engine.scene);

  // Step 3: Player
  loading.advance('Spawning player...');
  const { InputManager } = await import('./engine/InputManager.js');
  const { PlayerUnicorn } = await import('./entities/PlayerUnicorn.js');
  const { Unicorn } = await import('./entities/Unicorn.js');
  const { CameraSystem } = await import('./world/Camera.js');
  const { JumpSystem } = await import('./combat/JumpSystem.js');

  const input = new InputManager();
  const player = new PlayerUnicorn(engine.scene);
  player.position.set(0, 0, 0);

  const allUnicorns = [player];
  const bots = [];
  const remoteUnicorns = new Map();

  const jumpSystem = new JumpSystem(player, input);
  const cameraSystem = new CameraSystem(engine.camera);
  cameraSystem.follow(player);

  // Step 4: Network
  loading.advance('Connecting network...');
  const { NetworkManager } = await import('./network/NetworkManager.js');
  const { StateSync } = await import('./network/StateSync.js');

  const network = new NetworkManager();
  const stateSync = new StateSync(network);
  let multiplayer = false;

  // Step 5: Bots + combat
  loading.advance('Spawning bots...');
  const { BotUnicorn } = await import('./entities/BotUnicorn.js');
  const { MIN_UNICORNS, MAX_UNICORNS } = await import('./utils/Constants.js');
  const { ChargeSystem } = await import('./combat/ChargeSystem.js');
  const { DamageSystem } = await import('./combat/DamageSystem.js');
  const { HUD } = await import('./ui/HUD.js');
  const { Nameplates } = await import('./ui/Nameplates.js');
  const { Notifications } = await import('./ui/Notifications.js');

  const hud = new HUD();
  const nameplates = new Nameplates(engine.camera);
  const notifications = new Notifications();
  const damageSystem = new DamageSystem(notifications);
  const chargeSystem = new ChargeSystem(damageSystem, hud);
  chargeSystem.register(player);

  // Remote unicorn helpers
  function getOrCreateRemoteUnicorn(id) {
    if (remoteUnicorns.has(id)) return remoteUnicorns.get(id);
    const unicorn = new Unicorn(engine.scene);
    unicorn.name = id;
    remoteUnicorns.set(id, unicorn);
    chargeSystem.register(unicorn);
    allUnicorns.push(unicorn);
    return unicorn;
  }

  function removeRemoteUnicorn(id) {
    const unicorn = remoteUnicorns.get(id);
    if (!unicorn) return;
    unicorn.dispose(engine.scene);
    remoteUnicorns.delete(id);
    const idx = allUnicorns.indexOf(unicorn);
    if (idx !== -1) allUnicorns.splice(idx, 1);
    stateSync.removePlayer(id);
  }

  // Listen for server state updates
  network.on('state', (msg) => {
    stateSync.onServerState(msg);

    const now = Date.now();
    const activeIds = new Set();

    for (const playerData of msg.players) {
      if (playerData.id === network.playerId) continue;
      activeIds.add(playerData.id);

      const interpolated = stateSync.getInterpolatedState(playerData.id, now);
      if (!interpolated) continue;

      const unicorn = getOrCreateRemoteUnicorn(playerData.id);
      unicorn.position.set(interpolated.x, interpolated.y, interpolated.z);
      unicorn.rotation.y = interpolated.ry;
      unicorn.health = interpolated.health;
      unicorn.state = interpolated.state;
      unicorn.name = interpolated.name || playerData.id;
      unicorn.mesh.visible = interpolated.state !== 'eliminated';
    }

    // Remove players no longer in snapshot
    for (const id of remoteUnicorns.keys()) {
      if (!activeIds.has(id)) {
        removeRemoteUnicorn(id);
      }
    }

    // Reconcile local player (prediction) when latency >200ms
    if (network.latency > 200) {
      stateSync.reconcileLocalPlayer(player, (inp, dt) => {
        player.fixedUpdate(dt, inp);
      });
    }
  });

  network.on('leave', (msg) => {
    removeRemoteUnicorn(msg.playerId);
  });

  // Try connecting to multiplayer server
  try {
    await network.connect();
    multiplayer = true;
  } catch {
    multiplayer = false;
  }

  // Spawn local bots when not in multiplayer mode
  if (!multiplayer) {
    const humanPlayers = 1;
    const totalTarget = MIN_UNICORNS + Math.floor(Math.random() * (MAX_UNICORNS - MIN_UNICORNS + 1));
    const botCount = Math.max(0, totalTarget - humanPlayers);

    for (let i = 0; i < botCount; i++) {
      const difficulty = 0.4 + Math.random() * 0.6;
      const bot = new BotUnicorn(engine.scene, { difficulty });

      const angle = (i / botCount) * Math.PI * 2;
      const radius = 10 + Math.random() * 15;
      bot.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
      bot.rotation.y = angle + Math.PI;

      chargeSystem.register(bot);
      allUnicorns.push(bot);
      bots.push(bot);
    }
  }

  // Step 6: Wire systems
  loading.advance('Setting up systems...');
  engine.addSystem({
    fixedUpdate(dt) {
      if (input.charge) {
        chargeSystem.tryCharge(player);
      }

      player.fixedUpdate(dt, input);

      // Send input to server if connected
      if (multiplayer && network.connected) {
        const snapshot = getInputSnapshot(input);
        const seq = network.sendInput(snapshot);
        stateSync.pushLocalInput(seq, snapshot);
      }

      // Update local bot AI (only in offline mode)
      if (!multiplayer) {
        for (const bot of bots) {
          bot.fixedUpdate(dt, allUnicorns, chargeSystem);
        }
        chargeSystem.fixedUpdate(dt, allUnicorns);
      }

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

  engine.hud = hud;
  engine.nameplates = nameplates;
  engine.notifications = notifications;
  engine.chargeSystem = chargeSystem;
  engine.damageSystem = damageSystem;
  engine.allUnicorns = allUnicorns;

  // Step 7: Start
  loading.advance('Starting game...');
  await loading.hide();
  engine.start();
}

init().catch((err) => {
  console.error('Game initialization failed:', err);
  loading.showError(
    `Failed to start game: ${err.message || 'Unknown error'}. Please refresh and try again.`
  );
});
