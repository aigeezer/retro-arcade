import { GameEngine } from '../engine/GameEngine.js';

export class BreakoutGame extends GameEngine {
  init() {
    this.paddleW = 80;
    this.paddleH = 12;
    this.paddleX = (this.width - this.paddleW) / 2;
    this.paddleY = this.height - 40;
    this.paddleSpeed = 350;

    this.ballSize = 8;
    this.ballX = this.width / 2;
    this.ballY = this.paddleY - 20;
    this.ballVX = 200;
    this.ballVY = -200;
    this.ballLaunched = false;

    this.brickRows = 5;
    this.brickCols = 8;
    this.brickW = this.width / this.brickCols - 4;
    this.brickH = 20;
    this.bricks = [];

    const colors = ['#ff0040', '#ff8800', '#ffe600', '#00ff41', '#00fff2'];
    for (let row = 0; row < this.brickRows; row++) {
      for (let col = 0; col < this.brickCols; col++) {
        this.bricks.push({
          x: col * (this.brickW + 4) + 2,
          y: row * (this.brickH + 4) + 40,
          w: this.brickW,
          h: this.brickH,
          color: colors[row % colors.length],
          alive: true,
        });
      }
    }
  }

  onInput(action) {
    if (action === 'A' && !this.ballLaunched) {
      this.ballLaunched = true;
      if (this.options?.sound) this.options.sound.play('blip');
    }
  }

  update(dt) {
    // Paddle movement
    if (this.options?.input?.isDown('LEFT')) {
      this.paddleX -= this.paddleSpeed * dt;
    }
    if (this.options?.input?.isDown('RIGHT')) {
      this.paddleX += this.paddleSpeed * dt;
    }
    this.paddleX = Math.max(0, Math.min(this.width - this.paddleW, this.paddleX));

    if (!this.ballLaunched) {
      this.ballX = this.paddleX + this.paddleW / 2;
      return;
    }

    // Ball movement
    this.ballX += this.ballVX * dt;
    this.ballY += this.ballVY * dt;

    // Wall collision
    if (this.ballX <= 0 || this.ballX >= this.width - this.ballSize) {
      this.ballVX *= -1;
      this.ballX = Math.max(0, Math.min(this.width - this.ballSize, this.ballX));
      if (this.options?.sound) this.options.sound.play('blip');
    }
    if (this.ballY <= 0) {
      this.ballVY *= -1;
      this.ballY = 0;
      if (this.options?.sound) this.options.sound.play('blip');
    }

    // Paddle collision
    if (this.ballY + this.ballSize >= this.paddleY &&
        this.ballY <= this.paddleY + this.paddleH &&
        this.ballX + this.ballSize >= this.paddleX &&
        this.ballX <= this.paddleX + this.paddleW) {
      this.ballVY = -Math.abs(this.ballVY);
      const hitPos = (this.ballX - this.paddleX) / this.paddleW - 0.5;
      this.ballVX += hitPos * 200;
      if (this.options?.sound) this.options.sound.play('hit');
    }

    // Brick collision
    for (const brick of this.bricks) {
      if (!brick.alive) continue;

      if (this.ballX + this.ballSize >= brick.x &&
          this.ballX <= brick.x + brick.w &&
          this.ballY + this.ballSize >= brick.y &&
          this.ballY <= brick.y + brick.h) {
        brick.alive = false;
        this.ballVY *= -1;
        this.addScore(10);
        if (this.options?.sound) this.options.sound.play('score');
        break;
      }
    }

    // Win condition
    if (this.bricks.every(b => !b.alive)) {
      this.addScore(500);
      if (this.options?.sound) this.options.sound.play('win');
      this.triggerGameOver();
    }

    // Lose condition
    if (this.ballY > this.height) {
      this.triggerGameOver();
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Bricks
    for (const brick of this.bricks) {
      if (brick.alive) {
        this.drawPixelRect(ctx, brick.x, brick.y, brick.w, brick.h, brick.color, '#ffffff');
      }
    }

    // Paddle
    this.drawPixelRect(ctx, this.paddleX, this.paddleY, this.paddleW, this.paddleH, '#00fff2', '#ffffff');

    // Ball
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(this.ballX, this.ballY, this.ballSize, this.ballSize);

    if (!this.ballLaunched) {
      this.drawText(ctx, 'PRESS A TO LAUNCH', this.width / 2, this.height - 80, 8, '#ffe600');
    }

    if (this.gameOver) {
      const msg = this.bricks.every(b => !b.alive) ? 'YOU WIN!' : 'GAME OVER';
      this.drawText(ctx, msg, this.width / 2, this.height / 2, 20, '#00ff41');
    }
  }
}
