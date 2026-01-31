import { GameEngine } from '../engine/GameEngine.js';

export class ConnectFourGame extends GameEngine {
  init() {
    this.cols = 7;
    this.rows = 6;
    this.cellSize = Math.min(this.width / this.cols, this.height / (this.rows + 2));
    this.offsetX = (this.width - this.cols * this.cellSize) / 2;
    this.offsetY = (this.height - this.rows * this.cellSize) / 2 + 40;

    this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
    this.currentPlayer = 'P';
    this.winner = null;
  }

  onTap(x, y) {
    if (this.winner || this.currentPlayer !== 'P') return;

    const col = Math.floor((x - this.offsetX) / this.cellSize);
    if (col < 0 || col >= this.cols) return;

    if (this.dropPiece(col, 'P')) {
      if (this.options?.sound) this.options.sound.play('drop');

      if (this.checkWinner()) {
        this.addScore(100);
        if (this.options?.sound) this.options.sound.play('win');
        this.triggerGameOver();
      } else if (this.isFull()) {
        this.winner = 'DRAW';
        this.triggerGameOver();
      } else {
        this.currentPlayer = 'A';
        setTimeout(() => this.aiMove(), 600);
      }
    }
  }

  dropPiece(col, player) {
    for (let row = this.rows - 1; row >= 0; row--) {
      if (!this.grid[row][col]) {
        this.grid[row][col] = player;
        return true;
      }
    }
    return false;
  }

  aiMove() {
    // Simple AI: random column
    const validCols = [];
    for (let col = 0; col < this.cols; col++) {
      if (!this.grid[0][col]) validCols.push(col);
    }

    if (validCols.length === 0) return;

    const col = validCols[Math.floor(Math.random() * validCols.length)];
    this.dropPiece(col, 'A');
    if (this.options?.sound) this.options.sound.play('hit');

    if (this.checkWinner()) {
      this.triggerGameOver();
    } else {
      this.currentPlayer = 'P';
    }
  }

  checkWinner() {
    // Check horizontal, vertical, diagonal
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const player = this.grid[row][col];
        if (!player) continue;

        // Horizontal
        if (col <= this.cols - 4 &&
            this.grid[row][col + 1] === player &&
            this.grid[row][col + 2] === player &&
            this.grid[row][col + 3] === player) {
          this.winner = player;
          return true;
        }

        // Vertical
        if (row <= this.rows - 4 &&
            this.grid[row + 1][col] === player &&
            this.grid[row + 2][col] === player &&
            this.grid[row + 3][col] === player) {
          this.winner = player;
          return true;
        }

        // Diagonal /
        if (row <= this.rows - 4 && col <= this.cols - 4 &&
            this.grid[row + 1][col + 1] === player &&
            this.grid[row + 2][col + 2] === player &&
            this.grid[row + 3][col + 3] === player) {
          this.winner = player;
          return true;
        }

        // Diagonal \
        if (row >= 3 && col <= this.cols - 4 &&
            this.grid[row - 1][col + 1] === player &&
            this.grid[row - 2][col + 2] === player &&
            this.grid[row - 3][col + 3] === player) {
          this.winner = player;
          return true;
        }
      }
    }

    return false;
  }

  isFull() {
    return this.grid[0].every(c => c !== null);
  }

  update(dt) {
    // No continuous updates needed
  }

  render(ctx) {
    this.clearCanvas(ctx);

    this.drawText(ctx, 'CONNECT FOUR', this.width / 2, 30, 12, '#00fff2');

    // Board
    ctx.fillStyle = '#0044ff';
    ctx.fillRect(this.offsetX, this.offsetY, this.cols * this.cellSize, this.rows * this.cellSize);

    // Cells
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = this.offsetX + col * this.cellSize + this.cellSize / 2;
        const y = this.offsetY + row * this.cellSize + this.cellSize / 2;
        const r = this.cellSize / 2 - 6;

        ctx.fillStyle = this.grid[row][col] === 'P' ? '#ffe600' : this.grid[row][col] === 'A' ? '#ff0040' : '#0a0a0a';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (this.winner) {
      const msg = this.winner === 'DRAW' ? 'DRAW!' : this.winner === 'P' ? 'YOU WIN!' : 'YOU LOSE!';
      const color = this.winner === 'P' ? '#00ff41' : '#ff0040';
      this.drawText(ctx, msg, this.width / 2, this.height - 30, 16, color);
    }
  }
}
