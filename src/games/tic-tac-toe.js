import { GameEngine } from '../engine/GameEngine.js';

export class TicTacToeGame extends GameEngine {
  init() {
    this.grid = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.cellSize = 100;
    this.offsetX = (this.width - this.cellSize * 3) / 2;
    this.offsetY = (this.height - this.cellSize * 3) / 2;
    this.winner = null;
  }

  onTap(x, y) {
    if (this.winner || this.currentPlayer !== 'X') return;

    const col = Math.floor((x - this.offsetX) / this.cellSize);
    const row = Math.floor((y - this.offsetY) / this.cellSize);
    const idx = row * 3 + col;

    if (col >= 0 && col < 3 && row >= 0 && row < 3 && !this.grid[idx]) {
      this.grid[idx] = 'X';
      if (this.options?.sound) this.options.sound.play('blip');

      this.checkWinner();

      if (!this.winner && !this.grid.every(c => c)) {
        this.currentPlayer = 'O';
        setTimeout(() => this.aiMove(), 500);
      }
    }
  }

  aiMove() {
    // Simple AI: pick random empty cell
    const empty = this.grid.map((v, i) => v === null ? i : null).filter(i => i !== null);
    if (empty.length === 0) return;

    const idx = empty[Math.floor(Math.random() * empty.length)];
    this.grid[idx] = 'O';
    if (this.options?.sound) this.options.sound.play('hit');

    this.checkWinner();
    this.currentPlayer = 'X';
  }

  checkWinner() {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6], // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (this.grid[a] && this.grid[a] === this.grid[b] && this.grid[a] === this.grid[c]) {
        this.winner = this.grid[a];
        if (this.winner === 'X') {
          this.addScore(100);
          if (this.options?.sound) this.options.sound.play('win');
        }
        this.triggerGameOver();
        return;
      }
    }

    // Draw
    if (this.grid.every(c => c)) {
      this.winner = 'DRAW';
      this.triggerGameOver();
    }
  }

  update(dt) {
    // No continuous updates needed
  }

  render(ctx) {
    this.clearCanvas(ctx);

    this.drawText(ctx, 'TIC-TAC-TOE', this.width / 2, 40, 12, '#00fff2');

    // Grid
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(this.offsetX + i * this.cellSize, this.offsetY);
      ctx.lineTo(this.offsetX + i * this.cellSize, this.offsetY + this.cellSize * 3);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.offsetX, this.offsetY + i * this.cellSize);
      ctx.lineTo(this.offsetX + this.cellSize * 3, this.offsetY + i * this.cellSize);
      ctx.stroke();
    }

    // Marks
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = this.offsetX + col * this.cellSize + this.cellSize / 2;
      const y = this.offsetY + row * this.cellSize + this.cellSize / 2;

      if (this.grid[i] === 'X') {
        this.drawText(ctx, 'X', x, y, 40, '#00fff2');
      } else if (this.grid[i] === 'O') {
        this.drawText(ctx, 'O', x, y, 40, '#ff0040');
      }
    }

    if (this.winner) {
      const msg = this.winner === 'DRAW' ? 'DRAW!' : this.winner === 'X' ? 'YOU WIN!' : 'YOU LOSE!';
      const color = this.winner === 'X' ? '#00ff41' : '#ff0040';
      this.drawText(ctx, msg, this.width / 2, this.height - 40, 16, color);
    }
  }
}
