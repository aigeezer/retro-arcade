import { GameEngine } from '../engine/GameEngine.js';

export class MissileCommandGame extends GameEngine {
  init() {
    // Cities
    this.cities = [];
    for (let i = 0; i < 6; i++) {
      this.cities.push({
        x: 30 + i * ((this.width - 60) / 5),
        alive: true
      });
    }
    this.cityW = 24;
    this.cityH = 16;
    this.groundY = this.height - 30;

    // Player missiles
    this.playerMissiles = [];
    this.explosions = [];

    // Enemy missiles
    this.enemyMissiles = [];
    this.missileTimer = 0;
    this.missileRate = 2 - Math.min(this.level * 0.15, 1.5);

    // Battery
    this.ammo = 30;
    this.batteryX = this.width / 2;
    this.batteryY = this.groundY;

    // Crosshair
    this.crossX = this.width / 2;
    this.crossY = this.height / 2;
    this.crossSpeed = 250;
    this.crossDir = { x: 0, y: 0 };

    this.waveMissiles = 0;
    this.maxWaveMissiles = 10 + this.level * 5;
  }

  update(dt) {
    // Crosshair movement
    if (this.crossDir.x !== 0 || this.crossDir.y !== 0) {
      this.crossX += this.crossDir.x * this.crossSpeed * dt;
      this.crossY += this.crossDir.y * this.crossSpeed * dt;
    }
    this.crossX = Math.max(0, Math.min(this.width, this.crossX));
    this.crossY = Math.max(0, Math.min(this.groundY, this.crossY));

    // Spawn enemy missiles
    const aliveCities = this.cities.filter(c => c.alive);
    if (aliveCities.length === 0) {
      this.triggerGameOver();
      return;
    }

    this.missileTimer -= dt;
    if (this.missileTimer <= 0 && this.waveMissiles < this.maxWaveMissiles) {
      const target = aliveCities[Math.floor(Math.random() * aliveCities.length)];
      this.enemyMissiles.push({
        startX: Math.random() * this.width,
        startY: 0,
        x: Math.random() * this.width,
        y: 0,
        targetX: target.x + this.cityW / 2,
        targetY: this.groundY,
        speed: 40 + this.level * 8 + Math.random() * 20,
        trail: []
      });
      this.waveMissiles++;
      this.missileTimer = this.missileRate * (0.5 + Math.random());
    }

    // Update enemy missiles
    this.enemyMissiles = this.enemyMissiles.filter(m => {
      const dx = m.targetX - m.x;
      const dy = m.targetY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) {
        // Hit ground — check cities
        this.cities.forEach(c => {
          if (c.alive && Math.abs(c.x + this.cityW / 2 - m.x) < this.cityW) {
            c.alive = false;
          }
        });
        this.explosions.push({ x: m.x, y: m.y, radius: 0, maxRadius: 20, growing: true });
        return false;
      }
      const vx = (dx / dist) * m.speed;
      const vy = (dy / dist) * m.speed;
      m.x += vx * dt;
      m.y += vy * dt;
      m.trail.push({ x: m.x, y: m.y });
      if (m.trail.length > 30) m.trail.shift();
      return true;
    });

    // Update player missiles
    this.playerMissiles = this.playerMissiles.filter(m => {
      const dx = m.targetX - m.x;
      const dy = m.targetY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        this.explosions.push({ x: m.targetX, y: m.targetY, radius: 0, maxRadius: 40, growing: true });
        return false;
      }
      const speed = 400;
      m.x += (dx / dist) * speed * dt;
      m.y += (dy / dist) * speed * dt;
      return true;
    });

    // Update explosions
    this.explosions = this.explosions.filter(e => {
      if (e.growing) {
        e.radius += 80 * dt;
        if (e.radius >= e.maxRadius) e.growing = false;
      } else {
        e.radius -= 40 * dt;
      }

      // Check explosion vs enemy missiles
      this.enemyMissiles = this.enemyMissiles.filter(m => {
        if (Math.hypot(m.x - e.x, m.y - e.y) < e.radius) {
          this.addScore(25);
          return false;
        }
        return true;
      });

      return e.radius > 0;
    });

    // Check wave complete
    if (this.waveMissiles >= this.maxWaveMissiles && this.enemyMissiles.length === 0 && this.explosions.length === 0) {
      // Bonus for surviving cities
      const bonus = aliveCities.length * 100;
      this.addScore(bonus);
      this.level++;
      this.waveMissiles = 0;
      this.maxWaveMissiles = 10 + this.level * 5;
      this.missileRate = Math.max(0.3, 2 - this.level * 0.15);
      this.ammo = 30;
    }
  }

  fire(x, y) {
    if (this.ammo <= 0) return;
    this.ammo--;
    this.playerMissiles.push({
      x: this.batteryX,
      y: this.batteryY,
      targetX: x,
      targetY: y
    });
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Stars
    ctx.fillStyle = '#222222';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137.5) % this.width;
      const sy = (i * 73.1) % (this.groundY - 20);
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Ground
    this.drawRect(ctx, 0, this.groundY, this.width, this.height - this.groundY, '#1a4a1a');

    // Cities
    this.cities.forEach(c => {
      if (c.alive) {
        // Buildings
        this.drawPixelRect(ctx, c.x, this.groundY - 12, 8, 12, '#4488ff');
        this.drawPixelRect(ctx, c.x + 8, this.groundY - 16, 8, 16, '#4488ff');
        this.drawPixelRect(ctx, c.x + 16, this.groundY - 10, 8, 10, '#4488ff');
        // Windows
        for (let wy = this.groundY - 14; wy < this.groundY - 2; wy += 4) {
          this.drawPixelRect(ctx, c.x + 10, wy, 2, 2, '#ffe600');
        }
      } else {
        // Rubble
        this.drawPixelRect(ctx, c.x + 4, this.groundY - 4, 16, 4, '#333333');
      }
    });

    // Battery
    this.drawPixelRect(ctx, this.batteryX - 8, this.batteryY - 10, 16, 10, '#00ff41');
    this.drawPixelRect(ctx, this.batteryX - 3, this.batteryY - 16, 6, 8, '#00ff41');

    // Enemy missile trails
    this.enemyMissiles.forEach(m => {
      ctx.strokeStyle = '#ff0040';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(m.startX, m.startY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      this.drawPixelRect(ctx, m.x - 2, m.y - 2, 4, 4, '#ff0040');
    });

    // Player missiles
    this.playerMissiles.forEach(m => {
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.batteryX, this.batteryY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      this.drawPixelRect(ctx, m.x - 2, m.y - 2, 4, 4, '#00ff41');
    });

    // Explosions
    this.explosions.forEach(e => {
      const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.4, '#ffe600');
      gradient.addColorStop(0.7, '#ff8800');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Crosshair
    ctx.strokeStyle = '#00fff2';
    ctx.lineWidth = 1;
    const cx = this.crossX, cy = this.crossY;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy); ctx.lineTo(cx - 4, cy);
    ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy - 4);
    ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 10);
    ctx.stroke();

    // Ammo
    this.drawText(ctx, `AMMO: ${this.ammo}`, 10, 20, 12, '#00ff41', 'left');
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, 20, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') this.crossDir.x = -1;
    else if (action === 'RIGHT') this.crossDir.x = 1;
    else if (action === 'UP') this.crossDir.y = -1;
    else if (action === 'DOWN') this.crossDir.y = 1;
    else if (action === 'A') this.fire(this.crossX, this.crossY);
    else if (action === 'RELEASE') { this.crossDir = { x: 0, y: 0 }; }
  }

  onTap(x, y) {
    this.fire(x, y);
  }
}
