import { GameEngine } from '../engine/GameEngine.js';

export class TronGame extends GameEngine {
  init() {
    this.gridSize = 4;
    this.speed = 100 + this.level * 15;

    // Player (cyan)
    this.playerX = this.width / 4;
    this.playerY = this.height / 2;
    this.playerDir = { x: 1, y: 0 };
    this.playerTrail = [{ x: this.playerX, y: this.playerY }];
    this.playerAlive = true;

    // AI opponent (orange)
    this.aiX = this.width * 3 / 4;
    this.aiY = this.height / 2;
    this.aiDir = { x: -1, y: 0 };
    this.aiTrail = [{ x: this.aiX, y: this.aiY }];
    this.aiAlive = true;
    this.aiTurnTimer = 0;

    // Multiple AI opponents at higher levels
    this.extraAI = [];
    const extraCount = Math.min(this.level - 1, 3);
    const aiColors = ['#ff00ff', '#ffe600', '#ff0040'];
    for (let i = 0; i < extraCount; i++) {
      this.extraAI.push({
        x: this.width / 2 + (Math.random() - 0.5) * this.width / 2,
        y: 50 + Math.random() * (this.height - 100),
        dir: { x: [1, -1, 0, 0][i % 4], y: [0, 0, 1, -1][i % 4] },
        trail: [],
        alive: true,
        color: aiColors[i % aiColors.length],
        turnTimer: 0
      });
      this.extraAI[i].trail.push({ x: this.extraAI[i].x, y: this.extraAI[i].y });
    }

    this.lives = 3;
    this.roundWon = false;
    this.roundTimer = 0;
    this.winsNeeded = 3;
    this.roundWins = 0;

    // Boost
    this.boosting = false;
    this.boostFuel = 100;

    // Arena border
    this.borderSize = 10;
  }

  getAllTrails() {
    const trails = [...this.playerTrail, ...this.aiTrail];
    this.extraAI.forEach(ai => trails.push(...ai.trail));
    return trails;
  }

  isCollision(x, y, ignoreTrail) {
    // Border
    if (x < this.borderSize || x > this.width - this.borderSize ||
        y < this.borderSize || y > this.height - this.borderSize) {
      return true;
    }

    // Trail collision
    const checkTrail = (trail) => {
      if (trail === ignoreTrail) {
        // Don't check last few points of own trail
        for (let i = 0; i < trail.length - 5; i++) {
          if (Math.abs(x - trail[i].x) < this.gridSize && Math.abs(y - trail[i].y) < this.gridSize) return true;
        }
      } else {
        for (const p of trail) {
          if (Math.abs(x - p.x) < this.gridSize && Math.abs(y - p.y) < this.gridSize) return true;
        }
      }
      return false;
    };

    if (checkTrail(this.playerTrail)) return true;
    if (checkTrail(this.aiTrail)) return true;
    for (const ai of this.extraAI) {
      if (checkTrail(ai.trail)) return true;
    }
    return false;
  }

  aiThink(aiObj, trail) {
    aiObj.turnTimer -= 1;
    if (aiObj.turnTimer > 0) return;

    const lookAhead = 40 + this.level * 5;
    const frontX = aiObj.x + aiObj.dir.x * lookAhead;
    const frontY = aiObj.y + aiObj.dir.y * lookAhead;

    if (this.isCollision(frontX, frontY, trail) || Math.random() < 0.02) {
      // Try turning
      const turns = [];
      if (aiObj.dir.x !== 0) {
        turns.push({ x: 0, y: -1 }, { x: 0, y: 1 });
      } else {
        turns.push({ x: -1, y: 0 }, { x: 1, y: 0 });
      }

      // Pick best turn (toward player or most open)
      let bestTurn = turns[0];
      let bestScore = -Infinity;
      for (const t of turns) {
        let score = 0;
        // Check openness
        for (let d = 10; d < 100; d += 10) {
          if (!this.isCollision(aiObj.x + t.x * d, aiObj.y + t.y * d, trail)) {
            score += 1;
          } else break;
        }
        // Slight bias toward player
        const toPlayerX = this.playerX - aiObj.x;
        const toPlayerY = this.playerY - aiObj.y;
        score += (t.x * toPlayerX + t.y * toPlayerY) * 0.001;

        if (score > bestScore) {
          bestScore = score;
          bestTurn = t;
        }
      }
      aiObj.dir = bestTurn;
      aiObj.turnTimer = 3;
    }
  }

