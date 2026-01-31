import { GameEngine } from '../engine/GameEngine.js';

export class MemoryMatchGame extends GameEngine {
  init() {
    this.gridCols = 4;
    this.gridRows = 4;
    this.cardW = 70;
    this.cardH = 70;
    this.spacing = 10;

    const symbols = ['🔴', '🟢', '🔵', '🟡', '🟠', '🟣', '⚫', '⚪'];
    const deck = [...symbols, ...symbols];
    deck.sort(() => Math.random() - 0.5);

    this.cards = [];
    const startX = (this.width - (this.gridCols * (this.cardW + this.spacing) - this.spacing)) / 2;
    const startY = (this.height - (this.gridRows * (this.cardH + this.spacing) - this.spacing)) / 2 + 40;

    for (let i = 0; i < deck.length; i++) {
      const col = i % this.gridCols;
      const row = Math.floor(i / this.gridCols);
      this.cards.push({
        x: startX + col * (this.cardW + this.spacing),
        y: startY + row * (this.cardH + this.spacing),
        w: this.cardW,
        h: this.cardH,
        symbol: deck[i],
        flipped: false,
        matched: false,
      });
    }

    this.flipped = [];
    this.lockInput = false;
  }

  onTap(x, y) {
    if (this.lockInput || this.flipped.length >= 2) return;

    for (const card of this.cards) {
      if (card.matched || card.flipped) continue;

      if (x >= card.x && x <= card.x + card.w &&
          y >= card.y && y <= card.y + card.h) {
        card.flipped = true;
        this.flipped.push(card);
        if (this.options?.sound) this.options.sound.play('blip');

        if (this.flipped.length === 2) {
          this.lockInput = true;
          setTimeout(() => this.checkMatch(), 800);
        }

        break;
      }
    }
  }

  checkMatch() {
    const [a, b] = this.flipped;

    if (a.symbol === b.symbol) {
      a.matched = true;
      b.matched = true;
      this.addScore(20);
      if (this.options?.sound) this.options.sound.play('score');

      // Check win
      if (this.cards.every(c => c.matched)) {
        this.addScore(100);
        if (this.options?.sound) this.options.sound.play('win');
        this.triggerGameOver();
      }
    } else {
      a.flipped = false;
      b.flipped = false;
    }

    this.flipped = [];
    this.lockInput = false;
  }

  update(dt) {
    // No continuous updates needed
  }

  render(ctx) {
    this.clearCanvas(ctx);

    this.drawText(ctx, 'MEMORY MATCH', this.width / 2, 30, 12, '#00fff2');

    for (const card of this.cards) {
      if (card.matched) {
        this.drawPixelRect(ctx, card.x, card.y, card.w, card.h, '#1a1a1a', '#333');
      } else if (card.flipped) {
        this.drawPixelRect(ctx, card.x, card.y, card.w, card.h, '#00ff41', '#00fff2');
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.symbol, card.x + card.w / 2, card.y + card.h / 2);
      } else {
        this.drawPixelRect(ctx, card.x, card.y, card.w, card.h, '#0044ff', '#00fff2');
      }
    }

    if (this.gameOver) {
      this.drawText(ctx, 'YOU WIN!', this.width / 2, this.height / 2 - 100, 20, '#00ff41');
    }
  }
}
