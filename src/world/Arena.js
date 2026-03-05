import * as THREE from 'three';
import {
  ARENA_SIZE,
  WALL_HEIGHT,
  GROUND_COLOR,
  WALL_COLOR,
  FOG_NEAR,
  FOG_FAR,
  AMBIENT_LIGHT_INTENSITY,
  DIR_LIGHT_INTENSITY,
} from '../utils/Constants.js';

export class Arena {
  constructor(scene) {
    this.scene = scene;
    this._buildSky();
    this._buildLighting();
    this._buildGround();
    this._buildWalls();
    this._buildDecorations();
    this._buildFog();
  }

  _buildSky() {
    this.scene.background = new THREE.Color(0x87ceeb); // sky blue
  }

  _buildLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, AMBIENT_LIGHT_INTENSITY);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, DIR_LIGHT_INTENSITY);
    dir.position.set(30, 50, 20);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -ARENA_SIZE;
    dir.shadow.camera.right = ARENA_SIZE;
    dir.shadow.camera.top = ARENA_SIZE;
    dir.shadow.camera.bottom = -ARENA_SIZE;
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 120;
    this.scene.add(dir);
  }

  _buildGround() {
    // Checkerboard ground using two colors for blocky style
    const size = ARENA_SIZE * 2;
    const tileSize = 2;
    const tiles = size / tileSize;

    const geo = new THREE.PlaneGeometry(size, size, tiles, tiles);
    geo.rotateX(-Math.PI / 2);

    // Color vertices for checkerboard pattern
    const colors = [];
    const posAttr = geo.attributes.position;
    const darkGreen = new THREE.Color(0x3d7a33);
    const lightGreen = new THREE.Color(GROUND_COLOR);

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const col = Math.floor((x + ARENA_SIZE) / tileSize);
      const row = Math.floor((z + ARENA_SIZE) / tileSize);
      const color = (col + row) % 2 === 0 ? lightGreen : darkGreen;
      colors.push(color.r, color.g, color.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  _buildWalls() {
    const wallMat = new THREE.MeshLambertMaterial({ color: WALL_COLOR });
    const thickness = 1;
    const length = ARENA_SIZE * 2 + thickness * 2;

    const walls = [
      { pos: [0, WALL_HEIGHT / 2, -ARENA_SIZE - thickness / 2], size: [length, WALL_HEIGHT, thickness] },
      { pos: [0, WALL_HEIGHT / 2, ARENA_SIZE + thickness / 2], size: [length, WALL_HEIGHT, thickness] },
      { pos: [-ARENA_SIZE - thickness / 2, WALL_HEIGHT / 2, 0], size: [thickness, WALL_HEIGHT, length] },
      { pos: [ARENA_SIZE + thickness / 2, WALL_HEIGHT / 2, 0], size: [thickness, WALL_HEIGHT, length] },
    ];

    for (const w of walls) {
      const geo = new THREE.BoxGeometry(...w.size);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(...w.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    // Corner pillars for blocky aesthetic
    const pillarSize = 2;
    const pillarHeight = WALL_HEIGHT + 1;
    const pillarGeo = new THREE.BoxGeometry(pillarSize, pillarHeight, pillarSize);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x6b5b45 });

    const corners = [
      [-ARENA_SIZE, ARENA_SIZE],
      [ARENA_SIZE, ARENA_SIZE],
      [-ARENA_SIZE, -ARENA_SIZE],
      [ARENA_SIZE, -ARENA_SIZE],
    ];

    for (const [x, z] of corners) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, pillarHeight / 2, z);
      pillar.castShadow = true;
      this.scene.add(pillar);
    }
  }

  _buildDecorations() {
    // Scatter blocky "rocks" around the arena
    const rockGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

    const rng = this._seededRandom(42);
    for (let i = 0; i < 12; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const x = (rng() - 0.5) * ARENA_SIZE * 1.6;
      const z = (rng() - 0.5) * ARENA_SIZE * 1.6;
      const scale = 0.5 + rng() * 1.5;
      rock.position.set(x, scale * 0.5, z);
      rock.scale.set(scale, scale, scale);
      rock.rotation.y = rng() * Math.PI;
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }

    // A few blocky "tree stumps"
    const stumpGeo = new THREE.CylinderGeometry(0.4, 0.6, 1.5, 6);
    const stumpMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    const topGeo = new THREE.BoxGeometry(2, 2, 2);
    const topMat = new THREE.MeshLambertMaterial({ color: 0x2d6e1e });

    for (let i = 0; i < 6; i++) {
      const x = (rng() - 0.5) * ARENA_SIZE * 1.5;
      const z = (rng() - 0.5) * ARENA_SIZE * 1.5;

      const stump = new THREE.Mesh(stumpGeo, stumpMat);
      stump.position.set(x, 0.75, z);
      stump.castShadow = true;
      this.scene.add(stump);

      const top = new THREE.Mesh(topGeo, topMat);
      top.position.set(x, 2.5, z);
      top.castShadow = true;
      top.receiveShadow = true;
      this.scene.add(top);
    }
  }

  _buildFog() {
    this.scene.fog = new THREE.Fog(0x87ceeb, FOG_NEAR, FOG_FAR);
  }

  _seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };
  }
}
