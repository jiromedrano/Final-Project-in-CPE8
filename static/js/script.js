// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Get all game cards
  const gameCards = document.querySelectorAll(".game-card");

  // Add click event listeners to each game card
  gameCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      // If the click was on the Play Now button, prevent navigation and redirect to play_game
      if (e.target.classList.contains("play-now-btn")) {
        e.stopPropagation();
        const gameId =
          e.target.getAttribute("data-game-id") ||
          this.getAttribute("data-game-id") ||
          this.getAttribute("onclick").match(/\/game\/(\d+)/)[1];
        window.location.href = `/play_game/${gameId}`;
        return;
      }

      // Otherwise, navigate to the game page
      const gameId =
        this.getAttribute("data-game-id") ||
        this.getAttribute("onclick").match(/\/game\/(\d+)/)[1];
      window.location.href = `/game/${gameId}`;
    });
  });

  // Add event listener to Play Now buttons on game detail page
  const playNowBtn = document.querySelector(".play-now-btn.large");
  if (playNowBtn) {
    playNowBtn.addEventListener("click", function () {
      // Get the game ID from the URL if not set as an attribute
      const gameId =
        this.getAttribute("data-game-id") ||
        window.location.pathname.match(/\/game\/(\d+)/)?.[1];
      if (gameId) {
        window.location.href = `/play_game/${gameId}`;
      }
    });
  }

});







