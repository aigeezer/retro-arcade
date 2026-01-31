import { GameEngine } from '../engine/GameEngine.js';

export class DuckHuntGame extends GameEngine {
  init() {
    this.ducks = [];
    this.ducksPerRound = 3 + this.level;
    this.ducksLaunched = 0;
    this.ducksHit = 0;
    this.ducksMissed = 0;
    this.maxMisses = 3;
    this.launchTimer = 0;
    this.launchRate = 1.5;

    this.crossX = this.width / 2;
    this.crossY = this.height / 2;
    this.crossSpeed = 300;
    this.crossDir = { x: 0, y: 0 };

    this.shots = 3;
    this.maxShots = 3;

    this.hitEffects = [];
    this.fallingDucks = [];

    // Scenery
    this.groundY = this.height - 80;
    this.grass = [];
    for (let i = 0; i < 20; i++) {
      this.grass.push({
        x: Math.random() * this.width,
        h: 15 + Math.random() * 25
      });
    }

    this.trees = [
      { x: 30, h: 120 },
      { x: this.width - 60, h: 100 },
      { x: this.width / 2 - 20, h: 90 }
    ];

    this.roundComplete = false;
    this.roundTimer = 0;
    this.lives = 5;
  }

  launchDuck() {
    if (this.ducksLaunched >= this.ducksPerRound) return;
    const speed = 100 + this.level * 20 + Math.random() * 60;
    const angle = -Math.PI / 4 - Math.random() * Math.PI / 2;
    this.ducks.push({
      x: 20 + Math.random() * (this.width - 40),
      y: this.groundY - 10,
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: Math.sin(angle) * speed,
      size: 20,
      alive: true,
      flap: 0,
      changeTimer: 1 + Math.random() * 2,
      escapeTimer: 5
    });
    this.ducksLaunched++;
    this.shots = this.maxShots;
  }

  update(dt) {
    // Crosshair
    this.crossX += this.crossDir.x * this.crossSpeed * dt;
    this.crossY += this.crossDir.y * this.crossSpeed * dt;
    this.crossX = Math.max(0, Math.min(this.width, this.crossX));
    this.crossY = Math.max(0, Math.min(this.height, this.crossY));

    // Launch ducks
    this.launchTimer -= dt;
    if (this.launchTimer <= 0 && this.ducks.length === 0 && this.fallingDucks.length === 0 &&
        this.ducksLaunched < this.ducksPerRound && !this.roundComplete) {
      this.launchDuck();
      this.launchTimer = this.launchRate;
    }

    // Update ducks
    this.ducks = this.ducks.filter(d => {
      d.flap += dt * 10;
      d.escapeTimer -= dt;
      d.changeTimer -= dt;

      d.x += d.vx * dt;
      d.y += d.vy * dt;

      // Bounce off walls
      if (d.x < 10 || d.x > this.width - 10) {
        d.vx = -d.vx;
        d.x = Math.max(10, Math.min(this.width - 10, d.x));
      }
      if (d.y < 10) {
        d.vy = Math.abs(d.vy);
      }
      if (d.y > this.groundY - 30) {
        d.vy = -Math.abs(d.vy);
      }

      // Random direction change
      if (d.changeTimer <= 0) {
        const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
        const angle = -Math.PI / 4 - Math.random() * Math.PI / 2;
        d.vx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
        d.vy = Math.sin(angle) * speed;
        d.changeTimer = 0.8 + Math.random() * 1.5;
      }

      // Duck escapes
      if (d.escapeTimer <= 0) {
        d.vy = -200;
        if (d.y < -30) {
          if (this.options?.sound) this.options.sound.play('blip');
          this.ducksMissed++;
          this.lives--;
          if (this.lives <= 0) this.triggerGameOver();
          return false;
        }
      }

      return true;
    });

    // Falling ducks
    this.fallingDucks = this.fallingDucks.filter(d => {
      d.y += d.vy * dt;
      d.vy += 400 * dt;
      return d.y < this.height;
    });

    // Hit effects
    this.hitEffects = this.hitEffects.filter(e => {
      e.timer -= dt;
      return e.timer > 0;
    });

    // Round complete check
    if (this.ducksLaunched >= this.ducksPerRound && this.ducks.length === 0 && this.fallingDucks.length === 0) {
      if (!this.roundComplete) {
        this.roundComplete = true;
        this.roundTimer = 2;
        if (this.options?.sound) this.options.sound.play('clear');
      }
      this.roundTimer -= dt;
      if (this.roundTimer <= 0) {
        this.level++;
        this.ducksLaunched = 0;
        this.ducksHit = 0;
        this.ducksMissed = 0;
        this.ducksPerRound = 3 + this.level;
        this.roundComplete = false;
        this.maxShots = 3;
      }
    }
  }

