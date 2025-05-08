// Game states
const MENU = "menu";
const GAME = "game";
const WINNER = "winner";

// Game class to handle the main game logic
class Game {
  constructor() {
    // Initialize game state
    this.state = MENU;
    this.running = true;

    // Get DOM elements
    this.menuScreen = document.getElementById("menu-screen");
    this.gameScreen = document.getElementById("game-screen");
    this.winnerScreen = document.getElementById("winner-screen");
    this.winnerText = document.getElementById("winner-text");
    this.turnDisplay = document.getElementById("turn-display");

    // Set up event listeners
    document
      .getElementById("play-button")
      .addEventListener("click", () => this.startGame());
    document
      .getElementById("quit-button")
      .addEventListener("click", () => this.quitGame());
    document
      .getElementById("restart-button")
      .addEventListener("click", () => this.resetGame());
    document
      .getElementById("quit-game-button")
      .addEventListener("click", () => this.quitGame());
    document
      .getElementById("play-again-button")
      .addEventListener("click", () => this.resetGame());
    document
      .getElementById("quit-winner-button")
      .addEventListener("click", () => this.quitGame());

    // Initialize chess game
    this.chess = new Chess();
  }

  startGame() {
    this.state = GAME;
    this.menuScreen.classList.add("hidden");
    this.gameScreen.classList.remove("hidden");
    this.winnerScreen.classList.add("hidden");

    // Initialize the chess game
    this.chess.initializeGame();
  }

  resetGame() {
    this.state = GAME;
    this.menuScreen.classList.add("hidden");
    this.gameScreen.classList.remove("hidden");
    this.winnerScreen.classList.add("hidden");

    // Reset the chess game
    this.chess.initializeBoard();
    this.chess.updateBoardUI();
    this.chess.resetCastlingRights();
    this.chess.updateGameStatus();
  }

  quitGame() {
    console.log("Quitting game...");
    window.location.href = "/";
    }


  quitToMenu() {
    this.state = MENU;
    this.menuScreen.classList.remove("hidden");
    this.gameScreen.classList.add("hidden");
    this.winnerScreen.classList.add("hidden");
  }

  declareWinner(winner) {
    this.state = WINNER;
    this.winnerText.textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    this.menuScreen.classList.add("hidden");
    this.gameScreen.classList.add("hidden");
    this.winnerScreen.classList.remove("hidden");
  }
}

// Chess class to handle chess-specific logic
class Chess {
  constructor() {
    // Game state variables
    this.board = Array(8)
      .fill()
      .map(() => Array(8).fill(""));
    this.currentTurn = Math.random() < 0.5 ? "white" : "black";
    this.selectedPiece = null;
    this.possibleMoves = [];
    this.winner = null;
    this.gameStarted = false;
    this.capturedPieces = [];
    this.castlingRights = {
      whiteKingMoved: false,
      whiteRookLeftMoved: false,
      whiteRookRightMoved: false,
      blackKingMoved: false,
      blackRookLeftMoved: false,
      blackRookRightMoved: false,
    };

    // DOM elements
    this.chessBoard = document.getElementById("chess-board");
    this.whiteCaptured = document.getElementById("white-captured");
    this.blackCaptured = document.getElementById("black-captured");
  }

  // Initialize the game
  initializeGame() {
    // Create the board UI
    this.createBoardUI();

    // Initialize the game state
    this.initializeBoard();
    this.updateBoardUI();
    this.updateGameStatus();

    // Set game as started
    this.gameStarted = true;
  }

