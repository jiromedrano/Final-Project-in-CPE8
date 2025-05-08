document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  const quitButton = document.getElementById('quitButton');
  const homeButton = document.getElementById('homeButton');
  const playAgainButton = document.getElementById('playAgainButton');
  const homeWonButton = document.getElementById('homeWonButton');
  const playAgainWonButton = document.getElementById('playAgainWonButton');
  const quitGameIngame = document.getElementById('quitGameIngame'); // Get the in-game quit button

  startButton.addEventListener('click', () => {
    // Assuming you have a function to start the game
    if (typeof startGame === 'function') {
      startGame();
    }
    document.getElementById('startScreen').classList.add('hidden');
  });

  if (quitButton) {
    quitButton.addEventListener('click', () => {
      // Redirect to the home page (replace '/' with your actual home URL)
      window.location.href = "/";
    });
  }

  if (homeButton) {
    homeButton.addEventListener('click', () => {
      window.location.href = "/";
    });
  }

  if (playAgainButton) {
    playAgainButton.addEventListener('click', () => {
      if (typeof startGame === 'function') {
        startGame();
      }
      document.getElementById('gameOverScreen').classList.add('hidden');
    });
  }

  if (homeWonButton) {
    homeWonButton.addEventListener('click', () => {
      window.location.href = "/";
    });
  }

  if (playAgainWonButton) {
    playAgainWonButton.addEventListener('click', () => {
      if (typeof startGame === 'function') {
        startGame();
      }
      document.getElementById('gameWonScreen').classList.add('hidden');
    });
  }

  // Event listener for the in-game quit button
  if (quitGameIngame) {
    quitGameIngame.addEventListener('click', () => {
      window.location.href = "/"; // Redirect to the home page
      // You might want to pause or stop the game logic here as well
      gameStarted = false;
      gameOver = false;
      gameWon = false;
      cancelAnimationFrame(animationFrame); // Stop the game loop
      // Optionally, reset game state if needed
    });
  }
});

// Game Constants
const WIDTH = 800;
const HEIGHT = 600;
const WHITE = "rgb(255, 255, 255)";
const RED = "rgb(255, 0, 0)";
const GREEN = "rgb(0, 255, 0)";
const BLACK = "rgb(0, 0, 0)";


const PLAYER_IMG = "/static/images/rocket.png";
const ENEMY_IMG = "/static/images/enemy.png";
const BULLET_IMG = "/static/images/bullet.png";
const MASTER_ENEMY_IMG = "/static/images/big monster.png";



// Game elements
let canShoot = true;
let shootInterval = null;
let canvas;
let ctx;
let startScreen;
let gameOverScreen;
let gameWonScreen;
let gameOverScore;
let gameWonScore;
let startButton;
let playAgainButton;
let homeButton;
let playAgainWonButton;
let homeWonButton;
let quitGameIngame; // Declare quitGameIngame here

// Initialize DOM elements after the page is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // Game screens
  startScreen = document.getElementById("startScreen");
  gameOverScreen = document.getElementById("gameOverScreen");
  gameWonScreen = document.getElementById("gameWonScreen");
  gameOverScore = document.getElementById("gameOverScore");
  gameWonScore = document.getElementById("gameWonScore");

  // Buttons
  startButton = document.getElementById("startButton");
  playAgainButton = document.getElementById("playAgainButton");
  homeButton = document.getElementById("homeButton");
  playAgainWonButton = document.getElementById("playAgainWonButton");
  homeWonButton = document.getElementById("homeWonButton");
  quitGameIngame = document.getElementById("quitGameIngame"); // Initialize it here

  // Set up event listeners
  startButton.addEventListener("click", initGame);
  playAgainButton.addEventListener("click", initGame);
  homeButton.addEventListener("click", goToHome);
  playAgainWonButton.addEventListener("click", initGame);
  homeWonButton.addEventListener("click", goToHome);

  // Event listener for the in-game quit button (moved here)
  if (quitGameIngame) {
    quitGameIngame.addEventListener("click", () => {
      window.location.href = "/"; // Redirect to the home page
      gameStarted = false;
      gameOver = false;
      gameWon = false;
      cancelAnimationFrame(animationFrame); // Stop the game loop
      // Optionally, reset game state if needed
    });
  }

  // Initial resize and add event listener
  resizeCanvas();

  // Show start screen initially
  startScreen.classList.remove("hidden");
  gameOverScreen.classList.add("hidden");
  gameWonScreen.classList.add("hidden");
});

