// Game variables
let canvas, ctx;
let gameState = "menu"; // intro, menu, options, game, credits
let board;
let diceImages = [];
let playerTokens = [];
let currentPlayer = 1;
let playerCount = 2;
let playerPositions = [0, 0, 0, 0]; // 0-based positions for all 4 possible players
let diceValue = 1;
let isComputerPlayer = false;
let messageTimeout;


// Audio elements
let backgroundMusic;
let snakeSound;
let ladderSound;
let winSound;
let loseSound;

// Board coordinates for positions 1-100
const boardPositions = [];

// Snake and ladder positions
const snakes = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 36,
  93: 73,
  95: 75,
  98: 79,
};

const ladders = {
  1: 38,
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  51: 67,
  72: 91,
  80: 99,
};

// Initialize the game
window.onload = function () {
  // Get canvas and context
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // Load images
  loadImages();

  // Load audio
  loadAudio();

  // Calculate board positions
  calculateBoardPositions();

  // Set up event listeners
  setupEventListeners();

  // Start with intro screen
  showIntroScreen();
};

function loadImages() {
  // Load board image
  board = new Image();
  board.src = "/static/assets/Snakes-and-Ladders-Bigger.png";

  board.onload = function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

};


  // Load dice images
  for (let i = 1; i <= 6; i++) {
    const diceImg = new Image();
    diceImg.src = `/static/assets/dice${i}.png`;
    diceImages.push(diceImg);
  }

  // Load player tokens
  const tokenColors = ["red", "yellow", "green", "blue"];
  tokenColors.forEach((color) => {
    const token = new Image();
    token.src = `/static/assets/${color}goti.png`;
    playerTokens.push(token);
  });
}

// Load audio files
function loadAudio() {
  backgroundMusic = new Audio("/static/assets/music.wav");
   snakeSound = new Audio("/static/assets/snake.wav");
   ladderSound = new Audio("/static/assets/ladder.wav");
   winSound = new Audio("/static/assets/Win.wav");
   loseSound = new Audio("/static/assets/lose.wav");

}

function calculateBoardPositions() {
  const boardWidth = 700;
  const boardHeight = 500;
  const startX = 0;
  const startY = 0;

  const cellWidth = boardWidth / 10;
  const cellHeight = boardHeight / 10;

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      let x, y;
      let position;

      if (row % 2 === 0) {
        // Even row: left to right
        x = startX + col * cellWidth + cellWidth / 2;
        position = row * 10 + col + 1;
      } else {
        // Odd row: right to left
        x = startX + (9 - col) * cellWidth + cellWidth / 2;
        position = row * 10 + col + 1;
      }

      // Flip vertically so row 0 is at the bottom
      y = startY + (9 - row) * cellHeight + cellHeight / 2;

      boardPositions[position - 1] = { x, y };
    }
  }
}


function quitGame() {
  // Optional: cleanup logic
  console.log("Quitting game...");

  // Redirect to home or a 'goodbye' page
  window.location.href = "/";  // Change this if your main menu is a different route
}


// Set up event listeners for buttons
function setupEventListeners() {
  // Menu screen buttons
  document
    .getElementById("play-btn")
    .addEventListener("click", showOptionsScreen);
  document
    .getElementById("quit-btn")
    .addEventListener("click", quitGame);




  // Options screen buttons

  document
    .getElementById("two-player-btn")
    .addEventListener("click", () => startGame(2));
  document
    .getElementById("three-player-btn")
    .addEventListener("click", () => startGame(3));
  document
    .getElementById("four-player-btn")
    .addEventListener("click", () => startGame(4));
  document
    .getElementById("back-to-menu-btn")
    .addEventListener("click", showMenuScreen);

  // Game screen buttons
  document
    .getElementById("back-btn")
    .addEventListener("click", showOptionsScreen);
  document
    .getElementById("quitGame-btn")
    .addEventListener("click", quitGame);
  document.getElementById("mute-btn").addEventListener("click", muteMusic);
  document
    .getElementById("play-music-btn")
    .addEventListener("click", playMusic);

  // Player buttons
  document
    .getElementById("player1-btn")
    .addEventListener("click", () => playerTurn(1));
  document
    .getElementById("player2-btn")
    .addEventListener("click", () => playerTurn(2));
  document
    .getElementById("player3-btn")
    .addEventListener("click", () => playerTurn(3));
  document
    .getElementById("player4-btn")
    .addEventListener("click", () => playerTurn(4));


  // Menu music buttons
  document.getElementById("mute-menu-btn").addEventListener("click", muteMusic);
  document
    .getElementById("play-menu-music-btn")
    .addEventListener("click", playMusic);
}


// Show menu screen
function showMenuScreen() {
  gameState = "menu";
  hideAllScreens();
  document.getElementById("menu-screen").classList.add("active");
}

// Show options screen
function showOptionsScreen() {
  gameState = "options";
  hideAllScreens();
  document.getElementById("options-screen").classList.add("active");
}


// Hide all screens
function hideAllScreens() {
  const screens = document.querySelectorAll(".screen");
  screens.forEach((screen) => screen.classList.remove("active"));
  document.getElementById("game-container").style.display = "none";
}

