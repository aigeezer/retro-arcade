import { GameEngine } from '../engine/GameEngine.js';

export class GalagaGame extends GameEngine {
  init() {
    this.playerX = this.width / 2 - 15;
    this.playerY = this.height - 50;
    this.playerW = 30;
    this.playerH = 20;
    this.playerSpeed = 200;
    this.moveDir = 0;
    this.targetX = null;

    this.bullets = [];
    this.bulletSpeed = 450;
    this.bulletCooldown = 0;

    this.enemies = [];
    this.enemyBullets = [];
    this.formations = [];
    this.divingEnemies = [];

    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 20 + Math.random() * 60,
        size: Math.random() > 0.7 ? 2 : 1
      });
    }

    this.lives = 3;
    this.waveTimer = 0;
    this.setupWave();
  }

  setupWave() {
    this.enemies = [];
    this.divingEnemies = [];
    const rows = 3 + Math.min(this.level, 3);
    const cols = 8;
    const types = [
      { color: '#ff0040', points: 80, hp: 2 },
      { color: '#ffe600', points: 50, hp: 1 },
      { color: '#00fff2', points: 30, hp: 1 },
      { color: '#00ff41', points: 20, hp: 1 },
      { color: '#ff00ff', points: 40, hp: 1 },
      { color: '#ff8800', points: 60, hp: 1 }
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = types[r % types.length];
        this.enemies.push({
          baseX: 30 + c * 42,
          baseY: 40 + r * 30,
          x: 30 + c * 42,
          y: 40 + r * 30,
          alive: true,
          color: type.color,
          points: type.points,
          hp: type.hp,
          row: r,
          col: c,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    this.formationOffset = 0;
    this.formationDir = 1;
    this.diveTimer = 2;
    this.enemyShootTimer = 1;
  }

  update(dt) {
    // Stars
    this.stars.forEach(s => {
      s.y += s.speed * dt;
      if (s.y > this.height) { s.y = 0; s.x = Math.random() * this.width; }
    });

    // Player
    if (this.targetX !== null) {
      const diff = this.targetX - (this.playerX + this.playerW / 2);
      if (Math.abs(diff) > 5) this.playerX += Math.sign(diff) * this.playerSpeed * dt * 1.5;
    } else if (this.moveDir !== 0) {
      this.playerX += this.moveDir * this.playerSpeed * dt;
    }
    this.playerX = Math.max(0, Math.min(this.width - this.playerW, this.playerX));

    this.bulletCooldown -= dt;

    // Bullets
    this.bullets = this.bullets.filter(b => { b.y -= this.bulletSpeed * dt; return b.y > -10; });
    this.enemyBullets = this.enemyBullets.filter(b => { b.y += b.speed * dt; return b.y < this.height + 10; });

    // Formation sway
    this.formationOffset += this.formationDir * 30 * dt;
    if (Math.abs(this.formationOffset) > 30) this.formationDir = -this.formationDir;

    const alive = this.enemies.filter(e => e.alive);

    // Update formation positions
    alive.forEach(e => {
      if (!e.diving) {
        e.x = e.baseX + this.formationOffset + Math.sin(e.phase + this.formationOffset * 0.05) * 5;
        e.y = e.baseY + Math.sin(e.phase + this.formationOffset * 0.03) * 3;
      }
    });

    // Diving enemies
    this.diveTimer -= dt;
    if (this.diveTimer <= 0 && alive.length > 0) {
      const diver = alive[Math.floor(Math.random() * alive.length)];
      if (!diver.diving) {
        diver.diving = true;
        diver.divePhase = 0;
        diver.diveStartX = diver.x;
        diver.diveStartY = diver.y;
        diver.diveTargetX = this.playerX + this.playerW / 2 + (Math.random() - 0.5) * 80;
      }
      this.diveTimer = Math.max(0.5, 2 - this.level * 0.2);
    }

    // Update divers
    alive.filter(e => e.diving).forEach(e => {
      e.divePhase += dt * (1 + this.level * 0.15);
      if (e.divePhase < 1) {
        // Swoop down
        e.x = e.diveStartX + Math.sin(e.divePhase * Math.PI * 2) * 60;
        e.y = e.diveStartY + e.divePhase * (this.height - e.diveStartY + 40);
      } else {
        // Return to formation
        e.diving = false;
        e.x = e.baseX + this.formationOffset;
        e.y = e.baseY;
      }

      // Shoot while diving
      if (Math.random() < dt * 2) {
        this.enemyBullets.push({ x: e.x + 10, y: e.y + 16, speed: 250 });
      }
    });

    // Enemy shooting from formation
    this.enemyShootTimer -= dt;
    if (this.enemyShootTimer <= 0 && alive.length > 0) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      this.enemyBullets.push({ x: shooter.x + 10, y: shooter.y + 16, speed: 200 });
      this.enemyShootTimer = Math.max(0.3, 1.5 - this.level * 0.1);
    }

    // Bullet-enemy collision
    this.bullets.forEach(b => {
      alive.forEach(e => {
        if (b.x > e.x && b.x < e.x + 20 && b.y > e.y && b.y < e.y + 16) {
          e.hp--;
          b.y = -999;
          if (e.hp <= 0) {
            e.alive = false;
            if (this.options?.sound) this.options.sound.play('score');
            this.addScore(e.points);
          }
        }
      });
    });

    // Enemy bullet-player collision
    this.enemyBullets.forEach(b => {
      if (b.x > this.playerX && b.x < this.playerX + this.playerW &&
          b.y > this.playerY && b.y < this.playerY + this.playerH) {
        b.y = 9999;
        if (this.options?.sound) this.options.sound.play('die');
        this.lives--;
        if (this.lives <= 0) this.triggerGameOver();
      }
    });

    // Diving enemy-player collision
    alive.filter(e => e.diving).forEach(e => {
      if (Math.abs(e.x + 10 - (this.playerX + this.playerW / 2)) < 20 &&
          Math.abs(e.y + 8 - (this.playerY + this.playerH / 2)) < 18) {
        e.alive = false;
        if (this.options?.sound) this.options.sound.play('die');
        this.lives--;
        if (this.lives <= 0) this.triggerGameOver();
      }
    });

    // Wave complete
    if (alive.length === 0) {
      if (this.options?.sound) this.options.sound.play('clear');
      this.level++;
      this.setupWave();
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Stars
    this.stars.forEach(s => {
      ctx.fillStyle = s.size > 1 ? '#444444' : '#222222';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Enemies
    this.enemies.filter(e => e.alive).forEach(e => {
      // Body
      this.drawPixelRect(ctx, e.x + 4, e.y, 12, 12, e.color);
      // Wings
      this.drawPixelRect(ctx, e.x, e.y + 4, 6, 8, e.color);
      this.drawPixelRect(ctx, e.x + 14, e.y + 4, 6, 8, e.color);
      // Cockpit
      this.drawPixelRect(ctx, e.x + 7, e.y + 3, 6, 4, '#0a0a0a');
      // Wing tips
      if (e.diving) {
        this.drawPixelRect(ctx, e.x - 2, e.y + 10, 4, 4, e.color);
        this.drawPixelRect(ctx, e.x + 18, e.y + 10, 4, 4, e.color);
      }
    });

    // Player ship
    const px = this.playerX;
    const py = this.playerY;
    // Fuselage
    this.drawPixelRect(ctx, px + 11, py, 8, 6, '#00ff41');
    // Body
    this.drawPixelRect(ctx, px + 6, py + 6, 18, 8, '#00ff41');
    // Wings
    this.drawPixelRect(ctx, px, py + 10, 8, 6, '#00ff41');
    this.drawPixelRect(ctx, px + 22, py + 10, 8, 6, '#00ff41');
    // Cockpit
    this.drawPixelRect(ctx, px + 13, py + 2, 4, 4, '#00fff2');

    // Player bullets
    this.bullets.forEach(b => {
      this.drawPixelRect(ctx, b.x - 2, b.y, 4, 10, '#ffe600');
    });

    // Enemy bullets
    this.enemyBullets.forEach(b => {
      this.drawPixelRect(ctx, b.x - 2, b.y, 4, 8, '#ff0040');
    });

    // Lives
    for (let i = 0; i < this.lives; i++) {
      this.drawPixelRect(ctx, 10 + i * 18, this.height - 16, 12, 10, '#00ff41');
    }
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, this.height - 10, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') this.moveDir = -1;
    else if (action === 'RIGHT') this.moveDir = 1;
    else if (action === 'A') this.shoot();
    else if (action === 'RELEASE') { this.moveDir = 0; this.targetX = null; }
  }

  shoot() {
    if (this.bulletCooldown > 0) return;
    if (this.options?.sound) this.options.sound.play('blip');
    this.bullets.push({ x: this.playerX + this.playerW / 2, y: this.playerY });
    this.bulletCooldown = 0.2;
  }

  onTap(x, y) {
    this.targetX = x;
    this.shoot();
  }
}
