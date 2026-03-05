import * as THREE from 'three';
import { MAX_HEALTH } from '../utils/Constants.js';

const NAMEPLATE_OFFSET_Y = 3.2;

export class Nameplates {
  constructor(camera) {
    this._camera = camera;
    this._entries = new Map(); // unicornId -> { element, unicorn }
    this._container = this._buildContainer();
  }

  _buildContainer() {
    const container = document.createElement('div');
    container.id = 'nameplates';
    document.body.appendChild(container);

    const style = document.createElement('style');
    style.textContent = `
      #nameplates {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 5;
        overflow: hidden;
      }
      .nameplate {
        position: absolute;
        transform: translate(-50%, -100%);
        text-align: center;
        font-family: 'Courier New', monospace;
        white-space: nowrap;
      }
      .nameplate-name {
        font-size: 12px;
        font-weight: bold;
        color: #fff;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.9);
      }
      .nameplate-bar {
        width: 48px;
        height: 5px;
        background: rgba(0,0,0,0.5);
        border: 1px solid rgba(255,255,255,0.3);
        margin: 2px auto 0;
        overflow: hidden;
      }
      .nameplate-fill {
        width: 100%;
        height: 100%;
        background: #44cc44;
      }
    `;
    document.head.appendChild(style);

    return container;
  }

  add(id, name, mesh) {
    const el = document.createElement('div');
    el.className = 'nameplate';
    el.innerHTML = `
      <div class="nameplate-name">${this._escapeHtml(name)}</div>
      <div class="nameplate-bar"><div class="nameplate-fill"></div></div>
    `;
    this._container.appendChild(el);
    this._entries.set(id, { element: el, mesh, health: MAX_HEALTH });
  }

  remove(id) {
    const entry = this._entries.get(id);
    if (entry) {
      entry.element.remove();
      this._entries.delete(id);
    }
  }

  setHealth(id, hp) {
    const entry = this._entries.get(id);
    if (!entry) return;
    entry.health = hp;
    const pct = (hp / MAX_HEALTH) * 100;
    const fill = entry.element.querySelector('.nameplate-fill');
    fill.style.width = pct + '%';
    if (pct > 50) {
      fill.style.backgroundColor = '#44cc44';
    } else if (pct > 25) {
      fill.style.backgroundColor = '#ccaa22';
    } else {
      fill.style.backgroundColor = '#cc3333';
    }
  }

  update() {
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    const vec = new THREE.Vector3();

    for (const [, entry] of this._entries) {
      const { element, mesh } = entry;

      vec.setFromMatrixPosition(mesh.matrixWorld);
      vec.y += NAMEPLATE_OFFSET_Y;
      vec.project(this._camera);

      // Behind camera — hide
      if (vec.z > 1) {
        element.style.display = 'none';
        continue;
      }

      const x = (vec.x * halfW) + halfW;
      const y = -(vec.y * halfH) + halfH;

      element.style.display = '';
      element.style.left = x + 'px';
      element.style.top = y + 'px';
    }
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
