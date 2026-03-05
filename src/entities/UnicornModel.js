import * as THREE from 'three';

const PLAYER_COLORS = {
  body: 0xffffff,
  legs: 0xeeeeee,
  head: 0xffffff,
  horn: 0xffd700,
  mane: 0xff69b4,
  tail: 0xff69b4,
  hooves: 0x333333,
  eye: 0x111111,
};

const BOT_COLORS = {
  body: 0x8844aa,
  legs: 0x773399,
  head: 0x8844aa,
  horn: 0xcccccc,
  mane: 0x6622aa,
  tail: 0x6622aa,
  hooves: 0x222222,
  eye: 0xff0000,
};

function makeMesh(width, height, depth, color) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: true });
  return new THREE.Mesh(geo, mat);
}

/**
 * Creates a blocky Minecraft-style unicorn mesh.
 * The model faces +Z (forward).
 *
 * @param {object} [options]
 * @param {boolean} [options.isPlayer=false] - Use player color palette if true, bot palette otherwise
 * @returns {THREE.Group} The unicorn model group
 */
export function createUnicornModel({ isPlayer = false } = {}) {
  const colors = isPlayer ? PLAYER_COLORS : BOT_COLORS;
  const group = new THREE.Group();

  // Body - main torso
  const body = makeMesh(1.2, 1.0, 2.0, colors.body);
  body.position.set(0, 1.2, 0);
  group.add(body);

  // Head - attached at front of body
  const head = makeMesh(0.8, 0.8, 0.9, colors.head);
  head.position.set(0, 2.0, 1.2);
  group.add(head);

  // Snout - small block at front of head
  const snout = makeMesh(0.5, 0.4, 0.4, colors.head);
  snout.position.set(0, 1.85, 1.85);
  group.add(snout);

  // Eyes
  const leftEye = makeMesh(0.12, 0.12, 0.05, colors.eye);
  leftEye.position.set(-0.25, 2.15, 1.66);
  group.add(leftEye);

  const rightEye = makeMesh(0.12, 0.12, 0.05, colors.eye);
  rightEye.position.set(0.25, 2.15, 1.66);
  group.add(rightEye);

  // Horn - on top of head, angled forward
  const horn = makeMesh(0.15, 0.7, 0.15, colors.horn);
  horn.position.set(0, 2.7, 1.35);
  horn.rotation.x = -0.3;
  group.add(horn);

  // Ears
  const leftEar = makeMesh(0.15, 0.3, 0.15, colors.head);
  leftEar.position.set(-0.25, 2.55, 1.1);
  group.add(leftEar);

  const rightEar = makeMesh(0.15, 0.3, 0.15, colors.head);
  rightEar.position.set(0.25, 2.55, 1.1);
  group.add(rightEar);

  // Mane - series of blocks along neck/back
  const manePositions = [
    [0, 2.45, 1.0],
    [0, 2.3, 0.7],
    [0, 2.1, 0.4],
    [0, 1.9, 0.1],
  ];
  for (const [x, y, z] of manePositions) {
    const maneBlock = makeMesh(0.3, 0.3, 0.3, colors.mane);
    maneBlock.position.set(x, y, z);
    group.add(maneBlock);
  }

  // Legs - four legs at corners of body
  const legWidth = 0.3;
  const legHeight = 0.8;
  const legDepth = 0.3;
  const legY = 0.4;
  const legPositions = [
    [-0.35, legY, 0.65],  // front-left
    [0.35, legY, 0.65],   // front-right
    [-0.35, legY, -0.65], // back-left
    [0.35, legY, -0.65],  // back-right
  ];
  for (const [x, y, z] of legPositions) {
    const leg = makeMesh(legWidth, legHeight, legDepth, colors.legs);
    leg.position.set(x, y, z);
    group.add(leg);

    // Hoof at bottom of each leg
    const hoof = makeMesh(legWidth + 0.04, 0.1, legDepth + 0.04, colors.hooves);
    hoof.position.set(x, 0.05, z);
    group.add(hoof);
  }

  // Tail - series of small blocks trailing behind
  const tailPositions = [
    [0, 1.5, -1.1],
    [0, 1.7, -1.35],
    [0, 1.9, -1.5],
  ];
  for (const [x, y, z] of tailPositions) {
    const tailBlock = makeMesh(0.2, 0.2, 0.25, colors.tail);
    tailBlock.position.set(x, y, z);
    group.add(tailBlock);
  }

  return group;
}
