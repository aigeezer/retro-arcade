import { GameEngine } from '../engine/GameEngine.js';

export class HangmanGame extends GameEngine {
  init() {
    this.words = ['ARCADE', 'RETRO', 'PIXEL', 'JOYSTICK', 'CONSOLE', 'GAME', 'PLAYER', 'SCORE', 'VICTORY', 'CLASSIC'];
    this.word = this.words[Math.floor(Math.random() * this.words.length)];
    this.guessed = new Set();
    this.wrongGuesses = 0;
    this.maxWrong = 6;

    this.keyboard = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    this.keySize = 30;
    this.keySpacing = 8;
    this.keysPerRow = 7;
  }

  onTap(x, y) {
    if (this.gameOver) return;

    // Check keyboard
    const startY = this.height - 200;
    for (let i = 0; i < this.keyboard.length; i++) {
      const letter = this.keyboard[i];
      if (this.guessed.has(letter)) continue;

      const row = Math.floor(i / this.keysPerRow);
      const col = i % this.keysPerRow;
      const kx = this.width / 2 - (this.keysPerRow * (this.keySize + this.keySpacing)) / 2 + col * (this.keySize + this.keySpacing);
      const ky = startY + row * (this.keySize + this.keySpacing);

      if (x >= kx && x <= kx + this.keySize && y >= ky && y <= ky + this.keySize) {
        this.guessed.add(letter);

        if (this.word.includes(letter)) {
          this.addScore(10);
          if (this.options?.sound) this.options.sound.play('score');

          // Check win
          if (this.word.split('').every(l => this.guessed.has(l))) {
            this.addScore(100);
            if (this.options?.sound) this.options.sound.play('win');
            this.triggerGameOver();
          }
        } else {
          this.wrongGuesses++;
          if (this.options?.sound) this.options.sound.play('hit');

          if (this.wrongGuesses >= this.maxWrong) {
            this.triggerGameOver();
          }
        }

        break;
      }
    }
  }

  update(dt) {
    // No continuous updates needed
  }

  render(ctx) {
    this.clearCanvas(ctx);

    this.drawText(ctx, 'HANGMAN', this.width / 2, 30, 12, '#00fff2');

    // Word
    const letterSpacing = 40;
    const wordWidth = this.word.length * letterSpacing;
    const wordX = (this.width - wordWidth) / 2;
    const wordY = 120;

    for (let i = 0; i < this.word.length; i++) {
      const letter = this.word[i];
      const x = wordX + i * letterSpacing;

      if (this.guessed.has(letter) || this.gameOver) {
        this.drawText(ctx, letter, x + letterSpacing / 2, wordY, 20, '#00ff41');
      } else {
        ctx.strokeStyle = '#00fff2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, wordY + 15);
        ctx.lineTo(x + letterSpacing - 10, wordY + 15);
        ctx.stroke();
      }
    }

    // Hangman drawing
    this.drawHangman(ctx, this.wrongGuesses);

    // Keyboard
    const startY = this.height - 200;
    for (let i = 0; i < this.keyboard.length; i++) {
      const letter = this.keyboard[i];
      const row = Math.floor(i / this.keysPerRow);
      const col = i % this.keysPerRow;
      const x = this.width / 2 - (this.keysPerRow * (this.keySize + this.keySpacing)) / 2 + col * (this.keySize + this.keySpacing);
      const y = startY + row * (this.keySize + this.keySpacing);

      const used = this.guessed.has(letter);
      const color = used ? (this.word.includes(letter) ? '#00ff41' : '#ff0040') : '#0044ff';

      this.drawPixelRect(ctx, x, y, this.keySize, this.keySize, color, '#00fff2');
      this.drawText(ctx, letter, x + this.keySize / 2, y + this.keySize / 2, 10, '#ffffff');
    }

    if (this.gameOver) {
      const msg = this.wrongGuesses >= this.maxWrong ? 'YOU LOSE!' : 'YOU WIN!';
      const color = this.wrongGuesses >= this.maxWrong ? '#ff0040' : '#00ff41';
      this.drawText(ctx, msg, this.width / 2, 80, 16, color);
    }
  }

  drawHangman(ctx, stage) {
    const x = this.width / 2 + 80;
    const y = 200;

    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 3;

    // Base
    if (stage >= 1) {
      ctx.beginPath();
      ctx.moveTo(x - 40, y + 80);
      ctx.lineTo(x + 40, y + 80);
      ctx.stroke();
    }

    // Pole
    if (stage >= 2) {
      ctx.beginPath();
      ctx.moveTo(x, y + 80);
      ctx.lineTo(x, y - 60);
      ctx.stroke();
    }

    // Top
    if (stage >= 3) {
      ctx.beginPath();
      ctx.moveTo(x, y - 60);
      ctx.lineTo(x + 30, y - 60);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 30, y - 60);
      ctx.lineTo(x + 30, y - 40);
      ctx.stroke();
    }

    // Head
    if (stage >= 4) {
      ctx.beginPath();
      ctx.arc(x + 30, y - 30, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body
    if (stage >= 5) {
      ctx.beginPath();
      ctx.moveTo(x + 30, y - 20);
      ctx.lineTo(x + 30, y + 10);
      ctx.stroke();
    }

    // Legs
    if (stage >= 6) {
      ctx.beginPath();
      ctx.moveTo(x + 30, y + 10);
      ctx.lineTo(x + 20, y + 30);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 30, y + 10);
      ctx.lineTo(x + 40, y + 30);
      ctx.stroke();
    }
  }
}
