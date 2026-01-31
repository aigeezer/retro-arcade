import { GameEngine } from '../engine/GameEngine.js';

export class CrossyRoadGame extends GameEngine {
  init() {
    this.gridSize = 12;
    this.cellSize = this.width / this.gridSize;
    this.playerX = Math.floor(this.gridSize / 2);
    this.playerY = this.gridSize - 1;
    this.playerSize = this.cellSize * 0.7;

    this.lanes = [];
    this.maxY = this.gridSize;

    for (let y = 0; y < this.gridSize; y++) {
      this.lanes.push(this.generateLane(y));
    }

    this.cameraY = 0;
    this.maxProgress = 0;
  }

  generateLane(y) {
    const types = ['safe', 'road', 'river'];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === 'road') {
      return {
        type: 'road',
        y,
        dir: Math.random() > 0.5 ? 1 : -1,
        speed: 80 + Math.random() * 60,
        cars: [],
        spawnTimer: 0,
        spawnInterval: 1.5 + Math.random(),
      };
    } else if (type === 'river') {
      const logs = [];
      for (let i = 0; i < 3; i++) {
        logs.push({ x: i * 5, w: 2 + Math.floor(Math.random() * 2) });
      }
      return {
        type: 'river',
        y,
        dir: Math.random() > 0.5 ? 1 : -1,
        speed: 60 + Math.random() * 40,
        logs,
      };
    } else {
      return { type: 'safe', y };
    }
  }

  onInput(action) {
    const moves = {
      UP: { x: 0, y: -1 },
      DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 },
      RIGHT: { x: 1, y: 0 },
    };

    const move = moves[action];
    if (!move) return;

    const newX = this.playerX + move.x;
    const newY = this.playerY + move.y;

    if (newX < 0 || newX >= this.gridSize) return;

    const oldY = this.playerY;
    this.playerX = newX;
    this.playerY = newY;

    if (this.options?.sound) this.options.sound.play('move');

    // Progress tracking
    if (newY < oldY) {
      const progress = this.gridSize - this.playerY;
      if (progress > this.maxProgress) {
        this.addScore((progress - this.maxProgress) * 10);
        this.maxProgress = progress;
      }

      // Scroll world
      if (this.playerY < 5) {
        this.shiftWorld();
      }
    }
  }

  shiftWorld() {
    this.cameraY--;
    this.playerY++;

    for (const lane of this.lanes) {
      lane.y++;
    }

    // Remove bottom lane
    this.lanes = this.lanes.filter(l => l.y < this.gridSize);

    // Add new lane at top
    this.maxY++;
    this.lanes.unshift(this.generateLane(-1));
  }

  update(dt) {
    const playerLane = this.lanes.find(l => l.y === this.playerY);

    // Update roads
    for (const lane of this.lanes) {
      if (lane.type === 'road') {
        // Spawn cars
        lane.spawnTimer += dt;
        if (lane.spawnTimer >= lane.spawnInterval) {
          lane.spawnTimer = 0;
          lane.cars.push({ x: lane.dir > 0 ? -2 : this.gridSize + 2 });
        }

        // Move cars
        for (const car of lane.cars) {
          car.x += lane.dir * lane.speed * dt / this.cellSize;
        }

        lane.cars = lane.cars.filter(c => c.x > -3 && c.x < this.gridSize + 3);

        // Check collision
        if (lane.y === this.playerY) {
          for (const car of lane.cars) {
            if (Math.abs(car.x - this.playerX) < 0.8) {
              this.triggerGameOver();
            }
          }
        }
      }

      if (lane.type === 'river') {
        // Move logs
        for (const log of lane.logs) {
          log.x += lane.dir * lane.speed * dt / this.cellSize;

          // Wrap
          if (log.x > this.gridSize + log.w) log.x = -log.w;
          if (log.x < -log.w) log.x = this.gridSize + log.w;
        }

        // Check if on log
        if (lane.y === this.playerY) {
          let onLog = false;
          for (const log of lane.logs) {
            if (this.playerX >= log.x && this.playerX < log.x + log.w) {
              onLog = true;
              this.playerX += lane.dir * lane.speed * dt / this.cellSize;
              break;
            }
          }

          if (!onLog) {
            this.triggerGameOver();
          }

          // Check boundaries
          if (this.playerX < 0 || this.playerX >= this.gridSize) {
            this.triggerGameOver();
          }
        }
      }
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Draw lanes
    for (const lane of this.lanes) {
      const y = lane.y * this.cellSize;

      if (lane.type === 'safe') {
        ctx.fillStyle = '#1a4d1a';
      } else if (lane.type === 'road') {
        ctx.fillStyle = '#333';
      } else if (lane.type === 'river') {
        ctx.fillStyle = '#003366';
      }

      ctx.fillRect(0, y, this.width, this.cellSize);

      // Draw cars
      if (lane.type === 'road') {
        for (const car of lane.cars) {
          this.drawPixelRect(ctx, car.x * this.cellSize, y + this.cellSize * 0.15,
            this.cellSize * 1.2, this.cellSize * 0.7, '#ff0040', '#ff00ff');
        }
      }

      // Draw logs
      if (lane.type === 'river') {
        for (const log of lane.logs) {
          this.drawPixelRect(ctx, log.x * this.cellSize, y + this.cellSize * 0.2,
            log.w * this.cellSize, this.cellSize * 0.6, '#8b4513', '#a0522d');
        }
      }
    }

    // Player
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.arc(
      this.playerX * this.cellSize + this.cellSize / 2,
      this.playerY * this.cellSize + this.cellSize / 2,
      this.playerSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    if (this.gameOver) {
      this.drawText(ctx, 'GAME OVER', this.width / 2, this.height / 2, 16, '#ff0040');
    }
  }
}
