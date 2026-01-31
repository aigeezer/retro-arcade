import { GameEngine } from '../engine/GameEngine.js';

export class DoodleJumpGame extends GameEngine {
  init() {
    this.doodleW = 40;
    this.doodleH = 40;
    this.doodleX = this.width / 2 - this.doodleW / 2;
    this.doodleY = this.height / 2;
    this.doodleVX = 0;
    this.doodleVY = 0;
    this.gravity = 800;
    this.jumpPower = -400;
    this.moveSpeed = 200;

    this.platforms = [];
    this.platformW = 80;
    this.platformH = 15;

    for (let i = 0; i < 10; i++) {
      this.platforms.push({
        x: Math.random() * (this.width - this.platformW),
        y: i * 80,
        w: this.platformW,
        h: this.platformH,
      });
    }

    this.cameraY = 0;
    this.maxHeight = 0;
  }

  update(dt) {
    // Horizontal movement
    if (this.options?.input?.isDown('LEFT')) {
      this.doodleVX = -this.moveSpeed;
    } else if (this.options?.input?.isDown('RIGHT')) {
      this.doodleVX = this.moveSpeed;
    } else {
      this.doodleVX = 0;
    }

    this.doodleX += this.doodleVX * dt;

    // Wrap horizontally
    if (this.doodleX < -this.doodleW) this.doodleX = this.width;
    if (this.doodleX > this.width) this.doodleX = -this.doodleW;

    // Vertical movement
    this.doodleVY += this.gravity * dt;
    this.doodleY += this.doodleVY * dt;

    // Platform collision (only when falling)
    if (this.doodleVY > 0) {
      for (const plat of this.platforms) {
        if (this.doodleX + this.doodleW > plat.x &&
            this.doodleX < plat.x + plat.w &&
            this.doodleY + this.doodleH >= plat.y &&
            this.doodleY + this.doodleH <= plat.y + plat.h + 10) {
          this.doodleVY = this.jumpPower;
          if (this.options?.sound) this.options.sound.play('blip');
          break;
        }
      }
    }

    // Move camera
    if (this.doodleY < this.height / 3) {
      const shift = this.height / 3 - this.doodleY;
      this.cameraY -= shift;
      this.doodleY = this.height / 3;

      // Move platforms down
      for (const plat of this.platforms) {
        plat.y += shift;
      }

      // Remove off-screen platforms, add new ones
      this.platforms = this.platforms.filter(p => p.y < this.height + 100);
      while (this.platforms.length < 10) {
        this.platforms.push({
          x: Math.random() * (this.width - this.platformW),
          y: Math.min(...this.platforms.map(p => p.y)) - 80,
          w: this.platformW,
          h: this.platformH,
        });
      }

      // Update score
      const height = Math.floor(-this.cameraY / 10);
      if (height > this.maxHeight) {
        this.addScore(height - this.maxHeight);
        this.maxHeight = height;
      }
    }

    // Game over if fall off screen
    if (this.doodleY > this.height) {
      this.triggerGameOver();
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Platforms
    for (const plat of this.platforms) {
      this.drawPixelRect(ctx, plat.x, plat.y, plat.w, plat.h, '#00ff41', '#00fff2');
    }

    // Doodle
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(this.doodleX, this.doodleY, this.doodleW, this.doodleH);

    if (this.gameOver) {
      this.drawText(ctx, 'GAME OVER', this.width / 2, this.height / 2, 20, '#ff0040');
    }
  }
}
