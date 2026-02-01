import { GameEngine } from '../engine/GameEngine.js';

export class PacManGame extends GameEngine {
  init() {
    this.cellSize = 14;

    // Classic 28x31 Pac-Man maze layout
    // 0=empty, 1=wall, 2=dot, 3=power pellet, 4=ghost house, 5=tunnel
    this.mazeTemplate = [
      '1111111111111111111111111111',
      '1222222222222112222222222221',
      '1211112111112112111121111121',
      '1311112111112112111121111131',
      '1211112111112112111121111121',
      '1222222222222222222222222221',
      '1211112112111111211211112121',
      '1211112112111111211211112121',
      '1222222112222112222112222221',
      '1111112111110110111121111121',
      '0000012111110110111121000000',
      '0000012110000000011211000000',
      '0000012110114411011211000000',
      '1111112110140041011211111111',
      '5000002000140041000200000005',
      '1111112110140041011211111111',
      '0000012110144441011211000000',
      '0000012110000000011211000000',
      '0000012110111111011211000000',
      '1111112110111111011211111111',
      '1222222222222112222222222221',
      '1211112111112112111121111121',
      '1211112111112112111121111121',
      '1322112222222002222221122231',
      '1112112112111111211211211121',
      '1112112112111111211211211121',
      '1222222212222112222122222221',
      '1211111111112112111111111121',
      '1211111111112112111111111121',
      '1222222222222222222222222221',
      '1111111111111111111111111111',
    ];

    this.cols = 28;
    this.rows = 31;
    this.offsetX = Math.floor((this.width - this.cols * this.cellSize) / 2);
    this.offsetY = Math.floor((this.height - this.rows * this.cellSize) / 2) + 10;

    this.dir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };
    this.playerSpeed = 80;
    this.mouthAngle = 0;
    this.mouthDir = 1;

    this.ghosts = [];
    this.ghostSpeed = 55;
    this.powerMode = false;
    this.powerTimer = 0;

    this.lives = 3;
    this.dotsEaten = 0;
    this.totalDots = 0;
    this.dotFlashTimer = 0;

