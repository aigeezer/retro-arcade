import { GameEngine } from '../engine/GameEngine.js';

export class SpaceInvadersGame extends GameEngine {
  init() {
    this.playerW = 30;
    this.playerH = 16;
    this.playerX = this.width / 2 - this.playerW / 2;
    this.playerY = this.height - 50;
    this.playerSpeed = 200;
    this.moveDir = 0;
    this.targetX = null;

    this.bullets = [];
    this.bulletSpeed = 400;
    this.bulletCooldown = 0;
    this.bulletRate = 0.3;

    this.enemyBullets = [];
    this.enemyBulletSpeed = 200;

    this.invaders = [];
    this.invaderW = 24;
    this.invaderH = 16;
    this.invaderDir = 1;
    this.invaderSpeed = 30;
    this.invaderDropDist = 15;
    this.invaderShootTimer = 0;
    this.invaderShootRate = 1.5;

    this.lives = 3;
    this.setupInvaders();
  }

  setupInvaders() {
    this.invaders = [];
    const cols = 8;
    const rows = 4 + Math.min(this.level - 1, 3);
    const spacing = 34;
    const startX = (this.width - cols * spacing) / 2 + 5;
    const startY = 50;
    const types = ['#ff0040', '#ff8800', '#ffe600', '#00ff41', '#00fff2', '#ff00ff', '#4488ff'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.invaders.push({
          x: startX + c * spacing,
          y: startY + r * 24,
          alive: true,
          color: types[r % types.length],
          type: r
        });
      }
    }

    this.invaderSpeed = 30 + (this.level - 1) * 10;
    this.invaderShootRate = Math.max(0.4, 1.5 - (this.level - 1) * 0.15);
  }

  update(dt) {
    // Player movement
    if (this.targetX !== null) {
      const diff = this.targetX - (this.playerX + this.playerW / 2);
      if (Math.abs(diff) > 5) {
        this.playerX += Math.sign(diff) * this.playerSpeed * dt * 1.5;
      }
    } else if (this.moveDir !== 0) {
      this.playerX += this.moveDir * this.playerSpeed * dt;
    }
    this.playerX = Math.max(0, Math.min(this.width - this.playerW, this.playerX));

    // Fire cooldown
    if (this.bulletCooldown > 0) this.bulletCooldown -= dt;

    // Update player bullets
    this.bullets = this.bullets.filter(b => {
      b.y -= this.bulletSpeed * dt;
      return b.y > -10;
    });

    // Update enemy bullets
    this.enemyBullets = this.enemyBullets.filter(b => {
      b.y += this.enemyBulletSpeed * dt;
      return b.y < this.height + 10;
    });

    // Invader movement
    const alive = this.invaders.filter(i => i.alive);
    if (alive.length === 0) {
      if (this.options?.sound) this.options.sound.play('clear');
      this.level++;
      this.setupInvaders();
      return;
    }

    let edgeHit = false;
    const speedMult = 1 + (1 - alive.length / this.invaders.length) * 2;
    alive.forEach(inv => {
      inv.x += this.invaderDir * this.invaderSpeed * speedMult * dt;
      if (inv.x <= 0 || inv.x + this.invaderW >= this.width) edgeHit = true;
    });

    if (edgeHit) {
      this.invaderDir = -this.invaderDir;
      alive.forEach(inv => {
        inv.y += this.invaderDropDist;
        if (inv.y + this.invaderH >= this.playerY) {
          this.triggerGameOver();
        }
      });
    }

    // Enemy shooting
    this.invaderShootTimer -= dt;
    if (this.invaderShootTimer <= 0 && alive.length > 0) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      this.enemyBullets.push({
        x: shooter.x + this.invaderW / 2 - 2,
        y: shooter.y + this.invaderH,
        w: 4,
        h: 8
      });
      this.invaderShootTimer = this.invaderShootRate * (0.5 + Math.random());
    }

    // Bullet-invader collision
    this.bullets.forEach(b => {
      alive.forEach(inv => {
        if (b.x < inv.x + this.invaderW && b.x + b.w > inv.x &&
            b.y < inv.y + this.invaderH && b.y + b.h > inv.y) {
          inv.alive = false;
          b.y = -999;
          if (this.options?.sound) this.options.sound.play('score');
          const points = (6 - inv.type) * 10;
          this.addScore(Math.max(10, points));
        }
      });
    });

    // Enemy bullet-player collision
    this.enemyBullets.forEach(b => {
      if (b.x < this.playerX + this.playerW && b.x + b.w > this.playerX &&
          b.y < this.playerY + this.playerH && b.y + b.h > this.playerY) {
        b.y = 9999;
        if (this.options?.sound) this.options.sound.play('die');
        this.lives--;
        if (this.options?.sound) this.options.sound.play('die');
        if (this.lives <= 0) this.triggerGameOver();
      }
    });
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Invaders
    this.invaders.filter(i => i.alive).forEach(inv => {
      // Body
      this.drawPixelRect(ctx, inv.x + 4, inv.y, this.invaderW - 8, this.invaderH, inv.color);
      // Wings
      this.drawPixelRect(ctx, inv.x, inv.y + 4, 4, this.invaderH - 8, inv.color);
      this.drawPixelRect(ctx, inv.x + this.invaderW - 4, inv.y + 4, 4, this.invaderH - 8, inv.color);
      // Eyes
      this.drawPixelRect(ctx, inv.x + 8, inv.y + 4, 3, 3, '#0a0a0a');
      this.drawPixelRect(ctx, inv.x + this.invaderW - 11, inv.y + 4, 3, 3, '#0a0a0a');
    });

    // Player ship
    this.drawPixelRect(ctx, this.playerX + 10, this.playerY, 10, 6, '#00ff41');
    this.drawPixelRect(ctx, this.playerX + 4, this.playerY + 6, 22, 5, '#00ff41');
    this.drawPixelRect(ctx, this.playerX, this.playerY + 11, 30, 5, '#00ff41');

    // Player bullets
    this.bullets.forEach(b => {
      this.drawPixelRect(ctx, b.x, b.y, b.w, b.h, '#ffe600');
    });

    // Enemy bullets
    this.enemyBullets.forEach(b => {
      this.drawPixelRect(ctx, b.x, b.y, b.w, b.h, '#ff0040');
    });

    // Lives
    for (let i = 0; i < this.lives; i++) {
      this.drawPixelRect(ctx, 10 + i * 20, this.height - 18, 12, 8, '#00ff41');
    }

    // Level
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, this.height - 10, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') this.moveDir = -1;
    else if (action === 'RIGHT') this.moveDir = 1;
    else if (action === 'A' || action === 'UP') {
      if (this.bulletCooldown <= 0) {
        if (this.options?.sound) this.options.sound.play('blip');
        this.bullets.push({
          x: this.playerX + this.playerW / 2 - 2,
          y: this.playerY,
          w: 4,
          h: 10
        });
        this.bulletCooldown = this.bulletRate;
      }
    }
    else if (action === 'RELEASE') {
      this.moveDir = 0;
      this.targetX = null;
    }
  }

  onTap(x, y) {
    this.targetX = x;
  }
}
