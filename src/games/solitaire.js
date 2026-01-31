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
    this.selected = null; // { source: 'waste'|'tableau', pileIdx, cardIdx }
  }

  isRed(card) {
    return card.suit === '♥' || card.suit === '♦';
  }

  canPlaceOnTableau(card, pile) {
    if (pile.length === 0) return card.num === 13; // Only Kings on empty
    const top = pile[pile.length - 1];
    return top.faceUp && this.isRed(card) !== this.isRed(top) && card.num === top.num - 1;
  }

  canPlaceOnFoundation(card, pile) {
    if (pile.length === 0) return card.num === 1;
    const top = pile[pile.length - 1];
    return card.suit === top.suit && card.num === top.num + 1;
  }

  flipTopCard(pile) {
    if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
      pile[pile.length - 1].faceUp = true;
    }
  }

  onTap(x, y) {
    const stockX = this.spacing;
    const stockY = 40;
    const tableauY = stockY + this.cardH + this.spacing * 2;

    // Check stock pile tap
    if (x >= stockX && x <= stockX + this.cardW && y >= stockY && y <= stockY + this.cardH) {
      this.selected = null;
      if (this.stockPile.length > 0) {
        const card = this.stockPile.pop();
        card.faceUp = true;
        this.wastePile.push(card);
        if (this.options?.sound) this.options.sound.play('blip');
      } else if (this.wastePile.length > 0) {
        while (this.wastePile.length > 0) {
          const card = this.wastePile.pop();
          card.faceUp = false;
          this.stockPile.push(card);
        }
        if (this.options?.sound) this.options.sound.play('move');
      }
      return;
    }

    // Check waste pile tap
    const wasteX = stockX + this.cardW + this.spacing;
    if (this.wastePile.length > 0 &&
        x >= wasteX && x <= wasteX + this.cardW &&
        y >= stockY && y <= stockY + this.cardH) {
      if (this.selected && this.selected.source === 'waste') {
        this.selected = null; // Deselect
      } else {
        this.selected = { source: 'waste' };
      }
      return;
    }

    // Check foundation piles tap (destination only when something selected)
    const foundX = wasteX + this.cardW + this.spacing * 3;
    for (let i = 0; i < 4; i++) {
      const px = foundX + i * (this.cardW + this.spacing);
      if (x >= px && x <= px + this.cardW && y >= stockY && y <= stockY + this.cardH) {
        if (this.selected) {
          this.tryMoveSelected('foundation', i);
        }
        return;
      }
    }

    // Check tableau piles tap
    for (let i = 0; i < this.tableau.length; i++) {
      const pile = this.tableau[i];
      const px = this.spacing + i * (this.cardW + this.spacing);

      // Click on empty tableau spot
      if (pile.length === 0 && x >= px && x <= px + this.cardW &&
          y >= tableauY && y <= tableauY + this.cardH) {
        if (this.selected) {
          this.tryMoveSelected('tableau', i);
        }
        return;
      }

      // Click on cards in pile (check from bottom up so topmost card wins)
      for (let j = pile.length - 1; j >= 0; j--) {
        const py = tableauY + j * 20;
        const cardBottom = (j === pile.length - 1) ? py + this.cardH : py + 20;
        if (x >= px && x <= px + this.cardW && y >= py && y <= cardBottom) {
          if (!pile[j].faceUp) return; // Can't select face-down cards

          if (this.selected) {
            // Try to move to this pile
            this.tryMoveSelected('tableau', i);
          } else {
            // Select this card (and all cards below it)
            this.selected = { source: 'tableau', pileIdx: i, cardIdx: j };
          }
          return;
        }
      }
    }

    // Tapped empty space — deselect
    this.selected = null;
  }

  tryMoveSelected(destType, destIdx) {
    const sel = this.selected;
    if (!sel) return;

    let cards = [];
    let sourcePile = null;

    if (sel.source === 'waste') {
      if (this.wastePile.length === 0) { this.selected = null; return; }
      cards = [this.wastePile[this.wastePile.length - 1]];
      sourcePile = this.wastePile;
    } else if (sel.source === 'tableau') {
      sourcePile = this.tableau[sel.pileIdx];
      cards = sourcePile.slice(sel.cardIdx);
    }

    if (cards.length === 0) { this.selected = null; return; }

    let moved = false;
    if (destType === 'foundation' && cards.length === 1) {
      const pile = this.piles[destIdx];
      if (this.canPlaceOnFoundation(cards[0], pile)) {
        pile.push(cards[0]);
        if (sel.source === 'waste') sourcePile.pop();
        else sourcePile.splice(sel.cardIdx, cards.length);
        this.addScore(10);
        if (this.options?.sound) this.options.sound.play('score');
        moved = true;
      }
    } else if (destType === 'tableau') {
      const destPile = this.tableau[destIdx];
      if (this.canPlaceOnTableau(cards[0], destPile)) {
        destPile.push(...cards);
        if (sel.source === 'waste') sourcePile.pop();
        else sourcePile.splice(sel.cardIdx, cards.length);
        this.addScore(5);
        if (this.options?.sound) this.options.sound.play('move');
        moved = true;
      }
    }

    if (moved) {
      // Flip top card of source tableau pile
      if (sel.source === 'tableau') {
        this.flipTopCard(this.tableau[sel.pileIdx]);
      }
      this.checkWin();
    }

    this.selected = null;
  }

  tryAutoFoundation(card, sourcePile, removeIdx) {
    for (const pile of this.piles) {
      if (this.canPlaceOnFoundation(card, pile)) {
        pile.push(card);
        if (removeIdx !== undefined) sourcePile.splice(removeIdx, 1);
        else sourcePile.pop();
        this.addScore(10);
        if (this.options?.sound) this.options.sound.play('score');
        this.checkWin();
        return true;
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

  isSelected(source, pileIdx, cardIdx) {
    if (!this.selected) return false;
    if (this.selected.source !== source) return false;
    if (source === 'waste') return true;
    return this.selected.pileIdx === pileIdx && cardIdx >= this.selected.cardIdx;
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
      this.drawCard(ctx, card, wasteX, stockY, this.isSelected('waste'));
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
        this.drawCard(ctx, card, px, py, this.isSelected('tableau', i, j));
      }
    }

    if (this.gameOver) {
      this.drawText(ctx, 'YOU WIN!', this.width / 2, this.height / 2 - 80, 20, '#00ff41');
    }
  }

  drawCard(ctx, card, x, y, selected = false) {
    if (!card.faceUp) {
      this.drawPixelRect(ctx, x, y, this.cardW, this.cardH, '#0044ff', '#00fff2');
      return;
    }

    const color = card.suit === '♥' || card.suit === '♦' ? '#ff0040' : '#000';
    const border = selected ? '#ffe600' : color;
    this.drawPixelRect(ctx, x, y, this.cardW, this.cardH, '#fff', border);

    if (selected) {
      // Yellow glow for selected cards
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, this.cardW + 2, this.cardH + 2);
      ctx.lineWidth = 1;
    }

    ctx.fillStyle = color;
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(card.value, x + 3, y + 12);
    ctx.fillText(card.suit, x + 3, y + 24);
  }
}
