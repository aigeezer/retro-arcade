import { GameEngine } from '../engine/GameEngine.js';

export class AsteroidsGame extends GameEngine {
  init() {
    // Ship
    this.shipX = this.width / 2;
    this.shipY = this.height / 2;
    this.shipAngle = -Math.PI / 2;
    this.shipVX = 0;
    this.shipVY = 0;
    this.shipSize = 12;
    this.thrustPower = 200;
    this.friction = 0.98;
    this.rotateSpeed = 4;
    this.rotating = 0;
    this.thrusting = false;
    this.thrustFlicker = 0;

    this.bullets = [];
    this.bulletSpeed = 350;
    this.bulletCooldown = 0;

    this.asteroids = [];
    this.lives = 3;
    this.invincible = 0;

    this.spawnAsteroids(3 + this.level);
  }

  spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = Math.random() * this.width;
        y = Math.random() * this.height;
      } while (Math.hypot(x - this.shipX, y - this.shipY) < 100);

      this.createAsteroid(x, y, 3);
    }
  }

  createAsteroid(x, y, size) {
    const speed = (40 + Math.random() * 40) * (4 - size + this.level * 0.3);
    const angle = Math.random() * Math.PI * 2;
    const vertices = [];
    const numVerts = 8 + Math.floor(Math.random() * 5);
    const radius = size * 12;
    for (let i = 0; i < numVerts; i++) {
      const a = (i / numVerts) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.3);
      vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }

    this.asteroids.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      radius,
      vertices,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2
    });
  }

  wrap(obj) {
    if (obj.x < -20) obj.x = this.width + 20;
    if (obj.x > this.width + 20) obj.x = -20;
    if (obj.y < -20) obj.y = this.height + 20;
    if (obj.y > this.height + 20) obj.y = -20;
  }

  update(dt) {
    // Ship rotation
    this.shipAngle += this.rotating * this.rotateSpeed * dt;

    // Thrust
    if (this.thrusting) {
      this.shipVX += Math.cos(this.shipAngle) * this.thrustPower * dt;
      this.shipVY += Math.sin(this.shipAngle) * this.thrustPower * dt;
    }

    // Ship movement with friction
    this.shipVX *= this.friction;
    this.shipVY *= this.friction;
    this.shipX += this.shipVX * dt;
    this.shipY += this.shipVY * dt;
    this.wrap(this);
    // Fix wrap reference
    this.shipX = this.x !== undefined ? this.x : this.shipX;
    this.shipY = this.y !== undefined ? this.y : this.shipY;

    // Wrap ship manually
    if (this.shipX < -20) this.shipX = this.width + 20;
    if (this.shipX > this.width + 20) this.shipX = -20;
    if (this.shipY < -20) this.shipY = this.height + 20;
    if (this.shipY > this.height + 20) this.shipY = -20;

    this.thrustFlicker += dt * 20;
    if (this.invincible > 0) this.invincible -= dt;

    // Bullets
    this.bulletCooldown -= dt;
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      return b.life > 0;
    });

    // Asteroids
    this.asteroids.forEach(a => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rotation += a.rotSpeed * dt;
      if (a.x < -30) a.x = this.width + 30;
      if (a.x > this.width + 30) a.x = -30;
      if (a.y < -30) a.y = this.height + 30;
      if (a.y > this.height + 30) a.y = -30;
    });

    // Bullet-asteroid collision
    const newAsteroids = [];
    this.asteroids = this.asteroids.filter(a => {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
          this.bullets.splice(i, 1);
          if (this.options?.sound) this.options.sound.play('hit');
          this.addScore(a.size === 3 ? 20 : a.size === 2 ? 50 : 100);
          if (a.size > 1) {
            newAsteroids.push({ x: a.x, y: a.y, size: a.size - 1 });
            newAsteroids.push({ x: a.x, y: a.y, size: a.size - 1 });
          }
          return false;
        }
      }
      return true;
    });

    newAsteroids.forEach(a => this.createAsteroid(a.x, a.y, a.size));

    // Ship-asteroid collision
    if (this.invincible <= 0) {
      for (const a of this.asteroids) {
        if (Math.hypot(a.x - this.shipX, a.y - this.shipY) < a.radius + this.shipSize) {
          if (this.options?.sound) this.options.sound.play('die');
          this.lives--;
          if (this.lives <= 0) {
            this.triggerGameOver();
            return;
          }
          this.shipX = this.width / 2;
          this.shipY = this.height / 2;
          this.shipVX = 0;
          this.shipVY = 0;
          this.invincible = 2;
          break;
        }
      }
    }

    // Level complete
    if (this.asteroids.length === 0) {
      this.level++;
      this.spawnAsteroids(3 + this.level);
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Ship (triangle)
    const show = this.invincible <= 0 || Math.floor(this.invincible * 10) % 2 === 0;
    if (show) {
      ctx.save();
      ctx.translate(this.shipX, this.shipY);
      ctx.rotate(this.shipAngle);
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.shipSize, 0);
      ctx.lineTo(-this.shipSize * 0.7, -this.shipSize * 0.6);
      ctx.lineTo(-this.shipSize * 0.4, 0);
      ctx.lineTo(-this.shipSize * 0.7, this.shipSize * 0.6);
      ctx.closePath();
      ctx.stroke();

      // Thrust flame
      if (this.thrusting && Math.floor(this.thrustFlicker) % 2 === 0) {
        ctx.strokeStyle = '#ff8800';
        ctx.beginPath();
        ctx.moveTo(-this.shipSize * 0.5, -this.shipSize * 0.3);
        ctx.lineTo(-this.shipSize * 1.2, 0);
        ctx.lineTo(-this.shipSize * 0.5, this.shipSize * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Asteroids
    this.asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      ctx.strokeStyle = '#00fff2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.vertices[0].x, a.vertices[0].y);
      for (let i = 1; i < a.vertices.length; i++) {
        ctx.lineTo(a.vertices[i].x, a.vertices[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });

    // Bullets
    this.bullets.forEach(b => {
      this.drawPixelRect(ctx, b.x - 2, b.y - 2, 4, 4, '#ffe600');
    });

    // Lives
    for (let i = 0; i < this.lives; i++) {
      ctx.save();
      ctx.translate(20 + i * 20, this.height - 15);
      ctx.rotate(-Math.PI / 2);
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-5, -4);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, this.height - 10, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') this.rotating = -1;
    else if (action === 'RIGHT') this.rotating = 1;
    else if (action === 'UP') this.thrusting = true;
    else if (action === 'A') this.shoot();
    else if (action === 'RELEASE') {
      this.rotating = 0;
      this.thrusting = false;
    }
  }

  shoot() {
    if (this.bulletCooldown > 0) return;
    if (this.options?.sound) this.options.sound.play('blip');
    this.bullets.push({
      x: this.shipX + Math.cos(this.shipAngle) * this.shipSize,
      y: this.shipY + Math.sin(this.shipAngle) * this.shipSize,
      vx: Math.cos(this.shipAngle) * this.bulletSpeed + this.shipVX * 0.5,
      vy: Math.sin(this.shipAngle) * this.bulletSpeed + this.shipVY * 0.5,
      life: 1.5
    });
    this.bulletCooldown = 0.2;
  }

  onTap(x, y) {
    // Tap to shoot toward position
    this.shipAngle = Math.atan2(y - this.shipY, x - this.shipX);
    this.shoot();
  }
}
