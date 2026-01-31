import { GameEngine } from '../engine/GameEngine.js';

export class PacmanGame extends GameEngine {
  init() {
    this.gridSize = 15;
    this.cellSize = this.width / this.gridSize;
    this.playerX = 7;
    this.playerY = 11;
    this.playerDir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };
    this.moveTimer = 0;
    this.moveInterval = 0.15;

    // Simple maze
    this.maze = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,0,1,1,0,1,0,1,1,0,1,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,1,1,0,1,1,1,1,1,1,1,0,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,1,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    this.dots = [];
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.maze[y][x] === 0) {
          this.dots.push({ x, y });
        }
      }
    }

    this.ghosts = [
      { x: 6, y: 6, dir: { x: 1, y: 0 }, color: '#ff0040' },
      { x: 8, y: 6, dir: { x: -1, y: 0 }, color: '#ff00ff' },
    ];
    this.ghostTimer = 0;
    this.ghostInterval = 0.3;
  }

  onInput(action) {
    const dirs = {
      UP: { x: 0, y: -1 },
      DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 },
      RIGHT: { x: 1, y: 0 },
    };
    this.nextDir = dirs[action] || this.nextDir;
  }

  canMove(x, y) {
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return false;
    return this.maze[y][x] === 0;
  }

  update(dt) {
    this.moveTimer += dt;
    this.ghostTimer += dt;

    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;

      // Try to change direction
      if (this.canMove(this.playerX + this.nextDir.x, this.playerY + this.nextDir.y)) {
        this.playerDir = this.nextDir;
      }

      // Move player
      if (this.canMove(this.playerX + this.playerDir.x, this.playerY + this.playerDir.y)) {
        this.playerX += this.playerDir.x;
        this.playerY += this.playerDir.y;
      }

      // Collect dot
      const dotIdx = this.dots.findIndex(d => d.x === this.playerX && d.y === this.playerY);
      if (dotIdx >= 0) {
        this.dots.splice(dotIdx, 1);
        this.addScore(10);
        if (this.options?.sound) this.options.sound.play('score');
      }

      // Win condition
      if (this.dots.length === 0) {
        this.addScore(500);
        if (this.options?.sound) this.options.sound.play('win');
        this.triggerGameOver();
      }
    }

    // Move ghosts
    if (this.ghostTimer >= this.ghostInterval) {
      this.ghostTimer = 0;

      for (const ghost of this.ghosts) {
        // Simple AI: try to move toward player
        const dirs = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 },
        ];

        const validDirs = dirs.filter(d => this.canMove(ghost.x + d.x, ghost.y + d.y));
        if (validDirs.length === 0) continue;

        // Pick direction closest to player
        validDirs.sort((a, b) => {
          const distA = Math.abs(ghost.x + a.x - this.playerX) + Math.abs(ghost.y + a.y - this.playerY);
          const distB = Math.abs(ghost.x + b.x - this.playerX) + Math.abs(ghost.y + b.y - this.playerY);
          return distA - distB;
        });

        ghost.dir = validDirs[0];
        ghost.x += ghost.dir.x;
        ghost.y += ghost.dir.y;

        // Collision
        if (ghost.x === this.playerX && ghost.y === this.playerY) {
          this.triggerGameOver();
        }
      }
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Maze walls
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.maze[y][x] === 1) {
          this.drawPixelRect(ctx, x * this.cellSize, y * this.cellSize,
            this.cellSize, this.cellSize, '#0044ff', '#00fff2');
        }
      }
    }

    // Dots
    ctx.fillStyle = '#ffe600';
    for (const dot of this.dots) {
      ctx.beginPath();
      ctx.arc(dot.x * this.cellSize + this.cellSize / 2,
        dot.y * this.cellSize + this.cellSize / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pac-Man
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.arc(this.playerX * this.cellSize + this.cellSize / 2,
      this.playerY * this.cellSize + this.cellSize / 2,
      this.cellSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Ghosts
    for (const ghost of this.ghosts) {
      ctx.fillStyle = ghost.color;
      ctx.beginPath();
      ctx.arc(ghost.x * this.cellSize + this.cellSize / 2,
        ghost.y * this.cellSize + this.cellSize / 2,
        this.cellSize / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.gameOver) {
      const msg = this.dots.length === 0 ? 'YOU WIN!' : 'GAME OVER';
      this.drawText(ctx, msg, this.width / 2, this.height / 2, 16, '#ff0040');
    }
  }
}
