import { GameEngine } from '../engine/GameEngine.js';

export class MinesweeperGame extends GameEngine {
  init() {
    this.cols = 10;
    this.rows = 12;
    this.cellSize = this.width / this.cols;
    this.mineCount = 15;

    this.grid = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.grid.push({ x, y, mine: false, revealed: false, flagged: false, neighbors: 0 });
      }
    }

    // Place mines
    let placed = 0;
    while (placed < this.mineCount) {
      const cell = this.grid[Math.floor(Math.random() * this.grid.length)];
      if (!cell.mine) {
        cell.mine = true;
        placed++;
      }
    }

    // Calculate neighbors
    for (const cell of this.grid) {
      if (cell.mine) continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighbor = this.getCell(cell.x + dx, cell.y + dy);
          if (neighbor?.mine) count++;
        }
      }
      cell.neighbors = count;
    }
  }

  getCell(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return null;
    return this.grid[y * this.cols + x];
  }

  onTap(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    const cell = this.getCell(cellX, cellY);

    if (!cell || cell.revealed || cell.flagged) return;

    if (cell.mine) {
      this.triggerGameOver();
      if (this.options?.sound) this.options.sound.play('die');
      return;
    }

    this.revealCell(cell);
    if (this.options?.sound) this.options.sound.play('blip');

    // Check win
    const unrevealed = this.grid.filter(c => !c.revealed && !c.mine);
    if (unrevealed.length === 0) {
      this.addScore(500);
      if (this.options?.sound) this.options.sound.play('win');
      this.triggerGameOver();
    }
  }

  revealCell(cell) {
    if (cell.revealed) return;
    cell.revealed = true;
    this.addScore(10);

    // Auto-reveal neighbors if no adjacent mines
    if (cell.neighbors === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighbor = this.getCell(cell.x + dx, cell.y + dy);
          if (neighbor && !neighbor.revealed && !neighbor.mine) {
            this.revealCell(neighbor);
          }
        }
      }
    }
  }

  update(dt) {
    // No continuous updates needed
  }

  render(ctx) {
    this.clearCanvas(ctx);

    for (const cell of this.grid) {
      const x = cell.x * this.cellSize;
      const y = cell.y * this.cellSize;

      if (cell.revealed) {
        if (cell.mine) {
          this.drawPixelRect(ctx, x + 1, y + 1, this.cellSize - 2, this.cellSize - 2,
            '#ff0040', '#ff00ff');
        } else {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
          if (cell.neighbors > 0) {
            const colors = ['', '#00fff2', '#00ff41', '#ffe600', '#ff8800', '#ff0040'];
            this.drawText(ctx, String(cell.neighbors), x + this.cellSize / 2, y + this.cellSize / 2,
              10, colors[cell.neighbors] || '#ffffff');
          }
        }
      } else {
        this.drawPixelRect(ctx, x + 1, y + 1, this.cellSize - 2, this.cellSize - 2,
          '#0044ff', '#00fff2');
      }

      // Grid lines
      ctx.strokeStyle = '#0a0a0a';
      ctx.strokeRect(x, y, this.cellSize, this.cellSize);
    }

    if (this.gameOver) {
      // Reveal all mines
      for (const cell of this.grid) {
        if (cell.mine && !cell.revealed) {
          const x = cell.x * this.cellSize;
          const y = cell.y * this.cellSize;
          this.drawPixelRect(ctx, x + 1, y + 1, this.cellSize - 2, this.cellSize - 2,
            '#ff0040', '#ff00ff');
        }
      }

      const msg = this.grid.filter(c => !c.revealed && !c.mine).length === 0 ? 'YOU WIN!' : 'GAME OVER';
      this.drawText(ctx, msg, this.width / 2, this.height / 2 - 40, 16, '#ff0040');
    }
  }
}
