import { GameEngine } from '../engine/GameEngine.js';

export class BombermanGame extends GameEngine {
  init() {
    this.cellSize = 28;
    this.cols = Math.floor(this.width / this.cellSize);
    this.rows = Math.floor((this.height - 40) / this.cellSize);
    this.offsetY = 35;

    // Grid: 0=empty, 1=wall(indestructible), 2=brick(destructible), 3=powerup
    this.grid = [];
    this.buildLevel();

    // Player
    this.playerCol = 1;
    this.playerRow = 1;
    this.playerX = this.playerCol * this.cellSize + 2;
    this.playerY = this.offsetY + this.playerRow * this.cellSize + 2;
    this.playerSize = this.cellSize - 4;
    this.playerSpeed = 90;
    this.moveDir = { x: 0, y: 0 };

    // Bombs
    this.bombs = [];
    this.maxBombs = 1;
    this.bombRange = 2;
    this.explosions = [];

    // Enemies
    this.enemies = [];
    this.spawnEnemies();

    this.lives = 3;
  }

  buildLevel() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        if (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1) {
          this.grid[r][c] = 1; // border wall
        } else if (r % 2 === 0 && c % 2 === 0) {
          this.grid[r][c] = 1; // pillar
        } else if ((r <= 2 && c <= 2) || (r === 1 && c === 1)) {
          this.grid[r][c] = 0; // safe zone around player
        } else if (Math.random() < 0.4 + this.level * 0.03) {
          this.grid[r][c] = 2; // brick
        } else {
          this.grid[r][c] = 0;
        }
      }
    }
    // Ensure player start is clear
    this.grid[1][1] = 0;
    this.grid[1][2] = 0;
    this.grid[2][1] = 0;
  }

  spawnEnemies() {
    this.enemies = [];
    const count = 2 + this.level;
    for (let i = 0; i < count; i++) {
      let er, ec;
      do {
        er = 1 + Math.floor(Math.random() * (this.rows - 2));
        ec = 1 + Math.floor(Math.random() * (this.cols - 2));
      } while (this.grid[er][ec] !== 0 || (er <= 2 && ec <= 2));

      this.enemies.push({
        x: ec * this.cellSize + 4,
        y: this.offsetY + er * this.cellSize + 4,
        size: this.cellSize - 8,
        speed: 40 + this.level * 8,
        dir: { x: [1, -1, 0, 0][i % 4], y: [0, 0, 1, -1][i % 4] },
        changeTimer: 1 + Math.random() * 2,
        color: ['#ff0040', '#ff00ff', '#ff8800', '#00fff2'][i % 4]
      });
    }
  }

  getGridPos(px, py) {
    return {
      c: Math.floor(px / this.cellSize),
      r: Math.floor((py - this.offsetY) / this.cellSize)
    };
  }

  canWalk(c, r) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
    if (this.grid[r][c] === 1 || this.grid[r][c] === 2) return false;
    // Check bombs
    for (const b of this.bombs) {
      if (b.col === c && b.row === r) return false;
    }
    return true;
  }

  placeBomb() {
    if (this.bombs.length >= this.maxBombs) return;
    const pos = this.getGridPos(this.playerX + this.playerSize / 2, this.playerY + this.playerSize / 2);
    // Don't stack bombs
    if (this.bombs.some(b => b.col === pos.c && b.row === pos.r)) return;
    this.bombs.push({
      col: pos.c,
      row: pos.r,
      timer: 2.5,
      range: this.bombRange
    });
  }

  explode(bomb) {
    const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    dirs.forEach(([dc, dr]) => {
      for (let i = 0; i <= (dc === 0 && dr === 0 ? 0 : bomb.range); i++) {
        const ec = bomb.col + dc * i;
        const er = bomb.row + dr * i;
        if (ec < 0 || ec >= this.cols || er < 0 || er >= this.rows) break;
        if (this.grid[er][ec] === 1) break;

        this.explosions.push({
          x: ec * this.cellSize,
          y: this.offsetY + er * this.cellSize,
          w: this.cellSize,
          h: this.cellSize,
          timer: 0.4,
          col: ec,
          row: er
        });

        if (this.grid[er][ec] === 2) {
          this.grid[er][ec] = 0;
          this.addScore(10);
          // Random powerup
          if (Math.random() < 0.2) {
            this.grid[er][ec] = 3;
          }
          break;
        }
      }
    });
  }

  update(dt) {
    // Player movement (grid-aligned)
    const newX = this.playerX + this.moveDir.x * this.playerSpeed * dt;
    const newY = this.playerY + this.moveDir.y * this.playerSpeed * dt;

    // X movement
    const testPos = this.getGridPos(
      newX + (this.moveDir.x > 0 ? this.playerSize : 0),
      this.playerY + this.playerSize / 2
    );
    if (this.canWalk(testPos.c, testPos.r)) {
      this.playerX = Math.max(this.cellSize, Math.min((this.cols - 1) * this.cellSize - this.playerSize, newX));
    }

    // Y movement
    const testPosY = this.getGridPos(
      this.playerX + this.playerSize / 2,
      newY + (this.moveDir.y > 0 ? this.playerSize : 0)
    );
    if (this.canWalk(testPosY.c, testPosY.r)) {
      this.playerY = Math.max(this.offsetY + this.cellSize, Math.min(this.offsetY + (this.rows - 1) * this.cellSize - this.playerSize, newY));
    }

    // Powerup collection
    const pp = this.getGridPos(this.playerX + this.playerSize / 2, this.playerY + this.playerSize / 2);
    if (pp.r >= 0 && pp.r < this.rows && pp.c >= 0 && pp.c < this.cols && this.grid[pp.r][pp.c] === 3) {
      this.grid[pp.r][pp.c] = 0;
      if (Math.random() < 0.5) {
        this.maxBombs++;
      } else {
        this.bombRange++;
      }
      this.addScore(50);
    }

    // Bombs
    this.bombs = this.bombs.filter(b => {
      b.timer -= dt;
      if (b.timer <= 0) {
        this.explode(b);
        return false;
      }
      return true;
    });

    // Explosions
    this.explosions = this.explosions.filter(e => {
      e.timer -= dt;

      // Check player hit
      const pPos = this.getGridPos(this.playerX + this.playerSize / 2, this.playerY + this.playerSize / 2);
      if (pPos.c === e.col && pPos.r === e.row) {
        this.lives--;
        if (this.lives <= 0) this.triggerGameOver();
        else {
          this.playerX = this.cellSize + 2;
          this.playerY = this.offsetY + this.cellSize + 2;
        }
      }

      // Check enemy hit
      this.enemies = this.enemies.filter(en => {
        const ePos = this.getGridPos(en.x + en.size / 2, en.y + en.size / 2);
        if (ePos.c === e.col && ePos.r === e.row) {
          this.addScore(100);
          return false;
        }
        return true;
      });

      return e.timer > 0;
    });

    // Enemies
    this.enemies.forEach(en => {
      en.changeTimer -= dt;
      en.x += en.dir.x * en.speed * dt;
      en.y += en.dir.y * en.speed * dt;

      const ePos = this.getGridPos(en.x + en.size / 2 + en.dir.x * en.size / 2, en.y + en.size / 2 + en.dir.y * en.size / 2);
      if (!this.canWalk(ePos.c, ePos.r) || en.changeTimer <= 0) {
        const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
        const curPos = this.getGridPos(en.x + en.size / 2, en.y + en.size / 2);
        const valid = dirs.filter(d => {
          return this.canWalk(curPos.c + d.x, curPos.r + d.y);
        });
        if (valid.length > 0) en.dir = valid[Math.floor(Math.random() * valid.length)];
        en.changeTimer = 1 + Math.random() * 2;
      }

      // Enemy-player collision
      if (Math.abs(en.x - this.playerX) < this.cellSize * 0.7 &&
          Math.abs(en.y - this.playerY) < this.cellSize * 0.7) {
        this.lives--;
        if (this.lives <= 0) this.triggerGameOver();
        else {
          this.playerX = this.cellSize + 2;
          this.playerY = this.offsetY + this.cellSize + 2;
        }
      }
    });

    // Level complete
    if (this.enemies.length === 0) {
      this.level++;
      this.buildLevel();
      this.spawnEnemies();
      this.playerX = this.cellSize + 2;
      this.playerY = this.offsetY + this.cellSize + 2;
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Grid
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.cellSize;
        const y = this.offsetY + r * this.cellSize;
        const tile = this.grid[r][c];

        if (tile === 1) {
          this.drawPixelRect(ctx, x, y, this.cellSize, this.cellSize, '#444444', '#666666');
          // Brick pattern
          this.drawPixelRect(ctx, x + 2, y + 2, this.cellSize / 2 - 2, this.cellSize / 2 - 2, '#555555');
          this.drawPixelRect(ctx, x + this.cellSize / 2, y + this.cellSize / 2, this.cellSize / 2 - 2, this.cellSize / 2 - 2, '#555555');
        } else if (tile === 2) {
          this.drawPixelRect(ctx, x + 1, y + 1, this.cellSize - 2, this.cellSize - 2, '#8B4513', '#a0522d');
        } else if (tile === 3) {
          // Powerup
          this.drawPixelRect(ctx, x + 4, y + 4, this.cellSize - 8, this.cellSize - 8, '#ffe600', '#ff8800');
          this.drawText(ctx, 'P', x + this.cellSize / 2, y + this.cellSize / 2 + 4, 12, '#0a0a0a', 'center');
        } else {
          // Floor
          this.drawRect(ctx, x, y, this.cellSize, this.cellSize, '#0f0f0f');
        }
      }
    }

    // Bombs
    this.bombs.forEach(b => {
      const bx = b.col * this.cellSize;
      const by = this.offsetY + b.row * this.cellSize;
      const pulse = Math.sin(b.timer * 8) > 0;
      const color = pulse ? '#ffe600' : '#ff8800';
      this.drawPixelRect(ctx, bx + 4, by + 4, this.cellSize - 8, this.cellSize - 8, '#1a1a1a', color);
      // Fuse
      this.drawPixelRect(ctx, bx + this.cellSize / 2, by + 2, 2, 4, '#ff0040');
    });

    // Explosions
    this.explosions.forEach(e => {
      const alpha = e.timer / 0.4;
      ctx.globalAlpha = alpha;
      this.drawPixelRect(ctx, e.x + 2, e.y + 2, e.w - 4, e.h - 4, '#ff8800');
      this.drawPixelRect(ctx, e.x + 6, e.y + 6, e.w - 12, e.h - 12, '#ffe600');
      ctx.globalAlpha = 1;
    });

    // Enemies
    this.enemies.forEach(en => {
      this.drawPixelRect(ctx, en.x, en.y, en.size, en.size, en.color);
      // Eyes
      this.drawPixelRect(ctx, en.x + 3, en.y + 3, 4, 4, '#ffffff');
      this.drawPixelRect(ctx, en.x + en.size - 7, en.y + 3, 4, 4, '#ffffff');
      this.drawPixelRect(ctx, en.x + 4, en.y + 4, 2, 2, '#0a0a0a');
      this.drawPixelRect(ctx, en.x + en.size - 6, en.y + 4, 2, 2, '#0a0a0a');
    });

    // Player
    this.drawPixelRect(ctx, this.playerX, this.playerY, this.playerSize, this.playerSize, '#ffffff');
    this.drawPixelRect(ctx, this.playerX + 3, this.playerY + 3, 4, 3, '#0a0a0a');
    this.drawPixelRect(ctx, this.playerX + this.playerSize - 7, this.playerY + 3, 4, 3, '#0a0a0a');
    this.drawPixelRect(ctx, this.playerX + 2, this.playerY, this.playerSize - 4, 4, '#4488ff');

    // HUD
    for (let i = 0; i < this.lives; i++) {
      this.drawPixelRect(ctx, 10 + i * 16, 10, 10, 12, '#ffffff');
    }
    this.drawText(ctx, `BOMBS:${this.maxBombs} RNG:${this.bombRange}`, this.width / 2, 20, 10, '#ffe600', 'center');
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, 20, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') this.moveDir = { x: -1, y: 0 };
    else if (action === 'RIGHT') this.moveDir = { x: 1, y: 0 };
    else if (action === 'UP') this.moveDir = { x: 0, y: -1 };
    else if (action === 'DOWN') this.moveDir = { x: 0, y: 1 };
    else if (action === 'A' || action === 'B') this.placeBomb();
    else if (action === 'RELEASE') this.moveDir = { x: 0, y: 0 };
  }

  onTap(x, y) {
    const dx = x - (this.playerX + this.playerSize / 2);
    const dy = y - (this.playerY + this.playerSize / 2);
    if (Math.abs(dx) < this.cellSize && Math.abs(dy) < this.cellSize) {
      this.placeBomb();
    } else if (Math.abs(dx) > Math.abs(dy)) {
      this.moveDir = { x: dx > 0 ? 1 : -1, y: 0 };
    } else {
      this.moveDir = { x: 0, y: dy > 0 ? 1 : -1 };
    }
  }
}
