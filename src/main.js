import './css/style.css';
import { InputManager } from './engine/InputManager.js';
import { sound } from './engine/SoundManager.js';
import { gameRegistry } from './games/index.js';

const app = document.getElementById('app');
const input = new InputManager();

let currentGame = null;
let currentCleanup = null;

// ===== SAVE/LOAD =====
function getProgress() {
  try {
    return JSON.parse(localStorage.getItem('retro_progress') || '{}');
  } catch { return {}; }
}

function unlockGame(id) {
  const progress = getProgress();
  progress[id] = { unlocked: true, ...(progress[id] || {}) };
  localStorage.setItem('retro_progress', JSON.stringify(progress));
}

function isUnlocked(id, index) {
  if (index < 5) return true; // First 5 always unlocked
  const progress = getProgress();
  return progress[id]?.unlocked === true;
}

function getHighScore(id) {
  return parseInt(localStorage.getItem(`retro_hs_${id}`) || '0');
}

function getTotalScore() {
  let total = 0;
  gameRegistry.forEach(g => { total += getHighScore(g.id); });
  return total;
}

function getUnlockedCount() {
  let count = 0;
  gameRegistry.forEach((g, i) => { if (isUnlocked(g.id, i)) count++; });
  return count;
}

// ===== MENU SCREEN =====
function showMenu() {
  if (currentGame) {
    currentGame.stop();
    currentGame = null;
  }
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  const unlockedCount = getUnlockedCount();
  const totalScore = getTotalScore();

  app.innerHTML = `
    <div class="crt-overlay"></div>
    <div class="menu-screen">
      <div class="menu-header">
        <div class="menu-title flicker">RETRO ARCADE</div>
        <div class="menu-subtitle">30 CLASSIC GAMES</div>
      </div>
      <div class="menu-stats">
        <span>🕹️ ${unlockedCount}/30</span>
        <span>🏆 ${totalScore.toLocaleString()}</span>
      </div>
      <div class="game-grid" id="gameGrid"></div>
    </div>
  `;

  const grid = document.getElementById('gameGrid');
  
  gameRegistry.forEach((game, index) => {
    const unlocked = isUnlocked(game.id, index);
    const hs = getHighScore(game.id);
    
    const card = document.createElement('div');
    card.className = `game-card ${unlocked ? '' : 'locked'}`;
    card.innerHTML = `
      <div class="game-card-icon">${unlocked ? game.icon : '🔒'}</div>
      <div class="game-card-name">${unlocked ? game.name : '???'}</div>
      ${unlocked && hs > 0 ? `<div class="game-card-score">HI: ${hs}</div>` : ''}
    `;
    
    if (unlocked) {
      card.addEventListener('click', () => {
        sound.play('select');
        launchGame(game, index);
      });
    }
    
    grid.appendChild(card);
  });
}

