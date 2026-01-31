import { GameEngine } from '../engine/GameEngine.js';

export class Game2048 extends GameEngine {
  init() {
    this.gridSize = 4;
    this.cellSize = (this.width - 40) / this.gridSize;
    this.padding = 10;

    this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
    this.spawnTile();
    this.spawnTile();

    this.colors = {
      0: '#1a1a1a',
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e',
    };
  }

  spawnTile() {
    const empty = [];
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.grid[y][x] === 0) empty.push({ x, y });
      }
    }
    if (empty.length === 0) return false;

    const pos = empty[Math.floor(Math.random() * empty.length)];
    this.grid[pos.y][pos.x] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  onInput(action) {
    const dirs = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };
    const dir = dirs[action];
    if (!dir) return;

    const moved = this.move(dir);
    if (moved) {
      if (!this.spawnTile()) {
        if (this.isGameOver()) {
          this.triggerGameOver();
        }
      }
      if (this.options?.sound) this.options.sound.play('move');
    }
  }

  move(dir) {
    const [dx, dy] = dir;
    let moved = false;

    // Determine iteration order
    const rows = dy === 1 ? [3, 2, 1, 0] : [0, 1, 2, 3];
    const cols = dx === 1 ? [3, 2, 1, 0] : [0, 1, 2, 3];

    const merged = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));

    for (const y of rows) {
      for (const x of cols) {
        if (this.grid[y][x] === 0) continue;

        let ny = y;
        let nx = x;

        while (true) {
          const nextY = ny + dy;
          const nextX = nx + dx;

          if (nextY < 0 || nextY >= this.gridSize || nextX < 0 || nextX >= this.gridSize) break;

          if (this.grid[nextY][nextX] === 0) {
            ny = nextY;
            nx = nextX;
          } else if (this.grid[nextY][nextX] === this.grid[y][x] && !merged[nextY][nextX]) {
            ny = nextY;
            nx = nextX;
            break;
          } else {
            break;
          }
        }

        if (ny !== y || nx !== x) {
          moved = true;

          if (this.grid[ny][nx] === this.grid[y][x]) {
            this.grid[ny][nx] *= 2;
            this.addScore(this.grid[ny][nx]);
            merged[ny][nx] = true;
            if (this.options?.sound) this.options.sound.play('score');
          } else {
            this.grid[ny][nx] = this.grid[y][x];
          }

          this.grid[y][x] = 0;
        }
      }
    }

    return moved;
  }

  isGameOver() {
    // Check for empty cells
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.grid[y][x] === 0) return false;
      }
    }

    // Check for possible merges
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const val = this.grid[y][x];
        if ((x < this.gridSize - 1 && this.grid[y][x + 1] === val) ||
            (y < this.gridSize - 1 && this.grid[y + 1][x] === val)) {
          return false;
        }
      }
    }

    return true;
  }

  update(dt) {
    // No continuous updates needed
  }

  render(ctx) {
    this.clearCanvas(ctx);

    const offsetX = (this.width - (this.gridSize * this.cellSize + (this.gridSize + 1) * this.padding)) / 2;
    const offsetY = (this.height - (this.gridSize * this.cellSize + (this.gridSize + 1) * this.padding)) / 2;

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const val = this.grid[y][x];
        const px = offsetX + this.padding + x * (this.cellSize + this.padding);
        const py = offsetY + this.padding + y * (this.cellSize + this.padding);

        const color = this.colors[val] || '#3c3a32';
        this.drawPixelRect(ctx, px, py, this.cellSize, this.cellSize, color, '#666');

        if (val > 0) {
          const textColor = val <= 4 ? '#776e65' : '#f9f6f2';
          const size = val >= 1000 ? 10 : val >= 100 ? 12 : 16;
          this.drawText(ctx, String(val), px + this.cellSize / 2, py + this.cellSize / 2,
            size, textColor);
        }
      }
    }

    if (this.gameOver) {
      this.drawText(ctx, 'GAME OVER', this.width / 2, this.height / 2 - 60, 20, '#ff0040');
    }
  }
}
