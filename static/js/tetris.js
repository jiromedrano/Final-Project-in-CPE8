// Constants
const GRID_SIZE = 35;
const GRID_WIDTH = 17;
const GRID_HEIGHT = 20;
const SIDEBAR_WIDTH = 200;

// Colors
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const GRAY = "#808080";
const PINK = "#FF69B4";
const LIGHT_PINK = "#FFB6C1";
const DARK_PINK = "#DB7093";
const COLORS = [
  "#FF69B4", // Pink
  "#FF1493", // Deep Pink
  "#FFB6C1", // Light Pink
  "#FF69B4", // Hot Pink
  "#DB7093", // Pale Violet Red
  "#FF00FF", // Magenta
  "#EE82EE", // Violet
];

// Helper functions for color manipulation
function lightenColor(color, percent) {
  return adjustColor(color, percent);
}

function darkenColor(color, percent) {
  return adjustColor(color, -percent);
}

function adjustColor(color, percent) {
  // Convert hex to RGB
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);

  // Adjust the color
  r = Math.min(255, Math.max(0, r + Math.floor((r * percent) / 100)));
  g = Math.min(255, Math.max(0, g + Math.floor((g * percent) / 100)));
  b = Math.min(255, Math.max(0, b + Math.floor((b * percent) / 100)));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Tetromino shapes
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [1, 1, 1],
    [0, 1, 0],
  ], // T
  [
    [1, 1, 1],
    [1, 0, 0],
  ], // J
  [
    [1, 1, 1],
    [0, 0, 1],
  ], // L
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // S
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // Z
];

// Game variables
let canvas, ctx;
let nextPieceCanvas, nextPieceCtx;
let grid;
let currentPiece, nextPiece;
let score = 0;
let level = 1;
let linesCleared = 0;
let paused = false;
let gameOver = false;
let lastTime = 0;
let fallTime = 0;
let fallSpeed = 500; // milliseconds

// DOM elements
let scoreElement, levelElement, linesElement;
let pauseOverlay, gameOverOverlay;

// Initialize the game
window.onload = function () {
  // Set up canvas
  canvas = document.getElementById("tetris-canvas");
  ctx = canvas.getContext("2d");

  // Calculate canvas size based on grid dimensions
  const canvasWidth = GRID_WIDTH * GRID_SIZE;
  const canvasHeight = GRID_HEIGHT * GRID_SIZE;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Set up next piece canvas
  nextPieceCanvas = document.getElementById("next-piece-canvas");
  nextPieceCtx = nextPieceCanvas.getContext("2d");
  nextPieceCanvas.width = 150;
  nextPieceCanvas.height = 100;

  // Get DOM elements
  scoreElement = document.getElementById("score");
  levelElement = document.getElementById("level");
  linesElement = document.getElementById("lines");
  pauseOverlay = document.getElementById("pause-overlay");
  gameOverOverlay = document.getElementById("game-over-overlay");

  // Get menu elements
  const mainMenu = document.querySelector(".main-menu");
  const gameContainer = document.querySelector(".game-container");
  const startGameButton = document.getElementById("startGameButton");
  const quitGameButton = document.getElementById("quitGameButton");

  // Initially show the main menu and hide the game
  mainMenu.style.display = "block";
  gameContainer.style.display = "none";

  // Add event listeners for menu buttons
  startGameButton.addEventListener("click", () => {
    mainMenu.style.display = "none";
    gameContainer.style.display = "flex";
    // Reset and start the game
    initGame();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  });

  quitGameButton.addEventListener("click", () => {
    // Redirect to the home page
    window.location.href = "/";
  });

  // Set up event listeners for gameplay
  document.addEventListener("keydown", handleKeyPress);
};

// Tetromino class
class Tetromino {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.shapeIndex = Math.floor(Math.random() * SHAPES.length);
    this.shape = SHAPES[this.shapeIndex];
    this.color = COLORS[this.shapeIndex];
    this.rotation = 0;
  }

  rotate() {
    // Create a new rotated shape
    const rows = this.shape.length;
    const cols = this.shape[0].length;
    const rotated = Array(cols)
      .fill()
      .map(() => Array(rows).fill(0));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = this.shape[r][c];
      }
    }

    // Check if rotation is valid
    const oldShape = this.shape;
    this.shape = rotated;
    if (!this.isValidPosition(this.x, this.y, this.shape)) {
      this.shape = oldShape;
      return false;
    }
    return true;
  }

  isValidPosition(x, y, shape = null) {
    if (shape === null) {
      shape = this.shape;
    }

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c]) {
          // Check if out of bounds
          if (y + r >= GRID_HEIGHT || x + c < 0 || x + c >= GRID_WIDTH) {
            return false;
          }
          // Check if collides with existing blocks
          if (y + r >= 0 && grid[y + r][x + c]) {
            return false;
          }
        }
      }
    }
    return true;
  }

  moveDown() {
    if (this.isValidPosition(this.x, this.y + 1)) {
      this.y += 1;
      return true;
    }
    return false;
  }

  moveLeft() {
    if (this.isValidPosition(this.x - 1, this.y)) {
      this.x -= 1;
      return true;
    }
    return false;
  }

  moveRight() {
    if (this.isValidPosition(this.x + 1, this.y)) {
      this.x += 1;
      return true;
    }
    return false;
  }

  getGhostPosition() {
    let ghostY = this.y;
    while (this.isValidPosition(this.x, ghostY + 1)) {
      ghostY += 1;
    }
    return ghostY;
  }
}

