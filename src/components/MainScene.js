import Phaser from 'phaser';
import SFX from './SFX';
import FONT_PROPS from '../utils/utils';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  init() {
    this.startX = 45;
    this.startY = 230;
    this.endX = 590;
    this.endY = 690;
    this.gameWidth = this.sys.game.config.width;
    this.gameHeigth = this.sys.game.config.height;
    this.sceneZone = this.add.zone(this.gameWidth / 2, this.gameHeigth / 2, this.gameWidth, this.gameHeigth);
    this.frames = ['blue', 'purple', 'red', 'yellow', 'green'];
    this.grid = [];
    this.connected = [];
    this.chosenColor = null;
    this.highscore = localStorage.highscore ? JSON.parse(localStorage.highscore) : 0;
    this.score = 0;
    this.goal = 5;
    this.moves = 10;
    this.possibleMoves = [];
    this.level = 1;
    this.levelText = '';
    this.movesText = '';
    this.scoreText = '';
    this.highscoreText = '';
    this.progressBar = this.add.graphics({ fillStyle: { color: 0x199d21 } });
    this.progressOverlay = this.add.graphics({ fillStyle: { color: 0x001a3e } });
    this.rectBar = new Phaser.Geom.Rectangle(250, 45, 0, 30);
    this.rectOverlay = new Phaser.Geom.Rectangle(250, 45, 420, 30);
    this.camera = this.cameras.add();
  }

  preload() {
    this.cameras.main.fadeIn(250);
  }

  create() {
    this.sfx = new SFX({
      sprites: this.add.particles('sprites'),
    });

    this.createUI();
    this.createGrid();
    this.registry.set('score', this.score);
    this.registry.set('moves', this.moves);
    this.registry.set('highscore', this.highscore);
    this.registry.set('level', this.level);
    this.registry.events.on('changedata', this.updateData, this);

    // emmit click event on each cube
    this.input.on('gameobjectdown', (pointer, gameObject) => gameObject.emit('clicked', gameObject), this);
  }

  createUI() {
    let field = this.add.image(0, 0, 'sprites', 'field');
    Phaser.Display.Align.In.BottomLeft(field, this.sceneZone);

    let header = this.add.image(0, 0, 'sprites', 'bar1');
    Phaser.Display.Align.In.TopCenter(header, this.sceneZone);
    header.depth = -2;

    this.progressOverlay.fillRectShape(this.rectOverlay);
    this.progressOverlay.depth = 0;
    this.progressBar.depth = 1;

    let scoreboard = this.add.image(0, 0, 'sprites', 'scoreboard');
    Phaser.Display.Align.In.RightCenter(scoreboard, this.sceneZone);

    this.add.group({
      key: 'sprites',
      frame: ['bonus'],
      frameQuantity: 3,
      gridAlign: { width: 3, height: 1, cellWidth: 120, cellHeight: 67, x: 660, y: 700 },
      setScale: { x: 0.8, y: 0.8 },
    });

    this.scoreText = this.make.text(FONT_PROPS(`${this.score} / ${this.goal}`, 32));
    Phaser.Display.Align.In.QuickSet(this.scoreText, scoreboard, 11, 0, -60);

    this.highscoreText = this.make.text(FONT_PROPS(this.highscore, 32));
    Phaser.Display.Align.In.QuickSet(this.highscoreText, header, 2, -180, -32);

    this.movesText = this.make.text(FONT_PROPS(this.moves, 100));
    Phaser.Display.Align.In.QuickSet(this.movesText, scoreboard, 6, 0, -70);

    this.levelText = this.make.text(FONT_PROPS(this.level, 32));
    Phaser.Display.Align.In.QuickSet(this.levelText, header, 4, -120, -10);
  }

  createCube(data) {
    const block = this.add.sprite(data.sx, data.sy, 'sprites', this.frames[data.color]);
    block.gridData = data;
    data.sprite = block;
    block.setInteractive();
    block.on('clicked', this.clickHandler, this);
  }

  renderGrid() {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        let currentCube = this.grid[i][j];
        this.createCube(currentCube);
      }
    }
  }

  createGrid() {
    for (let x = 0; x < 9; x++) {
      this.grid[x] = [];
      for (let y = 0; y < 9; y++) {
        const sx = this.startX + x * 60;
        const sy = this.startY + y * 67;
        const color = Phaser.Math.Between(0, 4);
        const id = Phaser.Utils.String.UUID();
        this.grid[x][y] = { x, y, sx, sy, color, id, isEmpty: false };
      }
    }
    this.renderGrid();
  }

  isCubeChecked(x, y) {
    return this.connected.some((item) => item.x === x && item.y === y);
  }

  isInGrid(x, y) {
    return x >= 0 && x < 9 && y >= 0 && y < 9 && this.grid[x][y] !== undefined;
  }

  setEmpty(x, y) {
    this.grid[x][y].isEmpty = true;
  }

  isEmpty(x, y) {
    return this.grid[x][y].isEmpty;
  }

  getConnected(x, y) {
    if (!this.isInGrid(x, y) || this.grid[x][y].isEmpty) return null;
    let currentCube = this.grid[x][y];
    if (currentCube.color === this.chosenColor && !this.isCubeChecked(x, y)) {
      this.connected.push({ x, y, id: currentCube.id, sprite: currentCube.sprite });
      this.getConnected(x + 1, y);
      this.getConnected(x - 1, y);
      this.getConnected(x, y + 1);
      this.getConnected(x, y - 1);
    }
  }

  getPossibleMoves() {
    this.possibleMoves.length = 0;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (this.grid[x][y].color === this.grid[x][y + 1].color || this.grid[x][y].color === this.grid[x + 1][y].color) {
          this.possibleMoves.push({ id: this.grid[x][y].id });
        }
      }
    }
  }
}
