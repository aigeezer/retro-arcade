import { GameEngine } from '../engine/GameEngine.js';

export class CentipedeGame extends GameEngine {
  init() {
    this.gridSize = 16;
    this.cols = Math.floor(this.width / this.gridSize);
    this.rows = Math.floor(this.height / this.gridSize);

    // Player
    this.playerX = this.width / 2;
    this.playerY = this.height - 30;
    this.playerW = 14;
    this.playerH = 14;
    this.playerSpeed = 200;
    this.moveDir = { x: 0, y: 0 };
    this.targetPos = null;

    // Bullets
    this.bullets = [];
    this.bulletSpeed = 400;
    this.bulletCooldown = 0;
    this.autoShoot = true;

    // Mushrooms
    this.mushrooms = {};
    this.spawnMushrooms();

    // Centipede
    this.segments = [];
    this.spawnCentipede();

    // Spider
    this.spider = null;
    this.spiderTimer = 5;

    this.lives = 3;
  }

  mushKey(c, r) { return `${c},${r}`; }

  spawnMushrooms() {
    this.mushrooms = {};
    const count = 15 + this.level * 5;
    for (let i = 0; i < count; i++) {
      const c = Math.floor(Math.random() * this.cols);
      const r = 2 + Math.floor(Math.random() * (this.rows - 6));
      const key = this.mushKey(c, r);
      if (!this.mushrooms[key]) {
        this.mushrooms[key] = { health: 4, c, r };
      }
    }
  }

  spawnCentipede() {
    this.segments = [];
    const len = 8 + this.level * 2;
    for (let i = 0; i < len; i++) {
      this.segments.push({
        x: this.width / 2 - i * this.gridSize,
        y: 0,
        dir: 1,
        dropping: false,
        dropTarget: 0,
        isHead: i === 0,
        speed: 80 + this.level * 15
      });
    }
  }

  update(dt) {
    // Player movement
    if (this.targetPos) {
      const dx = this.targetPos.x - this.playerX;
      const dy = this.targetPos.y - this.playerY;
      if (Math.abs(dx) > 3) this.playerX += Math.sign(dx) * this.playerSpeed * dt;
      if (Math.abs(dy) > 3) this.playerY += Math.sign(dy) * this.playerSpeed * dt;
    } else {
      this.playerX += this.moveDir.x * this.playerSpeed * dt;
      this.playerY += this.moveDir.y * this.playerSpeed * dt;
    }
    this.playerX = Math.max(0, Math.min(this.width - this.playerW, this.playerX));
    this.playerY = Math.max(this.height * 0.6, Math.min(this.height - this.playerH, this.playerY));

    // Auto-shoot
    this.bulletCooldown -= dt;
    if (this.autoShoot && this.bulletCooldown <= 0) {
      this.bullets.push({ x: this.playerX + this.playerW / 2 - 2, y: this.playerY, w: 4, h: 8 });
      this.bulletCooldown = 0.12;
    }

    // Update bullets
    this.bullets = this.bullets.filter(b => {
      b.y -= this.bulletSpeed * dt;
      return b.y > -10;
    });

    // Bullet-mushroom collision
    this.bullets.forEach(b => {
      const mc = Math.floor(b.x / this.gridSize);
      const mr = Math.floor(b.y / this.gridSize);
      const key = this.mushKey(mc, mr);
      if (this.mushrooms[key]) {
        this.mushrooms[key].health--;
        if (this.mushrooms[key].health <= 0) {
          delete this.mushrooms[key];
          this.addScore(1);
        }
        b.y = -999;
      }
    });

    // Centipede movement
    this.segments.forEach(seg => {
      if (seg.dropping) {
        seg.y += seg.speed * 2 * dt;
        if (seg.y >= seg.dropTarget) {
          seg.y = seg.dropTarget;
          seg.dropping = false;
          seg.dir = -seg.dir;
        }
        return;
      }

      seg.x += seg.dir * seg.speed * dt;

      // Check wall or mushroom collision
      const gc = Math.floor(seg.x / this.gridSize);
      const gr = Math.floor(seg.y / this.gridSize);
      const nextC = gc + seg.dir;
      const nextKey = this.mushKey(nextC, gr);
      const hitWall = seg.x <= 0 || seg.x >= this.width - this.gridSize;
      const hitMush = this.mushrooms[nextKey];

      if (hitWall || hitMush) {
        seg.dropping = true;
        seg.dropTarget = seg.y + this.gridSize;
        if (seg.x <= 0) seg.x = 0;
        if (seg.x >= this.width - this.gridSize) seg.x = this.width - this.gridSize;
      }
    });

    // Bullet-segment collision
    this.segments = this.segments.filter(seg => {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (b.x < seg.x + this.gridSize && b.x + b.w > seg.x &&
            b.y < seg.y + this.gridSize && b.y + b.h > seg.y) {
          this.bullets.splice(i, 1);
          // Drop mushroom where segment died
          const mc = Math.floor(seg.x / this.gridSize);
          const mr = Math.floor(seg.y / this.gridSize);
          this.mushrooms[this.mushKey(mc, mr)] = { health: 4, c: mc, r: mr };
          this.addScore(seg.isHead ? 100 : 10);
          return false;
        }
      }
      return true;
    });