// Game functions
function initGame() {
  // Create empty grid
  grid = Array(GRID_HEIGHT)
    .fill()
    .map(() => Array(GRID_WIDTH).fill(0));

  // Create pieces
  currentPiece = new Tetromino(Math.floor(GRID_WIDTH / 2) - 1, 0);
  nextPiece = new Tetromino(Math.floor(GRID_WIDTH / 2) - 1, 0);

  // Reset game state
  score = 0;
  level = 1;
  linesCleared = 0;
  paused = false;
  gameOver = false;
  fallTime = 0;
  fallSpeed = 500; // milliseconds

  // Update UI
  updateUI();

  // Hide overlays
  pauseOverlay.style.display = "none";
  gameOverOverlay.style.display = "none";
}

function gameLoop(timestamp) {
  // Calculate delta time
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  if (!paused && !gameOver) {
    // Update fall time
    fallTime += deltaTime;

    // Move piece down automatically
    if (fallTime >= fallSpeed) {
      fallTime = 0;
      if (!currentPiece.moveDown()) {
        // Lock the piece in place
        lockPiece();

        // Check for completed lines
        const newLines = checkLines();
        if (newLines) {
          linesCleared += newLines;
          score += [100, 300, 500, 800][Math.min(newLines - 1, 3)] * level;

          // Level up every 10 lines
          level = Math.floor(linesCleared / 10) + 1;
          fallSpeed = Math.max(50, 500 - (level - 1) * 50);

          // Update UI
          updateUI();
        }

        // Create new piece
        currentPiece = nextPiece;
        nextPiece = new Tetromino(Math.floor(GRID_WIDTH / 2) - 1, 0);

        // Check if new piece can be placed
        if (!currentPiece.isValidPosition(currentPiece.x, currentPiece.y)) {
          gameOver = true;
          gameOverOverlay.style.display = "flex";
        }
      }
    }
  }

  // Draw everything
  draw();

  // Continue game loop
  requestAnimationFrame(gameLoop);
}

function draw() {
  // Clear canvas
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid and locked pieces
  drawGrid();

  if (!gameOver && !paused) {
    // Draw ghost piece (landing position)
    drawGhost();

    // Draw current piece
    drawPiece(currentPiece, ctx, 0, 0);
  }

  // Draw next piece preview
  drawNextPiece();
}

function drawGrid() {
  // Draw grid lines
  ctx.strokeStyle = GRAY;
  ctx.lineWidth = 1;

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      ctx.strokeRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

      // Draw filled cells with flat 2D style
      if (grid[y][x]) {
        const baseColor = grid[y][x];
        const cellX = x * GRID_SIZE;
        const cellY = y * GRID_SIZE;

        // Draw the cell with a single color
        ctx.fillStyle = baseColor;
        ctx.fillRect(cellX, cellY, GRID_SIZE - 1, GRID_SIZE - 1);
      }
    }
  }
}

function drawPiece(piece, context, offsetX, offsetY) {
  // Base color for the piece
  const baseColor = piece.color;

  // Create lighter and darker shades for 3D effect
  const lighterColor = lightenColor(baseColor, 30);
  const darkerColor = darkenColor(baseColor, 30);

  // 3D offset for the top and side faces
  const depthOffset = Math.floor(GRID_SIZE / 6);

  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[0].length; c++) {
      if (piece.shape[r][c]) {
        const x = offsetX + (piece.x + c) * GRID_SIZE;
        const y = offsetY + (piece.y + r) * GRID_SIZE;

        // Draw the main face (front)
        context.fillStyle = baseColor;
        context.fillRect(x, y, GRID_SIZE - 1, GRID_SIZE - 1);

        // Draw the top face
        context.fillStyle = lighterColor;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + depthOffset, y - depthOffset);
        context.lineTo(x + GRID_SIZE - 1 + depthOffset, y - depthOffset);
        context.lineTo(x + GRID_SIZE - 1, y);
        context.closePath();
        context.fill();

        // Draw the right face
        context.fillStyle = darkerColor;
        context.beginPath();
        context.moveTo(x + GRID_SIZE - 1, y);
        context.lineTo(x + GRID_SIZE - 1 + depthOffset, y - depthOffset);
        context.lineTo(
          x + GRID_SIZE - 1 + depthOffset,
          y + GRID_SIZE - 1 - depthOffset,
        );
        context.lineTo(x + GRID_SIZE - 1, y + GRID_SIZE - 1);
        context.closePath();
        context.fill();
      }
    }
  }
}

