import "./style.css";
import {
  fetchCharacterPokemons,
  fetchCharacters,
  fetchDecks,
  gatherPokemon,
  createDeck,
  type Pokemon,
  type Character,
  type Deck,
} from "./api";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <a href="/" class="back-link">← Back to characters</a>
  <h1 id="character-title">Character</h1>

  <div class="actions">
    <button id="gather-btn">Gather Pokémon</button>
    <button id="create-deck-btn">Create Deck</button>
  </div>

  <div id="status"></div>

  <h2>Pokémon Inventory</h2>
  <div id="pokemon-container" class="pokemon-grid"></div>

  <h2>Decks</h2>
  <div id="deck-container" class="deck-grid"></div>

  <!-- Modal -->
  <div id="deck-modal" class="modal hidden">
    <div class="modal-content">
      <h2>Create Deck</h2>

      <label class="deck-name-label">
        Deck name:
        <input type="text" id="deck-name-input" placeholder="Team Alpha" />
      </label>

      <h3>Selected Pokémon (max 5)</h3>
      <div id="selected-slots" class="selected-slots"></div>

      <h3>Choose from your Pokémon</h3>
      <div id="pokemon-select-list" class="pokemon-select-list"></div>

      <div class="modal-actions">
        <button id="save-deck-btn">Save Deck</button>
        <button id="cancel-deck-btn">Cancel</button>
      </div>
      <div id="deck-error" class="error-text"></div>
    </div>
  </div>
`;

const statusEl = document.getElementById("status") as HTMLDivElement;
const pokemonContainer = document.getElementById(
  "pokemon-container",
) as HTMLDivElement;
const deckContainer = document.getElementById(
  "deck-container",
) as HTMLDivElement;
const titleEl = document.getElementById(
  "character-title",
) as HTMLHeadingElement;

const gatherBtn = document.getElementById("gather-btn") as HTMLButtonElement;
const createDeckBtn = document.getElementById(
  "create-deck-btn",
) as HTMLButtonElement;

const modal = document.getElementById("deck-modal") as HTMLDivElement;
const deckNameInput = document.getElementById(
  "deck-name-input",
) as HTMLInputElement;
const pokemonSelectList = document.getElementById(
  "pokemon-select-list",
) as HTMLDivElement;
const selectedSlotsEl = document.getElementById(
  "selected-slots",
) as HTMLDivElement;
const saveDeckBtn = document.getElementById(
  "save-deck-btn",
) as HTMLButtonElement;
const cancelDeckBtn = document.getElementById(
  "cancel-deck-btn",
) as HTMLButtonElement;
const deckErrorEl = document.getElementById("deck-error") as HTMLDivElement;

// Get character id from query string
const params = new URLSearchParams(window.location.search);
const idParam = params.get("id");
const characterId = idParam ? Number(idParam) : NaN;

let currentPokemons: Pokemon[] = [];
let selectedPokemonIds: number[] = [];

// track previous + new pokemon ids for "!!" marker
let previousPokemonIds: Set<number> = new Set();
let newPokemonIds: Set<number> = new Set();

if (isNaN(characterId)) {
  statusEl.textContent = "Invalid character id.";
} else {
  init(characterId);
}

async function init(characterId: number) {
  statusEl.textContent = "Loading character...";

  try {
    const characters: Character[] = await fetchCharacters();
    const character = characters.find((c) => c.id === characterId);

    if (character) {
      titleEl.textContent = `${character.firstname} ${character.lastname}'s page`;
    } else {
      titleEl.textContent = `Character #${characterId}`;
    }

    await loadPokemons(characterId);
    await loadDecks(characterId);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load character data.";
    pokemonContainer.innerHTML = "";
  }
}

