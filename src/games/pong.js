import { GameEngine } from '../engine/GameEngine.js';

export class PongGame extends GameEngine {
  init() {
    // Paddle settings
    this.paddleW = 60;
    this.paddleH = 10;
    this.paddleSpeed = 300;

    // Player paddle (bottom)
    this.playerX = this.width / 2 - this.paddleW / 2;
    this.playerY = this.height - 40;

    // AI paddle (top)
    this.aiX = this.width / 2 - this.paddleW / 2;
    this.aiY = 25;
    this.aiSpeed = 100;

    // AI difficulty tuning — nerfed to be fun and beatable
    this.aiReactionDelay = 0;        // Time before AI starts reacting to new ball position
    this.aiReactionTimer = 0;        // Current timer
    this.aiTargetX = this.width / 2; // Where AI thinks the ball is (delayed/inaccurate)
    this.aiErrorMargin = 30;         // Random offset so AI doesn't perfectly track
    this.aiError = 0;                // Current error offset
    this.aiUpdateTimer = 0;          // Timer for AI to re-evaluate target
    this.aiUpdateInterval = 0.4;     // How often AI updates its target (seconds)
    this.aiMoveChance = 0.7;         // Probability AI moves on any given update (70%)

    // Ball
    this.ballSize = 8;
    this.resetBall();

    // Lives
    this.lives = 3;
    this.maxLives = 3;

    // Input
    this.moveDir = 0;
    this.targetX = null;

    // Level progression
    this.pointsToLevel = 5;
  }

  resetBall() {
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    const angle = (Math.random() * Math.PI / 3) - Math.PI / 6;
    const speed = 180 + (this.level - 1) * 15; // Slower base, gentler scaling
    this.ballVX = Math.sin(angle) * speed;
    this.ballVY = -Math.cos(angle) * speed;
    // Reset AI tracking on new ball
    this.aiTargetX = this.width / 2;
    this.aiUpdateTimer = 0;
  }

  update(dt) {
    // Player movement
    if (this.targetX !== null) {
      const diff = this.targetX - (this.playerX + this.paddleW / 2);
      if (Math.abs(diff) > 5) {
        this.playerX += Math.sign(diff) * this.paddleSpeed * dt * 1.5;
      }
    } else if (this.moveDir !== 0) {
      this.playerX += this.moveDir * this.paddleSpeed * dt;
    }
    this.playerX = Math.max(0, Math.min(this.width - this.paddleW, this.playerX));

    // AI movement — nerfed for fun gameplay
    // AI only re-evaluates its target periodically, with error
    this.aiUpdateTimer += dt;
    if (this.aiUpdateTimer >= this.aiUpdateInterval) {
      this.aiUpdateTimer = 0;
      // Only update target if ball is moving toward AI (upward)
      if (this.ballVY < 0) {
        // Add random error so AI doesn't perfectly track
        this.aiError = (Math.random() - 0.5) * this.aiErrorMargin * 2;
        this.aiTargetX = this.ballX + this.aiError;
      } else {
        // Ball is moving away — AI drifts lazily toward center
        this.aiTargetX = this.width / 2 + (Math.random() - 0.5) * 60;
      }
    }

    // AI sometimes just doesn't move (simulates human hesitation)
    const aiCenter = this.aiX + this.paddleW / 2;
    const aiDiff = this.aiTargetX - aiCenter;
    const currentAiSpeed = this.aiSpeed + (this.level - 1) * 8; // Much slower scaling
    // AI needs a bigger dead zone before it reacts
    if (Math.abs(aiDiff) > 25 && Math.random() < this.aiMoveChance) {
      this.aiX += Math.sign(aiDiff) * currentAiSpeed * dt;
    }
    this.aiX = Math.max(0, Math.min(this.width - this.paddleW, this.aiX));

    // Ball movement
    this.ballX += this.ballVX * dt;
    this.ballY += this.ballVY * dt;

    // Wall bounce (left/right)
    if (this.ballX <= 0 || this.ballX >= this.width - this.ballSize) {
      if (this.options?.sound) this.options.sound.play('blip');
      this.ballVX = -this.ballVX;
      this.ballX = Math.max(0, Math.min(this.width - this.ballSize, this.ballX));
    }

    // Player paddle collision
    if (this.ballVY > 0 &&
        this.ballY + this.ballSize >= this.playerY &&
        this.ballY + this.ballSize <= this.playerY + this.paddleH + 5 &&
        this.ballX + this.ballSize >= this.playerX &&
        this.ballX <= this.playerX + this.paddleW) {
      const hitPos = (this.ballX + this.ballSize / 2 - this.playerX) / this.paddleW;
      const angle = (hitPos - 0.5) * Math.PI / 3;
      const speed = Math.min(Math.sqrt(this.ballVX * this.ballVX + this.ballVY * this.ballVY) * 1.02, 500);
      if (this.options?.sound) this.options.sound.play('hit');
      this.ballVX = Math.sin(angle) * speed;
      this.ballVY = -Math.cos(angle) * speed;
      this.ballY = this.playerY - this.ballSize;
    }

    // AI paddle collision
    if (this.ballVY < 0 &&
        this.ballY <= this.aiY + this.paddleH &&
        this.ballY >= this.aiY - 5 &&
        this.ballX + this.ballSize >= this.aiX &&
        this.ballX <= this.aiX + this.paddleW) {
      const hitPos = (this.ballX + this.ballSize / 2 - this.aiX) / this.paddleW;
      const angle = (hitPos - 0.5) * Math.PI / 3;
      const speed = Math.sqrt(this.ballVX * this.ballVX + this.ballVY * this.ballVY);
      this.ballVX = Math.sin(angle) * speed;
      this.ballVY = Math.cos(angle) * speed;
      this.ballY = this.aiY + this.paddleH;
    }

    // Ball out bottom (player loses)
    if (this.ballY > this.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.triggerGameOver();
        return;
      }
      this.resetBall();
    }

    // Ball out top (player scores)
    if (this.ballY < 0) {
      if (this.options?.sound) this.options.sound.play('score');
      this.addScore(1);
      if (this.score % this.pointsToLevel === 0) {
        this.level++;
      }
      this.resetBall();
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Center line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2);
    ctx.lineTo(this.width, this.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // AI paddle
    this.drawPixelRect(ctx, this.aiX, this.aiY, this.paddleW, this.paddleH, '#ff0040', '#ff0040');

    // Player paddle
    this.drawPixelRect(ctx, this.playerX, this.playerY, this.paddleW, this.paddleH, '#00ff41', '#00ff41');

    // Ball
    this.drawPixelRect(ctx, this.ballX, this.ballY, this.ballSize, this.ballSize, '#ffe600', '#ffe600');

    // Lives
    for (let i = 0; i < this.lives; i++) {
      this.drawPixelRect(ctx, 10 + i * 15, this.height - 15, 8, 8, '#00ff41');
    }

    // Level indicator
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, this.height - 10, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') this.moveDir = -1;
    else if (action === 'RIGHT') this.moveDir = 1;
    else if (action === 'RELEASE') {
      this.moveDir = 0;
      this.targetX = null;
    }
  }

  onTap(x, y) {
    this.targetX = x;
  }
}
