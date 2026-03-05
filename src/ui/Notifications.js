const DISPLAY_DURATION = 4000; // ms
const MAX_VISIBLE = 5;

export class Notifications {
  constructor() {
    this._container = this._buildContainer();
    this._messages = [];
  }

  _buildContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    document.body.appendChild(container);

    const style = document.createElement('style');
    style.textContent = `
      #notifications {
        position: fixed;
        top: 60px;
        right: 16px;
        z-index: 10;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
        font-family: 'Courier New', monospace;
      }
      .notification {
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        padding: 6px 14px;
        border-radius: 3px;
        font-size: 13px;
        font-weight: bold;
        text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        opacity: 1;
        transition: opacity 0.5s ease-out;
        white-space: nowrap;
      }
      .notification.fading {
        opacity: 0;
      }
      .notification .elim-attacker {
        color: #ff6666;
      }
      .notification .elim-victim {
        color: #aaaaff;
      }
    `;
    document.head.appendChild(style);

    return container;
  }

  showElimination(attackerName, victimName) {
    const el = document.createElement('div');
    el.className = 'notification';
    el.innerHTML =
      `<span class="elim-attacker">${this._escapeHtml(attackerName)}</span>` +
      ` eliminated ` +
      `<span class="elim-victim">${this._escapeHtml(victimName)}</span>`;
    this._addMessage(el);
  }

  showMessage(text) {
    const el = document.createElement('div');
    el.className = 'notification';
    el.textContent = text;
    this._addMessage(el);
  }

  _addMessage(el) {
    this._container.appendChild(el);
    this._messages.push({ el, addedAt: performance.now() });

    // Trim excess
    while (this._messages.length > MAX_VISIBLE) {
      const old = this._messages.shift();
      old.el.remove();
    }
  }

  update() {
    const now = performance.now();
    const toRemove = [];

    for (let i = 0; i < this._messages.length; i++) {
      const msg = this._messages[i];
      const elapsed = now - msg.addedAt;

      if (elapsed > DISPLAY_DURATION) {
        msg.el.remove();
        toRemove.push(i);
      } else if (elapsed > DISPLAY_DURATION - 500) {
        msg.el.classList.add('fading');
      }
    }

    // Remove expired (iterate backwards to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this._messages.splice(toRemove[i], 1);
    }
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
