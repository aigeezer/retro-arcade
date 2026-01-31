import { GameEngine } from '../engine/GameEngine.js';

export class FroggerGame extends GameEngine {
  init() {
    this.cellSize = 30;
    this.cols = Math.floor(this.width / this.cellSize);
    this.laneCount = 14;
    this.offsetY = this.height - this.laneCount * this.cellSize;

    this.frogCol = Math.floor(this.cols / 2);
    this.frogRow = this.laneCount - 1;
    this.frogX = this.frogCol * this.cellSize;
    this.frogY = this.offsetY + this.frogRow * this.cellSize;
    this.frogTargetX = this.frogX;
    this.frogTargetY = this.frogY;
    this.frogSize = this.cellSize - 4;
    this.moving = false;
    this.moveTimer = 0;

    this.lives = 3;
    this.slots = [false, false, false, false, false];

    this.lanes = [];
    this.setupLanes();
  }

  setupLanes() {
    this.lanes = [];
    const speed = 40 + this.level * 10;

    for (let i = 0; i < this.laneCount; i++) {
      if (i === 0) {
        // Goal row
        this.lanes.push({ type: 'goal', objects: [] });
      } else if (i >= 1 && i <= 5) {
        // Water (logs)
        const dir = i % 2 === 0 ? 1 : -1;
        const logSpeed = speed * (0.6 + Math.random() * 0.6) * dir;
        const logs = [];
        const count = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < count; j++) {
          logs.push({
            x: j * (this.width / count) + Math.random() * 40,
            w: 60 + Math.random() * 40,
            speed: logSpeed
          });
        }
        this.lanes.push({ type: 'water', objects: logs });
      } else if (i === 6) {
        // Safe zone
        this.lanes.push({ type: 'safe', objects: [] });
      } else if (i >= 7 && i <= 12) {
        // Road (cars)
        const dir = i % 2 === 0 ? 1 : -1;
        const carSpeed = speed * (0.7 + Math.random() * 0.8) * dir;
        const cars = [];
        const count = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < count; j++) {
          cars.push({
            x: j * (this.width / count) + Math.random() * 60,
            w: 30 + Math.random() * 20,
            speed: carSpeed
          });
        }
        this.lanes.push({ type: 'road', objects: cars });
      } else {
        // Start zone
        this.lanes.push({ type: 'safe', objects: [] });
      }
    }
  }

  update(dt) {
    // Smooth frog movement
    if (this.moving) {
      this.moveTimer -= dt;
      const t = 1 - Math.max(0, this.moveTimer / 0.1);
      this.frogX += (this.frogTargetX - this.frogX) * Math.min(1, t * 3);
      this.frogY += (this.frogTargetY - this.frogY) * Math.min(1, t * 3);
      if (this.moveTimer <= 0) {
        this.frogX = this.frogTargetX;
        this.frogY = this.frogTargetY;
        this.moving = false;
      }
    }

    // Update lane objects
    this.lanes.forEach(lane => {
      lane.objects.forEach(obj => {
        obj.x += obj.speed * dt;
        if (obj.x > this.width + 50) obj.x = -obj.w - 20;
        if (obj.x + obj.w < -50) obj.x = this.width + 20;
      });
    });

    // Check collisions only when not moving
    if (!this.moving && this.frogRow >= 0 && this.frogRow < this.laneCount) {
      const lane = this.lanes[this.frogRow];

      if (lane.type === 'road') {
        for (const car of lane.objects) {
          if (this.frogX + this.frogSize > car.x && this.frogX < car.x + car.w) {
            this.die();
            return;
          }
        }
      }

      if (lane.type === 'water') {
        let onLog = false;
        for (const log of lane.objects) {
          if (this.frogX + this.frogSize > log.x && this.frogX < log.x + log.w) {
            onLog = true;
            this.frogX += log.speed * dt;
            this.frogTargetX = this.frogX;
            this.frogCol = Math.floor(this.frogX / this.cellSize);
          }
        }
        if (!onLog) {
          this.die();
          return;
        }
      }

      // Off screen
      if (this.frogX < -this.cellSize || this.frogX > this.width) {
        this.die();
        return;
      }

      if (lane.type === 'goal') {
        const slotWidth = this.width / 5;
        const slotIndex = Math.floor((this.frogX + this.frogSize / 2) / slotWidth);
        if (slotIndex >= 0 && slotIndex < 5 && !this.slots[slotIndex]) {
          this.slots[slotIndex] = true;
          if (this.options?.sound) this.options.sound.play('score');
          this.addScore(100 + this.frogRow * 10);
          this.resetFrog();

          if (this.slots.every(s => s)) {
            if (this.options?.sound) this.options.sound.play('win');
            this.level++;
            this.slots = [false, false, false, false, false];
            this.setupLanes();
            this.addScore(500);
          }
        } else {
          this.die();
        }
      }
    }
  }

  die() {
    if (this.options?.sound) this.options.sound.play('die');
    this.lives--;
    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      this.resetFrog();
    }
  }

  resetFrog() {
    this.frogCol = Math.floor(this.cols / 2);
    this.frogRow = this.laneCount - 1;
    this.frogX = this.frogCol * this.cellSize;
    this.frogY = this.offsetY + this.frogRow * this.cellSize;
    this.frogTargetX = this.frogX;
    this.frogTargetY = this.frogY;
    this.moving = false;
  }

  tryMove(dr, dc) {
    if (this.moving) return;
    const newRow = this.frogRow + dr;
    const newCol = this.frogCol + dc;
    if (newRow < 0 || newRow >= this.laneCount) return;

    const newX = this.frogX + dc * this.cellSize;
    if (newX < 0 || newX > this.width - this.frogSize) return;

    this.frogRow = newRow;
    this.frogCol = Math.max(0, Math.min(this.cols - 1, newCol));
    this.frogTargetX = newX;
    this.frogTargetY = this.offsetY + this.frogRow * this.cellSize;
    this.moving = true;
    this.moveTimer = 0.1;
    if (this.options?.sound) this.options.sound.play('move');

    if (dr < 0) this.addScore(10);
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Draw lanes
    for (let i = 0; i < this.laneCount; i++) {
      const y = this.offsetY + i * this.cellSize;
      const lane = this.lanes[i];

      if (lane.type === 'water') {
        this.drawRect(ctx, 0, y, this.width, this.cellSize, '#001a33');
        // Logs
        lane.objects.forEach(log => {
          this.drawPixelRect(ctx, log.x, y + 3, log.w, this.cellSize - 6, '#8B4513', '#6B3410');
          // Log detail lines
          for (let lx = log.x + 10; lx < log.x + log.w - 5; lx += 15) {
            this.drawRect(ctx, lx, y + this.cellSize / 2 - 1, 8, 2, '#6B3410');
          }
        });
      } else if (lane.type === 'road') {
        this.drawRect(ctx, 0, y, this.width, this.cellSize, '#1a1a1a');
        // Lane markers
        for (let x = 0; x < this.width; x += 30) {
          this.drawRect(ctx, x, y + this.cellSize / 2 - 1, 15, 2, '#333333');
        }
        // Cars
        lane.objects.forEach(car => {
          const colors = ['#ff0040', '#ffe600', '#ff8800', '#ff00ff', '#4488ff'];
          const color = colors[Math.abs(Math.floor(car.speed)) % colors.length];
          this.drawPixelRect(ctx, car.x, y + 4, car.w, this.cellSize - 8, color, '#ffffff');
          // Windshield
          this.drawPixelRect(ctx, car.x + car.w * 0.3, y + 6, car.w * 0.25, this.cellSize - 14, '#00fff2');
        });
      } else if (lane.type === 'safe') {
        this.drawRect(ctx, 0, y, this.width, this.cellSize, '#0a1a0a');
        // Grass detail
        for (let x = 5; x < this.width; x += 12) {
          this.drawRect(ctx, x, y + 2, 2, this.cellSize - 4, '#0a2a0a');
        }
      } else if (lane.type === 'goal') {
        this.drawRect(ctx, 0, y, this.width, this.cellSize, '#0a0a2a');
        // Goal slots
        const slotW = this.width / 5;
        for (let s = 0; s < 5; s++) {
          if (this.slots[s]) {
            this.drawPixelRect(ctx, s * slotW + 5, y + 3, slotW - 10, this.cellSize - 6, '#00ff41');
          } else {
            this.drawPixelRect(ctx, s * slotW + 10, y + 5, slotW - 20, this.cellSize - 10, '#1a1a4a', '#4488ff');
          }
        }
      }
    }

    // Draw frog
    const frogColor = '#00ff41';
    const fx = this.frogX;
    const fy = this.frogY;
    const fs = this.frogSize;
    // Body
    this.drawPixelRect(ctx, fx + 4, fy + 4, fs - 8, fs - 8, frogColor);
    // Eyes
    this.drawPixelRect(ctx, fx + 2, fy + 2, 6, 6, frogColor);
    this.drawPixelRect(ctx, fx + fs - 8, fy + 2, 6, 6, frogColor);
    this.drawPixelRect(ctx, fx + 4, fy + 3, 3, 3, '#0a0a0a');
    this.drawPixelRect(ctx, fx + fs - 7, fy + 3, 3, 3, '#0a0a0a');
    // Legs
    this.drawPixelRect(ctx, fx, fy + fs - 10, 4, 8, frogColor);
    this.drawPixelRect(ctx, fx + fs - 4, fy + fs - 10, 4, 8, frogColor);

    // HUD
    for (let i = 0; i < this.lives; i++) {
      this.drawPixelRect(ctx, 10 + i * 18, 10, 12, 12, '#00ff41');
    }
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, 20, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'UP') this.tryMove(-1, 0);
    else if (action === 'DOWN') this.tryMove(1, 0);
    else if (action === 'LEFT') this.tryMove(0, -1);
    else if (action === 'RIGHT') this.tryMove(0, 1);
  }

  onTap(x, y) {
    const dx = x - (this.frogX + this.frogSize / 2);
    const dy = y - (this.frogY + this.frogSize / 2);
    if (Math.abs(dx) > Math.abs(dy)) {
      this.tryMove(0, dx > 0 ? 1 : -1);
    } else {
      this.tryMove(dy > 0 ? 1 : -1, 0);
    }
  }
}
