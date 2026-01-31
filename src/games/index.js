// Game Registry - All 30 games
import { SnakeGame } from './snake.js';
import { TetrisGame } from './tetris.js';
import { BreakoutGame } from './breakout.js';
import { PongGame } from './pong.js';
import { SpaceInvadersGame } from './space-invaders.js';
import { PacManGame } from './pac-man.js';
import { AsteroidsGame } from './asteroids.js';
import { FroggerGame } from './frogger.js';
import { FlappyBirdGame } from './flappy-bird.js';
import { MinesweeperGame } from './minesweeper.js';
import { Game2048 } from './game-2048.js';
import { SimonGame } from './simon.js';
import { WhackAMoleGame } from './whack-a-mole.js';
import { MemoryMatchGame } from './memory-match.js';
import { TicTacToeGame } from './tic-tac-toe.js';
import { ConnectFourGame } from './connect-four.js';
import { HangmanGame } from './hangman.js';
import { CentipedeGame } from './centipede.js';
import { MissileCommandGame } from './missile-command.js';
import { GalagaGame } from './galaga.js';
import { DoodleJumpGame } from './doodle-jump.js';
import { CrossyRoadGame } from './crossy-road.js';
import { DuckHuntGame } from './duck-hunt.js';
import { BombermanGame } from './bomberman.js';
import { TronGame } from './tron.js';
import { SolitaireGame } from './solitaire.js';
import { DefenderGame } from './defender.js';
import { DigDugGame } from './dig-dug.js';
import { QbertGame } from './qbert.js';
import { DonkeyKongGame } from './donkey-kong.js';

export const gameRegistry = [
  {
    id: 'snake',
    name: 'Snake',
    icon: '🐍',
    Game: SnakeGame,
    controls: 'swipe',
    width: 400,
    height: 400,
  },
  {
    id: 'tetris',
    name: 'Tetris',
    icon: '🟦',
    Game: TetrisGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'breakout',
    name: 'Breakout',
    icon: '🧱',
    Game: BreakoutGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'pong',
    name: 'Pong',
    icon: '🏓',
    Game: PongGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'space-invaders',
    name: 'Space Invaders',
    icon: '👾',
    Game: SpaceInvadersGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'pacman',
    name: 'Pac-Man',
    icon: '🟡',
    Game: PacManGame,
    controls: 'dpad',
    width: 400,
    height: 400,
  },
  {
    id: 'asteroids',
    name: 'Asteroids',
    icon: '☄️',
    Game: AsteroidsGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'frogger',
    name: 'Frogger',
    icon: '🐸',
    Game: FroggerGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    icon: '🐦',
    Game: FlappyBirdGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    icon: '💣',
    Game: MinesweeperGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: '2048',
    name: '2048',
    icon: '🔢',
    Game: Game2048,
    controls: 'swipe',
    width: 400,
    height: 600,
  },
  {
    id: 'simon',
    name: 'Simon Says',
    icon: '🎵',
    Game: SimonGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: 'whack-a-mole',
    name: 'Whack-a-Mole',
    icon: '🔨',
    Game: WhackAMoleGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    icon: '🃏',
    Game: MemoryMatchGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    icon: '❌',
    Game: TicTacToeGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    icon: '🔴',
    Game: ConnectFourGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: 'hangman',
    name: 'Hangman',
    icon: '📝',
    Game: HangmanGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: 'centipede',
    name: 'Centipede',
    icon: '🐛',
    Game: CentipedeGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'missile-command',
    name: 'Missile Command',
    icon: '🚀',
    Game: MissileCommandGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: 'galaga',
    name: 'Galaga',
    icon: '🛸',
    Game: GalagaGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'doodle-jump',
    name: 'Doodle Jump',
    icon: '⬆️',
    Game: DoodleJumpGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'crossy-road',
    name: 'Crossy Road',
    icon: '🐔',
    Game: CrossyRoadGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'duck-hunt',
    name: 'Duck Hunt',
    icon: '🦆',
    Game: DuckHuntGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: 'bomberman',
    name: 'Bomberman',
    icon: '💥',
    Game: BombermanGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'tron',
    name: 'Tron',
    icon: '🏍️',
    Game: TronGame,
    controls: 'dpad',
    width: 400,
    height: 400,
  },
  {
    id: 'solitaire',
    name: 'Solitaire',
    icon: '🃏',
    Game: SolitaireGame,
    controls: 'tap',
    width: 400,
    height: 600,
  },
  {
    id: 'defender',
    name: 'Defender',
    icon: '🛡️',
    Game: DefenderGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'dig-dug',
    name: 'Dig Dug',
    icon: '⛏️',
    Game: DigDugGame,
    controls: 'dpad',
    width: 400,
    height: 400,
  },
  {
    id: 'qbert',
    name: 'Q*bert',
    icon: '🔺',
    Game: QbertGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
  {
    id: 'donkey-kong',
    name: 'Donkey Kong',
    icon: '🦍',
    Game: DonkeyKongGame,
    controls: 'dpad',
    width: 400,
    height: 600,
  },
];