  // Create the chess board UI
  createBoardUI() {
    this.chessBoard.innerHTML = "";

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const square = document.createElement("div");
        square.className = `square ${(x + y) % 2 === 0 ? "light-square" : "dark-square"}`;
        square.dataset.x = x;
        square.dataset.y = y;
        square.addEventListener("click", () =>
          this.handleSquareClick(parseInt(x), parseInt(y)),
        );
        this.chessBoard.appendChild(square);
      }
    }
  }

  // Initialize the board with pieces
  initializeBoard() {
    // Create a new board with empty squares
    this.board = Array(8)
      .fill()
      .map(() => Array(8).fill(""));

    // Set up pawns
    for (let i = 0; i < 8; i++) {
      this.board[1][i] = "black_pawn";
      this.board[6][i] = "white_pawn";
    }

    // Set up other pieces
    this.board[0][0] = "black_rook";
    this.board[0][1] = "black_knight";
    this.board[0][2] = "black_bishop";
    this.board[0][3] = "black_queen";
    this.board[0][4] = "black_king";
    this.board[0][5] = "black_bishop";
    this.board[0][6] = "black_knight";
    this.board[0][7] = "black_rook";

    this.board[7][0] = "white_rook";
    this.board[7][1] = "white_knight";
    this.board[7][2] = "white_bishop";
    this.board[7][3] = "white_queen";
    this.board[7][4] = "white_king";
    this.board[7][5] = "white_bishop";
    this.board[7][6] = "white_knight";
    this.board[7][7] = "white_rook";

    // Reset game state
    this.currentTurn = Math.random() < 0.5 ? "white" : "black";
    this.selectedPiece = null;
    this.possibleMoves = [];
    this.winner = null;
    this.capturedPieces = [];
  }

  resetCastlingRights() {
    this.castlingRights = {
      whiteKingMoved: false,
      whiteRookLeftMoved: false,
      whiteRookRightMoved: false,
      blackKingMoved: false,
      blackRookLeftMoved: false,
      blackRookRightMoved: false,
    };
  }

  // Handle square click
  handleSquareClick(x, y) {
    if (this.winner) return;

    const clickedPiece = this.board[y][x];
    const pieceColor = clickedPiece ? clickedPiece.split("_")[0] : null;

    // If a piece is already selected and the clicked square is a valid move
    if (this.selectedPiece && this.isPossibleMove(x, y)) {
      // Move the piece
      this.movePiece(this.selectedPiece, [x, y]);
      return;
    }

    // If the clicked square has a piece of the current player's color
    if (clickedPiece && pieceColor === this.currentTurn) {
      // Select the piece and calculate possible moves
      this.selectedPiece = [x, y];
      this.possibleMoves = this.calculatePossibleMoves(x, y);
      this.updateBoardUI();
      return;
    }

    // If the clicked square is empty or has an opponent's piece
    this.selectedPiece = null;
    this.possibleMoves = [];
    this.updateBoardUI();
  }

  // Check if a position is a possible move
  isPossibleMove(x, y) {
    return this.possibleMoves.some(
      ([moveX, moveY]) => moveX === x && moveY === y,
    );
  }

  // Calculate possible moves for a piece
  calculatePossibleMoves(x, y) {
    const piece = this.board[y][x];
    if (!piece) return [];

    const [color, type] = piece.split("_");
    const moves = [];

    // Helper to check if a position is valid and not occupied by own piece
    const isValidMove = (x, y) => {
      if (x < 0 || x > 7 || y < 0 || y > 7) return false;
      const targetPiece = this.board[y][x];
      if (!targetPiece) return true; // Empty square
      return targetPiece.split("_")[0] !== color; // Not occupied by own piece
    };

    // Pawn movement
    if (type === "pawn") {
      const direction = color === "black" ? 1 : -1;
      const startRow = color === "black" ? 1 : 6;

      // Move forward one square
      if (
        y + direction >= 0 &&
        y + direction < 8 &&
        !this.board[y + direction][x]
      ) {
        moves.push([x, y + direction]);

        // Move forward two squares from starting position
        if (y === startRow && !this.board[y + 2 * direction][x]) {
          moves.push([x, y + 2 * direction]);
        }
      }

      // Capture diagonally
      for (const dx of [-1, 1]) {
        const newX = x + dx;
        const newY = y + direction;
        if (
          newX >= 0 &&
          newX < 8 &&
          newY >= 0 &&
          newY < 8 &&
          this.board[newY][newX] &&
          this.board[newY][newX].split("_")[0] !== color
        ) {
          moves.push([newX, newY]);
        }
      }
    }

    // Knight movement
    if (type === "knight") {
      const knightMoves = [
        [1, 2],
        [2, 1],
        [2, -1],
        [1, -2],
        [-1, -2],
        [-2, -1],
        [-2, 1],
        [-1, 2],
      ];

      for (const [dx, dy] of knightMoves) {
        const newX = x + dx;
        const newY = y + dy;
        if (isValidMove(newX, newY)) {
          moves.push([newX, newY]);
        }
      }
    }

    // Bishop, Rook, and Queen movement (sliding pieces)
    if (type === "bishop" || type === "rook" || type === "queen") {
      // Directions: bishop (diagonals), rook (horizontals/verticals), queen (both)
      const directions = [];

      if (type === "bishop" || type === "queen") {
        directions.push(
          ...[
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
          ],
        );
      }

      if (type === "rook" || type === "queen") {
        directions.push(
          ...[
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ],
        );
      }

      for (const [dx, dy] of directions) {
        let newX = x + dx;
        let newY = y + dy;

        while (isValidMove(newX, newY)) {
          moves.push([newX, newY]);

          // If we hit an opponent's piece, stop looking in this direction
          if (this.board[newY][newX]) break;

          newX += dx;
          newY += dy;
        }
      }
    }

    // King movement
    if (type === "king") {
      const kingMoves = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];

      for (const [dx, dy] of kingMoves) {
        const newX = x + dx;
        const newY = y + dy;
        if (isValidMove(newX, newY)) {
          moves.push([newX, newY]);
        }
      }

      // Castling logic
      const homeRow = color === "white" ? 7 : 0;
      const isKingMoved = this.castlingRights[`${color}KingMoved`];
      const leftRookMoved = this.castlingRights[`${color}RookLeftMoved`];
      const rightRookMoved = this.castlingRights[`${color}RookRightMoved`];

      // Kingside castling (move king to g1/g8, move rook to f1/f8)
      if (
        !isKingMoved &&
        !rightRookMoved &&
        this.board[homeRow][5] === "" &&
        this.board[homeRow][6] === "" &&
        this.board[homeRow][7] === `${color}_rook`
      ) {
        moves.push([6, homeRow]); // King moves to g1/g8
      }

      // Queenside castling (move king to c1/c8, move rook to d1/d8)
      if (
        !isKingMoved &&
        !leftRookMoved &&
        this.board[homeRow][1] === "" &&
        this.board[homeRow][2] === "" &&
        this.board[homeRow][3] === "" &&
        this.board[homeRow][0] === `${color}_rook`
      ) {
        moves.push([2, homeRow]); // King moves to c1/c8
      }
    }

    return moves;
  }

  // Move a piece from one position to another
  movePiece(from, to) {
    const [fromX, fromY] = from;
    const [toX, toY] = to;
    const movingPiece = this.board[fromY][fromX];
    const targetPiece = this.board[toY][toX];

    // Track captured pieces
    if (targetPiece) {
      this.capturedPieces.push(targetPiece);
    }

    // Check if this is a capture of the king
    if (targetPiece === "white_king") {
      this.winner = "black";
      this.updateGameStatus();
      // Notify the game class about the winner
      game.declareWinner("black");
      return;
    }
    if (targetPiece === "black_king") {
      this.winner = "white";
      this.updateGameStatus();
      // Notify the game class about the winner
      game.declareWinner("white");
      return;
    }

    // Move the piece
    this.board[toY][toX] = movingPiece;
    this.board[fromY][fromX] = "";

    // Update castling rights if necessary
    if (movingPiece === "white_king") this.castlingRights.whiteKingMoved = true;
    if (movingPiece === "black_king") this.castlingRights.blackKingMoved = true;
    if (movingPiece === "white_rook") {
      if (fromX === 0 && fromY === 7)
        this.castlingRights.whiteRookLeftMoved = true;
      if (fromX === 7 && fromY === 7)
        this.castlingRights.whiteRookRightMoved = true;
    }
    if (movingPiece === "black_rook") {
      if (fromX === 0 && fromY === 0)
        this.castlingRights.blackRookLeftMoved = true;
      if (fromX === 7 && fromY === 0)
        this.castlingRights.blackRookRightMoved = true;
    }

    // Castling move: move rook as well
    if (movingPiece.endsWith("_king")) {
      const color = movingPiece.split("_")[0];
      const homeRow = color === "white" ? 7 : 0;

      // Kingside castling
      if (fromX === 4 && toX === 6) {
        this.board[homeRow][5] = `${color}_rook`;
        this.board[homeRow][7] = "";
      }

      // Queenside castling
      if (fromX === 4 && toX === 2) {
        this.board[homeRow][3] = `${color}_rook`;
        this.board[homeRow][0] = "";
      }
    }

    // Switch turns
    this.currentTurn = this.currentTurn === "white" ? "black" : "white";
    this.selectedPiece = null;
    this.possibleMoves = [];
    this.updateBoardUI();
    this.updateGameStatus();
  }

  // Update the board UI based on the current state
  updateBoardUI() {
    // Clear selected and possible move indicators
    document.querySelectorAll(".square").forEach((square) => {
      square.classList.remove("selected", "possible-move");
      square.innerHTML = "";
    });

    // Add pieces to the board
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.board[y][x];
        if (piece) {
          const square = document.querySelector(
            `.square[data-x="${x}"][data-y="${y}"]`,
          );
          const pieceElement = document.createElement("div");
          pieceElement.className = "piece";
          pieceElement.textContent = this.getPieceSymbol(piece);
          square.appendChild(pieceElement);
        }
      }
    }

    // Mark selected piece
    if (this.selectedPiece) {
      const [x, y] = this.selectedPiece;
      const square = document.querySelector(
        `.square[data-x="${x}"][data-y="${y}"]`,
      );
      if (square) {
        square.classList.add("selected");
      }
    }

    // Mark possible moves
    this.possibleMoves.forEach(([x, y]) => {
      const square = document.querySelector(
        `.square[data-x="${x}"][data-y="${y}"]`,
      );
      if (square) {
        square.classList.add("possible-move");
      }
    });
  }

  // Update the game status UI
  updateGameStatus() {
    const whiteTurnRadio = document.getElementById("white-turn-radio");
    const blackTurnRadio = document.getElementById("black-turn-radio");
    const whiteTurnLabel = document.querySelector(
      "label[for='white-turn-radio']",
    );
    const blackTurnLabel = document.querySelector(
      "label[for='black-turn-radio']",
    );

    if (this.winner) {
      whiteTurnLabel.textContent = "Game Over";
      blackTurnLabel.textContent = `${this.winner.charAt(0).toUpperCase() + this.winner.slice(1)} Wins!`;
      whiteTurnRadio.checked = false;
      blackTurnRadio.checked = false;
    } else {
      whiteTurnLabel.textContent = "White's Turn";
      blackTurnLabel.textContent = "Black's Turn";

      if (this.currentTurn === "white") {
        whiteTurnRadio.checked = true;
        blackTurnRadio.checked = false;
      } else {
        whiteTurnRadio.checked = false;
        blackTurnRadio.checked = true;
      }
    }

    // Update captured pieces
    this.updateCapturedPieces();
  }

  // Update the captured pieces display
  updateCapturedPieces() {
    this.whiteCaptured.innerHTML = "";
    this.blackCaptured.innerHTML = "";

    // Separate captured pieces by color
    const whitePieces = this.capturedPieces.filter((piece) =>
      piece.startsWith("white_"),
    );
    const blackPieces = this.capturedPieces.filter((piece) =>
      piece.startsWith("black_"),
    );

    // Get the none text elements
    const whiteNoneText = document.querySelector(".left-panel .none-text");
    const blackNoneText = document.querySelector(".right-panel .none-text");

    // Display white pieces captured by black
    if (whitePieces.length > 0) {
      whitePieces.forEach((piece) => {
        const pieceElement = document.createElement("span");
        pieceElement.className = "captured-piece";
        pieceElement.textContent = this.getPieceSymbol(piece);
        this.blackCaptured.appendChild(pieceElement);
      });
      blackNoneText.style.display = "none";
    } else {
      blackNoneText.style.display = "block";
    }

    // Display black pieces captured by white
    if (blackPieces.length > 0) {
      blackPieces.forEach((piece) => {
        const pieceElement = document.createElement("span");
        pieceElement.className = "captured-piece";
        pieceElement.textContent = this.getPieceSymbol(piece);
        this.whiteCaptured.appendChild(pieceElement);
      });
      whiteNoneText.style.display = "none";
    } else {
      whiteNoneText.style.display = "block";
    }
  }

  // Get the Unicode symbol for a piece
  getPieceSymbol(piece) {
    if (!piece) return "";

    const [color, type] = piece.split("_");

    const symbols = {
      king: { white: "♔", black: "♚" },
      queen: { white: "♕", black: "♛" },
      rook: { white: "♖", black: "♜" },
      bishop: { white: "♗", black: "♝" },
      knight: { white: "♘", black: "♞" },
      pawn: { white: "♙", black: "♟" },
    };

    return symbols[type]?.[color] || "";
  }

  // Get the value of a piece for material advantage calculation
  getPieceValue(piece) {
    const type = piece.split("_")[1];
    const values = {
      pawn: 1,
      knight: 3,
      bishop: 3,
      rook: 5,
      queen: 9,
      king: 0, // Kings shouldn't be captured in a real game
    };

    return values[type] || 0;
  }
}

// Initialize the game when the page loads
let game;
document.addEventListener("DOMContentLoaded", () => {
  game = new Game();
});