async function loadPokemons(characterId: number) {
  statusEl.textContent = "Loading Pokémon...";

  try {
    const pokemons: Pokemon[] = await fetchCharacterPokemons(characterId);

    // detect which ones are new compared to last load
    const newOnes: number[] = pokemons
      .filter((p) => !previousPokemonIds.has(p.id))
      .map((p) => p.id);

    newPokemonIds = new Set(newOnes);
    previousPokemonIds = new Set(pokemons.map((p) => p.id));

    currentPokemons = pokemons;

    if (!pokemons.length) {
      statusEl.textContent = "This character has no Pokémon yet.";
      pokemonContainer.innerHTML = "";
      return;
    }

    statusEl.textContent = "";
    pokemonContainer.innerHTML = pokemons
      .map((p) => {
        const isNew = newPokemonIds.has(p.id);
        return `
        <div class="card pokemon-card ${isNew ? "new-pokemon" : ""}">
          ${isNew ? '<div class="new-badge">!!</div>' : ""}
          <img src="${p.spriteOfficialUrl || p.spriteUrl}" alt="${
            p.name
          }" class="pokemon-img" />
          <h2>${p.name}</h2>
          <p><strong>Type:</strong> ${p.types}</p>
          <p><strong>HP:</strong> ${p.hp}</p>
          <p><strong>Attack:</strong> ${p.attack}</p>
          <p><strong>Defence:</strong> ${p.defence}</p>
        </div>
      `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load Pokémon.";
    pokemonContainer.innerHTML = "";
  }
}

async function loadDecks(characterId: number) {
  deckContainer.innerHTML = "<p>Loading decks...</p>";

  try {
    const decks: Deck[] = await fetchDecks(characterId);

    if (!decks.length) {
      deckContainer.innerHTML = "<p>No decks yet.</p>";
      return;
    }

    deckContainer.innerHTML = decks
      .map(
        (d) => `
        <div class="card deck-card">
          <h3>${d.name}</h3>
          ${
            d.pokemonCount != null
              ? `<p><strong>Cards:</strong> ${d.pokemonCount}</p>`
              : ""
          }
          ${
            d.pokemonIds
              ? `<p><strong>Pokémon IDs:</strong> ${d.pokemonIds.join(", ")}</p>`
              : ""
          }
        </div>
      `,
      )
      .join("");
  } catch (err) {
    console.error(err);
    deckContainer.innerHTML = "<p>Failed to load decks.</p>";
  }
}

// Button: Gather Pokémon
gatherBtn.addEventListener("click", async () => {
  statusEl.textContent = "Gathering Pokémon...";
  try {
    await gatherPokemon(characterId);
    await loadPokemons(characterId);
    statusEl.textContent = "Pokémon gathered successfully.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to gather Pokémon.";
  }
});

// Button: open Create Deck modal
createDeckBtn.addEventListener("click", () => {
  if (!currentPokemons.length) {
    statusEl.textContent = "This character has no Pokémon to create a deck.";
    return;
  }

  deckErrorEl.textContent = "";
  deckNameInput.value = "";
  selectedPokemonIds = [];
  renderSelectedSlots();
  renderPokemonSelection();
  openModal();
});

function renderSelectedSlots() {
  // 5 boxes (slots)
  const slots: string[] = [];
  for (let i = 0; i < 5; i++) {
    const pokemonId = selectedPokemonIds[i];
    if (pokemonId != null) {
      const p = currentPokemons.find((pk) => pk.id === pokemonId);
      if (p) {
        slots.push(`
          <div class="slot filled">
            <img src="${p.spriteUrl}" alt="${p.name}" />
            <span>${p.name}</span>
          </div>
        `);
      } else {
        slots.push(`<div class="slot"></div>`);
      }
    } else {
      slots.push(`<div class="slot"></div>`);
    }
  }

  selectedSlotsEl.innerHTML = slots.join("");
}

function renderPokemonSelection() {
  pokemonSelectList.innerHTML = currentPokemons
    .map((p) => {
      const checked = selectedPokemonIds.includes(p.id) ? "checked" : "";
      return `
      <label class="pokemon-select-item">
        <input type="checkbox" value="${p.id}" ${checked} />
        <img src="${p.spriteUrl}" alt="${p.name}" class="pokemon-select-img" />
        <span>${p.name} (${p.types})</span>
      </label>
    `;
    })
    .join("");

  // attach listeners to checkboxes
  const checkboxes =
    pokemonSelectList.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );

  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = Number(cb.value);
      if (cb.checked) {
        if (!selectedPokemonIds.includes(id)) {
          if (selectedPokemonIds.length >= 5) {
            cb.checked = false;
            deckErrorEl.textContent = "You can select up to 5 Pokémon.";
            return;
          }
          selectedPokemonIds.push(id);
        }
      } else {
        selectedPokemonIds = selectedPokemonIds.filter((v) => v !== id);
      }
      deckErrorEl.textContent = "";
      renderSelectedSlots();
    });
  });
}

function openModal() {
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

// Modal: cancel
cancelDeckBtn.addEventListener("click", () => {
  closeModal();
});

// Modal: save deck
saveDeckBtn.addEventListener("click", async () => {
  deckErrorEl.textContent = "";

  const name = deckNameInput.value.trim();
  if (!name) {
    deckErrorEl.textContent = "Please enter a deck name.";
    return;
  }

  if (!selectedPokemonIds.length) {
    deckErrorEl.textContent = "Please select at least one Pokémon.";
    return;
  }

  try {
    await createDeck(characterId, name, selectedPokemonIds);
    closeModal();
    statusEl.textContent = `Deck "${name}" created successfully.`;
    await loadDecks(characterId);
  } catch (err) {
    console.error(err);
    deckErrorEl.textContent = "Failed to create deck.";
  }
});