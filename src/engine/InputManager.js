export class InputManager {
  constructor() {
    this.keys = {};
    this._onKeyDown = (e) => { this.keys[e.code] = true; };
    this._onKeyUp = (e) => { this.keys[e.code] = false; };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  get forward() { return this.keys['KeyW'] || this.keys['ArrowUp'] || false; }
  get backward() { return this.keys['KeyS'] || this.keys['ArrowDown'] || false; }
  get left() { return this.keys['KeyA'] || this.keys['ArrowLeft'] || false; }
  get right() { return this.keys['KeyD'] || this.keys['ArrowRight'] || false; }
  get charge() { return this.keys['ShiftLeft'] || this.keys['ShiftRight'] || false; }
  get jump() { return this.keys['Space'] || false; }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
