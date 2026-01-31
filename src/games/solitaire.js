import { GameEngine } from '../engine/GameEngine.js';

export class SolitaireGame extends GameEngine {
  init() {
    this.cardW = 45;
    this.cardH = 60;
    this.spacing = 10;

    // Simplified solitaire
    this.deck = [];
    this.piles = [[], [], [], []]; // 4 foundation piles
    this.tableau = [[], [], [], [], [], [], []]; // 7 tableau piles

    // Create deck
    const suits = ['♥', '♦', '♣', '♠'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    for (const suit of suits) {
      for (let i = 0; i < values.length; i++) {
        this.deck.push({ suit, value: values[i], num: i + 1, faceUp: false });
      }
    }

    // Shuffle
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }

    // Deal to tableau
    for (let i = 0; i < 7; i++) {
      for (let j = i; j < 7; j++) {
        const card = this.deck.pop();
        if (i === j) card.faceUp = true;
        this.tableau[j].push(card);
      }
    }

    this.stockPile = this.deck;
    this.wastePile = [];
    this.selectedCard = null;
    this.selectedPile = null;
  }

  onTap(x, y) {
    const stockX = this.spacing;
    const stockY = this.spacing;

    // Check stock pile
    if (x >= stockX && x <= stockX + this.cardW && y >= stockY && y <= stockY + this.cardH) {
      if (this.stockPile.length > 0) {
        const card = this.stockPile.pop();
        card.faceUp = true;
        this.wastePile.push(card);
        if (this.options?.sound) this.options.sound.play('blip');
      } else if (this.wastePile.length > 0) {
        // Reset stock
        while (this.wastePile.length > 0) {
          const card = this.wastePile.pop();
          card.faceUp = false;
          this.stockPile.push(card);
        }
        if (this.options?.sound) this.options.sound.play('move');
      }
      return;
    }

    // Check waste pile
    const wasteX = stockX + this.cardW + this.spacing;
    if (this.wastePile.length > 0 &&
        x >= wasteX && x <= wasteX + this.cardW &&
        y >= stockY && y <= stockY + this.cardH) {
      const card = this.wastePile[this.wastePile.length - 1];
      if (this.tryMoveToFoundation(card, this.wastePile)) {
        this.wastePile.pop();
      }
      return;
    }

    // Check tableau piles
    const tableauY = stockY + this.cardH + this.spacing * 3;
    for (let i = 0; i < this.tableau.length; i++) {
      const pile = this.tableau[i];
      const px = this.spacing + i * (this.cardW + this.spacing);

      for (let j = 0; j < pile.length; j++) {
        const card = pile[j];
        const py = tableauY + j * 20;

        if (x >= px && x <= px + this.cardW && y >= py && y <= py + this.cardH && card.faceUp) {
          if (this.tryMoveToFoundation(card, pile)) {
            pile.splice(j, 1);
            if (pile.length > 0) pile[pile.length - 1].faceUp = true;
          }
          return;
        }
      }
    }
  }

  tryMoveToFoundation(card, sourcePile) {
    for (const pile of this.piles) {
      if (pile.length === 0) {
        if (card.num === 1) {
          pile.push(card);
          this.addScore(10);
          if (this.options?.sound) this.options.sound.play('score');
          this.checkWin();
          return true;
        }
      } else {
        const top = pile[pile.length - 1];
        if (card.suit === top.suit && card.num === top.num + 1) {
          pile.push(card);
          this.addScore(10);
          if (this.options?.sound) this.options.sound.play('score');
          this.checkWin();
          return true;
        }
      }
    }
    return false;
  }

  checkWin() {
    if (this.piles.every(p => p.length === 13)) {
      this.addScore(500);
      if (this.options?.sound) this.options.sound.play('win');
      this.triggerGameOver();
    }
  }

  update(dt) {
    // No continuous updates needed
  }

  render(ctx) {
    this.clearCanvas(ctx);

    this.drawText(ctx, 'SOLITAIRE', this.width / 2, 20, 10, '#00fff2');

    const stockX = this.spacing;
    const stockY = 40;

    // Stock pile
    if (this.stockPile.length > 0) {
      this.drawPixelRect(ctx, stockX, stockY, this.cardW, this.cardH, '#0044ff', '#00fff2');
      this.drawText(ctx, String(this.stockPile.length), stockX + this.cardW / 2, stockY + this.cardH / 2, 8, '#fff');
    } else {
      ctx.strokeStyle = '#00fff2';
      ctx.strokeRect(stockX, stockY, this.cardW, this.cardH);
    }

    // Waste pile
    const wasteX = stockX + this.cardW + this.spacing;
    if (this.wastePile.length > 0) {
      const card = this.wastePile[this.wastePile.length - 1];
      this.drawCard(ctx, card, wasteX, stockY);
    }

    // Foundation piles
    const foundX = wasteX + this.cardW + this.spacing * 3;
    for (let i = 0; i < 4; i++) {
      const px = foundX + i * (this.cardW + this.spacing);
      if (this.piles[i].length > 0) {
        const card = this.piles[i][this.piles[i].length - 1];
        this.drawCard(ctx, card, px, stockY);
      } else {
        ctx.strokeStyle = '#00fff2';
        ctx.strokeRect(px, stockY, this.cardW, this.cardH);
      }
    }

    // Tableau
    const tableauY = stockY + this.cardH + this.spacing * 2;
    for (let i = 0; i < this.tableau.length; i++) {
      const pile = this.tableau[i];
      const px = this.spacing + i * (this.cardW + this.spacing);

      if (pile.length === 0) {
        ctx.strokeStyle = '#00fff2';
        ctx.strokeRect(px, tableauY, this.cardW, this.cardH);
      }

      for (let j = 0; j < pile.length; j++) {
        const card = pile[j];
        const py = tableauY + j * 20;
        this.drawCard(ctx, card, px, py);
      }
    }

    if (this.gameOver) {
      this.drawText(ctx, 'YOU WIN!', this.width / 2, this.height / 2 - 80, 20, '#00ff41');
    }
  }

  drawCard(ctx, card, x, y) {
    if (!card.faceUp) {
      this.drawPixelRect(ctx, x, y, this.cardW, this.cardH, '#0044ff', '#00fff2');
      return;
    }

    const color = card.suit === '♥' || card.suit === '♦' ? '#ff0040' : '#000';
    this.drawPixelRect(ctx, x, y, this.cardW, this.cardH, '#fff', color);

    ctx.fillStyle = color;
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(card.value, x + 3, y + 12);
    ctx.fillText(card.suit, x + 3, y + 24);
  }
}
