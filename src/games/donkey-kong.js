import { GameEngine } from '../engine/GameEngine.js';

export class DonkeyKongGame extends GameEngine {
  init() {
    // Platforms
    this.platforms = [];
    this.buildLevel();

    // Player (Mario)
    this.playerX = 30;
    this.playerY = 0;
    this.playerW = 16;
    this.playerH = 20;
    this.playerVX = 0;
    this.playerVY = 0;
    this.playerSpeed = 120;
    this.jumpForce = -280;
    this.gravity = 600;
    this.onGround = false;
    this.moveDir = 0;
    this.facingRight = true;

    // Barrels
    this.barrels = [];
    this.barrelTimer = 0;
    this.barrelRate = Math.max(0.8, 2.5 - this.level * 0.3);

    // DK position
    this.dkX = 30;
    this.dkY = 0;

    // Princess position
    this.princessX = this.width / 2 - 10;
    this.princessY = 0;

    this.lives = 3;
    this.placeCharacters();
  }

  buildLevel() {
    this.platforms = [];
    const numPlatforms = 6;
    const platformH = 8;

    for (let i = 0; i < numPlatforms; i++) {
      const y = this.height - 40 - i * 80;
      const offset = (i % 2 === 0) ? 0 : 30;
      const gap = (i % 2 === 0) ? this.width - 40 : 0;

      // Each platform is slightly sloped/offset for that DK feel
      this.platforms.push({
        x: offset,
        y: y,
        w: this.width - offset - (i % 2 === 0 ? 30 : 0),
        h: platformH,
        hasLadderLeft: i > 0 && i % 2 === 1,
        hasLadderRight: i > 0 && i % 2 === 0
      });
    }

    // Ladders
    this.ladders = [];
    for (let i = 0; i < this.platforms.length - 1; i++) {
      const p = this.platforms[i];
      const above = this.platforms[i + 1];
      const lx = (i % 2 === 0) ? this.width - 50 : 40;
      this.ladders.push({
        x: lx,
        y: above.y + above.h,
        w: 16,
        h: p.y - above.y - above.h
      });
    }
  }

  placeCharacters() {
    if (this.platforms.length > 0) {
      // Player starts at bottom
      const bottom = this.platforms[0];
      this.playerX = 30;
      this.playerY = bottom.y - this.playerH;

      // DK at top
      const top = this.platforms[this.platforms.length - 1];
      this.dkX = 30;
      this.dkY = top.y - 40;

      // Princess at top
      this.princessX = this.width / 2;
      this.princessY = top.y - 24;
    }
  }

  isOnLadder() {
    for (const l of this.ladders) {
      if (this.playerX + this.playerW > l.x && this.playerX < l.x + l.w &&
          this.playerY + this.playerH > l.y && this.playerY < l.y + l.h) {
        return l;
      }
    }
    return null;
  }

  update(dt) {
    // Movement
    this.playerVX = this.moveDir * this.playerSpeed;
    const ladder = this.isOnLadder();

    if (ladder && this.climbDir) {
      this.playerVY = this.climbDir * -150;
      this.playerY += this.playerVY * dt;
    } else {
      this.playerVY += this.gravity * dt;
    }

    this.playerX += this.playerVX * dt;
    this.playerY += this.playerVY * dt;
    this.playerX = Math.max(0, Math.min(this.width - this.playerW, this.playerX));

    // Platform collision
    this.onGround = false;
    for (const p of this.platforms) {
      if (this.playerVY >= 0 &&
          this.playerY + this.playerH >= p.y &&
          this.playerY + this.playerH <= p.y + p.h + 10 &&
          this.playerX + this.playerW > p.x &&
          this.playerX < p.x + p.w) {
        this.playerY = p.y - this.playerH;
        this.playerVY = 0;
        this.onGround = true;
      }
    }

    // Fall off screen
    if (this.playerY > this.height + 50) {
      this.die();
      return;
    }

    // DK throws barrels
    this.barrelTimer -= dt;
    if (this.barrelTimer <= 0) {
      this.barrels.push({
        x: this.dkX + 30,
        y: this.dkY + 30,
        vx: 80 + this.level * 10,
        vy: 0,
        w: 12,
        h: 12,
        onPlatform: -1,
        rolling: true
      });
      this.barrelTimer = this.barrelRate * (0.7 + Math.random() * 0.6);
    }

    // Update barrels
    this.barrels = this.barrels.filter(b => {
      b.vy += this.gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Platform collision for barrels
      for (let i = 0; i < this.platforms.length; i++) {
        const p = this.platforms[i];
        if (b.vy >= 0 && b.y + b.h >= p.y && b.y + b.h <= p.y + p.h + 15 &&
            b.x + b.w > p.x && b.x < p.x + p.w) {
          b.y = p.y - b.h;
          b.vy = 0;
          // Reverse direction on each platform
          if (b.onPlatform !== i) {
            b.onPlatform = i;
            b.vx = -b.vx;
          }
        }
      }

      // Barrel-ladder: sometimes fall down
      for (const l of this.ladders) {
        if (b.vy === 0 && Math.abs(b.x + b.w / 2 - (l.x + l.w / 2)) < 10 &&
            b.y + b.h >= l.y && b.y + b.h <= l.y + 10 && Math.random() < 0.02) {
          b.vy = 50;
        }
      }

      // Off screen
      if (b.y > this.height + 20) return false;
      if (b.x < -20 || b.x > this.width + 20) return false;

      // Hit player
      if (b.x < this.playerX + this.playerW && b.x + b.w > this.playerX &&
          b.y < this.playerY + this.playerH && b.y + b.h > this.playerY) {
        this.die();
        return false;
      }

      // Jump over barrel = points
      if (b.y + b.h < this.playerY + this.playerH &&
          b.y + b.h > this.playerY &&
          Math.abs(b.x - this.playerX) < 30 &&
          this.playerVY < 0) {
        if (!b.scored) {
          if (this.options?.sound) this.options.sound.play('score');
          this.addScore(100);
          b.scored = true;
        }
      }

      return true;
    });

    // Reach princess
    if (Math.abs(this.playerX - this.princessX) < 30 &&
        Math.abs(this.playerY - this.princessY) < 30) {
      if (this.options?.sound) this.options.sound.play('win');
      this.addScore(500);
      this.level++;
      this.barrels = [];
      this.buildLevel();
      this.placeCharacters();
      this.barrelRate = Math.max(0.8, 2.5 - this.level * 0.3);
    }
  }