// Game state
let player = null;
let enemies = [];
let bullets = [];
let masterEnemy = null;
let keys = {};
let animationFrame = null;
let gameStarted = false;
let lastShotTime = 0;
const fireRate = 1000; // milliseconds between shots
let gameOver = false;
let gameWon = false;
let score = 0;

// Player class
class Player {
  constructor() {
    this.x = WIDTH / 2 - 25;
    this.y = HEIGHT - 70;
    this.speed = 5;
    this.health = 50;
    this.image = new Image();
    this.image.src = PLAYER_IMG;
  }

  move(direction) {
    if (direction === "left" && this.x > 0) {
      this.x -= this.speed;
    }
    if (direction === "right" && this.x < WIDTH - 50) {
      this.x += this.speed;
    }
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, 75, 75);
    ctx.font = "24px Arial";
    ctx.fillStyle = GREEN;
    ctx.fillText(`Player HP: ${this.health}`, 10, 40);
  }

  takeDamage() {
    this.health -= 1;
  }
}

// Enemy class
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 3;
    this.direction = 1;
    this.image = new Image();
    this.image.src = ENEMY_IMG;
  }

  move() {
    this.x += this.speed * this.direction;
    if (this.x >= WIDTH - 40 || this.x <= 0) {
      this.direction *= -1;
      this.y += 40;
    }
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, 45, 45);
  }
}

// Bullet class
class Bullet {
  constructor(x, y, speed = -7) {
    this.x = x + 20;
    this.y = y;
    this.speed = speed;
    this.active = true;
    this.image = new Image();
    this.image.src = BULLET_IMG;
  }

  move() {
    this.y += this.speed;
    if (this.y < 0 || this.y > HEIGHT) {
      this.active = false;
    }
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, 20, 20);
  }
}

// Master Enemy class
class MasterEnemy {
  constructor() {
    this.x = WIDTH / 2 - 50;
    this.y = 50;
    this.speed = 2;
    this.health = 250;
    this.direction = 1;
    this.bullets = [];
    this.image = new Image();
    this.image.src = MASTER_ENEMY_IMG;
  }

  move() {
    this.x += this.speed * this.direction;
    if (this.x >= WIDTH - 100 || this.x <= 0) {
      this.direction *= -1;
    }
  }

  fire() {
    if (Math.floor(Math.random() * 15) === 1) {
      this.bullets.push(new Bullet(this.x + 45, this.y + 90, 5));
    }
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, 100, 100);
    ctx.font = "24px Arial";
    ctx.fillStyle = RED;
    ctx.fillText(`Boss HP: ${this.health}`, WIDTH - 200, 30);
  }

  takeDamage() {
    this.health -= 1;
  }
}

// Initialize game
function initGame() {
  player = new Player();
  enemies = [];

  // Create initial enemies
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(Math.random() * (WIDTH - 100)) + 50;
    const y = Math.floor(Math.random() * 150) + 50;
    enemies.push(new Enemy(x, y));
  }

  bullets = [];
  masterEnemy = null;
  score = 0;
  gameOver = false;
  gameWon = false;
  gameStarted = true;

  // Hide all screens
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  gameWonScreen.classList.add("hidden");

  // Start game loop
  cancelAnimationFrame(animationFrame);
  gameLoop();
}

