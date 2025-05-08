document.addEventListener("DOMContentLoaded", function () {
  // Game constants
  const BOARD_SIZE = 15;
  const LETTER_VALUES = {
    A: 1,
    B: 3,
    C: 3,
    D: 2,
    E: 1,
    F: 4,
    G: 2,
    H: 4,
    I: 1,
    J: 8,
    K: 5,
    L: 1,
    M: 3,
    N: 1,
    O: 1,
    P: 3,
    Q: 10,
    R: 1,
    S: 1,
    T: 1,
    U: 1,
    V: 4,
    W: 4,
    X: 8,
    Y: 4,
    Z: 10,
    " ": 0,
  };

  // Game state
  let board = [];
  let playerRack = [];
  let aiRack = [];
  let tileBag = [];
  let placedTiles = []; // Tiles placed in the current move
  let selectedTile = null;
  let exchangeTiles = [];
  let playerScore = 0;
  let aiScore = 0;
  let playerTurn = true;
  let gameOver = false;
  let dictionary = [];
  let consecutivePasses = 0;

  // DOM elements
  const boardElement = document.getElementById("board");
  const rackElement = document.getElementById("rack");
  const playerScoreElement = document.getElementById("player-score");
  const aiScoreElement = document.getElementById("ai-score");
  const tilesLeftElement = document.getElementById("tiles-left");
  const messageElement = document.getElementById("message");
  const setupScreen = document.getElementById("setup-screen");
  const gameOverScreen = document.getElementById("game-over");
  const winnerTextElement = document.getElementById("winner-text");
  const finalScoreElement = document.getElementById("final-score");

  // Buttons
  const playButton = document.getElementById("play-button");
  const passButton = document.getElementById("pass-button");
  const exchangeButton = document.getElementById("exchange-button");
  const shuffleButton = document.getElementById("shuffle-button");
  const easyButton = document.getElementById("easy-button");
  const mediumButton = document.getElementById("medium-button");
  const hardButton = document.getElementById("hard-button");
  const startButton = document.getElementById("start-button");
  const playAgainButton = document.getElementById("play-again");
  const quitButton = document.getElementById("quit-button");
  const quitMenuButton = document.getElementById("menu-quit-button");


  // Initialize the game
  initSetupScreen();

  // Setup screen event listeners
  function initSetupScreen() {
    // Set direct onclick handlers for setup buttons
    startButton.onclick = startGame;
    playAgainButton.onclick = function () {
      gameOverScreen.classList.add("hidden");
      setupScreen.classList.remove("hidden");
    };

quitMenuButton.onclick = quitGame; // move this outside of restartButton function

  }


  function startGame() {
    console.log("Start game clicked");
    setupScreen.classList.add("hidden");
    initGame();
  }


  function initGame() {
    // Initialize the board
    createBoard();

    // Initialize the tile bag
    createTileBag();

    // Draw initial tiles for both players
    playerRack = drawTiles(7);
    aiRack = drawTiles(7);

    // Reset game state
    playerScore = 0;
    aiScore = 0;
    playerTurn = true;
    gameOver = false;
    placedTiles = [];
    exchangeTiles = [];
    consecutivePasses = 0;

    // Update UI
    updateScores();
    updateMessage("Your turn. Drag tiles to the board.");
    updateTilesLeft();
    renderRack();

    // Load dictionary
    loadDictionary();

    // Set direct onclick handlers for game controls
    playButton.onclick = playMove;
    passButton.onclick = passTurn;
    exchangeButton.onclick = exchangeTilesAction;
    shuffleButton.onclick = shuffleRack;
    quitButton.onclick = quitGame;
  }
  function quitGame() {
  // Redirect to the main menu page (adjust the URL as needed)
  window.location.href = "/"; // or "/main-menu" if your route is named that
}

  function createBoard() {
    boardElement.innerHTML = "";
    board = [];

    // Define bonus square types
    const bonusSquares = {
      tw: [
        [0, 0],
        [0, 7],
        [0, 14],
        [7, 0],
        [7, 14],
        [14, 0],
        [14, 7],
        [14, 14],
      ],
      dw: [
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
        [1, 13],
        [2, 12],
        [3, 11],
        [4, 10],
        [10, 4],
        [11, 3],
        [12, 2],
        [13, 1],
        [10, 10],
        [11, 11],
        [12, 12],
        [13, 13],
      ],
      tl: [
        [1, 5],
        [1, 9],
        [5, 1],
        [5, 5],
        [5, 9],
        [5, 13],
        [9, 1],
        [9, 5],
        [9, 9],
        [9, 13],
        [13, 5],
        [13, 9],
      ],
      dl: [
        [0, 3],
        [0, 11],
        [2, 6],
        [2, 8],
        [3, 0],
        [3, 7],
        [3, 14],
        [6, 2],
        [6, 6],
        [6, 8],
        [6, 12],
        [7, 3],
        [7, 11],
        [8, 2],
        [8, 6],
        [8, 8],
        [8, 12],
        [11, 0],
        [11, 7],
        [11, 14],
        [12, 6],
        [12, 8],
        [14, 3],
        [14, 11],
      ],
    };

    // Initialize board array
    for (let row = 0; row < BOARD_SIZE; row++) {
      board[row] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        board[row][col] = null; // No tile placed yet
      }
    }

    // Create the board squares
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const square = document.createElement("div");
        square.classList.add("square");
        square.dataset.row = row;
        square.dataset.col = col;

        // Add bonus square classes
        let squareType = "";
        if (row === 7 && col === 7) {
          squareType = "center";
          square.textContent = "★";
        } else if (
          bonusSquares.tw.some((pos) => pos[0] === row && pos[1] === col)
        ) {
          squareType = "tw";
          square.textContent = "TW";
        } else if (
          bonusSquares.dw.some((pos) => pos[0] === row && pos[1] === col)
        ) {
          squareType = "dw";
          square.textContent = "DW";
        } else if (
          bonusSquares.tl.some((pos) => pos[0] === row && pos[1] === col)
        ) {
          squareType = "tl";
          square.textContent = "TL";
        } else if (
          bonusSquares.dl.some((pos) => pos[0] === row && pos[1] === col)
        ) {
          squareType = "dl";
          square.textContent = "DL";
        }

        if (squareType) {
          square.classList.add(squareType);
        }

        // Add drop event listeners
        square.addEventListener("dragover", handleDragOver);
        square.addEventListener("drop", handleDrop);

        boardElement.appendChild(square);
      }
    }
  }

  function createTileBag() {
    tileBag = [];

    // Distribution of tiles in Scrabble
    const tileDistribution = {
      A: 9,
      B: 2,
      C: 2,
      D: 4,
      E: 12,
      F: 2,
      G: 3,
      H: 2,
      I: 9,
      J: 1,
      K: 1,
      L: 4,
      M: 2,
      N: 6,
      O: 8,
      P: 2,
      Q: 1,
      R: 6,
      S: 4,
      T: 6,
      U: 4,
      V: 2,
      W: 2,
      X: 1,
      Y: 2,
      Z: 1,
      " ": 2, // ' ' represents blank tiles
    };

    // Create tiles based on distribution
    for (const [letter, count] of Object.entries(tileDistribution)) {
      for (let i = 0; i < count; i++) {
        tileBag.push({
          letter: letter,
          value: LETTER_VALUES[letter],
        });
      }
    }

    // Shuffle the bag
    shuffleArray(tileBag);
  }

  function drawTiles(count) {
    const drawnTiles = [];
    for (let i = 0; i < count && tileBag.length > 0; i++) {
      drawnTiles.push(tileBag.pop());
    }
    return drawnTiles;
  }

  function renderRack() {
    rackElement.innerHTML = "";

    playerRack.forEach((tile, index) => {
      // Skip tiles that are currently placed on the board
      if (placedTiles.some((t) => t.tile === tile)) return;

      const tileElement = createTileElement(tile, index);
      rackElement.appendChild(tileElement);
    });
  }

  function createTileElement(tile, index) {
    const tileElement = document.createElement("div");
    tileElement.classList.add("tile");
    tileElement.dataset.index = index;

    // Add selection for exchange
    if (exchangeTiles.includes(index)) {
      tileElement.classList.add("selected");
    }

    // Add letter
    const letterElement = document.createElement("div");
    letterElement.classList.add("letter");
    letterElement.textContent = tile.letter;
    tileElement.appendChild(letterElement);

    // Add value
    const valueElement = document.createElement("div");
    valueElement.classList.add("value");
    valueElement.textContent = tile.value;
    tileElement.appendChild(valueElement);

    // Make draggable
    tileElement.draggable = true;
    tileElement.addEventListener("dragstart", handleDragStart);
    tileElement.addEventListener("dragend", handleDragEnd);

    // Add right-click for exchange selection
    tileElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      toggleExchangeTile(index);
    });

    return tileElement;
  }

  // Drag and drop functionality
  function handleDragStart(e) {
    const tileIndex = parseInt(e.target.dataset.index);

    // Check if this is a tile on the board
    const isOnBoard = e.target.closest(".square") !== null;

    if (isOnBoard) {
      // Find the placed tile
      const square = e.target.closest(".square");
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);

      // Find the tile in placedTiles
      const placedTileIndex = placedTiles.findIndex(
        (t) => t.row === row && t.col === col,
      );

      if (placedTileIndex !== -1) {
        selectedTile = {
          tile: placedTiles[placedTileIndex].tile,
          placedIndex: placedTileIndex,
          element: e.target,
          fromBoard: true,
          row: row,
          col: col,
        };
      }
    } else {
      // Regular tile from rack
      selectedTile = {
        tile: playerRack[tileIndex],
        index: tileIndex,
        element: e.target,
        fromBoard: false,
      };
    }

    e.target.classList.add("dragging");
    e.dataTransfer.setData("text/plain", "tile"); // Just need something here
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd(e) {
    e.target.classList.remove("dragging");
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e) {
    e.preventDefault();
    if (!selectedTile) return;

    // Check if dropping on the rack
    if (e.target === rackElement || e.target.closest("#rack")) {
      // If the tile was from the board, return it to the rack
      if (selectedTile.fromBoard) {
        // Remove from placedTiles
        placedTiles.splice(selectedTile.placedIndex, 1);

        // Clear the board square
        const square = document.querySelector(
          `.square[data-row="${selectedTile.row}"][data-col="${selectedTile.col}"]`,
        );

        // Restore the original text for bonus squares
        const row = selectedTile.row;
        const col = selectedTile.col;
        square.innerHTML = "";
        if (row === 7 && col === 7) {
          square.textContent = "★";
        } else if (isBonusSquare(row, col, "tw")) {
          square.textContent = "TW";
        } else if (isBonusSquare(row, col, "dw")) {
          square.textContent = "DW";
        } else if (isBonusSquare(row, col, "tl")) {
          square.textContent = "TL";
        } else if (isBonusSquare(row, col, "dl")) {
          square.textContent = "DL";
        }
      }

      // Update the rack
      renderRack();
      selectedTile = null;
      return;
    }

    // Handle dropping on a board square
    const square = e.target.closest(".square");
    if (!square) return;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    // Check if the square is empty
    if (
      board[row][col] !== null ||
      placedTiles.some((t) => t.row === row && t.col === col)
    ) {
      return;
    }

    // If moving from board to board
    if (selectedTile.fromBoard) {
      // Update the placedTile position
      placedTiles[selectedTile.placedIndex].row = row;
      placedTiles[selectedTile.placedIndex].col = col;

      // Clear the old square
      const oldSquare = document.querySelector(
        `.square[data-row="${selectedTile.row}"][data-col="${selectedTile.col}"]`,
      );

      // Restore the original text for bonus squares
      const oldRow = selectedTile.row;
      const oldCol = selectedTile.col;
      oldSquare.innerHTML = "";
      if (oldRow === 7 && oldCol === 7) {
        oldSquare.textContent = "★";
      } else if (isBonusSquare(oldRow, oldCol, "tw")) {
        oldSquare.textContent = "TW";
      } else if (isBonusSquare(oldRow, oldCol, "dw")) {
        oldSquare.textContent = "DW";
      } else if (isBonusSquare(oldRow, oldCol, "tl")) {
        oldSquare.textContent = "TL";
      } else if (isBonusSquare(oldRow, oldCol, "dl")) {
        oldSquare.textContent = "DL";
      }
    } else {
      // Place a new tile from the rack
      placedTiles.push({
        row: row,
        col: col,
        tile: selectedTile.tile,
      });
    }

    // Update the board visually
    const tileElement = createTileElement(selectedTile.tile, -1); // -1 index as it's now on the board
    square.innerHTML = ""; // Clear any bonus text
    square.appendChild(tileElement);

    // Update the rack
    renderRack();

    selectedTile = null;
  }

  // Helper function to check if a square is a bonus square
  function isBonusSquare(row, col, type) {
    const bonusSquares = {
      tw: [
        [0, 0],
        [0, 7],
        [0, 14],
        [7, 0],
        [7, 14],
        [14, 0],
        [14, 7],
        [14, 14],
      ],
      dw: [
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
        [1, 13],
        [2, 12],
        [3, 11],
        [4, 10],
        [10, 4],
        [11, 3],
        [12, 2],
        [13, 1],
        [10, 10],
        [11, 11],
        [12, 12],
        [13, 13],
      ],
      tl: [
        [1, 5],
        [1, 9],
        [5, 1],
        [5, 5],
        [5, 9],
        [5, 13],
        [9, 1],
        [9, 5],
        [9, 9],
        [9, 13],
        [13, 5],
        [13, 9],
      ],
      dl: [
        [0, 3],
        [0, 11],
        [2, 6],
        [2, 8],
        [3, 0],
        [3, 7],
        [3, 14],
        [6, 2],
        [6, 6],
        [6, 8],
        [6, 12],
        [7, 3],
        [7, 11],
        [8, 2],
        [8, 6],
        [8, 8],
        [8, 12],
        [11, 0],
        [11, 7],
        [11, 14],
        [12, 6],
        [12, 8],
        [14, 3],
        [14, 11],
      ],
    };

    return bonusSquares[type].some(([r, c]) => r === row && c === col);
  }
  // Game actions
  function playMove() {
    if (!playerTurn || placedTiles.length === 0) {
      updateMessage("You must place at least one tile.");
      return;
    }

    // Validate the move
    const validationResult = validateMove();
    if (!validationResult.valid) {
      updateMessage(validationResult.message);
      return;
    }

    // Calculate score
    const moveScore = calculateMoveScore();
    playerScore += moveScore;

    // Update the board permanently
    placedTiles.forEach((placed) => {
      board[placed.row][placed.col] = placed.tile;
    });

    // Remove placed tiles from rack
    placedTiles.forEach((placed) => {
      const index = playerRack.indexOf(placed.tile);
      if (index !== -1) {
        playerRack.splice(index, 1);
      }
    });

    // Draw new tiles
    const newTiles = drawTiles(placedTiles.length);
    playerRack.push(...newTiles);

    // Reset consecutive passes
    consecutivePasses = 0;

    // Update UI
    updateScores();
    updateMessage(`You scored ${moveScore} points!`);

    // Clear placed tiles
    placedTiles = [];

    // Switch turns
    playerTurn = false;
    updateMessage("AI is thinking...");
    updateTilesLeft();
    renderRack();

    // AI's turn (after a delay)
    setTimeout(aiTurn, 1500);
  }

  function validateMove() {
    if (placedTiles.length === 0) {
      return { valid: false, message: "No tiles placed." };
    }

    // Check if this is the first move
    let firstMove = true;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] !== null) {
          firstMove = false;
          break;
        }
      }
      if (!firstMove) break;
    }

    // If it's the first move, check if a tile is on the center square
    if (firstMove) {
      const centerTile = placedTiles.find((t) => t.row === 7 && t.col === 7);
      if (!centerTile) {
        return {
          valid: false,
          message: "First move must include the center square.",
        };
      }
    }

    // Check if all tiles are in a line (row or column)
    const rows = placedTiles.map((t) => t.row);
    const cols = placedTiles.map((t) => t.col);
    const sameRow = rows.every((r) => r === rows[0]);
    const sameCol = cols.every((c) => c === cols[0]);

    if (!sameRow && !sameCol) {
      return {
        valid: false,
        message: "Tiles must be placed in a straight line.",
      };
    }

    // Check if tiles are contiguous
    if (sameRow) {
      cols.sort((a, b) => a - b);
      for (let i = 1; i < cols.length; i++) {
        if (cols[i] !== cols[i - 1] + 1) {
          // Check if there's a tile already on the board between these positions
          if (board[rows[0]][cols[i - 1] + 1] === null) {
            return {
              valid: false,
              message: "Tiles must be placed in a contiguous line.",
            };
          }
        }
      }
    } else {
      // sameCol
      rows.sort((a, b) => a - b);
      for (let i = 1; i < rows.length; i++) {
        if (rows[i] !== rows[i - 1] + 1) {
          // Check if there's a tile already on the board between these positions
          if (board[rows[i - 1] + 1][cols[0]] === null) {
            return {
              valid: false,
              message: "Tiles must be placed in a contiguous line.",
            };
          }
        }
      }
    }

    // If not the first move, check if the new tiles connect to existing tiles
    if (!firstMove) {
      let connected = false;
      for (const placed of placedTiles) {
        const { row, col } = placed;
        // Check adjacent squares
        const adjacentPositions = [
          [row - 1, col], // above
          [row + 1, col], // below
          [row, col - 1], // left
          [row, col + 1], // right
        ];

        for (const [adjRow, adjCol] of adjacentPositions) {
          if (
            adjRow >= 0 &&
            adjRow < BOARD_SIZE &&
            adjCol >= 0 &&
            adjCol < BOARD_SIZE &&
            board[adjRow][adjCol] !== null
          ) {
            connected = true;
            break;
          }
        }
        if (connected) break;
      }

      if (!connected) {
        return {
          valid: false,
          message: "New tiles must connect to existing tiles.",
        };
      }
    }

    // Check if all formed words are valid
    const words = getFormedWords();
    for (const word of words) {
      if (!isValidWord(word.word)) {
        return { valid: false, message: `"${word.word}" is not a valid word.` };
      }
    }

    return { valid: true };
  }

  function getFormedWords() {
    const words = [];
    const tempBoard = JSON.parse(JSON.stringify(board)); // Deep copy

    // Add placed tiles to temp board
    placedTiles.forEach((placed) => {
      tempBoard[placed.row][placed.col] = placed.tile;
    });

    // Check for horizontal words
    for (const placed of placedTiles) {
      const { row, col } = placed;

      // Find the start of the horizontal word
      let startCol = col;
      while (startCol > 0 && tempBoard[row][startCol - 1] !== null) {
        startCol--;
      }

      // Find the end of the horizontal word
      let endCol = col;
      while (endCol < BOARD_SIZE - 1 && tempBoard[row][endCol + 1] !== null) {
        endCol++;
      }

      // If the word is longer than 1 letter, add it
      if (endCol > startCol) {
        let word = "";
        for (let c = startCol; c <= endCol; c++) {
          word += tempBoard[row][c].letter;
        }
        words.push({ word, direction: "horizontal", row, startCol, endCol });
      }
    }

    // Check for vertical words
    for (const placed of placedTiles) {
      const { row, col } = placed;

      // Find the start of the vertical word
      let startRow = row;
      while (startRow > 0 && tempBoard[startRow - 1][col] !== null) {
        startRow--;
      }

      // Find the end of the vertical word
      let endRow = row;
      while (endRow < BOARD_SIZE - 1 && tempBoard[endRow + 1][col] !== null) {
        endRow++;
      }

      // If the word is longer than 1 letter, add it
      if (endRow > startRow) {
        let word = "";
        for (let r = startRow; r <= endRow; r++) {
          word += tempBoard[r][col].letter;
        }
        words.push({ word, direction: "vertical", col, startRow, endRow });
      }
    }

    return words;
  }

  function isValidWord(word) {
    return dictionary.includes(word);
  }

  function calculateMoveScore() {
    let totalScore = 0;
    const words = getFormedWords();

    for (const wordInfo of words) {
      let wordScore = 0;
      let wordMultiplier = 1;

      if (wordInfo.direction === "horizontal") {
        for (let col = wordInfo.startCol; col <= wordInfo.endCol; col++) {
          const row = wordInfo.row;
          const tile =
            board[row][col] ||
            placedTiles.find((t) => t.row === row && t.col === col)?.tile;

          if (!tile) continue;

          let letterScore = tile.value;

          // Apply letter multipliers only for newly placed tiles
          if (placedTiles.some((t) => t.row === row && t.col === col)) {
            if (isBonusSquare(row, col, "dl")) letterScore *= 2;
            if (isBonusSquare(row, col, "tl")) letterScore *= 3;

            // Track word multipliers for newly placed tiles
            if (isBonusSquare(row, col, "dw")) wordMultiplier *= 2;
            if (isBonusSquare(row, col, "tw")) wordMultiplier *= 3;
          }

          wordScore += letterScore;
        }
      } else {
        // vertical
        for (let row = wordInfo.startRow; row <= wordInfo.endRow; row++) {
          const col = wordInfo.col;
          const tile =
            board[row][col] ||
            placedTiles.find((t) => t.row === row && t.col === col)?.tile;

          if (!tile) continue;

          let letterScore = tile.value;

          // Apply letter multipliers only for newly placed tiles
          if (placedTiles.some((t) => t.row === row && t.col === col)) {
            if (isBonusSquare(row, col, "dl")) letterScore *= 2;
            if (isBonusSquare(row, col, "tl")) letterScore *= 3;

            // Track word multipliers for newly placed tiles
            if (isBonusSquare(row, col, "dw")) wordMultiplier *= 2;
            if (isBonusSquare(row, col, "tw")) wordMultiplier *= 3;
          }

          wordScore += letterScore;
        }
      }

      // Apply word multiplier
      wordScore *= wordMultiplier;
      totalScore += wordScore;
    }

    // Bonus for using all 7 tiles
    if (placedTiles.length === 7) {
      totalScore += 50;
    }

    return totalScore;
  }

  function passTurn() {
    if (!playerTurn) return;

    // Return any placed tiles to the rack
    placedTiles = [];
    renderRack();

    // Increment consecutive passes
    consecutivePasses++;

    // Check if game should end (4 consecutive passes = 2 passes each)
    if (consecutivePasses >= 4) {
      endGame();
      return;
    }

    // Switch turns
    playerTurn = false;
    updateMessage("You passed. AI is thinking...");

    // AI's turn (after a delay)
    setTimeout(aiTurn, 1500);
  }

  function exchangeTilesAction() {
    if (!playerTurn || exchangeTiles.length === 0) {
      updateMessage("Select tiles to exchange (right-click).");
      return;
    }

    if (tileBag.length < exchangeTiles.length) {
      updateMessage("Not enough tiles in the bag to exchange.");
      return;
    }

    // Get the tiles to exchange
    const tilesToExchange = [];
    exchangeTiles.sort((a, b) => b - a); // Sort in descending order to remove from end first

    for (const index of exchangeTiles) {
      tilesToExchange.push(playerRack[index]);
      playerRack.splice(index, 1);
    }

    // Put them back in the bag
    tileBag.push(...tilesToExchange);
    shuffleArray(tileBag);

    // Draw new tiles
    const newTiles = drawTiles(tilesToExchange.length);
    playerRack.push(...newTiles);

    // Clear exchange selection
    exchangeTiles = [];

    // Reset consecutive passes
    consecutivePasses = 0;

    // Switch turns
    playerTurn = false;
    updateMessage("Tiles exchanged. AI is thinking...");
    updateTilesLeft();
    renderRack();

    // AI's turn (after a delay)
    setTimeout(aiTurn, 1500);
  }

  function shuffleRack() {
    if (!playerTurn) return;

    // Get tiles that aren't placed on the board
    const availableTiles = playerRack.filter(
      (tile) => !placedTiles.some((placed) => placed.tile === tile),
    );

    // Shuffle them
    shuffleArray(availableTiles);

    // Replace them in the rack
    let j = 0;
    for (let i = 0; i < playerRack.length; i++) {
      if (!placedTiles.some((placed) => placed.tile === playerRack[i])) {
        playerRack[i] = availableTiles[j++];
      }
    }

    // Clear exchange selection
    exchangeTiles = [];

    // Update the rack
    renderRack();
  }

  function aiTurn() {
    // Check if game is over
    if (checkGameOver()) {
      endGame();
      return;
    }

    // AI logic will be implemented in the next phase
    // For now, just a simple pass
    consecutivePasses++;

    // Check if game should end (4 consecutive passes = 2 passes each)
    if (consecutivePasses >= 4) {
      endGame();
      return;
    }

    // Switch back to player's turn
    playerTurn = true;
    updateMessage("AI passed. Your turn.");
    updateTilesLeft();
  }

  // Helper functions
  function toggleExchangeTile(index) {
    const idx = exchangeTiles.indexOf(index);
    if (idx === -1) {
      exchangeTiles.push(index);
    } else {
      exchangeTiles.splice(idx, 1);
    }
    renderRack();
  }

  function updateScores() {
    playerScoreElement.textContent = `Your Score: ${playerScore}`;
    aiScoreElement.textContent = `AI Score: ${aiScore}`;
  }

  function updateMessage(message) {
    messageElement.textContent = message;
  }

  function updateTilesLeft() {
    tilesLeftElement.textContent = `Tiles in bag: ${tileBag.length}`;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function loadDictionary() {
  fetch('/static/dictionary.txt')
    .then(response => response.text())
    .then(text => {
      dictionary = text.toUpperCase().split('\n').map(word => word.trim()).filter(word => word !== '');
      dictionaryLoaded = true;
      console.log("Dictionary loaded:", dictionary.length, "words");
    })
    .catch(error => {
      console.error("Error loading dictionary:", error);
    });
}


  function checkGameOver() {
    // Game is over if bag is empty and either player has no tiles
    return (
      (tileBag.length === 0 &&
        (playerRack.length === 0 || aiRack.length === 0)) ||
      consecutivePasses >= 4 // 4 consecutive passes (2 from each player)
    );
  }

  function endGame() {
    gameOver = true;

    // Determine winner
    let winnerText;
    if (playerScore > aiScore) {
      winnerText = "You win!";
    } else if (aiScore > playerScore) {
      winnerText = "AI wins!";
    } else {
      winnerText = "It's a tie!";
    }

    // Update game over screen
    winnerTextElement.textContent = winnerText;
    finalScoreElement.textContent = `Final Score: You ${playerScore} - AI ${aiScore}`;
    gameOverScreen.classList.remove("hidden");
  }
});