// Start the game
function startGame(players) {
  gameState = "game";
  playerCount = players;
  isComputerPlayer = players === 1;
  currentPlayer = 1;
  playerPositions = [0, 0, 0, 0];

  hideAllScreens();
  document.getElementById("game-container").style.display = "flex";

  // Show/hide player buttons based on player count
  document.getElementById("player1-btn").style.display = "block";
  document.getElementById("player2-btn").style.display = isComputerPlayer
    ? "block"
    : playerCount >= 2
      ? "block"
      : "none";
  document.getElementById("player3-btn").style.display =
    playerCount >= 3 ? "block" : "none";
  document.getElementById("player4-btn").style.display =
    playerCount >= 4 ? "block" : "none";

  // Change player 2 button text if computer player
  if (isComputerPlayer) {
    document.getElementById("player2-btn").textContent = "Computer";
  } else {
    document.getElementById("player2-btn").textContent = "Player 2";
  }

  // Update button states for current player
  updatePlayerButtons();

  // Draw the initial game state
  drawGame();

  // If computer is player 2 and current player is 2, make computer move
  if (isComputerPlayer && currentPlayer === 2) {
    setTimeout(computerTurn, 1000);
  }
}

// Draw the game board and pieces
function drawGame() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw board
  ctx.drawImage(board, 0, 0, canvas.width, canvas.height);

  // Draw player tokens
  for (let i = 0; i < playerCount; i++) {
    if (playerPositions[i] > 0) {
      const position = playerPositions[i];
      const { x, y } = boardPositions[position - 1];

      // Offset tokens slightly so they don't overlap
      const offsetX = i * 5;
      ctx.drawImage(playerTokens[i], x - 25 + offsetX, y - 25, 50, 50);
    }
  }

  // Update dice display
 document.getElementById("dice-img").src = `/static/assets/dice${diceValue}.png`;

}



// Handle player turn
function playerTurn(player) {
  if (currentPlayer !== player) return;

  // Roll dice
  diceValue = rollDice();

  // Move player
  movePlayer(player, diceValue);

  // Check for game over
  if (playerPositions[player - 1] === 100) {
    // Player wins
    displayMessage(`Player ${player} Wins!`);
    playSound(player === 1 ? winSound : loseSound);

    // After 2 seconds, go back to options
    setTimeout(showOptionsScreen, 2000);
    return;
  }

  // If not a 6, switch to next player
  if (diceValue !== 6) {
    nextPlayer();
  }

  // If next player is computer, make computer move
  if (isComputerPlayer && currentPlayer === 2) {
    setTimeout(computerTurn, 1000);
  }
}

// Computer turn
function computerTurn() {
  // Roll dice
  diceValue = rollDice();

  // Move computer
  movePlayer(2, diceValue);

  // Check for game over
  if (playerPositions[1] === 100) {
    // Computer wins
    displayMessage("Computer Wins!");
    playSound(loseSound);

    // After 2 seconds, go back to options
    setTimeout(showOptionsScreen, 2000);
    return;
  }

  // If not a 6, switch to player 1
  if (diceValue !== 6) {
    nextPlayer();
  } else if (isComputerPlayer && currentPlayer === 2) {
    // If rolled a 6, computer gets another turn
    setTimeout(computerTurn, 1000);
  }
}

// Roll the dice
function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function movePlayer(player, steps) {
  const currentPos = playerPositions[player - 1];
  let newPos = currentPos + steps;

  // Handle bounce-back if moving past 100
  if (newPos > 100) {
    const overshoot = newPos - 100; // Calculate how far over 100 the player goes
    newPos = 100 - overshoot; // Bounce back to the previous position
    displayMessage(`Bounced back to ${newPos}`); // Display bounce-back message
  }

  // Update position
  playerPositions[player - 1] = newPos;

  // Draw updated game
  drawGame();

  // Check for ladders
  if (ladders[newPos]) {
    setTimeout(() => {
      displayMessage("There's a Ladder!");
      playSound(ladderSound);
      playerPositions[player - 1] = ladders[newPos];
      drawGame();
    }, 500);
  }

  // Check for snakes
  if (snakes[newPos]) {
    setTimeout(() => {
      displayMessage("There's a Snake!");
      playSound(snakeSound);
      playerPositions[player - 1] = snakes[newPos];
      drawGame();
    }, 500);
  }
}


// Switch to next player
function nextPlayer() {
  currentPlayer++;
  if (currentPlayer > playerCount) {
    currentPlayer = 1;
  }

  updatePlayerButtons();
}

// Update player button states
function updatePlayerButtons() {
  // Enable/disable buttons based on current player
  document.getElementById("player1-btn").disabled = currentPlayer !== 1;
  document.getElementById("player2-btn").disabled =
    currentPlayer !== 2 || isComputerPlayer;
  document.getElementById("player3-btn").disabled = currentPlayer !== 3;
  document.getElementById("player4-btn").disabled = currentPlayer !== 4;
}

// Display a message
function displayMessage(message) {
  const messageDisplay = document.getElementById("message-display");
  messageDisplay.textContent = message;

  // Clear previous timeout
  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }

  // Clear message after 2 seconds
  messageTimeout = setTimeout(() => {
    messageDisplay.textContent = "";
  }, 2000);
}

// Play a sound
function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

// Mute background music
function muteMusic() {
  backgroundMusic.pause();
}

// Play background music
function playMusic() {
  backgroundMusic.play();
}