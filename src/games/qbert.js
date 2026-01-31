import { GameEngine } from '../engine/GameEngine.js';

export class QbertGame extends GameEngine {
  init() {
    this.pyramidRows = 7;
    this.cubeSize = 32;
    this.cubes = [];
    this.targetColor = '#ff00ff';
    this.startColor = '#4488ff';
    this.buildPyramid();

    // Player
    this.playerRow = 0;
    this.playerCol = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.jumping = false;
    this.jumpTimer = 0;
    this.jumpDuration = 0.25;
    this.jumpFromX = 0;
    this.jumpFromY = 0;
    this.jumpToX = 0;
    this.jumpToY = 0;
    this.updatePlayerPos();

    // Enemies
    this.enemies = [];
    this.enemyTimer = 3;
    this.enemyRate = Math.max(1.5, 4 - this.level * 0.4);

    // Discs (escape platforms)
    this.discs = [
      { row: 2, side: 'left', active: true },
      { row: 4, side: 'right', active: true }
    ];

    this.lives = 3;
    this.cubesChanged = 0;
    this.totalCubes = 0;
  }

  buildPyramid() {
    this.cubes = [];
    this.totalCubes = 0;
    for (let r = 0; r < this.pyramidRows; r++) {
      this.cubes[r] = [];
      for (let c = 0; c <= r; c++) {
        this.cubes[r][c] = {
          color: this.startColor,
          changed: false
        };
        this.totalCubes++;
      }
    }
    this.cubesChanged = 0;
  }

  getCubePos(row, col) {
    const baseX = this.width / 2;
    const baseY = 60;
    const xStep = this.cubeSize * 0.9;
    const yStep = this.cubeSize * 0.75;

    const x = baseX + (col - row / 2) * xStep;
    const y = baseY + row * yStep;
    return { x, y };
  }

  updatePlayerPos() {
    const pos = this.getCubePos(this.playerRow, this.playerCol);
    this.playerX = pos.x;
    this.playerY = pos.y;
  }

  isValidCube(row, col) {
    return row >= 0 && row < this.pyramidRows && col >= 0 && col <= row;
  }

  tryJump(dRow, dCol) {
    if (this.jumping) return;

    const newRow = this.playerRow + dRow;
    const newCol = this.playerCol + dCol;

    // Check discs
    if (!this.isValidCube(newRow, newCol)) {
      for (const disc of this.discs) {
        if (disc.active && disc.row === this.playerRow) {
          if ((disc.side === 'left' && dCol < 0) ||
              (disc.side === 'right' && dCol > 0)) {
            // Ride disc back to top
            disc.active = false;
            this.addScore(50);
            this.playerRow = 0;
            this.playerCol = 0;
            this.jumping = true;
            this.jumpTimer = 0;
            this.jumpFromX = this.playerX;
            this.jumpFromY = this.playerY;
            const target = this.getCubePos(0, 0);
            this.jumpToX = target.x;
            this.jumpToY = target.y;
            return;
          }
        }
      }

      // Fell off pyramid
      this.lives--;
      if (this.lives <= 0) { this.triggerGameOver(); return; }
      this.playerRow = 0;
      this.playerCol = 0;
      this.updatePlayerPos();
      return;
    }

    this.jumping = true;
    this.jumpTimer = 0;
    this.jumpFromX = this.playerX;
    this.jumpFromY = this.playerY;

    this.playerRow = newRow;
    this.playerCol = newCol;
    const target = this.getCubePos(newRow, newCol);
    this.jumpToX = target.x;
    this.jumpToY = target.y;
  }

  landOnCube() {
    if (this.playerRow >= 0 && this.playerRow < this.pyramidRows &&
        this.playerCol >= 0 && this.playerCol <= this.playerRow) {
      const cube = this.cubes[this.playerRow][this.playerCol];
      if (!cube.changed) {
        cube.changed = true;
        cube.color = this.targetColor;
        this.cubesChanged++;
        this.addScore(25);
      }
    }

    // Level complete
    if (this.cubesChanged >= this.totalCubes) {
      this.level++;
      this.buildPyramid();
      this.playerRow = 0;
      this.playerCol = 0;
      this.updatePlayerPos();
      this.enemies = [];
      this.discs.forEach(d => d.active = true);
      this.addScore(500);
      this.enemyRate = Math.max(1.5, 4 - this.level * 0.4);
    }
  }

