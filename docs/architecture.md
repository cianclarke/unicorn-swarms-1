# Architecture Specification

## Overview

Browser-based 3D multiplayer unicorn battle game built with Three.js and vanilla JavaScript. Single-page application with optional WebSocket multiplayer server.

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| 3D Rendering | Three.js | Mature WebGL abstraction, wide browser support |
| Build Tool | Vite | Fast HMR, native ES modules, zero-config |
| Language | JavaScript (ES modules) | No compile step needed, broad compatibility |
| Multiplayer Server | Node.js + ws | Lightweight WebSocket server |
| Package Manager | npm | Standard, no extra tooling |

## Directory Structure

```
src/
  main.js              # Entry point - init scene, game loop
  engine/
    GameEngine.js       # Core game loop, update/render cycle
    Physics.js          # Gravity, collision detection, movement
    InputManager.js     # Keyboard input capture and state
  entities/
    Unicorn.js          # Base unicorn class (position, health, state)
    PlayerUnicorn.js    # Player-controlled unicorn (extends Unicorn)
    BotUnicorn.js       # AI-controlled unicorn (extends Unicorn)
    UnicornModel.js     # Blocky 3D geometry builder for unicorn mesh
  world/
    Arena.js            # Arena geometry, ground plane, walls, decorations
    Camera.js           # Third-person camera follow system
  combat/
    ChargeSystem.js     # Charge initiation, speed boost, cooldown, collision
    JumpSystem.js       # Jump physics, airborne state, landing cooldown
    DamageSystem.js     # Hit registration, health reduction, elimination
  ui/
    HUD.js              # Health bar, hit counter, cooldown indicators
    Nameplates.js       # Floating name/health labels above unicorns
    Notifications.js    # Kill feed, elimination messages
    LoadingScreen.js    # Loading progress indicator
  network/
    NetworkManager.js   # WebSocket client, connect/disconnect
    StateSync.js        # State serialization, interpolation, prediction
  utils/
    Constants.js        # Game balance constants (speeds, cooldowns, etc.)
server/
  index.js              # WebSocket server entry point
  GameRoom.js           # Room management, player slots, bot fill
  StateAuthority.js     # Server-authoritative state validation
index.html              # Single HTML entry point
package.json
vite.config.js
```

## Core Systems

### Game Loop (GameEngine.js)
- `requestAnimationFrame` loop with delta-time calculation
- Fixed timestep physics (60hz) with variable render
- Update order: Input -> Physics -> Combat -> AI -> Network -> Render

### Entity Model
- `Unicorn` base class: position (Vector3), rotation (Euler), health, velocity, state machine
- States: `idle`, `moving`, `charging`, `airborne`, `eliminated`
- `PlayerUnicorn` reads from InputManager
- `BotUnicorn` reads from AI decision system

### Physics (Physics.js)
- Simple ground-plane collision (y=0)
- AABB or sphere-based collision between unicorns
- Gravity constant for jump arc
- Arena boundary enforcement (invisible walls)

### Combat Flow
1. Player presses Shift -> ChargeSystem.initiate(unicorn)
2. ChargeSystem locks rotation, applies speed multiplier for duration
3. Each frame: ChargeSystem checks sphere overlap with other unicorns
4. On hit: DamageSystem.applyDamage(target, amount) if target not airborne
5. After duration or hit: cooldown timer starts

### Camera (Camera.js)
- Offset: behind (-Z local) at configured distance, above at configured height
- Smoothed follow using lerp on position and slerp on rotation
- Damping factor for smooth tracking

### Bot AI (BotUnicorn.js)
- State machine: roam -> pursue -> charge -> evade
- Target selection: nearest unicorn within FOV
- Charge decision: within range + aligned within angle threshold
- Dodge decision: detect incoming charge, random success roll (40-60%)
- Difficulty variance: reaction delay multiplier per bot

### HUD (HUD.js)
- HTML overlay (not Three.js) for crisp UI
- CSS-styled health bar, hit counter, cooldown arc
- Updated each frame from game state

### Network (future phase)
- WebSocket connection to Node.js server
- Client sends: input actions (movement, charge, jump)
- Server broadcasts: authoritative positions, health, events
- Client-side prediction with server reconciliation
- Interpolation buffer for remote players

## Phased Delivery

### Phase 1: Foundation (parallel)
- **1A**: Project scaffold + Three.js scene + arena geometry
- **1B**: Blocky unicorn 3D model builder

### Phase 2: Core Gameplay (parallel, depends on Phase 1)
- **2A**: Player controls (WASD + rotation) + third-person camera
- **2B**: HUD overlay (health bar, hit counter, cooldown display)

### Phase 3: Combat (parallel, depends on Phase 2A)
- **3A**: Charge system (speed boost, direction lock, collision, VFX, cooldown)
- **3B**: Jump/defend system (vertical movement, gravity, airborne state, cooldown)

### Phase 4: AI (depends on Phase 3)
- **4A**: Bot AI (state machine, target selection, charge/dodge decisions)

### Phase 5: Polish + Networking (parallel, depends on Phase 4)
- **5A**: Loading screen, asset caching, error handling
- **5B**: Multiplayer networking (WebSocket server + client sync)

### Phase 6: Integration + QA
- **6A**: Full integration testing, balance tuning, browser compatibility
