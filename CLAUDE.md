# Retro Arcade — 30 Classic Games

## Project Overview
A mobile-first retro arcade with 30 classic games. Pure client-side, no backend.
Stack: Vite + vanilla JavaScript + HTML5 Canvas + CSS.

## Architecture

### File Structure
```
src/
  main.js          — App entry point, routing, menu
  css/
    style.css      — Global retro styling, CRT effects, responsive layout
  engine/
    GameEngine.js  — Base class all games extend
    InputManager.js — Keyboard + touch input handling
    SoundManager.js — Retro sound effects (Web Audio API)
  games/
    index.js       — Game registry (imports all 30 games)
    snake.js       — Each game is a single file
    tetris.js
    ... etc
```

### Game Engine Base Class
Every game extends GameEngine and implements:
- `init()` — setup game state
- `update(dt)` — game logic (called 60fps)
- `render(ctx)` — draw to canvas
- `onInput(action)` — handle input events
- `getScore()` — return current score
- `isGameOver()` — return boolean

### Input Actions (standardised)
- UP, DOWN, LEFT, RIGHT — d-pad
- A — primary action (jump, shoot, confirm)
- B — secondary action (back, cancel)
- START — pause/unpause

### Mobile Controls
- Virtual d-pad (left side of screen)
- A/B buttons (right side)
- Touch gestures for swipe-based games
- Controls overlay on canvas, semi-transparent

### Visual Style
- **Font:** "Press Start 2P" (Google Fonts) — mandatory for ALL text
- **Colors:** Neon on dark — green (#00ff41), cyan (#00fff2), magenta (#ff00ff), yellow (#ffe600), red (#ff0040)
- **Background:** Deep black (#0a0a0a)
- **CRT effect:** CSS scanlines overlay + subtle screen curvature
- **Pixel-perfect:** All game graphics use crisp pixel art (image-rendering: pixelated)
- **Glow:** Text and important elements have neon glow (text-shadow / box-shadow)

### Menu/Selection Screen
- Grid of game cards (scrollable on mobile)
- Each card shows: game icon (emoji or pixel art), name, high score
- Locked games show a "?" with mystery styling
- Unlock system: complete level 1 of a game to unlock the next
- First 5 games unlocked by default

### Responsive Layout
- Mobile-first (320px minimum)
- Game canvas fills available width, maintains aspect ratio
- Controls below canvas on mobile, optional keyboard on desktop
- No horizontal scrolling ever

## Game List (30 games)
1. Snake 🐍
2. Tetris 🟦
3. Breakout 🧱
4. Pong 🏓
5. Space Invaders 👾
6. Pac-Man 🟡
7. Asteroids ☄️
8. Frogger 🐸
9. Flappy Bird 🐦
10. Minesweeper 💣
11. 2048 🔢
12. Simon Says 🎵
13. Whack-a-Mole 🔨
14. Memory Match 🃏
15. Tic-Tac-Toe ❌
16. Connect Four 🔴
17. Hangman 📝
18. Centipede 🐛
19. Missile Command 🚀
20. Galaga 🛸
21. Doodle Jump ⬆️
22. Crossy Road 🐔
23. Duck Hunt 🦆
24. Bomberman 💥
25. Tron 🏍️
26. Solitaire 🃏
27. Defender 🛡️
28. Dig Dug ⛏️
29. Q*bert 🔺
30. Donkey Kong 🦍

## Key Principles
- MOBILE FIRST — test at 375px width
- FAST — 60fps, no jank
- FUN — games should feel good to play
- RETRO — everything screams classic arcade
- SIMPLE — no over-engineering, no backend, no databases