  shoot(x, y) {
    if (this.shots <= 0) return;
    this.shots--;
    if (this.options?.sound) this.options.sound.play('hit');

    let hit = false;
    this.ducks = this.ducks.filter(d => {
      if (Math.abs(d.x - x) < d.size && Math.abs(d.y - y) < d.size) {
        hit = true;
        this.ducksHit++;
        if (this.options?.sound) this.options.sound.play('score');
        this.addScore(100 * this.level);
        this.hitEffects.push({ x: d.x, y: d.y, timer: 0.3 });
        this.fallingDucks.push({ x: d.x, y: d.y, vy: 0, size: d.size });
        return false;
      }
      return true;
    });

    if (!hit) {
      this.hitEffects.push({ x, y, timer: 0.2, miss: true });
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, '#000033');
    skyGrad.addColorStop(1, '#001a4a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.groundY);

    // Moon
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.arc(this.width - 60, 50, 20, 0, Math.PI * 2);
    ctx.fill();

    // Trees
    this.trees.forEach(t => {
      this.drawPixelRect(ctx, t.x + 10, this.groundY - t.h, 10, t.h, '#1a4a1a');
      // Canopy
      this.drawPixelRect(ctx, t.x - 5, this.groundY - t.h - 20, 40, 25, '#0a3a0a');
      this.drawPixelRect(ctx, t.x, this.groundY - t.h - 35, 30, 20, '#0a3a0a');
    });

    // Ducks
    this.ducks.forEach(d => {
      const wingUp = Math.sin(d.flap) > 0;
      const color = d.escapeTimer <= 1 ? '#ff0040' : '#00ff41';
      // Body
      this.drawPixelRect(ctx, d.x - 8, d.y - 4, 16, 10, color);
      // Head
      this.drawPixelRect(ctx, d.x + (d.vx > 0 ? 6 : -10), d.y - 6, 8, 8, color);
      // Beak
      this.drawPixelRect(ctx, d.x + (d.vx > 0 ? 12 : -14), d.y - 4, 6, 3, '#ff8800');
      // Eye
      this.drawPixelRect(ctx, d.x + (d.vx > 0 ? 8 : -6), d.y - 5, 2, 2, '#ffffff');
      // Wings
      if (wingUp) {
        this.drawPixelRect(ctx, d.x - 6, d.y - 12, 12, 8, color);
      } else {
        this.drawPixelRect(ctx, d.x - 6, d.y + 4, 12, 8, color);
      }
    });

    // Falling ducks
    this.fallingDucks.forEach(d => {
      this.drawPixelRect(ctx, d.x - 8, d.y - 5, 16, 10, '#ff8800');
      this.drawText(ctx, 'X', d.x, d.y + 3, 12, '#ff0040', 'center');
    });

    // Ground
    this.drawRect(ctx, 0, this.groundY, this.width, this.height - this.groundY, '#0a3a0a');
    // Grass tufts
    this.grass.forEach(g => {
      this.drawPixelRect(ctx, g.x, this.groundY - g.h / 2, 3, g.h / 2, '#00ff41');
      this.drawPixelRect(ctx, g.x + 4, this.groundY - g.h / 3, 3, g.h / 3, '#00ff41');
    });

    // Hit effects
    this.hitEffects.forEach(e => {
      if (e.miss) {
        this.drawText(ctx, 'MISS', e.x, e.y, 14, '#ff0040', 'center');
      } else {
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const dist = (0.3 - e.timer) * 80;
          ctx.fillStyle = '#ffe600';
          ctx.fillRect(e.x + Math.cos(angle) * dist - 2, e.y + Math.sin(angle) * dist - 2, 4, 4);
        }
      }
    });

    // Crosshair
    ctx.strokeStyle = '#ff0040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.crossX, this.crossY, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.crossX - 20, this.crossY);
    ctx.lineTo(this.crossX - 8, this.crossY);
    ctx.moveTo(this.crossX + 8, this.crossY);
    ctx.lineTo(this.crossX + 20, this.crossY);
    ctx.moveTo(this.crossX, this.crossY - 20);
    ctx.lineTo(this.crossX, this.crossY - 8);
    ctx.moveTo(this.crossX, this.crossY + 8);
    ctx.lineTo(this.crossX, this.crossY + 20);
    ctx.stroke();

    // HUD
    this.drawText(ctx, `ROUND ${this.level}`, this.width / 2, 20, 14, '#ffe600', 'center');

    // Shots remaining
    for (let i = 0; i < this.shots; i++) {
      this.drawPixelRect(ctx, 10 + i * 12, this.height - 20, 8, 16, '#ff8800');
    }

    // Duck count
    const duckBar = this.width - 120;
    for (let i = 0; i < this.ducksPerRound; i++) {
      const color = i < this.ducksHit ? '#00ff41' : (i < this.ducksHit + this.ducksMissed ? '#ff0040' : '#333333');
      this.drawPixelRect(ctx, duckBar + i * 12, this.height - 16, 8, 8, color);
    }

    // Lives
    this.drawText(ctx, `♥${this.lives}`, 10, 20, 14, '#ff0040', 'left');

    if (this.roundComplete) {
      this.drawText(ctx, `ROUND ${this.level} CLEAR!`, this.width / 2, this.height / 2, 20, '#00ff41', 'center');
      this.drawText(ctx, `${this.ducksHit}/${this.ducksPerRound} DUCKS`, this.width / 2, this.height / 2 + 25, 14, '#ffe600', 'center');
    }
  }

  onInput(action) {
    if (action === 'LEFT') this.crossDir.x = -1;
    else if (action === 'RIGHT') this.crossDir.x = 1;
    else if (action === 'UP') this.crossDir.y = -1;
    else if (action === 'DOWN') this.crossDir.y = 1;
    else if (action === 'A') this.shoot(this.crossX, this.crossY);
    else if (action === 'RELEASE') this.crossDir = { x: 0, y: 0 };
  }

  onTap(x, y) {
    this.crossX = x;
    this.crossY = y;
    this.shoot(x, y);
  }
}
