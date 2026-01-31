import { GameEngine } from '../engine/GameEngine.js';

export class TetrisGame extends GameEngine {
  init() {
    this.cols = 10;
    this.rows = 20;
    this.cellSize = Math.min(this.width / this.cols, this.height / this.rows);
    this.offsetX = (this.width - this.cols * this.cellSize) / 2;
    this.offsetY = (this.height - this.rows * this.cellSize) / 2;

    this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    this.pieces = [
      [[1,1,1,1]], // I
      [[1,1],[1,1]], // O
      [[0,1,0],[1,1,1]], // T
      [[1,0,0],[1,1,1]], // L
      [[0,0,1],[1,1,1]], // J
      [[0,1,1],[1,1,0]], // S
      [[1,1,0],[0,1,1]], // Z
    ];
    this.colors = ['#00fff2', '#ffe600', '#ff00ff', '#ff8800', '#0044ff', '#00ff41', '#ff0040'];

    this.spawnPiece();
    this.fallTimer = 0;
    this.fallInterval = 0.5;
    this.lockDelay = 0;
  }

  spawnPiece() {
    const idx = Math.floor(Math.random() * this.pieces.length);
    this.piece = this.pieces[idx].map(r => [...r]);
    this.pieceColor = this.colors[idx];
    this.pieceX = Math.floor(this.cols / 2) - Math.floor(this.piece[0].length / 2);
    this.pieceY = 0;

    if (this.collides(this.piece, this.pieceX, this.pieceY)) {
      this.triggerGameOver();
    }
  }

  collides(piece, x, y) {
    for (let row = 0; row < piece.length; row++) {
      for (let col = 0; col < piece[row].length; col++) {
        if (piece[row][col]) {
          const gridX = x + col;
          const gridY = y + row;
          if (gridX < 0 || gridX >= this.cols || gridY >= this.rows) return true;
          if (gridY >= 0 && this.grid[gridY][gridX]) return true;
        }
      }
    }
    return false;
  }

  rotate(piece) {
    const rotated = piece[0].map((_, i) => piece.map(row => row[i]).reverse());
    return rotated;
  }

  onInput(action) {
    if (this.gameOver) return;

    if (action === 'LEFT') {
      if (!this.collides(this.piece, this.pieceX - 1, this.pieceY)) {
        this.pieceX--;
        if (this.options?.sound) this.options.sound.play('move');
      }
    } else if (action === 'RIGHT') {
      if (!this.collides(this.piece, this.pieceX + 1, this.pieceY)) {
        this.pieceX++;
        if (this.options?.sound) this.options.sound.play('move');
      }
    } else if (action === 'DOWN') {
      this.fallTimer = this.fallInterval; // Trigger immediate fall
    } else if (action === 'UP' || action === 'A') {
      const rotated = this.rotate(this.piece);
      if (!this.collides(rotated, this.pieceX, this.pieceY)) {
        this.piece = rotated;
        if (this.options?.sound) this.options.sound.play('blip');
      }
    }
  }

  update(dt) {
    this.fallTimer += dt;

    if (this.fallTimer >= this.fallInterval) {
      this.fallTimer = 0;

      if (!this.collides(this.piece, this.pieceX, this.pieceY + 1)) {
        this.pieceY++;
        this.lockDelay = 0;
      } else {
        this.lockDelay += dt;
        if (this.lockDelay > 0.3) {
          this.lockPiece();
        }
      }
    }
  }

  lockPiece() {
    for (let row = 0; row < this.piece.length; row++) {
      for (let col = 0; col < this.piece[row].length; col++) {
        if (this.piece[row][col]) {
          const gridY = this.pieceY + row;
          const gridX = this.pieceX + col;
          if (gridY >= 0) {
            this.grid[gridY][gridX] = this.pieceColor;
          }
        }
      }
    }

    this.clearLines();
    this.spawnPiece();
    this.lockDelay = 0;
  }

  clearLines() {
    let linesCleared = 0;
    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.grid[row].every(cell => cell !== 0)) {
        this.grid.splice(row, 1);
        this.grid.unshift(Array(this.cols).fill(0));
        linesCleared++;
        row++; // Check same row again
      }
    }

    if (linesCleared > 0) {
      const points = [0, 100, 300, 500, 800][linesCleared];
      this.addScore(points);
      if (this.options?.sound) this.options.sound.play('clear');

      // Speed up
      if (this.fallInterval > 0.1) {
        this.fallInterval -= 0.02;
      }
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Grid background
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(this.offsetX, this.offsetY, this.cols * this.cellSize, this.rows * this.cellSize);

    // Grid lines
    ctx.strokeStyle = '#1a1a1a';
    for (let i = 0; i <= this.cols; i++) {
      ctx.beginPath();
      ctx.moveTo(this.offsetX + i * this.cellSize, this.offsetY);
      ctx.lineTo(this.offsetX + i * this.cellSize, this.offsetY + this.rows * this.cellSize);
      ctx.stroke();
    }
    for (let i = 0; i <= this.rows; i++) {
      ctx.beginPath();
      ctx.moveTo(this.offsetX, this.offsetY + i * this.cellSize);
      ctx.lineTo(this.offsetX + this.cols * this.cellSize, this.offsetY + i * this.cellSize);
      ctx.stroke();
    }

    // Placed blocks
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          this.drawPixelRect(ctx,
            this.offsetX + col * this.cellSize + 1,
            this.offsetY + row * this.cellSize + 1,
            this.cellSize - 2, this.cellSize - 2,
            this.grid[row][col], '#ffffff');
        }
      }
    }

    // Current piece
    for (let row = 0; row < this.piece.length; row++) {
      for (let col = 0; col < this.piece[row].length; col++) {
        if (this.piece[row][col]) {
          this.drawPixelRect(ctx,
            this.offsetX + (this.pieceX + col) * this.cellSize + 1,
            this.offsetY + (this.pieceY + row) * this.cellSize + 1,
            this.cellSize - 2, this.cellSize - 2,
            this.pieceColor, '#ffffff');
        }
      }
    }

    if (this.gameOver) {
      this.drawText(ctx, 'GAME OVER', this.width / 2, this.height / 2, 16, '#ff0040');
    }
  }
}
