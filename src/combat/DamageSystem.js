import { MAX_HEALTH } from '../utils/Constants.js';

export class DamageSystem {
  constructor(notifications) {
    this.notifications = notifications;
  }

  applyDamage(attacker, target, amount) {
    if (target.state === 'eliminated') return false;

    target.health = Math.max(0, target.health - amount);

    if (target.health <= 0) {
      target.state = 'eliminated';
      target.mesh.visible = false;
      const attackerName = attacker.name || 'Player';
      const targetName = target.name || 'Unicorn';
      this.notifications.showElimination(attackerName, targetName);
      return true; // eliminated
    }

    return false;
  }
}