    // Segment-player collision
    for (const seg of this.segments) {
      if (Math.abs(seg.x - this.playerX) < this.gridSize &&
          Math.abs(seg.y - this.playerY) < this.gridSize) {
        this.lives--;
        if (this.lives <= 0) { this.triggerGameOver(); return; }
        this.playerX = this.width / 2;
        this.playerY = this.height - 30;
        break;
      }
    }

    // Spider
    this.spiderTimer -= dt;
    if (!this.spider && this.spiderTimer <= 0) {
      this.spider = {
        x: Math.random() > 0.5 ? -20 : this.width + 20,
        y: this.height * 0.6 + Math.random() * (this.height * 0.3),
        vx: (Math.random() > 0.5 ? 1 : -1) * (100 + this.level * 20),
        vy: 0,
        changeTimer: 0
      };
    }

    if (this.spider) {
      this.spider.x += this.spider.vx * dt;
      this.spider.y += this.spider.vy * dt;
      this.spider.changeTimer -= dt;
      if (this.spider.changeTimer <= 0) {
        this.spider.vy = (Math.random() - 0.5) * 200;
        this.spider.changeTimer = 0.3 + Math.random() * 0.5;
      }
      this.spider.y = Math.max(this.height * 0.5, Math.min(this.height - 20, this.spider.y));

      // Remove mushrooms near spider
      const sc = Math.floor(this.spider.x / this.gridSize);
      const sr = Math.floor(this.spider.y / this.gridSize);
      delete this.mushrooms[this.mushKey(sc, sr)];

      // Spider-player collision
      if (Math.abs(this.spider.x - this.playerX) < 15 &&
          Math.abs(this.spider.y - this.playerY) < 15) {
        this.lives--;
        if (this.lives <= 0) { this.triggerGameOver(); return; }
        this.spider = null;
        this.spiderTimer = 3;
      }

      // Spider-bullet collision
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (this.spider && Math.abs(b.x - this.spider.x) < 12 && Math.abs(b.y - this.spider.y) < 12) {
          this.bullets.splice(i, 1);
          this.addScore(600);
          this.spider = null;
          this.spiderTimer = 5;
        }
      }

      if (this.spider && (this.spider.x < -40 || this.spider.x > this.width + 40)) {
        this.spider = null;
        this.spiderTimer = 4;
      }
    }

    // Level complete
    if (this.segments.length === 0) {
      this.level++;
      this.spawnCentipede();
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Mushrooms
    Object.values(this.mushrooms).forEach(m => {
      const x = m.c * this.gridSize;
      const y = m.r * this.gridSize;
      const alpha = m.health / 4;
      const colors = ['#ff0040', '#ff8800', '#ffe600', '#00ff41'];
      const color = colors[m.health - 1] || '#00ff41';
      this.drawPixelRect(ctx, x + 2, y + 4, this.gridSize - 4, this.gridSize - 6, color);
      this.drawPixelRect(ctx, x + 4, y + 2, this.gridSize - 8, 4, color);
    });

    // Centipede segments
    this.segments.forEach((seg, i) => {
      const color = seg.isHead ? '#ff0040' : '#00ff41';
      this.drawPixelRect(ctx, seg.x + 1, seg.y + 1, this.gridSize - 2, this.gridSize - 2, color);
      // Eyes on head
      if (seg.isHead) {
        this.drawPixelRect(ctx, seg.x + 3, seg.y + 3, 3, 3, '#ffffff');
        this.drawPixelRect(ctx, seg.x + this.gridSize - 6, seg.y + 3, 3, 3, '#ffffff');
      }
    });

    // Spider
    if (this.spider) {
      this.drawPixelRect(ctx, this.spider.x - 6, this.spider.y - 4, 12, 8, '#ff00ff');
      this.drawPixelRect(ctx, this.spider.x - 8, this.spider.y - 2, 4, 4, '#ff00ff');
      this.drawPixelRect(ctx, this.spider.x + 4, this.spider.y - 2, 4, 4, '#ff00ff');
      this.drawPixelRect(ctx, this.spider.x - 3, this.spider.y + 4, 2, 4, '#ff00ff');
      this.drawPixelRect(ctx, this.spider.x + 1, this.spider.y + 4, 2, 4, '#ff00ff');
    }

    // Player
    this.drawPixelRect(ctx, this.playerX, this.playerY, this.playerW, this.playerH, '#00fff2', '#00fff2');
    this.drawPixelRect(ctx, this.playerX + this.playerW / 2 - 2, this.playerY - 4, 4, 6, '#00fff2');

    // Bullets
    this.bullets.forEach(b => {
      this.drawPixelRect(ctx, b.x, b.y, b.w, b.h, '#ffe600');
    });

    // Lives
    for (let i = 0; i < this.lives; i++) {
      this.drawPixelRect(ctx, 10 + i * 16, this.height - 14, 10, 10, '#00fff2');
    }
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, this.height - 10, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') this.moveDir = { x: -1, y: 0 };
    else if (action === 'RIGHT') this.moveDir = { x: 1, y: 0 };
    else if (action === 'UP') this.moveDir = { x: 0, y: -1 };
    else if (action === 'DOWN') this.moveDir = { x: 0, y: 1 };
    else if (action === 'RELEASE') { this.moveDir = { x: 0, y: 0 }; this.targetPos = null; }
  }

  onTap(x, y) {
    this.targetPos = { x, y };
  }
}
