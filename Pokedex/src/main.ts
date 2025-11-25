import "./style.css";
import { fetchCharacters, type Character } from "./api";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <h1>Pokedex Characters</h1>
  <button id="reload-btn">Reload</button>
  <div id="character-container" class="characters"></div>
`;

const container = document.getElementById("character-container")!;
const reloadBtn = document.getElementById("reload-btn")!;

async function loadCharacters() {
  container.innerHTML = "<p>Loading...</p>";

  try {
    const characters: Character[] = await fetchCharacters();

    if (!characters.length) {
      container.innerHTML = "<p>No characters found.</p>";
      return;
    }

    container.innerHTML = characters
      .map(
        (c) => `
        <a class="card" href="/character.html?id=${c.id}">
          <h2>${c.firstname} ${c.lastname}</h2>
          <p><strong>Age:</strong> ${c.age}</p>
          <p><strong>Gender:</strong> ${c.gender}</p>
          <p><strong>Decks:</strong> ${c.deckCount}</p>
        </a>
      `,
      )
      .join("");
  } catch (e) {
    console.error(e);
    container.innerHTML = "<p>Failed to load characters.</p>";
  }
}

reloadBtn.addEventListener("click", loadCharacters);
loadCharacters();