import { GameEngine } from '../engine/GameEngine.js';

export class SimonGame extends GameEngine {
  init() {
    this.sequence = [];
    this.playerSequence = [];
    this.playing = false;
    this.currentStep = 0;

    this.buttons = [
      { x: this.width / 2 - 80, y: this.height / 2 - 80, w: 70, h: 70, color: '#ff0040', lit: false, sound: 400 },
      { x: this.width / 2 + 10, y: this.height / 2 - 80, w: 70, h: 70, color: '#00ff41', lit: false, sound: 500 },
      { x: this.width / 2 - 80, y: this.height / 2 + 10, w: 70, h: 70, color: '#ffe600', lit: false, sound: 600 },
      { x: this.width / 2 + 10, y: this.height / 2 + 10, w: 70, h: 70, color: '#00fff2', lit: false, sound: 700 },
    ];

    this.state = 'waiting'; // waiting, showing, input
    this.litTimer = 0;
    this.litButton = -1;
  }

  start() {
    super.start();
    this.nextRound();
  }

  nextRound() {
    this.sequence.push(Math.floor(Math.random() * 4));
    this.playerSequence = [];
    this.currentStep = 0;
    this.state = 'showing';
    this.showSequence();
  }

  showSequence() {
    if (this.currentStep >= this.sequence.length) {
      this.state = 'input';
      return;
    }

    const btnIdx = this.sequence[this.currentStep];
    this.litButton = btnIdx;
    this.litTimer = 0.5;
    this.buttons[btnIdx].lit = true;

    if (this.options?.sound) {
      this.options.sound.play('blip');
    }

    setTimeout(() => {
      this.buttons[btnIdx].lit = false;
      this.currentStep++;
      setTimeout(() => this.showSequence(), 300);
    }, 500);
  }

  onTap(x, y) {
    if (this.state !== 'input') return;

    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        this.playerSequence.push(i);
        this.litButton = i;
        this.litTimer = 0.2;
        btn.lit = true;

        if (this.options?.sound) this.options.sound.play('blip');

        setTimeout(() => { btn.lit = false; }, 200);

        // Check correctness
        const idx = this.playerSequence.length - 1;
        if (this.playerSequence[idx] !== this.sequence[idx]) {
          this.triggerGameOver();
          return;
        }

        // Round complete
        if (this.playerSequence.length === this.sequence.length) {
          this.addScore(this.sequence.length * 10);
          if (this.options?.sound) this.options.sound.play('powerup');
          setTimeout(() => this.nextRound(), 1000);
        }

        break;
      }
    }
  }

  update(dt) {
    if (this.litTimer > 0) {
      this.litTimer -= dt;
    }
  }

  render(ctx) {
    this.clearCanvas(ctx);

    this.drawText(ctx, 'SIMON SAYS', this.width / 2, 40, 14, '#00fff2');
    this.drawText(ctx, `ROUND ${this.sequence.length}`, this.width / 2, 70, 10, '#ffe600');

    for (const btn of this.buttons) {
      const color = btn.lit ? btn.color : this.darken(btn.color);
      this.drawPixelRect(ctx, btn.x, btn.y, btn.w, btn.h, color, btn.color);
    }

    if (this.state === 'waiting') {
      this.drawText(ctx, 'TAP TO START', this.width / 2, this.height - 40, 10, '#00ff41');
    } else if (this.state === 'showing') {
      this.drawText(ctx, 'WATCH...', this.width / 2, this.height - 40, 10, '#ff00ff');
    } else if (this.state === 'input') {
      this.drawText(ctx, 'YOUR TURN', this.width / 2, this.height - 40, 10, '#00ff41');
    }

    if (this.gameOver) {
      this.drawText(ctx, 'GAME OVER', this.width / 2, this.height / 2 - 100, 20, '#ff0040');
    }
  }

  darken(color) {
    // Simple darken by reducing hex values
    const hex = color.slice(1);
    const r = Math.floor(parseInt(hex.slice(0, 2), 16) * 0.3);
    const g = Math.floor(parseInt(hex.slice(2, 4), 16) * 0.3);
    const b = Math.floor(parseInt(hex.slice(4, 6), 16) * 0.3);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
