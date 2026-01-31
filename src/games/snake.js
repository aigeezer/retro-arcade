import { GameEngine } from '../engine/GameEngine.js';

export class SnakeGame extends GameEngine {
  init() {
    this.gridSize = 20;
    this.cellSize = this.width / this.gridSize;
    this.snake = [{ x: 10, y: 10 }];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = this.spawnFood();
    this.moveTimer = 0;
    this.moveInterval = 0.15;
    this.growing = false;
  }

  spawnFood() {
    while (true) {
      const food = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize),
      };
      if (!this.snake.some(s => s.x === food.x && s.y === food.y)) {
        return food;
      }
    }
  }

  onInput(action) {
    const dirs = {
      UP: { x: 0, y: -1 },
      DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 },
      RIGHT: { x: 1, y: 0 },
    };
    const newDir = dirs[action];
    if (newDir && (newDir.x !== -this.direction.x || newDir.y !== -this.direction.y)) {
      this.nextDirection = newDir;
    }
  }

  update(dt) {
    this.moveTimer += dt;
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.direction = this.nextDirection;

      const head = this.snake[0];
      const newHead = { x: head.x + this.direction.x, y: head.y + this.direction.y };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= this.gridSize || newHead.y < 0 || newHead.y >= this.gridSize) {
        this.triggerGameOver();
        return;
      }

      // Self collision
      if (this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        this.triggerGameOver();
        return;
      }

      this.snake.unshift(newHead);

      // Food collision
      if (newHead.x === this.food.x && newHead.y === this.food.y) {
        this.addScore(10);
        this.food = this.spawnFood();
        this.growing = true;
        if (this.options?.sound) this.options.sound.play('score');
        // Speed up
        if (this.moveInterval > 0.08) this.moveInterval -= 0.005;
      } else if (!this.growing) {
        this.snake.pop();
      } else {
        this.growing = false;
      }
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Grid
    ctx.strokeStyle = '#1a1a1a';
    for (let i = 0; i <= this.gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * this.cellSize, 0);
      ctx.lineTo(i * this.cellSize, this.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * this.cellSize);
      ctx.lineTo(this.width, i * this.cellSize);
      ctx.stroke();
    }

    // Snake
    this.snake.forEach((seg, i) => {
      const color = i === 0 ? '#00ff41' : '#00aa2b';
      this.drawPixelRect(ctx, seg.x * this.cellSize + 1, seg.y * this.cellSize + 1,
        this.cellSize - 2, this.cellSize - 2, color, '#00ff41');
    });

    // Food
    this.drawPixelRect(ctx, this.food.x * this.cellSize + 2, this.food.y * this.cellSize + 2,
      this.cellSize - 4, this.cellSize - 4, '#ff0040', '#ff00ff');

    if (this.gameOver) {
      this.drawText(ctx, 'GAME OVER', this.width / 2, this.height / 2, 20, '#ff0040');
    }
  }
}
