/**
 * Game Instructions - "How to Play" data for all 30 games
 * Each entry has: objective, controls (desktop + mobile), and tips
 */
export const gameInstructions = {
  snake: {
    title: '🐍 SNAKE',
    objective: 'Eat food to grow longer without hitting walls or yourself.',
    controls: {
      desktop: '⬆⬇⬅➡ Arrow Keys / WASD',
      mobile: 'D-Pad or Swipe',
    },
    tips: [
      'Plan ahead — don\'t box yourself in!',
      'Speed increases as you eat more.',
    ],
  },
  tetris: {
    title: '🟦 TETRIS',
    objective: 'Stack falling blocks to complete full rows and clear them.',
    controls: {
      desktop: '⬅➡ Move · ⬇ Soft Drop · ⬆ Rotate · Space Hard Drop',
      mobile: 'D-Pad to move · A to Rotate',
    },
    tips: [
      'Keep the stack flat — avoid gaps!',
      'Clearing 4 lines at once = TETRIS bonus!',
    ],
  },
  breakout: {
    title: '🧱 BREAKOUT',
    objective: 'Bounce the ball to destroy all bricks. Don\'t let it drop!',
    controls: {
      desktop: '⬅➡ Arrow Keys to move paddle',
      mobile: 'D-Pad or tap to move paddle',
    },
    tips: [
      'Aim for the corners to clear tricky bricks.',
      'Hit angle changes based on where ball hits paddle.',
    ],
  },
  pong: {
    title: '🏓 PONG',
    objective: 'Score by getting the ball past the AI paddle at the top.',
    controls: {
      desktop: '⬅➡ Arrow Keys to move paddle',
      mobile: 'D-Pad or tap screen to move paddle',
    },
    tips: [
      'Use the edges of your paddle for angled shots.',
      'AI gets smarter each level — stay sharp!',
    ],
  },
  'space-invaders': {
    title: '👾 SPACE INVADERS',
    objective: 'Destroy all alien invaders before they reach the ground.',
    controls: {
      desktop: '⬅➡ Move · Space/Z to Shoot',
      mobile: 'D-Pad to move · A to Shoot',
    },
    tips: [
      'Take out the edges first to slow their descent.',
      'Watch for bonus UFOs at the top!',
    ],
  },
  pacman: {
    title: '🟡 PAC-MAN',
    objective: 'Eat all pellets. Avoid ghosts or eat Power Pellets to turn the tables!',
    controls: {
      desktop: '⬆⬇⬅➡ Arrow Keys / WASD',
      mobile: 'D-Pad to change direction',
    },
    tips: [
      'Power Pellets let you eat ghosts for big points!',
      'Learn the maze to escape ghost ambushes.',
      'Each ghost has a different personality.',
    ],
  },
  asteroids: {
    title: '☄️ ASTEROIDS',
    objective: 'Destroy all asteroids. Large ones split into smaller ones!',
    controls: {
      desktop: '⬅➡ Rotate · ⬆ Thrust · Space/Z Shoot',
      mobile: 'D-Pad to rotate/thrust · A to Shoot',
    },
    tips: [
      'Watch your momentum — space has no friction!',
      'Big asteroids split into 2 medium ones.',
    ],
  },
  frogger: {
    title: '🐸 FROGGER',
    objective: 'Guide the frog home across busy roads and rivers.',
    controls: {
      desktop: '⬆⬇⬅➡ Arrow Keys to hop',
      mobile: 'D-Pad to hop',
    },
    tips: [
      'Time your moves carefully with traffic.',
      'On rivers, ride logs — don\'t fall in the water!',
    ],
  },
  'flappy-bird': {
    title: '🐦 FLAPPY BIRD',
    objective: 'Tap to flap and navigate through pipe gaps. Don\'t crash!',
    controls: {
      desktop: 'Space / ⬆ / Z to Flap',
      mobile: 'Tap anywhere to Flap',
    },
    tips: [
      'Gentle, rhythmic taps work better than frantic mashing.',
      'Stay near the center for more reaction time.',
    ],
  },
  minesweeper: {
    title: '💣 MINESWEEPER',
    objective: 'Reveal all safe cells without hitting a mine.',
    controls: {
      desktop: 'Click to reveal a cell',
      mobile: 'Tap to reveal a cell',
    },
    tips: [
      'Numbers show how many mines surround that cell.',
      'Use logic, not luck — deduce mine positions!',
    ],
  },
  '2048': {
    title: '🔢 2048',
    objective: 'Slide tiles to combine matching numbers. Reach 2048!',
    controls: {
      desktop: '⬆⬇⬅➡ Arrow Keys to slide all tiles',
      mobile: 'Swipe in any direction',
    },
    tips: [
      'Keep your highest tile in a corner.',
      'Build a chain of descending values along an edge.',
    ],
  },
  simon: {
    title: '🎵 SIMON SAYS',
    objective: 'Repeat the color/sound sequence. It gets longer each round!',
    controls: {
      desktop: 'Click the colored buttons',
      mobile: 'Tap the colored buttons',
    },
    tips: [
      'Associate each color with its sound to remember.',
      'Focus — one wrong tap and it\'s over!',
    ],
  },
  'whack-a-mole': {
    title: '🔨 WHACK-A-MOLE',
    objective: 'Whack as many moles as possible before time runs out!',
    controls: {
      desktop: 'Click on moles to whack them',
      mobile: 'Tap on moles to whack them',
    },
    tips: [
      'Stay alert — moles pop up faster over time.',
      'Keep your cursor/finger near the center.',
    ],
  },
  'memory-match': {
    title: '🃏 MEMORY MATCH',
    objective: 'Flip cards to find matching pairs. Clear all pairs to win!',
    controls: {
      desktop: 'Click cards to flip them',
      mobile: 'Tap cards to flip them',
    },
    tips: [
      'Remember card positions as you reveal them.',
      'Fewer flips = better score!',
    ],
  },
  'tic-tac-toe': {
    title: '❌ TIC-TAC-TOE',
    objective: 'Get three X\'s in a row before the AI gets three O\'s.',
    controls: {
      desktop: 'Click an empty cell to place X',
      mobile: 'Tap an empty cell to place X',
    },
    tips: [
      'Take the center square if you can!',
      'Block the AI when it has two in a row.',
    ],
  },
  'connect-four': {
    title: '🔴 CONNECT FOUR',
    objective: 'Drop discs to get four in a row (horizontal, vertical, or diagonal).',
    controls: {
      desktop: 'Click a column to drop your disc',
      mobile: 'Tap a column to drop your disc',
    },
    tips: [
      'Control the center column for more options.',
      'Watch for diagonal threats!',
    ],
  },
  hangman: {
    title: '📝 HANGMAN',
    objective: 'Guess the word letter by letter before the hangman is drawn!',
    controls: {
      desktop: 'Click letters on the keyboard',
      mobile: 'Tap letters on the keyboard',
    },
    tips: [
      'Start with common vowels: A, E, I, O, U.',
      'Common consonants: R, S, T, L, N.',
    ],
  },
  centipede: {
    title: '🐛 CENTIPEDE',
    objective: 'Shoot the centipede before it reaches you. Watch for mushrooms!',
    controls: {
      desktop: '⬅➡ Move · Auto-shoots upward',
      mobile: 'D-Pad to move · Auto-shoots',
    },
    tips: [
      'Shooting a segment splits the centipede!',
      'Clear mushrooms to keep paths open.',
    ],
  },
  'missile-command': {
    title: '🚀 MISSILE COMMAND',
    objective: 'Defend your cities from incoming missiles by firing counter-missiles!',
    controls: {
      desktop: 'Click to aim and fire a counter-missile',
      mobile: 'Tap to aim and fire',
    },
    tips: [
      'Lead your shots — intercept missiles in their path.',
      'Protect the cities, not the open ground!',
    ],
  },
  galaga: {
    title: '🛸 GALAGA',
    objective: 'Destroy alien formations. Watch for diving attackers!',
    controls: {
      desktop: '⬅➡ Move · Space/Z to Shoot',
      mobile: 'D-Pad to move · A to Shoot',
    },
    tips: [
      'Focus on diving enemies — they\'re the biggest threat.',
      'Clear a wave for bonus points!',
    ],
  },
  'doodle-jump': {
    title: '⬆️ DOODLE JUMP',
    objective: 'Jump from platform to platform. Go as high as you can!',
    controls: {
      desktop: '⬅➡ Arrow Keys to move left/right',
      mobile: 'D-Pad ⬅➡ to steer',
    },
    tips: [
      'You auto-bounce on platforms — just steer!',
      'Wrapping around screen edges can save you.',
    ],
  },
  'crossy-road': {
    title: '🐔 CROSSY ROAD',
    objective: 'Cross roads and rivers to travel as far as possible!',
    controls: {
      desktop: '⬆⬇⬅➡ Arrow Keys to hop',
      mobile: 'D-Pad to hop in any direction',
    },
    tips: [
      'Don\'t stand still too long on roads!',
      'Rivers: hop on logs, not in the water.',
    ],
  },
  'duck-hunt': {
    title: '🦆 DUCK HUNT',
    objective: 'Shoot the flying ducks before they escape off-screen!',
    controls: {
      desktop: 'Move cursor & click to shoot',
      mobile: 'Tap ducks to shoot them',
    },
    tips: [
      'Aim slightly ahead of moving ducks.',
      'Limited shots per duck — make them count!',
    ],
  },
  bomberman: {
    title: '💥 BOMBERMAN',
    objective: 'Place bombs to destroy bricks and enemies. Don\'t blow yourself up!',
    controls: {
      desktop: '⬆⬇⬅➡ Move · Space/Z Place Bomb',
      mobile: 'D-Pad to move · A to Place Bomb',
    },
    tips: [
      'Drop a bomb and run! Don\'t get caught in the blast.',
      'Destroy bricks to find power-ups.',
    ],
  },
  tron: {
    title: '🏍️ TRON',
    objective: 'Leave a light trail. Survive longer than your opponents!',
    controls: {
      desktop: '⬆⬇⬅➡ Arrow Keys to turn',
      mobile: 'D-Pad to turn',
    },
    tips: [
      'Cut off opponents — force them into trails.',
      'Use the whole arena — don\'t box yourself in.',
    ],
  },
  solitaire: {
    title: '🃏 SOLITAIRE',
    objective: 'Sort all cards into foundation piles by suit, Ace to King.',
    controls: {
      desktop: 'Click cards to move them',
      mobile: 'Tap cards to move them',
    },
    tips: [
      'Uncover face-down cards early.',
      'Empty columns are valuable — use them wisely.',
    ],
  },
  defender: {
    title: '🛡️ DEFENDER',
    objective: 'Defend humanoids from alien abduction. Scroll and shoot!',
    controls: {
      desktop: '⬅➡⬆⬇ Move ship · Auto-fires forward',
      mobile: 'D-Pad to fly · Auto-fires',
    },
    tips: [
      'Keep moving — standing still = easy target.',
      'Watch the minimap for threats you can\'t see.',
    ],
  },
  'dig-dug': {
    title: '⛏️ DIG DUG',
    objective: 'Dig tunnels and pump enemies until they pop!',
    controls: {
      desktop: '⬆⬇⬅➡ Move & Dig · Space/Z to Pump',
      mobile: 'D-Pad to move · A to Pump',
    },
    tips: [
      'Dig strategically to lure enemies.',
      'Drop rocks on enemies for bonus points!',
    ],
  },
  qbert: {
    title: '🔺 Q*BERT',
    objective: 'Hop on every cube to change its color. Avoid enemies!',
    controls: {
      desktop: '⬆⬇⬅➡ to hop diagonally on cubes',
      mobile: 'D-Pad to hop diagonally',
    },
    tips: [
      'Arrows map to diagonal hops on the pyramid.',
      'Don\'t jump off the edge — it\'s instant death!',
    ],
  },
  'donkey-kong': {
    title: '🦍 DONKEY KONG',
    objective: 'Climb to the top while dodging barrels thrown by DK!',
    controls: {
      desktop: '⬅➡ Move · ⬆ Jump · Climb ladders',
      mobile: 'D-Pad to move & jump',
    },
    tips: [
      'Time your jumps over barrels carefully.',
      'Barrels can roll down ladders unpredictably!',
    ],
  },
};
