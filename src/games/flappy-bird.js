import { GameEngine } from '../engine/GameEngine.js';

export class FlappyBirdGame extends GameEngine {
  init() {
    this.birdX = 100;
    this.birdY = this.height / 2;
    this.birdVY = 0;
    this.birdSize = 20;
    this.gravity = 800;
    this.flapPower = -300;

    this.pipes = [];
    this.pipeWidth = 60;
    this.pipeGap = 150;
    this.pipeSpeed = 150;
    this.pipeTimer = 0;
    this.pipeInterval = 2.0;

    this.started = false;
  }

  onTap() {
    if (!this.started) {
      this.started = true;
      if (this.options?.sound) this.options.sound.play('start');
    }
    this.birdVY = this.flapPower;
    if (this.options?.sound) this.options.sound.play('blip');
  }

  update(dt) {
    if (!this.started) return;

    this.birdVY += this.gravity * dt;
    this.birdY += this.birdVY * dt;

    // Floor/ceiling collision
    if (this.birdY < 0 || this.birdY + this.birdSize > this.height) {
      this.triggerGameOver();
    }

    // Spawn pipes
    this.pipeTimer += dt;
    if (this.pipeTimer >= this.pipeInterval) {
      this.pipeTimer = 0;
      const gapY = 100 + Math.random() * (this.height - 200 - this.pipeGap);
      this.pipes.push({
        x: this.width,
        gapY,
        scored: false,
      });
    }

    // Move pipes
    for (const pipe of this.pipes) {
      pipe.x -= this.pipeSpeed * dt;

      // Score
      if (!pipe.scored && pipe.x + this.pipeWidth < this.birdX) {
        pipe.scored = true;
        this.addScore(10);
        if (this.options?.sound) this.options.sound.play('score');
      }

      // Collision
      if (this.birdX + this.birdSize > pipe.x && this.birdX < pipe.x + this.pipeWidth) {
        if (this.birdY < pipe.gapY || this.birdY + this.birdSize > pipe.gapY + this.pipeGap) {
          this.triggerGameOver();
        }
      }
    }

    this.pipes = this.pipes.filter(p => p.x > -this.pipeWidth);

    // Speed up over time
    if (this.pipeInterval > 1.2 && this.score > 0 && this.score % 50 === 0) {
      this.pipeInterval -= 0.1;
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Pipes
    for (const pipe of this.pipes) {
      // Top pipe
      this.drawPixelRect(ctx, pipe.x, 0, this.pipeWidth, pipe.gapY, '#00ff41', '#00fff2');
      // Bottom pipe
      this.drawPixelRect(ctx, pipe.x, pipe.gapY + this.pipeGap, this.pipeWidth,
        this.height - pipe.gapY - this.pipeGap, '#00ff41', '#00fff2');
    }

    // Bird
    ctx.save();
    ctx.translate(this.birdX + this.birdSize / 2, this.birdY + this.birdSize / 2);
    const angle = Math.min(Math.max(this.birdVY / 500, -0.5), 0.5);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(-this.birdSize / 2, -this.birdSize / 2, this.birdSize, this.birdSize);
    ctx.restore();

    if (!this.started) {
      this.drawText(ctx, 'TAP TO START', this.width / 2, this.height / 2, 12, '#00fff2');
    }

    if (this.gameOver) {
      this.drawText(ctx, 'GAME OVER', this.width / 2, this.height / 2, 20, '#ff0040');
    }
  }
}
