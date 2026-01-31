import { GameEngine } from '../engine/GameEngine.js';

export class DefenderGame extends GameEngine {
  init() {
    this.worldWidth = this.width * 4;
    this.cameraX = 0;

    // Player ship
    this.shipX = this.width / 2;
    this.shipY = this.height / 2;
    this.shipVX = 0;
    this.shipVY = 0;
    this.shipSpeed = 200;
    this.shipW = 24;
    this.shipH = 12;
    this.facingRight = true;

    this.bullets = [];
    this.bulletSpeed = 500;
    this.bulletCooldown = 0;
    this.autoFire = true;

    // Terrain
    this.terrain = [];
    for (let x = 0; x < this.worldWidth; x += 4) {
      this.terrain.push({
        x,
        y: this.height - 40 + Math.sin(x * 0.01) * 20 + Math.sin(x * 0.03) * 10
      });
    }

    // Enemies
    this.enemies = [];
    this.enemyBullets = [];
    this.spawnEnemies();

    // Humans to protect
    this.humans = [];
    for (let i = 0; i < 6; i++) {
      this.humans.push({
        x: 100 + Math.random() * (this.worldWidth - 200),
        y: this.height - 50,
        alive: true,
        captured: false,
        capturedBy: null,
        falling: false
      });
    }

    this.lives = 3;
    this.moveDir = { x: 0, y: 0 };

    // Stars
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({ x: Math.random() * this.worldWidth, y: Math.random() * (this.height - 80), size: Math.random() > 0.7 ? 2 : 1 });
    }
  }

  spawnEnemies() {
    this.enemies = [];
    const count = 6 + this.level * 3;
    for (let i = 0; i < count; i++) {
      this.enemies.push({
        x: Math.random() * this.worldWidth,
        y: 30 + Math.random() * (this.height / 2),
        vx: (Math.random() - 0.5) * (60 + this.level * 10),
        vy: (Math.random() - 0.5) * 40,
        type: Math.random() < 0.3 ? 'lander' : 'baiter',
        w: 16,
        h: 12,
        shootTimer: 2 + Math.random() * 3,
        captureTarget: null
      });
    }
  }

  wrapX(x) {
    return ((x % this.worldWidth) + this.worldWidth) % this.worldWidth;
  }

  update(dt) {
    // Ship movement
    this.shipVX += this.moveDir.x * this.shipSpeed * dt * 3;
    this.shipVY += this.moveDir.y * this.shipSpeed * dt * 3;
    this.shipVX *= 0.95;
    this.shipVY *= 0.95;

    if (this.moveDir.x > 0) this.facingRight = true;
    else if (this.moveDir.x < 0) this.facingRight = false;

    this.shipX += this.shipVX * dt;
    this.shipY += this.shipVY * dt;
    this.shipX = this.wrapX(this.shipX);
    this.shipY = Math.max(10, Math.min(this.height - 60, this.shipY));

    this.cameraX = this.shipX - this.width / 2;

    // Auto fire
    this.bulletCooldown -= dt;
    if (this.autoFire && this.bulletCooldown <= 0) {
      if (this.options?.sound) this.options.sound.play('blip');
      const dir = this.facingRight ? 1 : -1;
      this.bullets.push({
        x: this.shipX + dir * this.shipW / 2,
        y: this.shipY,
        vx: dir * this.bulletSpeed,
        life: 1.5
      });
      this.bulletCooldown = 0.15;
    }

    // Bullets
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx * dt;
      b.x = this.wrapX(b.x);
      b.life -= dt;
      return b.life > 0;
    });

    // Enemy bullets
    this.enemyBullets = this.enemyBullets.filter(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Hit player
      if (Math.abs(this.wrapX(b.x) - this.shipX) < this.shipW &&
          Math.abs(b.y - this.shipY) < this.shipH) {
        this.die();
        return false;
      }
      return b.life > 0;
    });

    // Enemies
    this.enemies = this.enemies.filter(enemy => {
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.x = this.wrapX(enemy.x);
      enemy.y = Math.max(10, Math.min(this.height - 60, enemy.y));

      // Landers try to capture humans
      if (enemy.type === 'lander' && !enemy.captureTarget) {
        const target = this.humans.find(h => h.alive && !h.captured &&
          Math.abs(this.wrapX(h.x) - this.wrapX(enemy.x)) < 100);
        if (target) {
          enemy.captureTarget = target;
        }
      }

      if (enemy.captureTarget) {
        const t = enemy.captureTarget;
        if (!t.alive) { enemy.captureTarget = null; }
        else {
          const dx = t.x - enemy.x;
          const dy = t.y - enemy.y;
          enemy.vx += Math.sign(dx) * 50 * dt;
          enemy.vy += Math.sign(dy) * 50 * dt;

          if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && !t.captured) {
            t.captured = true;
            t.capturedBy = enemy;
            enemy.vy = -40 - this.level * 5;
          }

          if (t.captured && enemy.y < -20) {
            t.alive = false;
            enemy.captureTarget = null;
            enemy.vy = 20;
          }
        }
      }

      // Shooting
      enemy.shootTimer -= dt;
      if (enemy.shootTimer <= 0) {
        const dx = this.shipX - enemy.x;
        const dy = this.shipY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.width) {
          this.enemyBullets.push({
            x: enemy.x, y: enemy.y,
            vx: (dx / dist) * 200,
            vy: (dy / dist) * 200,
            life: 2
          });
        }
        enemy.shootTimer = Math.max(0.5, 2 - this.level * 0.15);
      }

      // Enemy-player collision
      if (Math.abs(this.wrapX(enemy.x) - this.shipX) < 18 &&
          Math.abs(enemy.y - this.shipY) < 14) {
        if (enemy.captureTarget && enemy.captureTarget.captured) {
          enemy.captureTarget.captured = false;
          enemy.captureTarget.falling = true;
          enemy.captureTarget.capturedBy = null;
        }
        this.die();
        return false;
      }

      // Bullet collision
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (Math.abs(this.wrapX(b.x) - this.wrapX(enemy.x)) < 14 &&
            Math.abs(b.y - enemy.y) < 12) {
          this.bullets.splice(i, 1);
          if (this.options?.sound) this.options.sound.play('score');
          this.addScore(enemy.type === 'lander' ? 150 : 200);
          if (enemy.captureTarget && enemy.captureTarget.captured) {
            enemy.captureTarget.captured = false;
            enemy.captureTarget.falling = true;
            enemy.captureTarget.capturedBy = null;
          }
          return false;
        }
      }

      return true;
    });

    // Humans
    this.humans.forEach(h => {
      if (h.captured && h.capturedBy) {
        h.x = h.capturedBy.x;
        h.y = h.capturedBy.y + 14;
      } else if (h.falling) {
        h.y += 100 * dt;
        // Catch falling human
        if (Math.abs(this.wrapX(h.x) - this.shipX) < 20 &&
            Math.abs(h.y - this.shipY) < 20) {
          h.falling = false;
          if (this.options?.sound) this.options.sound.play('powerup');
          this.addScore(500);
        }
        if (h.y > this.height - 45) {
          h.falling = false;
          h.y = this.height - 50;
        }
      }
    });

    // Wave complete
    if (this.enemies.length === 0) {
      this.level++;
      this.spawnEnemies();
    }
  }

  die() {
    if (this.options?.sound) this.options.sound.play('die');
    this.lives--;
    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      this.shipX = this.width / 2;
      this.shipY = this.height / 2;
      this.shipVX = 0;
      this.shipVY = 0;
    }
  }

  screenX(worldX) {
    let sx = worldX - this.cameraX;
    if (sx < -this.worldWidth / 2) sx += this.worldWidth;
    if (sx > this.worldWidth / 2) sx -= this.worldWidth;
    return sx;
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Stars
    this.stars.forEach(s => {
      const sx = this.screenX(s.x);
      if (sx > -5 && sx < this.width + 5) {
        ctx.fillStyle = '#222222';
        ctx.fillRect(sx, s.y, s.size, s.size);
      }
    });

    // Minimap
    const mmY = 5;
    const mmH = 15;
    const mmW = this.width - 20;
    this.drawRect(ctx, 10, mmY, mmW, mmH, '#111111');
    // Player on minimap
    const pMM = (this.shipX / this.worldWidth) * mmW + 10;
    this.drawPixelRect(ctx, pMM - 1, mmY + 2, 3, mmH - 4, '#00ff41');
    // Enemies on minimap
    this.enemies.forEach(e => {
      const eMM = (e.x / this.worldWidth) * mmW + 10;
      this.drawPixelRect(ctx, eMM, mmY + 4, 2, mmH - 8, '#ff0040');
    });
    // Humans on minimap
    this.humans.filter(h => h.alive).forEach(h => {
      const hMM = (h.x / this.worldWidth) * mmW + 10;
      this.drawPixelRect(ctx, hMM, mmY + mmH - 4, 2, 3, '#00fff2');
    });

    // Terrain
    ctx.strokeStyle = '#0a4a0a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    let started = false;
    this.terrain.forEach(t => {
      const sx = this.screenX(t.x);
      if (sx > -10 && sx < this.width + 10) {
        if (!started) { ctx.moveTo(sx, t.y); started = true; }
        else ctx.lineTo(sx, t.y);
      }
    });
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fillStyle = '#0a2a0a';
    ctx.fill();

    // Humans
    this.humans.filter(h => h.alive).forEach(h => {
      const sx = this.screenX(h.x);
      if (sx > -20 && sx < this.width + 20) {
        this.drawPixelRect(ctx, sx - 3, h.y, 6, 12, '#00fff2');
        this.drawPixelRect(ctx, sx - 2, h.y - 4, 4, 5, '#ffe600');
      }
    });

    // Enemies
    this.enemies.forEach(e => {
      const sx = this.screenX(e.x);
      if (sx > -30 && sx < this.width + 30) {
        const color = e.type === 'lander' ? '#00ff41' : '#ff00ff';
        this.drawPixelRect(ctx, sx - 8, e.y - 6, 16, 12, color);
        this.drawPixelRect(ctx, sx - 4, e.y - 8, 8, 4, color);
        this.drawPixelRect(ctx, sx - 2, e.y - 4, 4, 3, '#0a0a0a');
      }
    });

    // Player ship
    const psx = this.width / 2;
    ctx.save();
    ctx.translate(psx, this.shipY);
    if (!this.facingRight) ctx.scale(-1, 1);
    // Ship body
    ctx.fillStyle = '#00ff41';
    ctx.beginPath();
    ctx.moveTo(this.shipW / 2, 0);
    ctx.lineTo(-this.shipW / 2, -this.shipH / 2);
    ctx.lineTo(-this.shipW / 3, 0);
    ctx.lineTo(-this.shipW / 2, this.shipH / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Bullets
    this.bullets.forEach(b => {
      const sx = this.screenX(b.x);
      if (sx > -10 && sx < this.width + 10) {
        this.drawPixelRect(ctx, sx - 4, b.y - 1, 8, 2, '#ffe600');
      }
    });

    // Enemy bullets
    this.enemyBullets.forEach(b => {
      const sx = this.screenX(b.x);
      if (sx > -10 && sx < this.width + 10) {
        this.drawPixelRect(ctx, sx - 2, b.y - 2, 4, 4, '#ff0040');
      }
    });

    // HUD
    for (let i = 0; i < this.lives; i++) {
      this.drawPixelRect(ctx, 10 + i * 18, this.height - 16, 12, 8, '#00ff41');
    }
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, this.height - 10, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') this.moveDir.x = -1;
    else if (action === 'RIGHT') this.moveDir.x = 1;
    else if (action === 'UP') this.moveDir.y = -1;
    else if (action === 'DOWN') this.moveDir.y = 1;
    else if (action === 'RELEASE') { this.moveDir = { x: 0, y: 0 }; }
  }

  onTap(x, y) {
    this.facingRight = x > this.width / 2;
    if (y < this.shipY - 20) this.moveDir.y = -1;
    else if (y > this.shipY + 20) this.moveDir.y = 1;
    if (x < this.width / 2 - 30) this.moveDir.x = -1;
    else if (x > this.width / 2 + 30) this.moveDir.x = 1;
  }
}