    this.buildMaze();
    this.spawnPlayer();
    this.spawnGhosts();
  }

  buildMaze() {
    this.maze = [];
    this.totalDots = 0;
    this.dotsEaten = 0;

    for (let r = 0; r < this.rows; r++) {
      this.maze[r] = [];
      const row = this.mazeTemplate[r];
      for (let c = 0; c < this.cols; c++) {
        const ch = parseInt(row[c]);
        this.maze[r][c] = ch;
        if (ch === 2 || ch === 3) this.totalDots++;
      }
    }
  }

  spawnPlayer() {
    // Pac-Man starts below the ghost house
    this.playerCol = 13;
    this.playerRow = 23;
    this.playerX = this.playerCol * this.cellSize + this.offsetX;
    this.playerY = this.playerRow * this.cellSize + this.offsetY;
    this.dir = { x: -1, y: 0 };
    this.nextDir = { x: -1, y: 0 };
  }

  spawnGhosts() {
    // Classic ghost colors and names: Blinky(red), Pinky(pink), Inky(cyan), Clyde(orange)
    const ghostDefs = [
      { color: '#FF0000', name: 'blinky', startCol: 13, startRow: 11, dir: { x: -1, y: 0 } },
      { color: '#FFB8FF', name: 'pinky',  startCol: 13, startRow: 14, dir: { x: 0, y: -1 } },
      { color: '#00FFFF', name: 'inky',   startCol: 11, startRow: 14, dir: { x: 0, y: 1 } },
      { color: '#FFB852', name: 'clyde',  startCol: 15, startRow: 14, dir: { x: 0, y: -1 } },
    ];
    this.ghosts = [];
    const numGhosts = Math.min(2 + this.level, 4);
    for (let i = 0; i < numGhosts; i++) {
      const def = ghostDefs[i];
      this.ghosts.push({
        x: def.startCol * this.cellSize + this.offsetX,
        y: def.startRow * this.cellSize + this.offsetY,
        color: def.color,
        name: def.name,
        dir: { ...def.dir },
        changeTimer: 1 + Math.random() * 2,
        scatterMode: false,
      });
    }
  }

  getCell(px, py) {
    const c = Math.round((px - this.offsetX) / this.cellSize);
    const r = Math.round((py - this.offsetY) / this.cellSize);
    return { r, c };
  }

  canMove(r, c) {
    if (c < 0 || c >= this.cols) {
      // Tunnel wrap
      return true;
    }
    if (r < 0 || r >= this.rows) return false;
    const tile = this.maze[r][c];
    return tile !== 1;
  }

  isWalkable(r, c) {
    if (c < 0 || c >= this.cols) return true;
    if (r < 0 || r >= this.rows) return false;
    const tile = this.maze[r][c];
    return tile !== 1 && tile !== 4;
  }

  update(dt) {
    // Mouth animation
    this.mouthAngle += this.mouthDir * dt * 10;
    if (this.mouthAngle > 0.5) this.mouthDir = -1;
    if (this.mouthAngle < 0.05) this.mouthDir = 1;

    // Power pellet flash
    this.dotFlashTimer += dt;

    // Snap player to grid for direction changes
    const cell = this.getCell(this.playerX, this.playerY);

    // Align to cell center when close
    const cellCenterX = cell.c * this.cellSize + this.offsetX;
    const cellCenterY = cell.r * this.cellSize + this.offsetY;
    const distToCenter = Math.abs(this.playerX - cellCenterX) + Math.abs(this.playerY - cellCenterY);

    if (distToCenter < 6) {
      // At a cell center — try direction change
      const nextR = cell.r + this.nextDir.y;
      const nextC = cell.c + this.nextDir.x;
      if (this.canMove(nextR, nextC)) {
        this.dir = { ...this.nextDir };
        this.playerX = cellCenterX;
        this.playerY = cellCenterY;
      }
    }

    // Move player
    const tryR = cell.r + this.dir.y;
    const tryC = cell.c + this.dir.x;
    if (this.canMove(tryR, tryC)) {
      this.playerX += this.dir.x * this.playerSpeed * dt;
      this.playerY += this.dir.y * this.playerSpeed * dt;
    } else {
      // Snap to cell center when hitting a wall to prevent getting stuck
      this.playerX = cellCenterX;
      this.playerY = cellCenterY;
    }

    // Tunnel wrapping
    if (this.playerX < -this.cellSize + this.offsetX) {
      this.playerX = (this.cols - 1) * this.cellSize + this.offsetX;
    } else if (this.playerX > (this.cols - 1) * this.cellSize + this.offsetX + this.cellSize) {
      this.playerX = this.offsetX;
    }

    // Collect dots
    const pCell = this.getCell(this.playerX, this.playerY);
    if (pCell.r >= 0 && pCell.r < this.rows && pCell.c >= 0 && pCell.c < this.cols) {
      const tile = this.maze[pCell.r][pCell.c];
      if (tile === 2) {
        this.maze[pCell.r][pCell.c] = 0;
        if (this.options?.sound) this.options.sound.play('click');
        this.addScore(10);
        this.dotsEaten++;
      } else if (tile === 3) {
        this.maze[pCell.r][pCell.c] = 0;
        if (this.options?.sound) this.options.sound.play('powerup');
        this.addScore(50);
        this.dotsEaten++;
        this.powerMode = true;
        this.powerTimer = 8;
      }
    }

    // Power mode timer
    if (this.powerMode) {
      this.powerTimer -= dt;
      if (this.powerTimer <= 0) this.powerMode = false;
    }

    // Level complete
    if (this.dotsEaten >= this.totalDots) {
      if (this.options?.sound) this.options.sound.play('win');
      this.level++;
      this.buildMaze();
      this.spawnPlayer();
      this.spawnGhosts();
      return;
    }

    // Ghost movement
    const gSpeed = this.ghostSpeed + (this.level - 1) * 5;
    const frightenedSpeed = gSpeed * 0.5;
    this.ghosts.forEach(g => {
      const currentSpeed = this.powerMode ? frightenedSpeed : gSpeed;
      g.x += g.dir.x * currentSpeed * dt;
      g.y += g.dir.y * currentSpeed * dt;

      // Tunnel wrapping for ghosts
      if (g.x < -this.cellSize + this.offsetX) {
        g.x = (this.cols - 1) * this.cellSize + this.offsetX;
      } else if (g.x > (this.cols - 1) * this.cellSize + this.offsetX + this.cellSize) {
        g.x = this.offsetX;
      }

      const gc = this.getCell(g.x, g.y);
      g.changeTimer -= dt;

      const ahead = this.isWalkable(gc.r + g.dir.y, gc.c + g.dir.x);
      if (!ahead || g.changeTimer <= 0) {
        // Get available directions (excluding reverse unless stuck)
        const reverse = { x: -g.dir.x, y: -g.dir.y };
        let dirs = [
          { x: 1, y: 0 }, { x: -1, y: 0 },
          { x: 0, y: 1 }, { x: 0, y: -1 }
        ].filter(d => {
          if (d.x === reverse.x && d.y === reverse.y) return false;
          return this.isWalkable(gc.r + d.y, gc.c + d.x);
        });

        // If no non-reverse direction, allow reverse
        if (dirs.length === 0) {
          dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
            .filter(d => this.isWalkable(gc.r + d.y, gc.c + d.x));
        }

        if (dirs.length > 0) {
          if (this.powerMode) {
            // Frightened: random direction
            g.dir = dirs[Math.floor(Math.random() * dirs.length)];
          } else {
            // Chase: bias toward player
            const pCell2 = this.getCell(this.playerX, this.playerY);
            let best = dirs[0];
            let bestDist = Infinity;
            for (const d of dirs) {
              const nr = gc.r + d.y;
              const nc = gc.c + d.x;
              const dist = Math.abs(nr - pCell2.r) + Math.abs(nc - pCell2.c);
              if (dist < bestDist) {
                bestDist = dist;
                best = d;
              }
            }
            // Don't always pick optimal — some randomness
            g.dir = Math.random() < 0.7 ? best : dirs[Math.floor(Math.random() * dirs.length)];
          }
          // Snap ghost to grid
          g.x = gc.c * this.cellSize + this.offsetX;
          g.y = gc.r * this.cellSize + this.offsetY;
        }
        g.changeTimer = 0.3 + Math.random() * 0.5;
      }

      // Ghost-player collision
      const dx = g.x - this.playerX;
      const dy = g.y - this.playerY;
      if (Math.sqrt(dx * dx + dy * dy) < this.cellSize * 0.9) {
        if (this.powerMode) {
          // Eat ghost — send back to ghost house
          g.x = 13 * this.cellSize + this.offsetX;
          g.y = 14 * this.cellSize + this.offsetY;
          g.dir = { x: 0, y: -1 };
          if (this.options?.sound) this.options.sound.play('score');
          this.addScore(200);
        } else {
          if (this.options?.sound) this.options.sound.play('die');
          this.lives--;
          if (this.lives <= 0) {
            this.triggerGameOver();
          } else {
            this.spawnPlayer();
          }
        }
      }
    });
  }

  render(ctx) {
    // Dark blue background like the original
    this.clearCanvas(ctx, '#000000');

    const cs = this.cellSize;
    const halfCs = cs / 2;

    // Draw maze
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * cs + this.offsetX;
        const y = r * cs + this.offsetY;
        const tile = this.maze[r][c];

        if (tile === 1) {
          // Wall — draw with blue outline style like original
          ctx.fillStyle = '#0000AA';
          ctx.fillRect(x, y, cs, cs);

          // Draw inner border to create the maze wall look
          ctx.strokeStyle = '#2121DE';
          ctx.lineWidth = 1.5;

          // Only draw borders on sides that face non-wall tiles
          const top = r > 0 && this.maze[r-1][c] !== 1;
          const bottom = r < this.rows-1 && this.maze[r+1][c] !== 1;
          const left = c > 0 && this.maze[r][c-1] !== 1;
          const right = c < this.cols-1 && this.maze[r][c+1] !== 1;

          ctx.beginPath();
          if (top) { ctx.moveTo(x, y + 0.5); ctx.lineTo(x + cs, y + 0.5); }
          if (bottom) { ctx.moveTo(x, y + cs - 0.5); ctx.lineTo(x + cs, y + cs - 0.5); }
          if (left) { ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, y + cs); }
          if (right) { ctx.moveTo(x + cs - 0.5, y); ctx.lineTo(x + cs - 0.5, y + cs); }
          ctx.stroke();

        } else if (tile === 2) {
          // Small dot (pellet) — centered, small, pinkish-white like original
          ctx.fillStyle = '#FFB8AE';
          ctx.beginPath();
          ctx.arc(x + halfCs, y + halfCs, 1.5, 0, Math.PI * 2);
          ctx.fill();

        } else if (tile === 3) {
          // Power pellet — larger, flashing
          if (Math.floor(this.dotFlashTimer * 4) % 2 === 0) {
            ctx.fillStyle = '#FFB8AE';
            ctx.beginPath();
            ctx.arc(x + halfCs, y + halfCs, 4, 0, Math.PI * 2);
            ctx.fill();
          }

        } else if (tile === 4) {
          // Ghost house — draw door/gate
          ctx.fillStyle = '#FFB8FF';
          ctx.fillRect(x, y + cs / 2 - 1, cs, 2);
        }
      }
    }

    // Draw Pac-Man (yellow circle with animated mouth)
    if (!this.gameOver) {
      const px = this.playerX + halfCs;
      const py = this.playerY + halfCs;
      const radius = halfCs - 1;

      // Determine facing angle
      let angle = 0;
      if (this.dir.x === 1) angle = 0;
      else if (this.dir.x === -1) angle = Math.PI;
      else if (this.dir.y === -1) angle = -Math.PI / 2;
      else if (this.dir.y === 1) angle = Math.PI / 2;

      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(px, py, radius, angle + this.mouthAngle, angle + Math.PI * 2 - this.mouthAngle);
      ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fill();
    }

    // Draw ghosts
    this.ghosts.forEach(g => {
      const gx = g.x + halfCs;
      const gy = g.y + halfCs;
      const gr = halfCs - 1;

      let bodyColor;
      if (this.powerMode) {
        bodyColor = this.powerTimer < 2
          ? (Math.floor(this.dotFlashTimer * 6) % 2 === 0 ? '#FFFFFF' : '#2121DE')
          : '#2121DE';
      } else {
        bodyColor = g.color;
      }

      // Ghost body — rounded top, wavy bottom
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      // Top dome
      ctx.arc(gx, g.y + gr + 1, gr, Math.PI, 0);
      // Right side
      ctx.lineTo(gx + gr, g.y + cs - 1);
      // Wavy bottom (3 waves)
      const waveW = (gr * 2) / 3;
      for (let i = 0; i < 3; i++) {
        const wx = gx + gr - i * waveW;
        ctx.quadraticCurveTo(wx - waveW / 4, g.y + cs + 2, wx - waveW / 2, g.y + cs - 2);
        ctx.quadraticCurveTo(wx - waveW * 3 / 4, g.y + cs - 5, wx - waveW, g.y + cs - 1);
      }
      ctx.closePath();
      ctx.fill();

      // Eyes
      if (this.powerMode && this.powerTimer > 0) {
        // Frightened face — simple white eyes and squiggly mouth
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(gx - 3, g.y + gr - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(gx + 3, g.y + gr - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Squiggly mouth
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx - 4, g.y + gr + 3);
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(gx - 4 + i * 2 + 1, g.y + gr + (i % 2 === 0 ? 2 : 4));
        }
        ctx.stroke();
      } else {
        // Normal eyes — white sclera with colored pupil
        const eyeOffX = g.dir.x * 2;
        const eyeOffY = g.dir.y * 2;

        // Left eye white
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(gx - 3, g.y + gr - 2, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right eye white
        ctx.beginPath();
        ctx.ellipse(gx + 3, g.y + gr - 2, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (look in movement direction)
        ctx.fillStyle = '#2121DE';
        ctx.beginPath();
        ctx.arc(gx - 3 + eyeOffX, g.y + gr - 1 + eyeOffY, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(gx + 3 + eyeOffX, g.y + gr - 1 + eyeOffY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // HUD — lives as pac-man icons
    const hudY = this.offsetY + this.rows * cs + 4;
    for (let i = 0; i < this.lives; i++) {
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(12 + i * 18, hudY + 6, 6, 0.3, Math.PI * 2 - 0.3);
      ctx.lineTo(12 + i * 18, hudY + 6);
      ctx.closePath();
      ctx.fill();
    }

    // Power mode indicator
    if (this.powerMode) {
      this.drawText(ctx, `POWER ${Math.ceil(this.powerTimer)}s`, this.width / 2, this.offsetY - 8, 8, '#2121DE', 'center');
    }

    // Level
    this.drawText(ctx, `LVL ${this.level}`, this.width - 8, hudY + 6, 7, '#FFFFFF', 'right');

    // "READY!" text at start
    if (this.dir.x === 0 && this.dir.y === 0 && this.dotsEaten === 0) {
      this.drawText(ctx, 'READY!', this.width / 2, this.offsetY + 17 * cs + halfCs, 10, '#FFFF00', 'center');
    }

    if (this.gameOver) {
      this.drawText(ctx, 'GAME OVER', this.width / 2, this.height / 2, 14, '#FF0000', 'center');
    }
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
