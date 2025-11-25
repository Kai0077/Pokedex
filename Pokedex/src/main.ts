import "./style.css";
import {
  fetchCharacters,
  createCharacter,
  type Character,
  type NewCharacterPayload,
} from "./api";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="home-header">
    <h1>Pokedex Characters</h1>
    <button id="create-character-btn">Create Character</button>
  </div>

  <div id="status"></div>
  <div id="character-container" class="characters"></div>

  <!-- Create Character Modal -->
  <div id="character-modal" class="modal hidden">
    <div class="modal-content">
      <h2>Create Character</h2>

      <div class="form-group">
        <label>
          First name:
          <input type="text" id="first-name-input" />
        </label>
      </div>

      <div class="form-group">
        <label>
          Last name:
          <input type="text" id="last-name-input" />
        </label>
      </div>

      <div class="form-group">
        <label>
          Age:
          <input type="number" id="age-input" min="1" />
        </label>
      </div>

      <div class="form-group">
        <label>
          Gender:
          <select id="gender-select">
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <div class="form-group">
        <p>Starter:</p>
        <div class="starter-grid">
          <label class="starter-option">
            <input type="radio" name="starter" value="Charmander" />
            <span>Charmander 🔥</span>
          </label>
          <label class="starter-option">
            <input type="radio" name="starter" value="Bulbasaur" />
            <span>Bulbasaur 🌿</span>
          </label>
          <label class="starter-option">
            <input type="radio" name="starter" value="Squirtle" />
            <span>Squirtle 💧</span>
          </label>
        </div>
      </div>

      <div id="character-error" class="error-text"></div>

      <div class="modal-actions">
        <button id="save-character-btn">Create</button>
        <button id="cancel-character-btn">Cancel</button>
      </div>
    </div>
  </div>
`;

const statusEl = document.getElementById("status") as HTMLDivElement;
const container = document.getElementById(
  "character-container",
) as HTMLDivElement;

const createCharacterBtn = document.getElementById(
  "create-character-btn",
) as HTMLButtonElement;

const characterModal = document.getElementById(
  "character-modal",
) as HTMLDivElement;
const firstNameInput = document.getElementById(
  "first-name-input",
) as HTMLInputElement;
const lastNameInput = document.getElementById(
  "last-name-input",
) as HTMLInputElement;
const ageInput = document.getElementById("age-input") as HTMLInputElement;
const genderSelect = document.getElementById(
  "gender-select",
) as HTMLSelectElement;
const characterErrorEl = document.getElementById(
  "character-error",
) as HTMLDivElement;
const saveCharacterBtn = document.getElementById(
  "save-character-btn",
) as HTMLButtonElement;
const cancelCharacterBtn = document.getElementById(
  "cancel-character-btn",
) as HTMLButtonElement;

async function loadCharacters() {
  statusEl.textContent = "Loading characters...";
  container.innerHTML = "";

  try {
    const characters: Character[] = await fetchCharacters();

    if (!characters.length) {
      statusEl.textContent = "No characters yet. Create one!";
      return;
    }

    statusEl.textContent = "";
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
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load characters.";
  }
}

function openCharacterModal() {
  characterErrorEl.textContent = "";
  firstNameInput.value = "";
  lastNameInput.value = "";
  ageInput.value = "";
  genderSelect.value = "";
  const starterRadios = document.querySelectorAll<HTMLInputElement>(
    'input[name="starter"]',
  );
  starterRadios.forEach((r) => {
    r.checked = false;
  });

  characterModal.classList.remove("hidden");
}

function closeCharacterModal() {
  characterModal.classList.add("hidden");
}

createCharacterBtn.addEventListener("click", () => {
  openCharacterModal();
});

cancelCharacterBtn.addEventListener("click", () => {
  closeCharacterModal();
});

// optional: close by clicking backdrop
characterModal.addEventListener("click", (e) => {
  if (e.target === characterModal) {
    closeCharacterModal();
  }
});

saveCharacterBtn.addEventListener("click", async () => {
  characterErrorEl.textContent = "";

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const age = Number(ageInput.value);
  const gender = genderSelect.value;
  const starterRadio = document.querySelector<HTMLInputElement>(
    'input[name="starter"]:checked',
  );

  if (!firstName || !lastName || !age || !gender || !starterRadio) {
    characterErrorEl.textContent = "Please fill out all fields and choose a starter.";
    return;
  }

  const payload: NewCharacterPayload = {
    firstName,
    lastName,
    age,
    gender,
    starter: starterRadio.value as NewCharacterPayload["starter"],
  };

  try {
    await createCharacter(payload);
    closeCharacterModal();
    await loadCharacters();
    statusEl.textContent = `Character "${firstName} ${lastName}" created.`;
  } catch (err) {
    console.error(err);
    characterErrorEl.textContent = "Failed to create character.";
  }
});

// initial load
loadCharacters();