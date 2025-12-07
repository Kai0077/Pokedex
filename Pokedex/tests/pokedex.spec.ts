import { test, expect } from "@playwright/test";

test("homepage loads with correct title and elements", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to be" Pokedex Frontend.
  await expect(page).toHaveTitle("Pokedex Frontend");

  // homepage UI heading
  await expect(page.getByRole("heading", { name: "Pokedex Characters" })).toBeVisible();

  // button create character
  await expect(page.getByRole("button", { name: "Create Character" })).toBeVisible();
});

test("pokedex end to end", async ({ page }) => {
  await page.goto("/");

  // ------------------------
  // CREATE CHARACTER
  // ------------------------

  // Open modal
  const createCharacterButton = page.getByRole("button", { name: "Create Character" });
  await createCharacterButton.click();

  // Input form
  await page.fill("#first-name-input", "John");
  await page.fill("#last-name-input", "Jonas");
  await page.fill("#age-input", "25");
  await page.selectOption("#gender-select", "male");
  await page.getByRole("radio", { name: /Charmander/i }).check();

  // Submit
  await page.locator("#save-character-btn").click();

  // Wait for success message
  await expect(page.locator("#status")).toContainText("John Jonas");

  // Check new character card appears
  const card = page.locator("a.card", { hasText: "John Jonas" }).last();

  await expect(card).toBeVisible();
  await expect(card).toContainText("Age: 25");
  await expect(card).toContainText("Gender: male");
  await expect(card).toContainText("Decks: 0");

  // ------------------------
  // CHARACTER PAGE
  // ------------------------
  await card.click();

  // Expect a title "to be" Character Inventory.
  await expect(page).toHaveTitle("Character Inventory");

  const backButton = page.getByRole("link", { name: "← Back to characters" });
  await expect(backButton).toBeVisible();

  await expect(page.getByRole("heading", { name: "John Jonas's page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gather Pokémon" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Deck" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Decks" })).toBeVisible();
  await expect(page.locator("p", { hasText: "No decks yet." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pokémon Inventory" })).toBeVisible();


  const inventory = page.locator(".pokemon-card");
  const infoButton = page.locator(".pokemon-card button.pokemon-info-btn");

  // Pokemon Inventory Cards before
  await expect(inventory).toHaveCount(1);
  await expect(inventory.filter({ hasText: "charmander" })).toHaveCount(1);

  await expect(infoButton).toHaveCount(1);
  await expect(infoButton).toHaveText(Array(1).fill("i"));

  // -------------------------------------
  // GATHER POKEMON (CHARACTER PAGE)
  // -------------------------------------
  await page.getByRole("button", { name: "Gather Pokémon" }).click();
  await expect(page.locator("button", { hasText: "Gather in" })).toBeVisible();
  await expect(page.locator("button", { hasText: "Gather in" })).toBeDisabled();

  // Wait for success message
  await expect(page.locator("#status")).toContainText("Success! 10 random Pokémon assigned to character #");
  await expect(page.getByRole("heading", { name: "Pokémon Inventory" })).toBeVisible();

  // Pokemon Inventory Cards after
  await expect(inventory).toHaveCount(11);
  await expect(inventory.filter({ hasText: "charmander" })).toHaveCount(1);

  await expect(infoButton).toHaveCount(11);
  await expect(infoButton).toHaveText(Array(11).fill("i"));

  // -------------------------------------
  // CREATE DECK (CHARACTER PAGE)
  // -------------------------------------
  const createDeckButton = page.getByRole("button", { name: "Create Deck" });
  await createDeckButton.click();

  await expect(page.locator("#deck-modal")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Deck" })).toBeVisible();
  await expect(page.getByLabel("Deck name:")).toBeVisible();

  await expect(page.getByRole("heading", { name: "Selected Pokémon"})).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose from your Pokémon"})).toBeVisible();
  await expect(page.locator("#selected-slots .slot")).toHaveCount(5);

  const checkboxes = page.locator('#pokemon-select-list input[type="checkbox"]');
  await expect(checkboxes).toHaveCount(11);

  const pokeRows = page.locator(".pokemon-select-item");
  await expect(pokeRows).toHaveCount(11);

  await page.getByRole("button", { name: "Save Deck" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Save Deck" })).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

  // Input form
  await page.fill("#deck-name-input", "Team Fire");

  await page.locator('#pokemon-select-list input[type="checkbox"]').nth(0).check();
  await page.locator('#pokemon-select-list input[type="checkbox"]').nth(1).check();
  await page.locator('#pokemon-select-list input[type="checkbox"]').nth(2).check();
  await page.locator('#pokemon-select-list input[type="checkbox"]').nth(3).check();
  await page.locator('#pokemon-select-list input[type="checkbox"]').nth(4).check();

  const saveDeckButton = page.getByRole("button", { name: "Save Deck" });
  await saveDeckButton.scrollIntoViewIfNeeded();
  await saveDeckButton.click();

  await expect(page.locator("#deck-modal")).toBeHidden();

  // -------------------------------------
  // DECKS (CHARACTER PAGE)
  // -------------------------------------
  await expect(page.getByRole("heading", { name: "Decks"})).toBeVisible();
  const deckName = page.locator(".deck-card h3");
  await expect(deckName).toHaveText("Team Fire");

  const deckPokemons = page.locator(".deck-card .deck-pokemon-list");
  await expect(deckPokemons).toBeVisible();
  await expect(deckPokemons).toHaveCount(1);

  const rank = page.locator(".deck-card .deck-rank");
  await expect(rank).toBeVisible();

  const pokemonInDeck = page.locator(".deck-card .deck-pokemon-item");
  await expect(pokemonInDeck).toHaveCount(5);

  // -------------------------------------
  // CANCEL AND NAVIGATE BUTTONS
  // -------------------------------------
  await createDeckButton.click();
  const cancelDeckButton = page.getByRole("button", { name: "Cancel" });
  await cancelDeckButton.scrollIntoViewIfNeeded();
  await cancelDeckButton.click();

  await backButton.click();

  // Homepage
  await expect(page.getByRole("heading", { name: "Pokedex Characters" })).toBeVisible();

  await createCharacterButton.click();
  await expect(page.getByRole("heading", { name: "Create Character" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("#character-modal")).toBeHidden();
});