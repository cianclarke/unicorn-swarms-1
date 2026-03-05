export class LoadingScreen {
  constructor() {
    this._progress = 0;
    this._steps = [];
    this._currentStep = 0;
    this._buildDOM();
  }

  _buildDOM() {
    this._overlay = document.createElement('div');
    this._overlay.id = 'loading-screen';
    this._overlay.innerHTML = `
      <div class="loading-content">
        <h1 class="loading-title">Unicorn Swarms</h1>
        <div class="loading-bar-track">
          <div class="loading-bar-fill"></div>
        </div>
        <div class="loading-status">Initializing...</div>
        <div class="loading-error" style="display:none"></div>
      </div>
    `;
    document.body.appendChild(this._overlay);

    const style = document.createElement('style');
    style.textContent = `
      #loading-screen {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: #1a1a2e;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Courier New', monospace;
        color: #fff;
        transition: opacity 0.4s ease-out;
      }
      #loading-screen.fade-out {
        opacity: 0;
        pointer-events: none;
      }
      .loading-content {
        text-align: center;
        width: 320px;
      }
      .loading-title {
        font-size: 28px;
        margin-bottom: 24px;
        letter-spacing: 2px;
        background: linear-gradient(90deg, #ff6ec7, #7b68ee, #00e5ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .loading-bar-track {
        width: 100%;
        height: 12px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 6px;
        overflow: hidden;
      }
      .loading-bar-fill {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #7b68ee, #00e5ff);
        border-radius: 6px;
        transition: width 0.2s ease-out;
      }
      .loading-status {
        margin-top: 12px;
        font-size: 12px;
        color: rgba(255,255,255,0.6);
      }
      .loading-error {
        margin-top: 16px;
        padding: 12px;
        background: rgba(204,51,51,0.3);
        border: 1px solid #cc3333;
        border-radius: 4px;
        font-size: 13px;
        color: #ff8888;
      }
    `;
    document.head.appendChild(style);
    this._style = style;

    this._fill = this._overlay.querySelector('.loading-bar-fill');
    this._status = this._overlay.querySelector('.loading-status');
    this._errorEl = this._overlay.querySelector('.loading-error');
  }

  setSteps(steps) {
    this._steps = steps;
    this._currentStep = 0;
  }

  advance(label) {
    this._currentStep++;
    const pct = Math.min(100, (this._currentStep / this._steps.length) * 100);
    this._progress = pct;
    this._fill.style.width = pct + '%';
    this._status.textContent = label || this._steps[this._currentStep - 1] || '';
  }

  showError(message) {
    this._errorEl.style.display = 'block';
    this._errorEl.textContent = message;
    this._status.textContent = 'Failed to load';
  }

  hide() {
    return new Promise((resolve) => {
      this._fill.style.width = '100%';
      this._status.textContent = 'Ready!';
      setTimeout(() => {
        this._overlay.classList.add('fade-out');
        this._overlay.addEventListener('transitionend', () => {
          this._overlay.remove();
          this._style.remove();
          resolve();
        }, { once: true });
      }, 200);
    });
  }
}