// Game loop
function gameLoop() {
  // Clear canvas
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Handle player movement
  if (keys["ArrowLeft"]) {
    player.move("left");
  }
  if (keys["ArrowRight"]) {
    player.move("right");
  }
  const now = Date.now();
if (keys[" "] && now - lastShotTime > fireRate) {
  bullets.push(new Bullet(player.x, player.y));
  lastShotTime = now;
}

  // Update enemies and check if any enemy moves beyond the canvas
    for (let i = 0; i < enemies.length; i++) {
      enemies[i].move();
      if (enemies[i].y > HEIGHT) {
        // End the game if any enemy moves below the canvas
        gameOver = true;
        gameStarted = false;
        gameOverScore.textContent = score;
        gameOverScreen.classList.remove("hidden");
        return; // Exit gameLoop to prevent further drawing
      }
    }

  // Update bullets
  bullets.forEach((bullet) => bullet.move());
  bullets = bullets.filter((bullet) => bullet.active);

  // Check collisions
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    // Check enemy collisions
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];

      if (
        enemy.x < bullet.x &&
        bullet.x < enemy.x + 40 &&
        enemy.y < bullet.y &&
        bullet.y < enemy.y + 40
      ) {
        // Remove enemy and bullet
        enemies.splice(j, 1);
        bullets.splice(i, 1);

        // Increase score
        score += 1;

        // Add new enemy
        const x = Math.floor(Math.random() * (WIDTH - 100)) + 50;
        const y = Math.floor(Math.random() * 150) + 50;
        enemies.push(new Enemy(x, y));

        // Create boss after 30 enemies
        if (score >= 30 && !masterEnemy) {
          masterEnemy = new MasterEnemy();
        }

        break;
      }
    }
  }

  // Update master enemy
  if (masterEnemy) {
    masterEnemy.move();
    masterEnemy.fire();

    // Update boss bullets
    masterEnemy.bullets.forEach((bullet) => bullet.move());

    // Check if boss bullets hit player
    for (let i = masterEnemy.bullets.length - 1; i >= 0; i--) {
      const bullet = masterEnemy.bullets[i];

      // Assuming the player is 50x50 and the bullet is 10x10 in size
      if (
        bullet.x < player.x + 50 &&     // bullet's left < player's right
        bullet.x + 10 > player.x &&     // bullet's right > player's left
        bullet.y < player.y + 50 &&     // bullet's top < player's bottom
        bullet.y + 10 > player.y        // bullet's bottom > player's top
      ) {
        player.takeDamage();
        masterEnemy.bullets.splice(i, 1);
      }
    }

    // Check if player bullets hit boss
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];

      if (
        masterEnemy.x < bullet.x &&
        bullet.x < masterEnemy.x + 100 &&
        masterEnemy.y < bullet.y &&
        bullet.y < masterEnemy.y + 100
      ) {
        masterEnemy.takeDamage();
        bullets.splice(i, 1);
      }
    }
  }

  // Draw everything
  player.draw();
  enemies.forEach((enemy) => enemy.draw());
  bullets.forEach((bullet) => bullet.draw());

  if (masterEnemy) {
    masterEnemy.draw();
    masterEnemy.bullets.forEach((bullet) => bullet.draw());
  }

  // Draw score
  ctx.font = "24px Arial";
  ctx.fillStyle = WHITE;
  ctx.fillText(`Enemies Detected: ${score}`, 10, 80);

  // Check win/loss conditions
  if (masterEnemy && masterEnemy.health <= 0) {
    gameWon = true;
    gameStarted = false;
    gameWonScore.textContent = score;
    gameWonScreen.classList.remove("hidden");
  }

  if (player.health <= 0) {
    gameOver = true;
    gameStarted = false;
    gameOverScore.textContent = score;
    gameOverScreen.classList.remove("hidden");
  }

  // Continue game loop
  if (gameStarted && !gameOver && !gameWon) {
    animationFrame = requestAnimationFrame(gameLoop);
  }
}

// Event listeners
function handleKeyDown(e) {
  keys[e.key] = true;

  // Prevent scrolling on space or arrows
  if ([" ", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
  }

  // Only start shooting if spacebar is pressed
  if (e.key === " ") {
    startShooting();
  }
}

function handleKeyUp(e) {
  keys[e.key] = false;

  // Stop shooting only when spacebar is released
  if (e.key === " ") {
    stopShooting();
  }
}


function goToHome() {
  window.location.href = "/";
}

// Set up global event listeners
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("resize", resizeCanvas);

// Make sure canvas is properly sized
function resizeCanvas() {
  if (!canvas) return;

  if (window.innerWidth < 850) {
    const aspectRatio = HEIGHT / WIDTH;
    const newWidth = Math.min(window.innerWidth - 40, WIDTH);
    const newHeight = newWidth * aspectRatio;

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
  } else {
    canvas.style.width = ``;
    canvas.style.height = ``;
  }
}

function startShooting() {
  if (!shootInterval) {
    shootInterval = setInterval(() => {
      if (bullets.length < 10) {
        bullets.push(new Bullet(player.x, player.y));
      }
    }, 200); // Adjust interval (ms) for desired firing rate
  }
}

function stopShooting() {
  clearInterval(shootInterval);
  shootInterval = null;
}