  update(dt) {
    if (this.roundWon) {
      this.roundTimer -= dt;
      if (this.roundTimer <= 0) {
        if (this.roundWins >= this.winsNeeded) {
          this.level++;
          this.roundWins = 0;
        }
        this.init();
        this.roundWon = false;
      }
      return;
    }

    const currentSpeed = this.boosting ? this.speed * 1.5 : this.speed;
    if (this.boosting) {
      this.boostFuel -= dt * 50;
      if (this.boostFuel <= 0) this.boosting = false;
    } else {
      this.boostFuel = Math.min(100, this.boostFuel + dt * 10);
    }

    // Move player
    if (this.playerAlive) {
      this.playerX += this.playerDir.x * currentSpeed * dt;
      this.playerY += this.playerDir.y * currentSpeed * dt;

      // Snap to grid
      this.playerX = Math.round(this.playerX / this.gridSize) * this.gridSize;
      this.playerY = Math.round(this.playerY / this.gridSize) * this.gridSize;

      this.playerTrail.push({ x: this.playerX, y: this.playerY });

      if (this.isCollision(this.playerX, this.playerY, this.playerTrail)) {
        this.playerAlive = false;
        this.lives--;
        if (this.lives <= 0) {
          this.triggerGameOver();
          return;
        }
        this.roundWon = true;
        this.roundTimer = 1.5;
      }
    }

    // Move main AI
    if (this.aiAlive) {
      const aiState = { x: this.aiX, y: this.aiY, dir: this.aiDir, turnTimer: this.aiTurnTimer };
      this.aiThink(aiState, this.aiTrail);
      this.aiDir = aiState.dir;
      this.aiTurnTimer = aiState.turnTimer;
      this.aiX += this.aiDir.x * this.speed * dt;
      this.aiY += this.aiDir.y * this.speed * dt;
      this.aiX = Math.round(this.aiX / this.gridSize) * this.gridSize;
      this.aiY = Math.round(this.aiY / this.gridSize) * this.gridSize;
      this.aiTrail.push({ x: this.aiX, y: this.aiY });

      if (this.isCollision(this.aiX, this.aiY, this.aiTrail)) {
        this.aiAlive = false;
      }
    }

    // Move extra AIs
    this.extraAI.filter(ai => ai.alive).forEach(ai => {
      this.aiThink(ai, ai.trail);
      ai.x += ai.dir.x * this.speed * dt;
      ai.y += ai.dir.y * this.speed * dt;
      ai.x = Math.round(ai.x / this.gridSize) * this.gridSize;
      ai.y = Math.round(ai.y / this.gridSize) * this.gridSize;
      ai.trail.push({ x: ai.x, y: ai.y });

      if (this.isCollision(ai.x, ai.y, ai.trail)) {
        ai.alive = false;
      }
    });

    // Check win condition
    const allAIDead = !this.aiAlive && this.extraAI.every(ai => !ai.alive);
    if (this.playerAlive && allAIDead) {
      this.roundWins++;
      this.addScore(100 * this.level);
      this.roundWon = true;
      this.roundTimer = 1.5;
    }
  }

  renderTrail(ctx, trail, color, headX, headY) {
    if (trail.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = this.gridSize;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y);
    }
    ctx.stroke();

    // Glow head
    this.drawPixelRect(ctx, headX - this.gridSize, headY - this.gridSize, this.gridSize * 2, this.gridSize * 2, color);
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Grid lines
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 0.5;
    for (let x = this.borderSize; x < this.width - this.borderSize; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, this.borderSize); ctx.lineTo(x, this.height - this.borderSize); ctx.stroke();
    }
    for (let y = this.borderSize; y < this.height - this.borderSize; y += 20) {
      ctx.beginPath(); ctx.moveTo(this.borderSize, y); ctx.lineTo(this.width - this.borderSize, y); ctx.stroke();
    }

    // Border
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.borderSize, this.borderSize, this.width - this.borderSize * 2, this.height - this.borderSize * 2);

    // Player trail
    if (this.playerAlive) {
      this.renderTrail(ctx, this.playerTrail, '#00fff2', this.playerX, this.playerY);
    }

    // AI trail
    if (this.aiAlive) {
      this.renderTrail(ctx, this.aiTrail, '#ff8800', this.aiX, this.aiY);
    }

    // Extra AI trails
    this.extraAI.filter(ai => ai.alive).forEach(ai => {
      this.renderTrail(ctx, ai.trail, ai.color, ai.x, ai.y);
    });

    // Dead trails (dimmed)
    if (!this.playerAlive) {
      ctx.globalAlpha = 0.3;
      this.renderTrail(ctx, this.playerTrail, '#00fff2', this.playerX, this.playerY);
      ctx.globalAlpha = 1;
    }
    if (!this.aiAlive) {
      ctx.globalAlpha = 0.3;
      this.renderTrail(ctx, this.aiTrail, '#ff8800', this.aiX, this.aiY);
      ctx.globalAlpha = 1;
    }

    // Boost meter
    this.drawRect(ctx, 10, this.height - 18, 60, 8, '#111111');
    this.drawRect(ctx, 10, this.height - 18, 60 * (this.boostFuel / 100), 8, '#00fff2');
    this.drawText(ctx, 'BOOST', 40, this.height - 10, 8, '#00fff2', 'center');

    // HUD
    this.drawText(ctx, `WINS ${this.roundWins}/${this.winsNeeded}`, this.width / 2, 25, 12, '#ffe600', 'center');
    for (let i = 0; i < this.lives; i++) {
      this.drawPixelRect(ctx, this.width - 30 - i * 14, 12, 10, 10, '#00fff2');
    }
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, this.height - 10, 12, '#00fff2', 'right');

    if (this.roundWon) {
      const msg = this.playerAlive ? 'YOU WIN!' : 'CRASHED!';
      const color = this.playerAlive ? '#00ff41' : '#ff0040';
      this.drawText(ctx, msg, this.width / 2, this.height / 2, 24, color, 'center');
    }
  }

  onInput(action) {
    if (action === 'LEFT' && this.playerDir.x === 0) this.playerDir = { x: -1, y: 0 };
    else if (action === 'RIGHT' && this.playerDir.x === 0) this.playerDir = { x: 1, y: 0 };
    else if (action === 'UP' && this.playerDir.y === 0) this.playerDir = { x: 0, y: -1 };
    else if (action === 'DOWN' && this.playerDir.y === 0) this.playerDir = { x: 0, y: 1 };
    else if (action === 'A') this.boosting = true;
    else if (action === 'B') this.boosting = false;
  }

  onTap(x, y) {
    const dx = x - this.playerX;
    const dy = y - this.playerY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && this.playerDir.x === 0) this.playerDir = { x: 1, y: 0 };
      else if (dx < 0 && this.playerDir.x === 0) this.playerDir = { x: -1, y: 0 };
    } else {
      if (dy > 0 && this.playerDir.y === 0) this.playerDir = { x: 0, y: 1 };
      else if (dy < 0 && this.playerDir.y === 0) this.playerDir = { x: 0, y: -1 };
    }
  }
}
