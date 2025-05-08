// Sanrio Memory Game JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Game variables
  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let totalPairs = 8; // 4x4 grid = 16 cards = 8 pairs
  let moves = 0;
  let gameStarted = false;
  let gameTimer;
  let seconds = 0;
  let gameState = "menu"; // menu, playing, victory

  // Character images for matching
  const characterImages = [
    "Hello Kitty.png",
    "My Melody.png",
    "Pompompurin.png",
    "Kuromi.png",
    "Cinnamoroll.png",
    "Pochacco.png",
    "Badtz Maru.png",
    "Keroppi.png",
  ];

  // DOM elements
  const menuScreen = document.getElementById("menu-screen");
  const gameScreen = document.getElementById("game-screen");
  const victoryScreen = document.getElementById("victory-screen");
  const gameBoard = document.getElementById("memory-game-board");
  const movesCount = document.getElementById("moves-count");
  const pairsFound = document.getElementById("pairs-found");
  const timeElapsed = document.getElementById("time-elapsed");
  const victoryTimeLabel = document.getElementById("victory-time");
  const victoryMovesLabel = document.getElementById("victory-moves");
  const startGameButton = document.getElementById("start-game");
  const quitGameButton = document.getElementById("quit-game");
  const playAgainButton = document.getElementById("play-again");
  const mainMenuButtons = document.querySelectorAll(".main-menu-btn");

  // Add event listeners
  startGameButton.addEventListener("click", startGame);
  playAgainButton.addEventListener("click", startGame);
  mainMenuButtons.forEach((button) => {
    button.addEventListener("click", showMenuScreen);
  });

  function quitGame() {
  // Any game cleanup logic here
  console.log("Quitting game...");

  // Then redirect to main menu
  window.location.href = "/";
}

quitGameButton.addEventListener("click", quitGame);



  // Show menu screen initially
  showMenuScreen();

  // Function to show menu screen
  function showMenuScreen() {
    gameState = "menu";
    menuScreen.style.display = "block";
    gameScreen.style.display = "none";
    victoryScreen.style.display = "none";

    // Stop timer if running
    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }
  }

  // Function to show game screen
  function showGameScreen() {
    gameState = "playing";
    menuScreen.style.display = "none";
    gameScreen.style.display = "block";
    victoryScreen.style.display = "none";
  }

  // Function to show victory screen
  function showVictoryScreen() {
    gameState = "victory";
    menuScreen.style.display = "none";
    gameScreen.style.display = "none";
    victoryScreen.style.display = "block";

    // Update victory screen stats
    victoryTimeLabel.textContent = formatTime(seconds);
    victoryMovesLabel.textContent = moves;
  }

  // Function to start the game
  function startGame() {
    // Reset game variables
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    seconds = 0;
    gameStarted = true;

    // Clear the game board
    gameBoard.innerHTML = "";

    // Update the UI
    movesCount.textContent = moves;
    pairsFound.textContent = `${matchedPairs}/${totalPairs}`;
    timeElapsed.textContent = "00:00";

    // Clear any existing timer
    if (gameTimer) {
      clearInterval(gameTimer);
    }

    // Start the game timer
    startGameTimer();

    // Create a shuffled array of card values (pairs of character images)
    const cardValues = [];

    // Make sure we have enough images for 8 pairs (16 cards)
    let availableImages = [...characterImages];
    while (availableImages.length < 8) {
      // Add images from the beginning again if we don't have enough
      const needed = 8 - availableImages.length;
      availableImages = availableImages.concat(
        characterImages.slice(0, needed),
      );
    }

    // Select exactly 8 images and create pairs
    const selectedImages = availableImages.slice(0, 8);
    const pairs = [...selectedImages, ...selectedImages]; // Create pairs (16 cards total)

    // Shuffle the card values
    shuffleArray(pairs);

    // Create the cards and add them to the game board
    pairs.forEach((value, index) => {
      const card = document.createElement("div");
      card.className = "memory-card";
      card.dataset.cardIndex = index;
      card.dataset.value = value;

      // Create card front (with character image)
      const cardFront = document.createElement("div");
      cardFront.className = "memory-card-front";
      const cardImage = document.createElement("img");
      cardImage.src = `/static/images/${value}`;

      cardImage.alt = value.replace(".png", "").replace("_", " ");
      cardImage.className = "memory-card-image";
      cardFront.appendChild(cardImage);

      // Create card back
      const cardBack = document.createElement("div");
      cardBack.className = "memory-card-back";

      // Add front and back to the card
      card.appendChild(cardFront);
      card.appendChild(cardBack);

      // Add click event listener
      card.addEventListener("click", () => flipCard(card));

      // Add the card to the game board
      gameBoard.appendChild(card);
      cards.push(card);
    });

    // Show game screen
    showGameScreen();
  }

  // Function to flip a card
  function flipCard(card) {
    // Ignore clicks if the card is already flipped or matched
    if (
      card.classList.contains("flipped") ||
      card.classList.contains("matched")
    ) {
      return;
    }

    // Ignore clicks if two cards are already flipped and being checked
    if (flippedCards.length === 2) {
      return;
    }

    // Flip the card
    card.classList.add("flipped");
    flippedCards.push(card);

    // Check for a match if two cards are flipped
    if (flippedCards.length === 2) {
      // Increment the moves counter
      moves++;
      movesCount.textContent = moves;

      // Check if the cards match
      setTimeout(() => {
        checkMatch();
      }, 500);
    }
  }

  // Function to check if flipped cards match
  function checkMatch() {
    const firstCard = flippedCards[0];
    const secondCard = flippedCards[1];

    if (firstCard.dataset.value === secondCard.dataset.value) {
      // Cards match
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");

      // Increment the matched pairs counter
      matchedPairs++;
      pairsFound.textContent = `${matchedPairs}/${totalPairs}`;

      // Check if all pairs have been found
      if (matchedPairs === totalPairs) {
        // Game over - player has won
        setTimeout(() => {
          clearInterval(gameTimer);
          showVictoryScreen();
        }, 1000);
      }
    } else {
      // Cards don't match, flip them back
      setTimeout(() => {
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
      }, 500);
    }

    // Clear the flipped cards array
    flippedCards = [];
  }

  // Function to start the game timer
  function startGameTimer() {
    gameTimer = setInterval(() => {
      seconds++;
      timeElapsed.textContent = formatTime(seconds);
    }, 1000);
  }

  // Function to format time as MM:SS
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  // Function to shuffle an array (Fisher-Yates algorithm)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});
