// Tic Tac Toe Game JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Constants
// Constants
  const BOARD_ROWS = 3;
  const BOARD_COLS = 3;
  const SQUARE_SIZE = 180;
  const CIRCLE_RADIUS = SQUARE_SIZE / 5;
  const CIRCLE_WIDTH = 10;
  const CROSS_WIDTH = 15;
  const SPACE = SQUARE_SIZE / 5; // Try decreasing this value

  // Colors
  const BG_COLOR = "#ffb6c1"; // Light pink
  const LINE_COLOR = "#2d2d2d"; // Dark gray
  const CIRCLE_COLOR = "#efe7c8"; // Light beige
  const CROSS_COLOR = "#424242"; // Dark gray
  const WIN_LINE_COLOR = "#ff5555"; // Red
  const BUTTON_COLOR = "#ff69b4"; // Hot pink
  const BUTTON_HOVER = "#ff1493"; // Deeper pink

  // Game variables
  let board = Array(BOARD_ROWS)
    .fill()
    .map(() => Array(BOARD_COLS).fill(null));
  let player = "X";
  let gameOver = false;
  let winner = null;
  let lastMove = null;
  let animationProgress = 0;
  let particles = [];

  // DOM elements
  const gameMenu = document.getElementById("game-menu");
  const gamePlay = document.getElementById("game-play");
  const gameBoard = document.getElementById("game-board");
  const gameStatus = document.getElementById("game-status");
  const resetButton = document.getElementById("reset-button");
  const quitButton = document.getElementById("quit-button");
  const playButton = document.getElementById("play-button");
  const menuQuitButton = document.getElementById("menu-quit-button");
  const backButton = document.getElementById("back-button");
  const winnerModal = document.getElementById("winner-modal");
  const winnerText = document.getElementById("winner-text");
  const playAgainButton = document.getElementById("play-again-button");
  const backToMenuButton = document.getElementById("back-to-menu-button");
  const particlesCanvas = document.getElementById("particles-canvas");
  const ctx = particlesCanvas.getContext("2d");

  // Set up the canvas for particles
  function setupCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
  }

  // Show menu screen
  function showMenu() {
    gameMenu.style.display = "flex";
    gamePlay.style.display = "none";
    winnerModal.style.display = "none";
  }

  // Show game screen
  function showGame() {
    gameMenu.style.display = "none";
    gamePlay.style.display = "block";
    winnerModal.style.display = "none";
    resetGame();
  }

  // Show winner modal
  function showWinnerModal() {
    winnerModal.style.display = "flex";

    // Create confetti effect for winner
    if (winner !== "Draw") {
      createConfetti();
    }
  }

  // Create confetti particles
  function createConfetti() {
    const colors = ["#ff69b4", "#c71585", "#efe7c8", "#ffb6c1", "#ff1493"];

    for (let i = 0; i < 100; i++) {
      const x = Math.random() * window.innerWidth;
      const y = -20; // Start above the screen
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push(new ConfettiParticle(x, y, color));
    }
  }

  // Initialize the game board
  function initializeBoard() {
    gameBoard.innerHTML = "";

    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const square = document.createElement("div");
        square.className = "square";
        square.dataset.row = row;
        square.dataset.col = col;
        square.addEventListener("click", () => handleSquareClick(row, col));
        gameBoard.appendChild(square);
      }
    }
  }

  // Handle square click
  function handleSquareClick(row, col) {
    // Ignore clicks if game is over or square is already filled
    if (gameOver || board[row][col] !== null) {
      return;
    }

    // Mark the square
    markSquare(row, col, player);

    // Check for win or draw
    winner = checkWin();
    if (winner) {
      gameOver = true;
      updateGameStatus();

      // Show winner modal after a short delay
      setTimeout(() => {
        if (winner === "Draw") {
          winnerText.textContent = "It's a Draw!";
        } else {
          winnerText.textContent = `Player ${winner} Wins!`;
        }
        showWinnerModal();
      }, 1000);
    } else {
      // Switch player
      player = player === "X" ? "O" : "X";
      updateGameStatus();
    }
  }

  // Mark a square with X or O
  function markSquare(row, col, currentPlayer) {
    board[row][col] = currentPlayer;
    lastMove = { row, col };
    animationProgress = 0;

    // Get the square element
    const square = document.querySelector(
      `[data-row="${row}"][data-col="${col}"]`,
    );

    if (currentPlayer === "X") {
      drawX(square);
    } else {
      drawO(square);
    }

    // Create particles
    createParticles(square);
  }

  // Draw X in a square
  function drawX(square) {
    const x = document.createElement("div");
    x.className = "x-mark";
    x.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        <line x1="${SPACE}" y1="${SPACE}" x2="${100 - SPACE}" y2="${100 - SPACE}"
              stroke="${CROSS_COLOR}" stroke-width="${CROSS_WIDTH}" stroke-linecap="round">
          <animate attributeName="x2" from="${SPACE}" to="${100 - SPACE}" dur="0.3s" fill="freeze" />
          <animate attributeName="y2" from="${SPACE}" to="${100 - SPACE}" dur="0.3s" fill="freeze" />
        </line>
        <line x1="${100 - SPACE}" y1="${SPACE}" x2="${SPACE}" y2="${100 - SPACE}"
              stroke="${CROSS_COLOR}" stroke-width="${CROSS_WIDTH}" stroke-linecap="round">
          <animate attributeName="x2" from="${100 - SPACE}" to="${SPACE}" dur="0.3s" begin="0.15s" fill="freeze" />
          <animate attributeName="y2" from="${SPACE}" to="${100 - SPACE}" dur="0.3s" begin="0.15s" fill="freeze" />
        </line>
      </svg>
    `;
    square.appendChild(x);
  }

  // Draw O in a square
  function drawO(square) {
    const o = document.createElement("div");
    o.className = "o-mark";
    o.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="${(CIRCLE_RADIUS * 100) / SQUARE_SIZE}"
                fill="none" stroke="${CIRCLE_COLOR}" stroke-width="${CIRCLE_WIDTH}">
          <animate attributeName="r" from="0" to="${(CIRCLE_RADIUS * 100) / SQUARE_SIZE}" dur="0.3s" fill="freeze" />
        </circle>
      </svg>
    `;
    square.appendChild(o);
  }

  // Check for win or draw
  function checkWin() {
    // Check rows
    for (let row = 0; row < BOARD_ROWS; row++) {
      if (
        board[row][0] !== null &&
        board[row][0] === board[row][1] &&
        board[row][1] === board[row][2]
      ) {
        drawWinLine("H", row);
        return board[row][0];
      }
    }

    // Check columns
    for (let col = 0; col < BOARD_COLS; col++) {
      if (
        board[0][col] !== null &&
        board[0][col] === board[1][col] &&
        board[1][col] === board[2][col]
      ) {
        drawWinLine("V", col);
        return board[0][col];
      }
    }

    // Check diagonals
    if (
      board[0][0] !== null &&
      board[0][0] === board[1][1] &&
      board[1][1] === board[2][2]
    ) {
      drawWinLine("D1");
      return board[0][0];
    }

    if (
      board[0][2] !== null &&
      board[0][2] === board[1][1] &&
      board[1][1] === board[2][0]
    ) {
      drawWinLine("D2");
      return board[0][2];
    }

    // Check for draw
    if (board.flat().every((cell) => cell !== null)) {
      return "Draw";
    }

    return null;
  }

  // Draw win line
   function drawWinLine(lineType, index) {
    const winLine = document.createElement("div");
    winLine.className = "win-line";
    winLine.style.position = "absolute";
    winLine.style.backgroundColor = WIN_LINE_COLOR;
    winLine.style.zIndex = "10";

    if (lineType === "H") {
  // Horizontal win
      winLine.style.height = "10px";
      winLine.style.width = `${SQUARE_SIZE * 3}px`; // span across all tiles
      winLine.style.top = `${index * SQUARE_SIZE + SQUARE_SIZE / 2 - 5}px`; // vertically center
      winLine.style.left = `0`;
      winLine.style.transform = "scaleX(0)";
      winLine.style.transformOrigin = "left";
      winLine.style.animation = "stretch-horizontally 0.5s forwards";
    } else if (lineType === "V") {
  // Vertical win
      winLine.style.width = "10px";
      winLine.style.height = `${SQUARE_SIZE * 3}px`; // full board height
      winLine.style.left = `${index * SQUARE_SIZE + SQUARE_SIZE / 2 - 5}px`; // center in column
      winLine.style.top = "0px";
      winLine.style.transform = "scaleY(0)";
      winLine.style.transformOrigin = "top";
      winLine.style.animation = "stretch-vertically 0.5s forwards";
    } else if (lineType === "D1") {
  // Diagonal win (top-left to bottom-right)
      const diagonalLength = Math.sqrt(2) * SQUARE_SIZE * 3;
      winLine.style.height = "10px";
      winLine.style.width = `${diagonalLength}px`;
      winLine.style.top = `calc(50% - 5px)`;
      winLine.style.left = `calc(50% - ${diagonalLength / 2}px)`;
      winLine.style.transform = "rotate(45deg) scaleX(0)";
      winLine.style.transformOrigin = "center";
      winLine.style.animation = "stretch-horizontally 0.5s forwards";
    } else if (lineType === "D2") {
      // Diagonal win (top-right to bottom-left)
      const diagonalLength = Math.sqrt(2) * SQUARE_SIZE * 3;
      winLine.style.height = "10px";
      winLine.style.width = `${diagonalLength}px`;
      winLine.style.top = `calc(50% - 5px)`;
      winLine.style.left = `calc(50% - ${diagonalLength / 2}px)`;
      winLine.style.transform = "rotate(-45deg) scaleX(0)";
      winLine.style.transformOrigin = "center";
      winLine.style.animation = "stretch-horizontally 0.5s forwards";
    }

    gameBoard.appendChild(winLine);

    // Add CSS animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes stretch-horizontally {
        to { transform: ${winLine.style.transform.replace("scaleX(0)", "scaleX(1)")}; }
      }
      @keyframes stretch-vertically {
        to { transform: scaleY(1); }
      }
    `;
    document.head.appendChild(style);
  }

  // Update game status text
  function updateGameStatus() {
    if (gameOver) {
      if (winner === "Draw") {
        gameStatus.textContent = "It's a Draw!";
      } else {
        gameStatus.textContent = `Player ${winner} wins!`;
      }
    } else {
      gameStatus.textContent = `Player ${player}'s Turn`;
    }
  }

  // Reset the game
  function resetGame() {
    board = Array(BOARD_ROWS)
      .fill()
      .map(() => Array(BOARD_COLS).fill(null));
    player = "X";
    gameOver = false;
    winner = null;
    lastMove = null;
    animationProgress = 0;
    particles = [];

    initializeBoard();
    updateGameStatus();
  }

  // Create particles at the marked position
  function createParticles(square) {
    const rect = square.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const color = player === "X" ? CROSS_COLOR : CIRCLE_COLOR;

    for (let i = 0; i < 30; i++) {
      particles.push(new Particle(centerX, centerY, color));
    }
  }

  // Particle class
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.vx = (Math.random() - 0.5) * 6;
      this.vy = (Math.random() - 0.5) * 6;
      this.radius = Math.random() * 4 + 2;
      this.life = 100;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.1; // Gravity
      this.life -= 1;
    }

    draw(ctx) {
      const alpha = this.life / 100;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.getRGBValues(this.color)}, ${alpha})`;
      ctx.fill();
    }

    getRGBValues(color) {
      // Convert hex to rgb
      if (color.startsWith("#")) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
      }
      return "0, 0, 0";
    }
  }

  // Confetti Particle class
  class ConfettiParticle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = Math.random() * 3 + 1;
      this.width = Math.random() * 10 + 5;
      this.height = Math.random() * 10 + 5;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 10;
      this.life = 200;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.05; // Gravity
      this.rotation += this.rotationSpeed;
      this.life -= 1;
    }

    draw(ctx) {
      const alpha = this.life / 200;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = `${this.color}${Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
    }
  }

  // Animation loop
  function animate() {
    // Clear the canvas
    ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(ctx);

      if (particles[i].life <= 0) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  // Event listeners
  playButton.addEventListener("click", showGame);
  menuQuitButton.addEventListener("click", function () {
    window.location.href = "/";
  });
  resetButton.addEventListener("click", resetGame);
  backButton.addEventListener("click", showMenu);
  quitButton.addEventListener("click", function () {
    window.location.href = "/";
  });
  playAgainButton.addEventListener("click", function () {
    winnerModal.style.display = "none";
    resetGame();
  });
  backToMenuButton.addEventListener("click", showMenu);

  window.addEventListener("resize", setupCanvas);

  // Initialize the game
  setupCanvas();
  initializeBoard();
  updateGameStatus();
  animate();

  // Start with menu screen
  showMenu();
});
