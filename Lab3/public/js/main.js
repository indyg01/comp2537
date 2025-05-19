let offset = 0;
const limit = 10;
let isLoading = false;

async function loadPokemonBatch(offset, limit) {
  isLoading = true;
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
    const data = await res.json();

    for (const p of data.results) {
      const detailRes = await fetch(p.url);
      const detailData = await detailRes.json();
      const imageUrl = detailData.sprites.other['official-artwork'].front_default;
      displayPokemon(p.name, imageUrl);
    }
  } catch (err) {
    console.error("Failed to load PokÃ©mon:", err);
  }
  isLoading = false;
}

function displayPokemon(name, imageUrl) {
  const container = document.getElementById("pokemonList");

  const card = document.createElement("div");
  card.className = "card mx-auto my-3";
  card.style.width = "475px";

  const img = document.createElement("img");
  img.className = "card-img-top";
  img.src = imageUrl;
  img.alt = name;

  const body = document.createElement("div");
  body.className = "card-body";
  body.style.backgroundColor = "#f8f8f8";

  const title = document.createElement("h3");
  title.className = "card-title text-capitalize";
  title.textContent = name;

  body.appendChild(title);
  card.appendChild(img);
  card.appendChild(body);
  container.appendChild(card);
}

loadPokemonBatch(offset, limit);
offset += limit;

document.addEventListener("scroll", function () {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;

  if (!isLoading && scrollTop + clientHeight >= scrollHeight - 100) {
    loadPokemonBatch(offset, limit);
    offset += limit;
  }
});