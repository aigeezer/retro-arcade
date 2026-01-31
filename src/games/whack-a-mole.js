import { GameEngine } from '../engine/GameEngine.js';

export class WhackAMoleGame extends GameEngine {
  init() {
    this.holes = [];
    const cols = 3;
    const rows = 3;
    const size = 60;
    const spacing = 20;
    const startX = (this.width - (cols * size + (cols - 1) * spacing)) / 2;
    const startY = (this.height - (rows * size + (rows - 1) * spacing)) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.holes.push({
          x: startX + col * (size + spacing),
          y: startY + row * (size + spacing),
          w: size,
          h: size,
          mole: false,
          timer: 0,
        });
      }
    }

    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
    this.gameTime = 30;
    this.timeLeft = this.gameTime;
  }

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.triggerGameOver();
      return;
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      // Spawn a mole
      const empty = this.holes.filter(h => !h.mole);
      if (empty.length > 0) {
        const hole = empty[Math.floor(Math.random() * empty.length)];
        hole.mole = true;
        hole.timer = 1.5;
      }
    }

    // Update moles
    for (const hole of this.holes) {
      if (hole.mole) {
        hole.timer -= dt;
        if (hole.timer <= 0) {
          hole.mole = false;
        }
      }
    }

    // Speed up over time
    if (this.spawnInterval > 0.4) {
      this.spawnInterval -= dt * 0.02;
    }
  }

  onTap(x, y) {
    for (const hole of this.holes) {
      if (hole.mole &&
          x >= hole.x && x <= hole.x + hole.w &&
          y >= hole.y && y <= hole.y + hole.h) {
        hole.mole = false;
        this.addScore(10);
        if (this.options?.sound) this.options.sound.play('hit');
        break;
      }
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Timer
    this.drawText(ctx, `TIME: ${Math.ceil(this.timeLeft)}`, this.width / 2, 40, 12, '#ffe600');

    // Holes
    for (const hole of this.holes) {
      this.drawPixelRect(ctx, hole.x, hole.y, hole.w, hole.h, '#333', '#666');

      if (hole.mole) {
        ctx.fillStyle = '#ff0040';
        ctx.beginPath();
        ctx.arc(hole.x + hole.w / 2, hole.y + hole.h / 2, hole.w / 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (this.gameOver) {
      this.drawText(ctx, 'TIME UP!', this.width / 2, this.height / 2, 20, '#ff0040');
    }
  }
}
