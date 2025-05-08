document.addEventListener("DOMContentLoaded", () => {
  const startGameButton = document.getElementById("start-game-checkers");
  const quitGameMenuButton = document.getElementById("quit-game-menu");
  const quitGameIngameButton = document.getElementById("quit-game-ingame");
  const menuScreen = document.getElementById("menu-screen");
  const gameContainer = document.querySelector(".game-container");
  const resetButton = document.getElementById("reset-button");
  const winnerMessage = document.getElementById("winner-message");

  // Initially hide the game container
  gameContainer.style.display = "none";

  startGameButton.addEventListener("click", () => {
    menuScreen.style.display = "none";
    gameContainer.style.display = "flex";
    // Initialize the game if the function exists
    if (typeof initGame === "function") {
      initGame(); // Assuming you have this function in your checkers.js
    }
  });

  quitGameMenuButton.addEventListener("click", () => {
    const homeUrl = quitGameMenuButton.dataset.homeUrl;
    window.location.href = homeUrl;
  });

  quitGameIngameButton.addEventListener("click", () => {
    const homeUrl = quitGameIngameButton.dataset.homeUrl;
    window.location.href = homeUrl;
  });

  // Ensure the reset button in the game still works
  resetButton.addEventListener("click", () => {
    if (typeof resetGame === "function") {
      resetGame();
    }
  });

  // Game constants
  const ROWS = 8;
  const COLS = 8;

  // Game state
  let board = [];
  let selectedPiece = null;
  let validMoves = [];
  let currentPlayer = 1; // 1 for red, 2 for black
  let gameOver = false;

  // DOM elements
  const boardElement = document.getElementById("board");
  const currentPlayerElement = document.getElementById("current-player");

  // Initialize the game
  initGame();

  // Event listeners
  resetButton.addEventListener("click", resetGame);

  function initGame() {
    // Initialize the board
    board = [
      [0, 2, 0, 2, 0, 2, 0, 2],
      [2, 0, 2, 0, 2, 0, 2, 0],
      [0, 2, 0, 2, 0, 2, 0, 2],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
    ];

    selectedPiece = null;
    validMoves = [];
    currentPlayer = 1;
    gameOver = false;

    // Clear the board
    boardElement.innerHTML = "";

    // Create the board squares
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const square = document.createElement("div");
        square.classList.add("square");
        square.classList.add((row + col) % 2 === 0 ? "light" : "dark");
        square.dataset.row = row;
        square.dataset.col = col;

        // Add click event to the square
        square.addEventListener("click", handleSquareClick);

        // Add piece if there is one
        const pieceValue = board[row][col];
        if (pieceValue !== 0) {
          const piece = createPieceElement(pieceValue);
          square.appendChild(piece);
        }

        boardElement.appendChild(square);
      }
    }

    updateCurrentPlayerDisplay();
    winnerMessage.classList.add("hidden");
  }

  function createPieceElement(pieceValue) {
    const piece = document.createElement("div");
    piece.classList.add("piece");

    if (pieceValue === 1 || pieceValue === 3) {
      piece.classList.add("red");
    } else if (pieceValue === 2 || pieceValue === 4) {
      piece.classList.add("black");
    }

    if (pieceValue === 3 || pieceValue === 4) {
      piece.classList.add("king");
    }

    return piece;
  }

  function handleSquareClick(event) {
    if (gameOver) return;

    const square = event.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    // If a piece is already selected
    if (selectedPiece) {
      const [selectedRow, selectedCol] = selectedPiece;

      // Check if the clicked square is a valid move
      const moveIndex = validMoves.findIndex(
        (move) => move[0] === row && move[1] === col,
      );

      if (moveIndex !== -1) {
        // Move the piece
        const captured = movePiece([selectedRow, selectedCol], [row, col]);

        // Check if there are additional captures available
        const nextCaptures = getValidMoves(row, col, true);

        if (captured && nextCaptures.length > 0) {
          // Continue with the same piece for multiple captures
          selectedPiece = [row, col];
          validMoves = nextCaptures;
          updateBoardDisplay();
        } else {
          // End the turn
          selectedPiece = null;
          validMoves = [];
          switchPlayer();
          updateBoardDisplay();

          // Check for a winner
          const winner = checkWinner();
          if (winner) {
            gameOver = true;
            showWinner(winner);
          }
        }
      } else {
        // Deselect the piece if clicking elsewhere
        selectedPiece = null;
        validMoves = [];
        updateBoardDisplay();
      }
    } else {
      // Try to select a piece
      const piece = board[row][col];

      // Check for mandatory captures
      const mandatoryCaptures = getAllCaptureMovesForCurrentPlayer();

      if (mandatoryCaptures.length > 0) {
        // If there are mandatory captures, only allow selecting pieces that can capture
        const canCapture = mandatoryCaptures.some(
          (pos) => pos[0] === row && pos[1] === col,
        );

        if (canCapture) {
          selectedPiece = [row, col];
          validMoves = getValidMoves(row, col, true); // Only capture moves
          updateBoardDisplay();
        }
      } else if (
        ((piece === 1 || piece === 3) && currentPlayer === 1) ||
        ((piece === 2 || piece === 4) && currentPlayer === 2)
      ) {
        // Select the piece if it belongs to the current player
        selectedPiece = [row, col];
        validMoves = getValidMoves(row, col);
        updateBoardDisplay();
      }
    }
  }

  function updateBoardDisplay() {
    // Remove all highlights
    document.querySelectorAll(".square").forEach((square) => {
      const piece = square.querySelector(".piece");
      if (piece) piece.classList.remove("selected");
      square.classList.remove("valid-move");
    });

    // Highlight selected piece
    if (selectedPiece) {
      const [row, col] = selectedPiece;
      const square = getSquareElement(row, col);
      const piece = square.querySelector(".piece");
      if (piece) piece.classList.add("selected");

      // Highlight valid moves
      validMoves.forEach((move) => {
        const [moveRow, moveCol] = move;
        const moveSquare = getSquareElement(moveRow, moveCol);
        moveSquare.classList.add("valid-move");
      });
    }
  }

  function getSquareElement(row, col) {
    return document.querySelector(
      `.square[data-row="${row}"][data-col="${col}"]`,
    );
  }

  function updateCurrentPlayerDisplay() {
    currentPlayerElement.innerHTML = `Current Player: <span class="${currentPlayer === 1 ? "red-text" : "black-text"}">${currentPlayer === 1 ? "Red" : "Black"}</span>`;
  }

  function resetGame() {
    initGame();
  }

  function showWinner(winner) {
    const winnerColor = winner === 1 ? "red" : "black";
    const winnerText = winner === 1 ? "Red" : "Black";

    winnerMessage.innerHTML = `
      <div class="winner-content">
        <h2 class="winner-title winner-message-${winnerColor}">${winnerText} Wins!</h2>
        <div class="winner-buttons">
          <button class="play-again-btn" id="play-again-btn">Play Again</button>
          <button class="return-menu-btn" id="return-menu-btn">Return to Menu</button>
        </div>
      </div>
    `;

    winnerMessage.classList.remove("hidden");

    // Add event listeners to the winner message buttons
    document.getElementById("play-again-btn").addEventListener("click", () => {
      resetGame();
    });

    document.getElementById("return-menu-btn").addEventListener("click", () => {
      winnerMessage.classList.add("hidden");
      gameContainer.style.display = "none";
      menuScreen.style.display = "flex";
    });
  }

  // Game logic functions
  function movePiece(from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    // Get the piece value
    const piece = board[fromRow][fromCol];

    // Move the piece on the board array
    board[fromRow][fromCol] = 0;
    board[toRow][toCol] = piece;

    // Check if a piece was captured (jump move)
    let captured = false;
    if (Math.abs(fromRow - toRow) === 2) {
      const capturedRow = (fromRow + toRow) / 2;
      const capturedCol = (fromCol + toCol) / 2;
      board[capturedRow][capturedCol] = 0;
      captured = true;

      // Remove the captured piece from the board visually
      const capturedSquare = getSquareElement(capturedRow, capturedCol);
      if (capturedSquare.firstChild) {
        capturedSquare.removeChild(capturedSquare.firstChild);
      }
    }

    // Check if the piece should be promoted to king
    if ((piece === 1 && toRow === 0) || (piece === 2 && toRow === 7)) {
      board[toRow][toCol] = piece + 2; // Promote to king (1->3 or 2->4)
    }

    // Update the visual board
    const fromSquare = getSquareElement(fromRow, fromCol);
    const toSquare = getSquareElement(toRow, toCol);

    // Move the piece element
    if (fromSquare.firstChild) {
      const pieceElement = fromSquare.firstChild;
      fromSquare.removeChild(pieceElement);

      // Update king status if needed
      if ((piece === 1 && toRow === 0) || (piece === 2 && toRow === 7)) {
        pieceElement.classList.add("king");
      }

      toSquare.appendChild(pieceElement);
    }

    return captured;
  }

  function getValidMoves(row, col, capturesOnly = false) {
    const piece = board[row][col];
    const moves = [];

    // Determine direction based on piece type
    // Red pieces (1) move up, Black pieces (2) move down
    // Kings (3, 4) can move in both directions
    const directions = [];
    if (piece === 1) directions.push(-1); // Red piece moves up
    if (piece === 2) directions.push(1); // Black piece moves down
    if (piece === 3 || piece === 4) {
      directions.push(-1); // King moves up
      directions.push(1); // King moves down
    }

    // Check for regular moves (one step diagonally)
    if (!capturesOnly) {
      for (const direction of directions) {
        // Check left and right diagonals
        if (
          isValidSquare(row + direction, col - 1) &&
          board[row + direction][col - 1] === 0
        ) {
          moves.push([row + direction, col - 1]);
        }
        if (
          isValidSquare(row + direction, col + 1) &&
          board[row + direction][col + 1] === 0
        ) {
          moves.push([row + direction, col + 1]);
        }
      }
    }

    // Check for capture moves (jumps)
    for (const direction of directions) {
      // Check left diagonal capture
      if (
        isValidSquare(row + direction, col - 1) &&
        isValidSquare(row + direction * 2, col - 2) &&
        isOpponentPiece(row + direction, col - 1) &&
        board[row + direction * 2][col - 2] === 0
      ) {
        moves.push([row + direction * 2, col - 2]);
      }

      // Check right diagonal capture
      if (
        isValidSquare(row + direction, col + 1) &&
        isValidSquare(row + direction * 2, col + 2) &&
        isOpponentPiece(row + direction, col + 1) &&
        board[row + direction * 2][col + 2] === 0
      ) {
        moves.push([row + direction * 2, col + 2]);
      }
    }

    return moves;

    // Helper function to check if a square is within the board
    function isValidSquare(r, c) {
      return r >= 0 && r < ROWS && c >= 0 && c < COLS;
    }

    // Helper function to check if a square contains an opponent's piece
    function isOpponentPiece(r, c) {
      const targetPiece = board[r][c];
      if (targetPiece === 0) return false;

      // Check if the piece belongs to the opponent
      return (
        (currentPlayer === 1 && (targetPiece === 2 || targetPiece === 4)) ||
        (currentPlayer === 2 && (targetPiece === 1 || targetPiece === 3))
      );
    }
  }

  function getAllCaptureMovesForCurrentPlayer() {
    const piecesWithCaptures = [];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const piece = board[row][col];

        // Check if the piece belongs to the current player
        if (
          (currentPlayer === 1 && (piece === 1 || piece === 3)) ||
          (currentPlayer === 2 && (piece === 2 || piece === 4))
        ) {
          // Check if this piece has any capture moves
          const captureMoves = getValidMoves(row, col, true);
          if (captureMoves.length > 0) {
            piecesWithCaptures.push([row, col]);
          }
        }
      }
    }

    return piecesWithCaptures;
  }

  function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateCurrentPlayerDisplay();
  }

  function checkWinner() {
    let redPieces = 0;
    let blackPieces = 0;

    // Count pieces of each color
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const piece = board[row][col];
        if (piece === 1 || piece === 3) redPieces++;
        if (piece === 2 || piece === 4) blackPieces++;
      }
    }

    // Check if any player has no pieces left
    if (redPieces === 0) return 2; // Black wins
    if (blackPieces === 0) return 1; // Red wins

    // Check if current player has no valid moves
    let hasValidMoves = false;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const piece = board[row][col];
        if (
          (currentPlayer === 1 && (piece === 1 || piece === 3)) ||
          (currentPlayer === 2 && (piece === 2 || piece === 4))
        ) {
          const moves = getValidMoves(row, col);
          if (moves.length > 0) {
            hasValidMoves = true;
            break;
          }
        }
      }
      if (hasValidMoves) break;
    }

    // If current player has no valid moves, the opponent wins
    if (!hasValidMoves) {
      return currentPlayer === 1 ? 2 : 1;
    }

    // No winner yet
    return null;
  }
});
