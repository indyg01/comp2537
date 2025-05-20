const difficultyMap = {
  easy: { pairs: 3, time: 60, class: 'easy' },
  medium: { pairs: 8, time: 90, class: 'medium' },
  hard: { pairs: 18, time: 120, class: 'hard' }
};

let firstCard, secondCard, lockBoard = false;
let matches = 0, totalClicks = 0, timer, timeLeft = 0, totalPairs = 0;

function resetGameStats(pairs) {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  matches = 0;
  totalClicks = 0;
  totalPairs = pairs;
  timeLeft = difficultyMap[$("#difficulty").val()].time;
  updateStatus();
  clearInterval(timer);
}

function updateStatus() {
  $("#clicks").text("Clicks: " + totalClicks);
  $("#matches").text("Matches: " + matches);
  $("#pairsLeft").text("Pairs Left: " + (totalPairs - matches));
  $("#totalPairs").text("Total Pairs: " + totalPairs);
  $("#timer").text("Time Left: " + timeLeft + "s");
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    updateStatus();
    if (timeLeft <= 0) {
      clearInterval(timer);
      alert("Time's up! Game over.");
      $(".card").off("click");
    }
  }, 1000);
}

function setupCardEvents() {
  $(".card").on("click", function () {
    if (lockBoard || $(this).hasClass("flip")) return;

    $(this).addClass("flip");
    totalClicks++;
    updateStatus();

    const current = $(this).find(".front_face")[0];
    if (!firstCard) {
      firstCard = { element: $(this), img: current };
    } else {
      secondCard = { element: $(this), img: current };
      lockBoard = true;

      if (firstCard.img.src === secondCard.img.src) {
        firstCard.element.off("click");
        secondCard.element.off("click");
        matches++;
        firstCard.element.addClass("matched");
        secondCard.element.addClass("matched");
        resetTurn();

        if (matches === totalPairs) {
          clearInterval(timer);
          alert("You win!");
        }
      } else {
        setTimeout(() => {
          firstCard.element.removeClass("flip");
          secondCard.element.removeClass("flip");
          resetTurn();
        }, 1000);
      }
    }
  });
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  updateStatus();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateGameBoard(difficulty) {
  const { pairs: numPairs, class: gridClass } = difficultyMap[difficulty];
  resetGameStats(numPairs);
  const $grid = $("#game_grid");
  $grid.removeClass("easy medium hard").addClass(gridClass);
  $grid.empty();

  $.get("https://pokeapi.co/api/v2/pokemon?limit=151", function (data) {
    const allPokemon = data.results;
    const selected = [];

    function getValidPokemon(count) {
      if (selected.length >= count) {
        buildBoard(selected);
        return;
      }

      const randIndex = Math.floor(Math.random() * allPokemon.length);
      const candidate = allPokemon[randIndex];

      if (selected.some(p => p.name === candidate.name)) {
        getValidPokemon(count);
        return;
      }

      $.get(candidate.url).then(res => {
        const img = res.sprites.other["official-artwork"].front_default || res.sprites.front_default;
if (img && typeof img === "string" && img.trim() !== "") {
  selected.push({ name: res.name, img: img });
}
        getValidPokemon(count);
      }).fail(() => {
        getValidPokemon(count);
      });
    }

    getValidPokemon(numPairs);
  });

  function buildBoard(pokemonCards) {
    const cards = [];

    pokemonCards.forEach(p => {
      for (let i = 0; i < 2; i++) {
        cards.push(`
          <div class="card">
            <img class="front_face" src="${p.img}" alt="${p.name}">
            <img class="back_face" src="back.webp" alt="Back">
          </div>
        `);
      }
    });

    shuffle(cards);
    $("#game_grid").html(cards.join(""));
    setupCardEvents();
    startTimer();
  }
}

$(document).ready(function () {
  $("body").addClass("light");

  $("#startGame").on("click", function () {
    const level = $("#difficulty").val();
    generateGameBoard(level);
  });

  $("#resetGame").on("click", function () {
    const level = $("#difficulty").val();
    generateGameBoard(level);
  });

  $("#themeToggle").on("click", function () {
    $("body").toggleClass("dark").toggleClass("light");
  });

  $("#powerUp").on("click", function () {
  $(".card").addClass("flip");

  setTimeout(() => {
    $(".card").not(".matched").removeClass("flip");
  }, 2000);
});
});

