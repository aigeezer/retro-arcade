/**
 * Retro Sound Manager using Web Audio API
 * Generates 8-bit style sounds procedurally
 */
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('retro_muted') === 'true';
  }

  getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  play(type) {
    if (this.muted) return;
    try {
      const sounds = {
        blip: () => this.tone(800, 0.05, 'square'),
        score: () => this.tone(600, 0.1, 'square', 900),
        die: () => this.tone(200, 0.3, 'sawtooth', 50),
        move: () => this.tone(400, 0.03, 'square'),
        clear: () => this.sweep(400, 800, 0.15, 'square'),
        drop: () => this.tone(150, 0.1, 'triangle'),
        hit: () => this.tone(300, 0.08, 'square', 100),
        powerup: () => this.sweep(300, 1200, 0.2, 'square'),
        select: () => this.tone(500, 0.06, 'square'),
        start: () => this.sweep(200, 600, 0.15, 'square'),
        gameover: () => this.sweep(400, 100, 0.5, 'sawtooth'),
        click: () => this.tone(1000, 0.02, 'square'),
        win: () => this.arpeggio([523, 659, 784, 1047], 0.1, 'square'),
      };
      const fn = sounds[type];
      if (fn) fn();
    } catch (e) {
      // Silently fail
    }
  }

  tone(freq, duration, type = 'square', endFreq = null) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq) {
      osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  sweep(startFreq, endFreq, duration, type = 'square') {
    this.tone(startFreq, duration, type, endFreq);
  }

  arpeggio(freqs, noteLen, type = 'square') {
    freqs.forEach((freq, i) => {
      setTimeout(() => this.tone(freq, noteLen, type), i * noteLen * 1000);
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('retro_muted', String(this.muted));
    return this.muted;
  }
}

// Singleton
export const sound = new SoundManager();
