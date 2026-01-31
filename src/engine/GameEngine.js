/**
 * Base GameEngine class - all games extend this
 */
export class GameEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = options.width || 400;
    this.height = options.height || 600;
    this.score = 0;
    this.highScore = 0;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;
    this.running = false;
    this.lastTime = 0;
    this.animFrameId = null;
    this.onScoreChange = options.onScoreChange || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    
    // Load high score
    this.gameId = options.gameId || 'unknown';
    this.highScore = parseInt(localStorage.getItem(`retro_hs_${this.gameId}`) || '0');
    
    this.resize();
  }

  resize() {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const scale = Math.min(containerW / this.width, containerH / this.height);
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = `${this.width * scale}px`;
    this.canvas.style.height = `${this.height * scale}px`;
    this.scale = scale;
  }

  start() {
    this.running = true;
    this.gameOver = false;
    this.paused = false;
    this.score = 0;
    this.level = 1;
    this.init();
    this.onScoreChange(this.score);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  loop(timestamp) {
    if (!this.running) return;
    
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // cap at 100ms
    this.lastTime = timestamp;
    
    if (!this.paused && !this.gameOver) {
      this.update(dt);
    }
    
    this.render(this.ctx);
    this.animFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  setScore(score) {
    this.score = score;
    this.onScoreChange(this.score);
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(`retro_hs_${this.gameId}`, String(this.highScore));
    }
  }

  addScore(points) {
    this.setScore(this.score + points);
  }

  triggerGameOver() {
    this.gameOver = true;
    this.onGameOver(this.score);
  }

  togglePause() {
    this.paused = !this.paused;
  }

  // Override these in subclasses
  init() {}
  update(dt) {}
  render(ctx) {}
  onInput(action) {}
  cleanup() {}

  // Utility drawing methods
  drawText(ctx, text, x, y, size = 12, color = '#00ff41', align = 'center') {
    ctx.save();
    ctx.font = `${size}px 'Press Start 2P', monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = size / 2;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  drawPixelRect(ctx, x, y, w, h, color, borderColor) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
  }

  clearCanvas(ctx, color = '#0a0a0a') {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
