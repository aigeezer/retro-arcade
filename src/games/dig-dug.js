import { GameEngine } from '../engine/GameEngine.js';

export class DigDugGame extends GameEngine {
  init() {
    this.cellSize = 20;
    this.cols = Math.floor(this.width / this.cellSize);
    this.rows = Math.floor((this.height - 40) / this.cellSize);
    this.offsetY = 35;

    // Grid: 0=dug, 1=dirt
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = (r < 2) ? 0 : 1;
      }
    }

    // Player
    this.playerCol = Math.floor(this.cols / 2);
    this.playerRow = 1;
    this.playerX = this.playerCol * this.cellSize + this.cellSize / 2;
    this.playerY = this.offsetY + this.playerRow * this.cellSize + this.cellSize / 2;
    this.playerSpeed = 100;
    this.moveDir = { x: 0, y: 0 };
    this.facingDir = { x: 1, y: 0 };
    this.digging = false;

    // Pump (weapon)
    this.pumping = false;
    this.pumpTarget = null;
    this.pumpExtend = 0;
    this.pumpMaxExtend = 60;

    // Enemies
    this.enemies = [];
    this.spawnEnemies();

    // Rocks
    this.rocks = [];
    this.spawnRocks();

    this.lives = 3;
  }

  spawnEnemies() {
    this.enemies = [];
    const count = 3 + this.level;
    for (let i = 0; i < count; i++) {
      let er, ec;
      do {
        er = 3 + Math.floor(Math.random() * (this.rows - 4));
        ec = 1 + Math.floor(Math.random() * (this.cols - 2));
      } while (Math.abs(ec - this.playerCol) < 3 && Math.abs(er - this.playerRow) < 3);

      // Clear space for enemy
      this.grid[er][ec] = 0;

      this.enemies.push({
        x: ec * this.cellSize + this.cellSize / 2,
        y: this.offsetY + er * this.cellSize + this.cellSize / 2,
        speed: 40 + this.level * 5,
        dir: { x: [1, -1][i % 2], y: 0 },
        type: i < count / 2 ? 'pooka' : 'fygar',
        inflateLevel: 0,
        inflateTimer: 0,
        changeTimer: 1 + Math.random() * 2,
        ghostMode: false,
        ghostTimer: 5 + Math.random() * 5,
        size: this.cellSize - 4,
        alive: true
      });
    }
  }

  spawnRocks() {
    this.rocks = [];
    for (let i = 0; i < 3; i++) {
      const rc = 2 + Math.floor(Math.random() * (this.cols - 4));
      const rr = 2 + Math.floor(Math.random() * 3);
      this.rocks.push({
        x: rc * this.cellSize,
        y: this.offsetY + rr * this.cellSize,
        falling: false,
        fallSpeed: 0,
        settled: false,
        w: this.cellSize,
        h: this.cellSize
      });
    }
  }

  getGridPos(px, py) {
    return {
      c: Math.floor(px / this.cellSize),
      r: Math.floor((py - this.offsetY) / this.cellSize)
    };
  }

  update(dt) {
    // Player movement
    if (this.moveDir.x !== 0 || this.moveDir.y !== 0) {
      this.facingDir = { ...this.moveDir };
      const newX = this.playerX + this.moveDir.x * this.playerSpeed * dt;
      const newY = this.playerY + this.moveDir.y * this.playerSpeed * dt;

      const pos = this.getGridPos(newX, newY);
      if (pos.c >= 0 && pos.c < this.cols && pos.r >= 0 && pos.r < this.rows) {
        this.playerX = newX;
        this.playerY = newY;
        this.playerX = Math.max(this.cellSize / 2, Math.min(this.width - this.cellSize / 2, this.playerX));
        this.playerY = Math.max(this.offsetY + this.cellSize / 2, Math.min(this.offsetY + (this.rows - 0.5) * this.cellSize, this.playerY));

        // Dig
        if (this.grid[pos.r] && this.grid[pos.r][pos.c] === 1) {
          this.grid[pos.r][pos.c] = 0;
          this.addScore(1);
        }
      }
    }

    // Pump mechanic
    if (this.pumping) {
      this.pumpExtend += 150 * dt;
      const pumpEndX = this.playerX + this.facingDir.x * this.pumpExtend;
      const pumpEndY = this.playerY + this.facingDir.y * this.pumpExtend;

      // Check pump hit enemies
      if (!this.pumpTarget) {
        for (const e of this.enemies) {
          if (e.alive && Math.abs(pumpEndX - e.x) < this.cellSize &&
              Math.abs(pumpEndY - e.y) < this.cellSize) {
            this.pumpTarget = e;
            break;
          }
        }
      }

      if (this.pumpTarget && this.pumpTarget.alive) {
        this.pumpTarget.inflateLevel += dt * 2;
        if (this.pumpTarget.inflateLevel >= 4) {
          this.pumpTarget.alive = false;
          if (this.options?.sound) this.options.sound.play('score');
          const depth = this.getGridPos(this.pumpTarget.x, this.pumpTarget.y).r;
          this.addScore((depth + 1) * 100);
          this.pumping = false;
          this.pumpTarget = null;
          this.pumpExtend = 0;
        }
      }

      if (this.pumpExtend > this.pumpMaxExtend && !this.pumpTarget) {
        this.pumping = false;
        this.pumpExtend = 0;
      }
    } else {
      this.pumpExtend = Math.max(0, this.pumpExtend - 200 * dt);
    }

    // Enemy deflation
    this.enemies.forEach(e => {
      if (e.alive && e !== this.pumpTarget && e.inflateLevel > 0) {
        e.inflateLevel -= dt;
        if (e.inflateLevel < 0) e.inflateLevel = 0;
      }
    });

    // Enemy movement
    this.enemies.filter(e => e.alive && e.inflateLevel < 1).forEach(e => {
      e.changeTimer -= dt;
      e.ghostTimer -= dt;

      if (e.ghostTimer <= 0 && !e.ghostMode) {
        e.ghostMode = true;
        e.ghostTimer = 3;
      }
      if (e.ghostMode && e.ghostTimer <= 0) {
        e.ghostMode = false;
        e.ghostTimer = 5 + Math.random() * 5;
      }

      if (e.ghostMode) {
        // Move through dirt toward player
        const dx = this.playerX - e.x;
        const dy = this.playerY - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        e.x += (dx / dist) * e.speed * 0.7 * dt;
        e.y += (dy / dist) * e.speed * 0.7 * dt;
      } else {
        // Move in tunnels only
        const pos = this.getGridPos(e.x + e.dir.x * e.speed * dt, e.y + e.dir.y * e.speed * dt);
        if (pos.c >= 0 && pos.c < this.cols && pos.r >= 0 && pos.r < this.rows && this.grid[pos.r][pos.c] === 0) {
          e.x += e.dir.x * e.speed * dt;
          e.y += e.dir.y * e.speed * dt;
        } else {
          e.changeTimer = 0;
        }

        if (e.changeTimer <= 0) {
          const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
          const pos = this.getGridPos(e.x, e.y);
          const valid = dirs.filter(d => {
            const nr = pos.r + d.y;
            const nc = pos.c + d.x;
            return nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc] === 0;
          });
          if (valid.length > 0) e.dir = valid[Math.floor(Math.random() * valid.length)];
          e.changeTimer = 1 + Math.random() * 2;
        }
      }

      // Enemy-player collision
      if (Math.abs(e.x - this.playerX) < this.cellSize * 0.8 &&
          Math.abs(e.y - this.playerY) < this.cellSize * 0.8) {
        if (this.options?.sound) this.options.sound.play('die');
        this.lives--;
        if (this.lives <= 0) this.triggerGameOver();
        else {
          this.playerX = this.playerCol * this.cellSize + this.cellSize / 2;
          this.playerY = this.offsetY + this.cellSize + this.cellSize / 2;
        }
      }
    });

    // Rocks
    this.rocks.forEach(rock => {
      if (rock.settled) return;
      const below = this.getGridPos(rock.x + rock.w / 2, rock.y + rock.h + 2);
      if (below.r < this.rows && this.grid[below.r] && this.grid[below.r][below.c] === 0) {
        if (!rock.falling && this.options?.sound) this.options.sound.play('drop');
        rock.falling = true;
      }

      if (rock.falling) {
        rock.fallSpeed += 300 * dt;
        rock.y += rock.fallSpeed * dt;

        // Hit enemies
        this.enemies.forEach(e => {
          if (e.alive && Math.abs(e.x - (rock.x + rock.w / 2)) < this.cellSize &&
              Math.abs(e.y - (rock.y + rock.h / 2)) < this.cellSize) {
            e.alive = false;
            this.addScore(500);
          }
        });

        // Hit player
        if (Math.abs(this.playerX - (rock.x + rock.w / 2)) < this.cellSize &&
            Math.abs(this.playerY - (rock.y + rock.h / 2)) < this.cellSize) {
          this.lives--;
          if (this.lives <= 0) this.triggerGameOver();
        }

        // Land
        const rockPos = this.getGridPos(rock.x + rock.w / 2, rock.y + rock.h);
        if (rockPos.r >= this.rows - 1 ||
            (this.grid[rockPos.r] && this.grid[rockPos.r][rockPos.c] === 1)) {
          rock.settled = true;
          rock.falling = false;
        }
      }
    });

    // Level complete
    if (this.enemies.filter(e => e.alive).length === 0) {
      this.level++;
      this.grid = [];
      for (let r = 0; r < this.rows; r++) {
        this.grid[r] = [];
        for (let c = 0; c < this.cols; c++) {
          this.grid[r][c] = (r < 2) ? 0 : 1;
        }
      }
      this.spawnEnemies();
      this.spawnRocks();
      this.playerX = this.playerCol * this.cellSize + this.cellSize / 2;
      this.playerY = this.offsetY + this.playerRow * this.cellSize + this.cellSize / 2;
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Sky
    this.drawRect(ctx, 0, this.offsetY, this.width, this.cellSize * 2, '#001a33');

    // Dirt layers
    const layerColors = ['#8B4513', '#7a3b10', '#693210', '#582a0d', '#4a220a'];
    for (let r = 2; r < this.rows; r++) {
      const layerIdx = Math.min(Math.floor((r - 2) / 4), layerColors.length - 1);
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.cellSize;
        const y = this.offsetY + r * this.cellSize;
        if (this.grid[r][c] === 1) {
          this.drawRect(ctx, x, y, this.cellSize, this.cellSize, layerColors[layerIdx]);
          // Dirt texture
          if ((r + c) % 3 === 0) {
            this.drawPixelRect(ctx, x + 4, y + 4, 3, 3, '#5a2a0a');
          }
        } else {
          this.drawRect(ctx, x, y, this.cellSize, this.cellSize, '#0a0a0a');
        }
      }
    }

    // Rocks
    this.rocks.filter(r => !r.settled || true).forEach(rock => {
      this.drawPixelRect(ctx, rock.x + 1, rock.y + 1, rock.w - 2, rock.h - 2, '#888888', '#aaaaaa');
      this.drawPixelRect(ctx, rock.x + 4, rock.y + 3, rock.w / 3, rock.h / 3, '#666666');
    });

    // Pump line
    if (this.pumpExtend > 0) {
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.playerX, this.playerY);
      ctx.lineTo(
        this.playerX + this.facingDir.x * this.pumpExtend,
        this.playerY + this.facingDir.y * this.pumpExtend
      );
      ctx.stroke();
      // Pump end
      this.drawPixelRect(ctx,
        this.playerX + this.facingDir.x * this.pumpExtend - 3,
        this.playerY + this.facingDir.y * this.pumpExtend - 3,
        6, 6, '#ffe600');
    }

    // Enemies
    this.enemies.filter(e => e.alive).forEach(e => {
      const inflate = 1 + e.inflateLevel * 0.3;
      const s = e.size * inflate;

      if (e.type === 'pooka') {
        // Red round enemy
        const color = e.ghostMode ? 'rgba(255,0,64,0.5)' : '#ff0040';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, s / 2, 0, Math.PI * 2);
        ctx.fill();
        // Goggles
        this.drawPixelRect(ctx, e.x - 6, e.y - 4, 5, 4, '#ffe600');
        this.drawPixelRect(ctx, e.x + 1, e.y - 4, 5, 4, '#ffe600');
      } else {
        // Fygar (dragon)
        const color = e.ghostMode ? 'rgba(0,255,65,0.5)' : '#00ff41';
        this.drawPixelRect(ctx, e.x - s / 2, e.y - s / 3, s, s * 0.6, color);
        // Mouth
        this.drawPixelRect(ctx, e.x + s / 2 - 2, e.y - 2, 6, 4, '#ff8800');
        // Eye
        this.drawPixelRect(ctx, e.x - 2, e.y - s / 3 + 2, 3, 3, '#ff0040');
      }
    });

    // Player
    this.drawPixelRect(ctx, this.playerX - 7, this.playerY - 8, 14, 16, '#4488ff');
    this.drawPixelRect(ctx, this.playerX - 4, this.playerY - 10, 8, 5, '#ffe600'); // helmet
    this.drawPixelRect(ctx, this.playerX - 3, this.playerY - 4, 6, 4, '#ffe600'); // face
    // Pump
    this.drawPixelRect(ctx,
      this.playerX + this.facingDir.x * 8 - 2,
      this.playerY + this.facingDir.y * 8 - 2,
      4, 4, '#ffffff');

    // HUD
    for (let i = 0; i < this.lives; i++) {
      this.drawPixelRect(ctx, 10 + i * 16, 10, 10, 14, '#4488ff');
    }
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, 20, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') { this.moveDir = { x: -1, y: 0 }; this.pumping = false; this.pumpTarget = null; }
    else if (action === 'RIGHT') { this.moveDir = { x: 1, y: 0 }; this.pumping = false; this.pumpTarget = null; }
    else if (action === 'UP') { this.moveDir = { x: 0, y: -1 }; this.pumping = false; this.pumpTarget = null; }
    else if (action === 'DOWN') { this.moveDir = { x: 0, y: 1 }; this.pumping = false; this.pumpTarget = null; }
    else if (action === 'A') { this.pumping = true; this.moveDir = { x: 0, y: 0 }; this.pumpExtend = 0; if (this.options?.sound) this.options.sound.play('blip'); }
    else if (action === 'RELEASE') { this.moveDir = { x: 0, y: 0 }; this.pumping = false; this.pumpTarget = null; }
  }

  onTap(x, y) {
    const dx = x - this.playerX;
    const dy = y - this.playerY;
    if (Math.abs(dx) < this.cellSize && Math.abs(dy) < this.cellSize) {
      // Tap near player = pump
      this.pumping = true;
      this.moveDir = { x: 0, y: 0 };
      this.pumpExtend = 0;
    } else if (Math.abs(dx) > Math.abs(dy)) {
      this.moveDir = { x: dx > 0 ? 1 : -1, y: 0 };
      this.pumping = false;
    } else {
      this.moveDir = { x: 0, y: dy > 0 ? 1 : -1 };
      this.pumping = false;
    }
  }
}
