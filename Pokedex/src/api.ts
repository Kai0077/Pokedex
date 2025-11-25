const CHARACTER_API_URL = "http://localhost:3000/api/character";
const DECK_API_URL = "http://localhost:3000/api/deck";
const POKEMON_API_URL = "http://localhost:3000/api/pokemon";

export type Character = {
  id: number;
  firstname: string;
  lastname: string;
  age: number;
  gender: string;
  deckCount: number;
};

export type Pokemon = {
  id: number;
  name: string;
  types: string;
  hp: number;
  attack: number;
  defence: number;
  spriteUrl: string;
  spriteOfficialUrl: string;
};

export type Deck = {
  id: number;
  name: string;
  pokemonCount?: number;
  pokemonIds?: number[];
};

export async function fetchCharacters(): Promise<Character[]> {
  const res = await fetch(CHARACTER_API_URL);
  if (!res.ok) {
    throw new Error(`Failed to load characters: ${res.status}`);
  }
  return res.json();
}

export async function fetchCharacterPokemons(
  characterId: number,
): Promise<Pokemon[]> {
  const res = await fetch(`${CHARACTER_API_URL}/${characterId}`);
  if (!res.ok) {
    throw new Error(`Failed to load pokemons for character ${characterId}`);
  }
  return res.json();
}

export async function gatherPokemon(characterId: number): Promise<void> {
  const res = await fetch(`${CHARACTER_API_URL}/${characterId}/pokemon`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Failed to gather Pokémon: ${res.status}`);
  }
}

export async function createDeck(
  characterId: number,
  name: string,
  pokemonIds: number[],
): Promise<void> {
  const res = await fetch(`${DECK_API_URL}/${characterId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, pokemonIds }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create deck: ${res.status}`);
  }
}

export async function fetchDecks(characterId: number): Promise<Deck[]> {
  const res = await fetch(`${DECK_API_URL}/${characterId}`);
  if (!res.ok) {
    throw new Error(`Failed to load decks for character ${characterId}`);
  }
  return res.json();
}