  update(dt) {
    // Jump animation
    if (this.jumping) {
      this.jumpTimer += dt;
      const t = Math.min(this.jumpTimer / this.jumpDuration, 1);

      // Parabolic arc
      this.playerX = this.jumpFromX + (this.jumpToX - this.jumpFromX) * t;
      this.playerY = this.jumpFromY + (this.jumpToY - this.jumpFromY) * t - Math.sin(t * Math.PI) * 30;

      if (t >= 1) {
        this.jumping = false;
        this.updatePlayerPos();
        this.landOnCube();
      }
    }

    // Spawn enemies
    this.enemyTimer -= dt;
    if (this.enemyTimer <= 0) {
      const types = ['coily', 'ball', 'ball'];
      const type = types[Math.floor(Math.random() * types.length)];
      this.enemies.push({
        row: 0,
        col: 0,
        x: 0,
        y: 0,
        type,
        moveTimer: 1,
        moveRate: type === 'coily' ? 0.8 : 1.2,
        jumping: false,
        jumpTimer: 0,
        jumpFromX: 0,
        jumpFromY: 0,
        jumpToX: 0,
        jumpToY: 0
      });
      const pos = this.getCubePos(0, 0);
      this.enemies[this.enemies.length - 1].x = pos.x;
      this.enemies[this.enemies.length - 1].y = pos.y;
      this.enemyTimer = this.enemyRate;
    }

    // Update enemies
    this.enemies = this.enemies.filter(e => {
      if (e.jumping) {
        e.jumpTimer += dt;
        const t = Math.min(e.jumpTimer / 0.3, 1);
        e.x = e.jumpFromX + (e.jumpToX - e.jumpFromX) * t;
        e.y = e.jumpFromY + (e.jumpToY - e.jumpFromY) * t - Math.sin(t * Math.PI) * 20;
        if (t >= 1) {
          e.jumping = false;
          const pos = this.getCubePos(e.row, e.col);
          e.x = pos.x;
          e.y = pos.y;
        }
      } else {
        e.moveTimer -= dt;
        if (e.moveTimer <= 0) {
          // Move down the pyramid
          let newRow = e.row + 1;
          let dCol;

          if (e.type === 'coily') {
            // Chase player
            if (this.playerCol > e.col) dCol = 1;
            else if (this.playerCol < e.col) dCol = 0;
            else dCol = Math.random() > 0.5 ? 1 : 0;
            // Coily can also go up
            if (this.playerRow < e.row && Math.random() < 0.4) {
              newRow = e.row - 1;
              dCol = this.playerCol >= e.col ? 0 : -1;
            }
          } else {
            dCol = Math.random() > 0.5 ? 1 : 0;
          }

          const newCol = e.col + dCol;

          if (this.isValidCube(newRow, newCol)) {
            e.jumping = true;
            e.jumpTimer = 0;
            e.jumpFromX = e.x;
            e.jumpFromY = e.y;
            e.row = newRow;
            e.col = newCol;
            const pos = this.getCubePos(newRow, newCol);
            e.jumpToX = pos.x;
            e.jumpToY = pos.y;
          } else if (newRow >= this.pyramidRows) {
            return false; // fell off
          }

          e.moveTimer = e.moveRate;
        }
      }

      // Collision with player
      if (!e.jumping && !this.jumping &&
          e.row === this.playerRow && e.col === this.playerCol) {
        this.lives--;
        if (this.lives <= 0) { this.triggerGameOver(); return false; }
        this.playerRow = 0;
        this.playerCol = 0;
        this.updatePlayerPos();
        return false;
      }

      return true;
    });
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Draw pyramid
    for (let r = this.pyramidRows - 1; r >= 0; r--) {
      for (let c = 0; c <= r; c++) {
        const pos = this.getCubePos(r, c);
        const cube = this.cubes[r][c];
        const s = this.cubeSize;

        // Isometric cube - top face
        ctx.fillStyle = cube.color;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - s * 0.3);
        ctx.lineTo(pos.x + s * 0.45, pos.y);
        ctx.lineTo(pos.x, pos.y + s * 0.15);
        ctx.lineTo(pos.x - s * 0.45, pos.y);
        ctx.closePath();
        ctx.fill();

        // Left face
        ctx.fillStyle = '#1a1a4a';
        ctx.beginPath();
        ctx.moveTo(pos.x - s * 0.45, pos.y);
        ctx.lineTo(pos.x, pos.y + s * 0.15);
        ctx.lineTo(pos.x, pos.y + s * 0.45);
        ctx.lineTo(pos.x - s * 0.45, pos.y + s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Right face
        ctx.fillStyle = '#0a0a3a';
        ctx.beginPath();
        ctx.moveTo(pos.x + s * 0.45, pos.y);
        ctx.lineTo(pos.x, pos.y + s * 0.15);
        ctx.lineTo(pos.x, pos.y + s * 0.45);
        ctx.lineTo(pos.x + s * 0.45, pos.y + s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#333366';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - s * 0.3);
        ctx.lineTo(pos.x + s * 0.45, pos.y);
        ctx.lineTo(pos.x + s * 0.45, pos.y + s * 0.3);
        ctx.lineTo(pos.x, pos.y + s * 0.45);
        ctx.lineTo(pos.x - s * 0.45, pos.y + s * 0.3);
        ctx.lineTo(pos.x - s * 0.45, pos.y);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Discs
    this.discs.filter(d => d.active).forEach(d => {
      const pos = this.getCubePos(d.row, d.side === 'left' ? -1 : d.row + 1);
      ctx.fillStyle = '#ff0040';
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Enemies
    this.enemies.forEach(e => {
      if (e.type === 'coily') {
        // Snake enemy
        this.drawPixelRect(ctx, e.x - 8, e.y - 12, 16, 16, '#ff00ff');
        this.drawPixelRect(ctx, e.x - 5, e.y - 10, 4, 4, '#ffe600');
        this.drawPixelRect(ctx, e.x + 1, e.y - 10, 4, 4, '#ffe600');
        this.drawPixelRect(ctx, e.x - 3, e.y - 2, 6, 4, '#ff00ff');
      } else {
        // Ball enemy
        ctx.fillStyle = '#ff0040';
        ctx.beginPath();
        ctx.arc(e.x, e.y - 4, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Player (Q*bert)
    const px = this.playerX;
    const py = this.playerY;
    // Body
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.arc(px, py - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    // Snout
    this.drawPixelRect(ctx, px + 6, py - 10, 8, 4, '#ff8800');
    // Eyes
    this.drawPixelRect(ctx, px - 4, py - 12, 4, 4, '#ffffff');
    this.drawPixelRect(ctx, px + 1, py - 12, 4, 4, '#ffffff');
    this.drawPixelRect(ctx, px - 3, py - 11, 2, 2, '#0a0a0a');
    this.drawPixelRect(ctx, px + 2, py - 11, 2, 2, '#0a0a0a');
    // Feet
    this.drawPixelRect(ctx, px - 6, py, 5, 4, '#ff8800');
    this.drawPixelRect(ctx, px + 1, py, 5, 4, '#ff8800');

    // HUD
    for (let i = 0; i < this.lives; i++) {
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.arc(15 + i * 18, this.height - 12, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Progress bar
    const barW = 100;
    const barX = this.width / 2 - barW / 2;
    this.drawRect(ctx, barX, this.height - 20, barW, 8, '#111111');
    this.drawRect(ctx, barX, this.height - 20, barW * (this.cubesChanged / this.totalCubes), 8, this.targetColor);

    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, this.height - 10, 12, '#00fff2', 'right');
  }

  onInput(action) {
    // Q*bert moves diagonally on the isometric grid
    if (action === 'UP') this.tryJump(-1, 0);        // up-left
    else if (action === 'RIGHT') this.tryJump(-1, 1); // up-right
    else if (action === 'DOWN') this.tryJump(1, 1);   // down-right
    else if (action === 'LEFT') this.tryJump(1, 0);   // down-left
    else if (action === 'A') this.tryJump(-1, -1);     // up-left diagonal
    else if (action === 'B') this.tryJump(1, 0);       // down-left
  }

  onTap(x, y) {
    const dx = x - this.playerX;
    const dy = y - this.playerY;

    if (dy < -10) {
      // Tapped above - go up
      if (dx > 0) this.tryJump(-1, 0);   // up-right
      else this.tryJump(-1, -1);           // up-left
    } else {
      // Tapped below - go down
      if (dx > 0) this.tryJump(1, 1);    // down-right
      else this.tryJump(1, 0);            // down-left
    }
  }
}