function drawGhost() {
  const ghostY = currentPiece.getGhostPosition();
  const ghostColor = currentPiece.color + "66"; // Add transparency

  // Create a ghost version of the piece with transparency
  const ghostPiece = {
    x: currentPiece.x,
    y: ghostY,
    shape: currentPiece.shape,
    color: ghostColor,
  };

  // Draw the ghost piece with a simplified 3D effect
  for (let r = 0; r < ghostPiece.shape.length; r++) {
    for (let c = 0; c < ghostPiece.shape[0].length; c++) {
      if (ghostPiece.shape[r][c]) {
        const x = (ghostPiece.x + c) * GRID_SIZE;
        const y = (ghostPiece.y + r) * GRID_SIZE;

        // Draw the main face with transparency
        ctx.fillStyle = ghostColor;
        ctx.fillRect(x, y, GRID_SIZE - 1, GRID_SIZE - 1);

        // Draw simplified 3D edges with lines
        ctx.strokeStyle = "#ffffff44";
        ctx.lineWidth = 2;

        // Top edge
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + GRID_SIZE - 1, y);
        ctx.stroke();

        // Left edge
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + GRID_SIZE - 1);
        ctx.stroke();
      }
    }
  }
}

function drawNextPiece() {
  // Clear next piece canvas
  nextPieceCtx.fillStyle = WHITE;
  nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

  // Use a smaller grid size for the preview
  const previewGridSize = 25;

  // Center the piece in the preview
  const offsetX =
    (nextPieceCanvas.width - nextPiece.shape[0].length * previewGridSize) / 2;
  const offsetY =
    (nextPieceCanvas.height - nextPiece.shape.length * previewGridSize) / 2;

  // Draw the next piece with custom size
  nextPieceCtx.fillStyle = nextPiece.color;

  for (let r = 0; r < nextPiece.shape.length; r++) {
    for (let c = 0; c < nextPiece.shape[0].length; c++) {
      if (nextPiece.shape[r][c]) {
        nextPieceCtx.fillRect(
          offsetX + c * previewGridSize,
          offsetY + r * previewGridSize,
          previewGridSize - 1,
          previewGridSize - 1,
        );
      }
    }
  }
}

function lockPiece() {
  for (let r = 0; r < currentPiece.shape.length; r++) {
    for (let c = 0; c < currentPiece.shape[0].length; c++) {
      if (currentPiece.shape[r][c]) {
        if (currentPiece.y + r >= 0) {
          grid[currentPiece.y + r][currentPiece.x + c] = currentPiece.color;
        }
      }
    }
  }
}

function checkLines() {
  let linesCleared = 0;

  for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
    // Check if line is full
    const isLineFull = grid[y].every((cell) => cell !== 0);

    if (isLineFull) {
      linesCleared++;

      // Move all lines above down
      for (let y2 = y; y2 > 0; y2--) {
        grid[y2] = [...grid[y2 - 1]];
      }

      // Clear the top line
      grid[0] = Array(GRID_WIDTH).fill(0);

      // Check the same line again (since we moved everything down)
      y++;
    }
  }

  return linesCleared;
}

function updateUI() {
  scoreElement.textContent = score;
  levelElement.textContent = level;
  linesElement.textContent = linesCleared;
}

function handleKeyPress(event) {
  if (!gameOver) {
    if (event.key === "p" || event.key === "P") {
      // Toggle pause
      paused = !paused;
      pauseOverlay.style.display = paused ? "flex" : "none";
      return;
    }

    if (!paused) {
      switch (event.key) {
        case "ArrowLeft":
          currentPiece.moveLeft();
          break;
        case "ArrowRight":
          currentPiece.moveRight();
          break;
        case "ArrowDown":
          currentPiece.moveDown();
          break;
        case "ArrowUp":
          currentPiece.rotate();
          break;
        case " ": // Space bar
          // Hard drop
          while (currentPiece.moveDown()) {
            score += 1;
          }
          updateUI();
          break;
        case "q":
        case "Q":
          // Quit game - redirect to home page
          window.location.href = "/";
          break;
      }
    }
  } else {
    // Game over state
    if (event.key === "r" || event.key === "R") {
      // Restart game
      initGame();
    } else if (event.key === "q" || event.key === "Q") {
      // Quit game - redirect to home page
      window.location.href = "/";
    }
  }
}
