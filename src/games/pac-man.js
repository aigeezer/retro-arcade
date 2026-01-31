import { GameEngine } from '../engine/GameEngine.js';

export class PacManGame extends GameEngine {
  init() {
    this.cellSize = 20;
    this.cols = Math.floor(this.width / this.cellSize);
    this.rows = Math.floor((this.height - 60) / this.cellSize);
    this.offsetX = (this.width - this.cols * this.cellSize) / 2;
    this.offsetY = 40;

    this.dir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };
    this.playerSpeed = 100;
    this.mouthAngle = 0;
    this.mouthDir = 1;

    this.ghosts = [];
    this.ghostSpeed = 60;
    this.powerMode = false;
    this.powerTimer = 0;

    this.lives = 3;
    this.dotsEaten = 0;
    this.totalDots = 0;

    this.buildMaze();
    this.spawnGhosts();
  }

  buildMaze() {
    this.maze = [];
    for (let r = 0; r < this.rows; r++) {
      this.maze[r] = [];
      for (let c = 0; c < this.cols; c++) {
        // Border walls
        if (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1) {
          this.maze[r][c] = 1; // wall
        }
        // Internal walls pattern
        else if ((r % 4 === 2) && (c % 4 === 2) && c < this.cols - 2 && r < this.rows - 2) {
          this.maze[r][c] = 1;
          if (c + 1 < this.cols - 1) this.maze[r][c + 1] = 1;
        }
        // Power pellets in corners
        else if ((r === 2 && c === 2) || (r === 2 && c === this.cols - 3) ||
                 (r === this.rows - 3 && c === 2) || (r === this.rows - 3 && c === this.cols - 3)) {
          this.maze[r][c] = 3; // power pellet
        }
        else {
          this.maze[r][c] = 2; // dot
        }
      }
    }

    // Player start position (center bottom area)
    this.playerCol = Math.floor(this.cols / 2);
    this.playerRow = this.rows - 3;
    this.playerX = this.playerCol * this.cellSize + this.offsetX;
    this.playerY = this.playerRow * this.cellSize + this.offsetY;
    this.maze[this.playerRow][this.playerCol] = 0;

    // Clear area around player
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = this.playerRow + dr;
        const nc = this.playerCol + dc;
        if (nr > 0 && nr < this.rows - 1 && nc > 0 && nc < this.cols - 1) {
          if (this.maze[nr][nc] === 1) this.maze[nr][nc] = 2;
        }
      }
    }

    // Count dots
    this.totalDots = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.maze[r][c] === 2 || this.maze[r][c] === 3) this.totalDots++;
      }
    }
    this.dotsEaten = 0;
  }

  spawnGhosts() {
    const colors = ['#ff0040', '#00fff2', '#ff00ff', '#ff8800'];
    this.ghosts = [];
    const numGhosts = Math.min(2 + this.level, 6);
    for (let i = 0; i < numGhosts; i++) {
      let gr, gc;
      do {
        gr = 2 + Math.floor(Math.random() * (this.rows / 2));
        gc = 2 + Math.floor(Math.random() * (this.cols - 4));
      } while (this.maze[gr][gc] === 1);

      this.ghosts.push({
        x: gc * this.cellSize + this.offsetX,
        y: gr * this.cellSize + this.offsetY,
        color: colors[i % colors.length],
        dir: { x: [1, -1, 0, 0][i % 4], y: [0, 0, 1, -1][i % 4] },
        changeTimer: Math.random() * 2
      });
    }
  }

  getCell(px, py) {
    const c = Math.floor((px - this.offsetX + this.cellSize / 2) / this.cellSize);
    const r = Math.floor((py - this.offsetY + this.cellSize / 2) / this.cellSize);
    return { r, c };
  }

  canMove(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.maze[r][c] !== 1;
  }

  update(dt) {
    // Mouth animation
    this.mouthAngle += this.mouthDir * dt * 8;
    if (this.mouthAngle > 0.4) this.mouthDir = -1;
    if (this.mouthAngle < 0) this.mouthDir = 1;

    // Try direction change
    const cell = this.getCell(this.playerX, this.playerY);
    const nextR = cell.r + this.nextDir.y;
    const nextC = cell.c + this.nextDir.x;
    if (this.canMove(nextR, nextC)) {
      this.dir = { ...this.nextDir };
    }

    // Move player
    const tryR = cell.r + this.dir.y;
    const tryC = cell.c + this.dir.x;
    if (this.canMove(tryR, tryC)) {
      this.playerX += this.dir.x * this.playerSpeed * dt;
      this.playerY += this.dir.y * this.playerSpeed * dt;
    }

    // Collect dots
    const pCell = this.getCell(this.playerX, this.playerY);
    if (pCell.r >= 0 && pCell.r < this.rows && pCell.c >= 0 && pCell.c < this.cols) {
      const tile = this.maze[pCell.r][pCell.c];
      if (tile === 2) {
        this.maze[pCell.r][pCell.c] = 0;
        this.addScore(10);
        this.dotsEaten++;
      } else if (tile === 3) {
        this.maze[pCell.r][pCell.c] = 0;
        this.addScore(50);
        this.dotsEaten++;
        this.powerMode = true;
        this.powerTimer = 6;
      }
    }

    // Power mode timer
    if (this.powerMode) {
      this.powerTimer -= dt;
      if (this.powerTimer <= 0) this.powerMode = false;
    }

    // Level complete
    if (this.dotsEaten >= this.totalDots) {
      this.level++;
      this.buildMaze();
      this.spawnGhosts();
      this.dir = { x: 0, y: 0 };
      this.nextDir = { x: 0, y: 0 };
      return;
    }

    // Ghost movement
    const gSpeed = this.ghostSpeed + (this.level - 1) * 10;
    this.ghosts.forEach(g => {
      g.x += g.dir.x * gSpeed * dt;
      g.y += g.dir.y * gSpeed * dt;

      const gc = this.getCell(g.x, g.y);
      g.changeTimer -= dt;

      // Change direction at walls or randomly
      const ahead = this.canMove(gc.r + g.dir.y, gc.c + g.dir.x);
      if (!ahead || g.changeTimer <= 0) {
        const dirs = [
          { x: 1, y: 0 }, { x: -1, y: 0 },
          { x: 0, y: 1 }, { x: 0, y: -1 }
        ].filter(d => this.canMove(gc.r + d.y, gc.c + d.x));

        if (dirs.length > 0) {
          g.dir = dirs[Math.floor(Math.random() * dirs.length)];
        }
        g.changeTimer = 1 + Math.random() * 2;
      }

      // Ghost-player collision
      const dx = g.x - this.playerX;
      const dy = g.y - this.playerY;
      if (Math.sqrt(dx * dx + dy * dy) < this.cellSize * 0.8) {
        if (this.powerMode) {
          // Eat ghost
          g.x = Math.floor(this.cols / 2) * this.cellSize + this.offsetX;
          g.y = 3 * this.cellSize + this.offsetY;
          this.addScore(200);
        } else {
          this.lives--;
          if (this.lives <= 0) {
            this.triggerGameOver();
          } else {
            this.playerX = this.playerCol * this.cellSize + this.offsetX;
            this.playerY = this.playerRow * this.cellSize + this.offsetY;
            this.dir = { x: 0, y: 0 };
            this.nextDir = { x: 0, y: 0 };
          }
        }
      }
    });
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Draw maze
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.cellSize + this.offsetX;
        const y = r * this.cellSize + this.offsetY;
        const tile = this.maze[r][c];

        if (tile === 1) {
          this.drawPixelRect(ctx, x + 1, y + 1, this.cellSize - 2, this.cellSize - 2, '#1a1a4a', '#4488ff');
        } else if (tile === 2) {
          this.drawPixelRect(ctx, x + this.cellSize / 2 - 2, y + this.cellSize / 2 - 2, 4, 4, '#ffe600');
        } else if (tile === 3) {
          this.drawPixelRect(ctx, x + this.cellSize / 2 - 5, y + this.cellSize / 2 - 5, 10, 10, '#ffe600');
        }
      }
    }

    // Draw Pac-Man
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    const px = this.playerX + this.cellSize / 2;
    const py = this.playerY + this.cellSize / 2;
    const angle = Math.atan2(this.dir.y, this.dir.x);
    ctx.arc(px, py, this.cellSize / 2 - 2, angle + this.mouthAngle, angle + Math.PI * 2 - this.mouthAngle);
    ctx.lineTo(px, py);
    ctx.fill();

    // Draw ghosts
    this.ghosts.forEach(g => {
      const gx = g.x + this.cellSize / 2;
      const gy = g.y + this.cellSize / 2;
      const color = this.powerMode ? (this.powerTimer < 2 ? '#ffffff' : '#4488ff') : g.color;

      // Ghost body
      this.drawPixelRect(ctx, g.x + 2, g.y + 4, this.cellSize - 4, this.cellSize - 6, color);
      // Ghost head
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(gx, g.y + 6, this.cellSize / 2 - 2, Math.PI, 0);
      ctx.fill();
      // Eyes
      this.drawPixelRect(ctx, g.x + 5, g.y + 5, 4, 4, '#ffffff');
      this.drawPixelRect(ctx, g.x + this.cellSize - 9, g.y + 5, 4, 4, '#ffffff');
      this.drawPixelRect(ctx, g.x + 6, g.y + 6, 2, 2, '#0a0a0a');
      this.drawPixelRect(ctx, g.x + this.cellSize - 8, g.y + 6, 2, 2, '#0a0a0a');
    });

    // Lives
    for (let i = 0; i < this.lives; i++) {
      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      ctx.arc(15 + i * 20, this.height - 12, 6, 0.3, Math.PI * 2 - 0.3);
      ctx.lineTo(15 + i * 20, this.height - 12);
      ctx.fill();
    }

    // Power mode indicator
    if (this.powerMode) {
      this.drawText(ctx, `POWER ${Math.ceil(this.powerTimer)}s`, this.width / 2, 20, 12, '#4488ff', 'center');
    }

    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, this.height - 10, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') this.nextDir = { x: -1, y: 0 };
    else if (action === 'RIGHT') this.nextDir = { x: 1, y: 0 };
    else if (action === 'UP') this.nextDir = { x: 0, y: -1 };
    else if (action === 'DOWN') this.nextDir = { x: 0, y: 1 };
  }

  onTap(x, y) {
    const dx = x - this.playerX;
    const dy = y - this.playerY;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.nextDir = { x: dx > 0 ? 1 : -1, y: 0 };
    } else {
      this.nextDir = { x: 0, y: dy > 0 ? 1 : -1 };
    }
  }
}