// ===== GAME SCREEN =====
function launchGame(gameDef, index) {
  app.innerHTML = `
    <div class="crt-overlay"></div>
    <div class="game-screen">
      <div class="game-header">
        <button class="game-header-btn" id="backBtn">← BACK</button>
        <span class="game-header-title">${gameDef.icon} ${gameDef.name}</span>
        <span class="game-header-score" id="scoreDisplay">0</span>
      </div>
      <div class="game-canvas-container" id="canvasContainer">
        <canvas id="gameCanvas"></canvas>
      </div>
      <div class="mobile-controls" id="mobileControls">
        <div class="dpad">
          <button class="dpad-btn dpad-up" data-action="UP">▲</button>
          <button class="dpad-btn dpad-down" data-action="DOWN">▼</button>
          <button class="dpad-btn dpad-left" data-action="LEFT">◀</button>
          <button class="dpad-btn dpad-right" data-action="RIGHT">►</button>
        </div>
        <div class="action-buttons">
          <button class="action-btn action-btn-b" data-action="B">B</button>
          <button class="action-btn action-btn-a" data-action="A">A</button>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('gameCanvas');
  const container = document.getElementById('canvasContainer');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const backBtn = document.getElementById('backBtn');
  const mobileControls = document.getElementById('mobileControls');

  // If game specifies custom controls (tap-based etc), hide dpad
  if (gameDef.controls === 'tap' || gameDef.controls === 'swipe' || gameDef.controls === 'custom') {
    mobileControls.style.display = 'none';
  }

  // Create game instance
  const game = new gameDef.Game(canvas, {
    width: gameDef.width || 400,
    height: gameDef.height || 600,
    gameId: gameDef.id,
    onScoreChange: (score) => {
      scoreDisplay.textContent = score.toLocaleString();
    },
    onGameOver: (score) => {
      sound.play('gameover');
      // Unlock next game if score > 0
      if (score > 0 && index + 1 < gameRegistry.length) {
        const nextGame = gameRegistry[index + 1];
        unlockGame(nextGame.id);
      }
      showGameOverOverlay(gameDef, game, score, index);
    },
    input,
    sound,
  });

  currentGame = game;

  // Input handler
  const removeInput = input.onInput((action, pressed) => {
    if (pressed) {
      if (action === 'START') {
        game.togglePause();
        if (game.paused) {
          showPauseOverlay(gameDef, game);
        } else {
          removePauseOverlay();
        }
      } else {
        game.onInput(action);
      }
    } else {
      // Send release events — games like Pong need to know when to stop moving
      if (game.onInput) {
        game.onInput('RELEASE_' + action);
        game.onInput('RELEASE');
      }
    }
  });

  // Mobile controls
  input.bindMobileControls(mobileControls);

  // Swipe support for swipe-based games
  if (gameDef.controls === 'swipe') {
    input.bindSwipe(canvas, (dir) => {
      game.onInput(dir);
    });
  }

  // Tap support — bind tap for any game that has onTap, plus tap-based games
  if (gameDef.controls === 'tap' || gameDef.controls === 'custom' || game.onTap) {
    input.bindTap(canvas, (x, y) => {
      if (game.onTap) game.onTap(x, y);
    });
  }

  // Back button
  backBtn.addEventListener('click', () => {
    sound.play('blip');
    game.stop();
    if (game.cleanup) game.cleanup();
    removeInput();
    showMenu();
  });

  // Resize handler
  const onResize = () => game.resize();
  window.addEventListener('resize', onResize);

  currentCleanup = () => {
    removeInput();
    window.removeEventListener('resize', onResize);
    if (game.cleanup) game.cleanup();
  };

  // Start!
  sound.play('start');
  game.start();
}

function showGameOverOverlay(gameDef, game, score, index) {
  const container = document.getElementById('canvasContainer');
  if (!container) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'gameOverlay';
  overlay.innerHTML = `
    <div class="overlay-title" style="color: var(--neon-red)">GAME OVER</div>
    <div class="overlay-score">SCORE: ${score.toLocaleString()}</div>
    <div class="overlay-text">HIGH: ${game.highScore.toLocaleString()}</div>
    ${score > 0 && index + 1 < gameRegistry.length ? 
      `<div class="overlay-text" style="color: var(--neon-magenta)">🔓 NEW GAME UNLOCKED!</div>` : ''}
    <button class="overlay-btn" id="retryBtn">RETRY</button>
    <button class="overlay-btn" id="menuBtn" style="border-color: var(--neon-magenta); color: var(--neon-magenta)">MENU</button>
  `;
  container.appendChild(overlay);

  document.getElementById('retryBtn').addEventListener('click', () => {
    sound.play('start');
    overlay.remove();
    game.start();
  });

  document.getElementById('menuBtn').addEventListener('click', () => {
    sound.play('blip');
    game.stop();
    showMenu();
  });
}

function showPauseOverlay() {
  const container = document.getElementById('canvasContainer');
  if (!container || document.getElementById('pauseOverlay')) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'pauseOverlay';
  overlay.innerHTML = `
    <div class="overlay-title" style="color: var(--neon-yellow)">PAUSED</div>
    <div class="overlay-text">Press P or START to resume</div>
  `;
  container.appendChild(overlay);
}

function removePauseOverlay() {
  const el = document.getElementById('pauseOverlay');
  if (el) el.remove();
}

// ===== INIT =====
showMenu();

// Enable audio on first interaction
document.addEventListener('touchstart', () => sound.getCtx(), { once: true });
document.addEventListener('click', () => sound.getCtx(), { once: true });