  die() {
    if (this.options?.sound) this.options.sound.play('die');
    this.lives--;
    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      this.placeCharacters();
      this.playerVX = 0;
      this.playerVY = 0;
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    // Platforms
    this.platforms.forEach(p => {
      this.drawPixelRect(ctx, p.x, p.y, p.w, p.h, '#ff8800');
      // Girder pattern
      for (let gx = p.x; gx < p.x + p.w; gx += 12) {
        this.drawPixelRect(ctx, gx, p.y, 6, p.h, '#cc6600');
      }
    });

    // Ladders
    this.ladders.forEach(l => {
      // Rails
      this.drawPixelRect(ctx, l.x, l.y, 3, l.h, '#00fff2');
      this.drawPixelRect(ctx, l.x + l.w - 3, l.y, 3, l.h, '#00fff2');
      // Rungs
      for (let ry = l.y + 8; ry < l.y + l.h; ry += 12) {
        this.drawPixelRect(ctx, l.x, ry, l.w, 2, '#00fff2');
      }
    });

    // DK
    this.drawPixelRect(ctx, this.dkX, this.dkY, 35, 30, '#8B4513');
    this.drawPixelRect(ctx, this.dkX + 5, this.dkY + 5, 10, 8, '#0a0a0a'); // face
    this.drawPixelRect(ctx, this.dkX + 20, this.dkY + 5, 10, 8, '#0a0a0a');
    this.drawPixelRect(ctx, this.dkX + 10, this.dkY + 15, 15, 8, '#cc8844'); // mouth
    this.drawText(ctx, 'DK', this.dkX + 17, this.dkY - 5, 10, '#ff0040', 'center');

    // Princess
    this.drawPixelRect(ctx, this.princessX, this.princessY, 16, 20, '#ff00ff');
    this.drawPixelRect(ctx, this.princessX + 4, this.princessY + 2, 8, 6, '#ffe600'); // hair
    this.drawText(ctx, 'HELP!', this.princessX + 8, this.princessY - 8, 10, '#ff00ff', 'center');

    // Player (Mario)
    this.drawPixelRect(ctx, this.playerX, this.playerY, this.playerW, this.playerH, '#ff0040'); // body
    this.drawPixelRect(ctx, this.playerX + 2, this.playerY, this.playerW - 4, 6, '#4488ff'); // hat
    this.drawPixelRect(ctx, this.playerX + 4, this.playerY + 7, 8, 5, '#ffe600'); // face
    this.drawPixelRect(ctx, this.playerX + 2, this.playerY + 14, 5, 6, '#4488ff'); // legs
    this.drawPixelRect(ctx, this.playerX + 9, this.playerY + 14, 5, 6, '#4488ff');

    // Barrels
    this.barrels.forEach(b => {
      this.drawPixelRect(ctx, b.x, b.y, b.w, b.h, '#8B4513', '#ffe600');
      this.drawPixelRect(ctx, b.x + 2, b.y + 2, b.w - 4, 3, '#6B3410');
    });

    // HUD
    for (let i = 0; i < this.lives; i++) {
      this.drawPixelRect(ctx, 10 + i * 18, this.height - 16, 12, 12, '#ff0040');
    }
    this.drawText(ctx, `LVL ${this.level}`, this.width - 10, this.height - 10, 12, '#00fff2', 'right');
  }

  onInput(action) {
    if (action === 'LEFT') { this.moveDir = -1; this.facingRight = false; this.climbDir = 0; }
    else if (action === 'RIGHT') { this.moveDir = 1; this.facingRight = true; this.climbDir = 0; }
    else if (action === 'UP') { this.climbDir = 1; this.moveDir = 0; if (this.onGround && !this.isOnLadder()) { this.playerVY = this.jumpForce; if (this.options?.sound) this.options.sound.play('blip'); } }
    else if (action === 'DOWN') { this.climbDir = -1; this.moveDir = 0; }
    else if (action === 'A' && this.onGround) { this.playerVY = this.jumpForce; if (this.options?.sound) this.options.sound.play('blip'); }
    else if (action === 'RELEASE') { this.moveDir = 0; this.climbDir = 0; }
  }

  onTap(x, y) {
    if (y < this.playerY - 20) {
      // Tap above = jump
      if (this.onGround) { this.playerVY = this.jumpForce; if (this.options?.sound) this.options.sound.play('blip'); }
      if (this.isOnLadder()) this.climbDir = 1;
    } else if (y > this.playerY + this.playerH + 20) {
      if (this.isOnLadder()) this.climbDir = -1;
    } else {
      this.moveDir = x > this.playerX + this.playerW / 2 ? 1 : -1;
    }
  }
}
