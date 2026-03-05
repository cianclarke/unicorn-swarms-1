// Movement
export const BASE_MOVE_SPEED = 6;           // meters/sec (range 5-8)
export const FORWARD_SPEED_BONUS = 1.2;     // 20% faster forward
export const BACKWARD_SPEED_PENALTY = 0.8;  // 20% slower backward
export const ROTATION_SPEED = 3;            // radians/sec

// Charge
export const CHARGE_SPEED_MULTIPLIER = 2.5; // range 2-3x
export const CHARGE_DURATION = 1.5;         // seconds (range 1-2)
export const CHARGE_COOLDOWN = 4;           // seconds (range 3-5)

// Jump / Defend
export const JUMP_VELOCITY = 8;             // initial upward m/s
export const GRAVITY = -20;                 // m/s^2
export const JUMP_COOLDOWN = 1.5;           // seconds (range 1-2)

// Combat
export const CHARGE_DAMAGE = 25;            // HP per hit
export const MAX_HEALTH = 100;
export const HIT_RADIUS = 1.5;             // collision sphere radius

// Arena
export const ARENA_SIZE = 50;               // half-extent in meters
export const WALL_HEIGHT = 4;
export const GROUND_COLOR = 0x4a8c3f;       // grass green
export const WALL_COLOR = 0x8b7355;         // stone brown

// Camera
export const CAMERA_DISTANCE = 8;           // meters behind (range 5-10)
export const CAMERA_HEIGHT = 3;             // meters above (range 2-4)
export const CAMERA_SMOOTHING = 0.08;       // lerp factor

// Bots
export const MIN_UNICORNS = 4;
export const MAX_UNICORNS = 8;
export const BOT_DODGE_CHANCE = 0.5;        // 40-60% range

// Physics
export const PHYSICS_TIMESTEP = 1 / 60;     // 60hz fixed step

// Network
export const NET_TICK_RATE = 20;              // server broadcasts per second
export const NET_TICK_INTERVAL = 1 / 20;      // 50ms between server ticks
export const NET_INTERPOLATION_DELAY = 100;   // ms buffer for remote player interpolation
export const NET_PREDICTION_THRESHOLD = 200;  // ms latency before prediction kicks in
export const NET_MAX_ROOM_PLAYERS = 8;
export const NET_DEFAULT_PORT = 3001;

// Rendering
export const FOG_NEAR = 40;
export const FOG_FAR = 100;
export const AMBIENT_LIGHT_INTENSITY = 0.6;
export const DIR_LIGHT_INTENSITY = 0.8;
