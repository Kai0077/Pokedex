import "./style.css";
import { getAllCharacters, type Character } from "./api";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <h1>Pokedex Characters</h1>
  <button id="reload-btn">Reload characters</button>
  <div id="status"></div>
  <ul id="character-list"></ul>
`;

const listEl = document.getElementById("character-list") as HTMLUListElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const reloadBtn = document.getElementById("reload-btn") as HTMLButtonElement;

async function loadCharacters() {
  statusEl.textContent = "Loading...";
  listEl.innerHTML = "";

  try {
    const characters: Character[] = await getAllCharacters();

    if (!Array.isArray(characters) || characters.length === 0) {
      statusEl.textContent = "No characters found.";
      return;
    }

    statusEl.textContent = "";
    characters.forEach((ch) => {
      const li = document.createElement("li");
      li.textContent = ch.name ?? `Character #${ch.id}`;
      listEl.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load characters.";
  }
}

reloadBtn.addEventListener("click", loadCharacters);
loadCharacters();