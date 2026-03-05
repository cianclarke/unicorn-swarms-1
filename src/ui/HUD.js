import { MAX_HEALTH, CHARGE_COOLDOWN } from '../utils/Constants.js';

export class HUD {
  constructor() {
    this._buildDOM();
    this._health = MAX_HEALTH;
    this._hits = 0;
    this._chargeCooldownRemaining = 0;
  }

  _buildDOM() {
    const container = document.createElement('div');
    container.id = 'hud';
    container.innerHTML = `
      <div class="hud-health">
        <div class="hud-health-bar">
          <div class="hud-health-fill"></div>
        </div>
        <span class="hud-health-text">100%</span>
      </div>
      <div class="hud-hits">
        Hits: <span class="hud-hits-count">0</span>
      </div>
      <div class="hud-cooldown">
        <svg class="hud-cooldown-svg" viewBox="0 0 44 44">
          <circle class="hud-cooldown-bg" cx="22" cy="22" r="18"
            fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>
          <circle class="hud-cooldown-arc" cx="22" cy="22" r="18"
            fill="none" stroke="#ff6600" stroke-width="4"
            stroke-dasharray="113.1" stroke-dashoffset="0"
            stroke-linecap="round" transform="rotate(-90 22 22)"/>
        </svg>
        <span class="hud-cooldown-label">CHARGE</span>
      </div>
    `;
    document.body.appendChild(container);

    const style = document.createElement('style');
    style.textContent = `
      #hud {
        position: fixed;
        top: 0; left: 0; right: 0;
        pointer-events: none;
        z-index: 10;
        font-family: 'Courier New', monospace;
        color: #fff;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        padding: 16px;
        display: flex;
        align-items: flex-start;
        gap: 24px;
      }
      .hud-health {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .hud-health-bar {
        width: 180px;
        height: 18px;
        background: rgba(0,0,0,0.5);
        border: 2px solid rgba(255,255,255,0.4);
        border-radius: 2px;
        overflow: hidden;
      }
      .hud-health-fill {
        width: 100%;
        height: 100%;
        background: #44cc44;
        transition: width 0.15s ease-out, background-color 0.3s;
      }
      .hud-health-text {
        font-size: 14px;
        font-weight: bold;
        min-width: 40px;
      }
      .hud-hits {
        font-size: 14px;
        font-weight: bold;
      }
      .hud-cooldown {
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .hud-cooldown-svg {
        width: 44px;
        height: 44px;
      }
      .hud-cooldown-label {
        position: absolute;
        font-size: 8px;
        font-weight: bold;
        letter-spacing: 0.5px;
      }
    `;
    document.head.appendChild(style);

    this._healthFill = container.querySelector('.hud-health-fill');
    this._healthText = container.querySelector('.hud-health-text');
    this._hitsCount = container.querySelector('.hud-hits-count');
    this._cooldownArc = container.querySelector('.hud-cooldown-arc');
  }

  setHealth(hp) {
    this._health = Math.max(0, Math.min(MAX_HEALTH, hp));
    const pct = (this._health / MAX_HEALTH) * 100;
    this._healthFill.style.width = pct + '%';
    this._healthText.textContent = Math.round(pct) + '%';

    if (pct > 50) {
      this._healthFill.style.backgroundColor = '#44cc44';
    } else if (pct > 25) {
      this._healthFill.style.backgroundColor = '#ccaa22';
    } else {
      this._healthFill.style.backgroundColor = '#cc3333';
    }
  }

  setHits(count) {
    this._hits = count;
    this._hitsCount.textContent = count;
  }

  setChargeCooldown(remaining) {
    this._chargeCooldownRemaining = remaining;
    const circumference = 2 * Math.PI * 18; // r=18
    const ratio = Math.max(0, Math.min(1, remaining / CHARGE_COOLDOWN));
    this._cooldownArc.setAttribute(
      'stroke-dashoffset',
      String(circumference * ratio)
    );
    this._cooldownArc.setAttribute(
      'stroke',
      ratio > 0 ? '#ff6600' : '#44cc44'
    );
  }

  update() {
    // Called each frame — HUD reads from game state when wired up.
    // Consumers call setHealth/setHits/setChargeCooldown directly.
  }
}
