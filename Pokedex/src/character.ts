import "./style.css";
import {
  fetchCharacterPokemons,
  fetchCharacters,
  fetchCharacterDecks,
  gatherPokemon,
  createDeck,
  type Pokemon,
  type Character,
  type CharacterDeck,
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

  <h2>Decks</h2>
  <div id="deck-container" class="deck-grid"></div>

  <h2>Pokémon Inventory</h2>
  <div id="pokemon-container" class="pokemon-grid"></div>

  <!-- Deck Modal -->
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

  <!-- Pokémon Info Modal -->
  <div id="pokemon-modal" class="modal hidden">
    <div class="modal-content pokemon-modal-content">
      <h2 id="pokemon-modal-name"></h2>
      <img id="pokemon-modal-img" class="pokemon-modal-img" src="" alt="" />
      <div id="pokemon-modal-stats" class="pokemon-modal-stats"></div>
      <div class="modal-actions">
        <button id="pokemon-modal-close">Close</button>
      </div>
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

// deck modal elements
const deckModal = document.getElementById("deck-modal") as HTMLDivElement;
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

// pokemon info modal elements
const pokemonModal = document.getElementById(
  "pokemon-modal",
) as HTMLDivElement;
const pokemonModalName = document.getElementById(
  "pokemon-modal-name",
) as HTMLHeadingElement;
const pokemonModalImg = document.getElementById(
  "pokemon-modal-img",
) as HTMLImageElement;
const pokemonModalStats = document.getElementById(
  "pokemon-modal-stats",
) as HTMLDivElement;
const pokemonModalClose = document.getElementById(
  "pokemon-modal-close",
) as HTMLButtonElement;

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

    await loadDecks(characterId);
    await loadPokemons(characterId);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load character data.";
    pokemonContainer.innerHTML = "";
  }
}

let nextGatherAtMs: number | null = null;
let gatherTimerId: number | null = null;

function formatDuration(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateGatherButtonState() {
  if (!gatherBtn) return;

  if (!nextGatherAtMs) {
    gatherBtn.disabled = false;
    gatherBtn.textContent = "Gather Pokémon";
    return;
  }

  const now = Date.now();
  const diff = nextGatherAtMs - now;

  if (diff <= 0) {
    gatherBtn.disabled = false;
    gatherBtn.textContent = "Gather Pokémon";
    nextGatherAtMs = null; // reset once cooldown expired
  } else {
    gatherBtn.disabled = true;
    gatherBtn.textContent = `Gather in ${formatDuration(diff)}`;
  }
}

function startGatherTimer() {
  if (gatherTimerId != null) {
    window.clearInterval(gatherTimerId);
  }
  gatherTimerId = window.setInterval(() => {
    updateGatherButtonState();
  }, 1000);
}

// Load decks from /api/character/:id/decks
async function loadDecks(characterId: number) {
  deckContainer.innerHTML = "<p>Loading decks...</p>";

  try {
    const decks: CharacterDeck[] = await fetchCharacterDecks(characterId);

    if (!decks.length) {
      deckContainer.innerHTML = "<p>No decks yet.</p>";
      return;
    }

    deckContainer.innerHTML = decks
      .map(
        (d) => `
        <div class="card deck-card">
          <h3>${d.name}</h3>
          <div class="deck-pokemon-list">
            ${d.pokemon
              .map(
                (p) => `
              <div class="deck-pokemon-item">
                <img src="${p.spriteUrl}" alt="${p.name}" />
                <span>${p.name}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `,
      )
      .join("");
  } catch (err) {
    console.error(err);
    deckContainer.innerHTML = "<p>Failed to load decks.</p>";
  }
}

// Load Pokémon inventory and mark new ones with "!!"
async function loadPokemons(characterId: number) {
  statusEl.textContent = "Loading Pokémon...";

  try {
    const pokemons: Pokemon[] = await fetchCharacterPokemons(characterId);

    // detect new ones compared to previous load
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
          <div class="pokemon-card-footer">
            <h2>${p.name}</h2>
            <button class="pokemon-info-btn" data-id="${
              p.id
            }" aria-label="View info">i</button>
          </div>
        </div>
      `;
      })
      .join("");

    attachPokemonInfoHandlers();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load Pokémon.";
    pokemonContainer.innerHTML = "";
  }
}

function attachPokemonInfoHandlers() {
  const infoButtons =
    pokemonContainer.querySelectorAll<HTMLButtonElement>(".pokemon-info-btn");

  infoButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const pokemon = currentPokemons.find((p) => p.id === id);
      if (!pokemon) return;
      openPokemonModal(pokemon);
    });
  });
}

function openPokemonModal(pokemon: Pokemon) {
  pokemonModalName.textContent = pokemon.name;
  pokemonModalImg.src = pokemon.spriteOfficialUrl || pokemon.spriteUrl;
  pokemonModalImg.alt = pokemon.name;

  pokemonModalStats.innerHTML = `
    <p><strong>Type:</strong> ${pokemon.types}</p>
    <p><strong>HP:</strong> ${pokemon.hp}</p>
    <p><strong>Attack:</strong> ${pokemon.attack}</p>
    <p><strong>Defence:</strong> ${pokemon.defence}</p>
  `;

  pokemonModal.classList.remove("hidden");
}

function closePokemonModal() {
  pokemonModal.classList.add("hidden");
}

pokemonModalClose.addEventListener("click", () => {
  closePokemonModal();
});

// optional: close pokemon modal by clicking backdrop
pokemonModal.addEventListener("click", (e) => {
  if (e.target === pokemonModal) {
    closePokemonModal();
  }
});

// Button: Gather Pokémon
gatherBtn.addEventListener("click", async () => {
  statusEl.textContent = "Gathering Pokémon...";
  gatherBtn.disabled = true;

  try {
    const res = await gatherPokemon(characterId);
    await loadPokemons(characterId);

    statusEl.textContent = res.message || "Pokémon gathered successfully.";

    if (res.nextGatherAt) {
      nextGatherAtMs = new Date(res.nextGatherAt).getTime();
    } else if (res.lastGatherAt) {
      // fallback: 60 min after lastGatherAt
      const last = new Date(res.lastGatherAt).getTime();
      nextGatherAtMs = last + 60 * 60 * 1000;
    } else {
      nextGatherAtMs = null;
    }

    updateGatherButtonState();
    startGatherTimer();
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error) {
      statusEl.textContent = err.message;
    } else {
      statusEl.textContent = "Failed to gather Pokémon.";
    }

    // if backend rejected because of cooldown, we keep whatever
    // nextGatherAtMs we had (or null) and update button state
    updateGatherButtonState();
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
  openDeckModal();
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

function openDeckModal() {
  deckModal.classList.remove("hidden");
}

function closeDeckModal() {
  deckModal.classList.add("hidden");
}

// Modal: cancel
cancelDeckBtn.addEventListener("click", () => {
  closeDeckModal();
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
    closeDeckModal();
    statusEl.textContent = `Deck "${name}" created successfully.`;
    await loadDecks(characterId);
  } catch (err) {
    console.error(err);
    deckErrorEl.textContent = "Failed to create deck.";
  }
});