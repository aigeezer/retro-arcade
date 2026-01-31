/**
 * Unified Input Manager - keyboard + touch + dpad buttons
 */
export class InputManager {
  constructor() {
    this.listeners = [];
    this.keys = new Set();
    this.setupKeyboard();
  }

  setupKeyboard() {
    const keyMap = {
      'ArrowUp': 'UP', 'KeyW': 'UP',
      'ArrowDown': 'DOWN', 'KeyS': 'DOWN',
      'ArrowLeft': 'LEFT', 'KeyA': 'LEFT',
      'ArrowRight': 'RIGHT', 'KeyD': 'RIGHT',
      'Space': 'A', 'Enter': 'A', 'KeyZ': 'A',
      'KeyX': 'B', 'Escape': 'B', 'Backspace': 'B',
      'KeyP': 'START',
    };

    document.addEventListener('keydown', (e) => {
      const action = keyMap[e.code];
      if (action) {
        e.preventDefault();
        if (!this.keys.has(action)) {
          this.keys.add(action);
          this.emit(action, true);
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      const action = keyMap[e.code];
      if (action) {
        e.preventDefault();
        this.keys.delete(action);
        this.emit(action, false);
      }
    });
  }

  /**
   * Bind mobile control buttons (call after DOM is built)
   */
  bindMobileControls(container) {
    const buttons = container.querySelectorAll('[data-action]');
    buttons.forEach(btn => {
      const action = btn.dataset.action;
      
      const start = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        this.keys.add(action);
        this.emit(action, true);
      };
      
      const end = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        this.keys.delete(action);
        this.emit(action, false);
      };

      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    });
  }

  /**
   * Bind swipe gestures on an element (for games like 2048, Snake)
   */
  bindSwipe(element, callback) {
    let startX, startY, startTime;
    const minDistance = 30;
    const maxTime = 300;

    element.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const dt = Date.now() - startTime;

      if (dt > maxTime) return;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < minDistance) return;

      if (absDx > absDy) {
        callback(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        callback(dy > 0 ? 'DOWN' : 'UP');
      }

      startX = startY = null;
    }, { passive: true });
  }

  /**
   * Bind tap/touch on canvas (for games like Minesweeper, Whack-a-Mole, and paddle games)
   */
  bindTap(canvas, callback) {
    const getCoords = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    canvas.addEventListener('click', (e) => {
      const { x, y } = getCoords(e.clientX, e.clientY);
      callback(x, y);
    });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getCoords(touch.clientX, touch.clientY);
      callback(x, y);
    }, { passive: false });

    // Continuous touch tracking for paddle/movement games
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getCoords(touch.clientX, touch.clientY);
      callback(x, y);
    }, { passive: false });
  }

  isDown(action) {
    return this.keys.has(action);
  }

  onInput(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  emit(action, pressed) {
    this.listeners.forEach(cb => cb(action, pressed));
  }

  destroy() {
    this.listeners = [];
    this.keys.clear();
  }
}
