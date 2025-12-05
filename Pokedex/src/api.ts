const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CHARACTER_API_URL = `${BASE_URL}character`;
const DECK_API_URL = `${BASE_URL}deck`;

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

// Decks /deck/:characterId
export type Deck = {
  id: number;
  name: string;
  pokemonCount?: number;
  pokemonIds?: number[];
};

// Decks /character/:id/decks
export type CharacterDeck = {
  deckId: number;
  name: string;
  rank: "S" | "A" | "B" | "C" | "D";
  pokemon: Pokemon[];
};

export type NewCharacterPayload = {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  starter: "Charmander" | "Bulbasaur" | "Squirtle";
};

export type GatherResponse = {
  message: string;
  characterId: number;
  count: number;
  lastGatherAt?: string;
  nextGatherAt?: string;
  data: Pokemon[];
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


export async function gatherPokemon(
  characterId: number,
): Promise<GatherResponse> {
  const res = await fetch(`${CHARACTER_API_URL}/${characterId}/pokemon`, {
    method: "POST",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      body && typeof body.error === "string"
        ? body.error
        : `Failed to gather Pokémon: ${res.status}`;
    throw new Error(msg);
  }

  return body as GatherResponse;
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

export async function fetchCharacterDecks(
  characterId: number,
): Promise<CharacterDeck[]> {
  const res = await fetch(`${CHARACTER_API_URL}/${characterId}/decks`);
  if (!res.ok) {
    throw new Error(`Failed to fetch decks for character ${characterId}: ${res.status}`);
  }

  const data = await res.json();

  if (Array.isArray(data)) {
    return data as CharacterDeck[];
  }

  if (Array.isArray(data.decks)) {
    return data.decks as CharacterDeck[];
  }

  throw new Error("Unexpected decks response format");
}

export async function createCharacter(
  payload: NewCharacterPayload,
): Promise<Character> {
  const res = await fetch(CHARACTER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to create character: ${res.status}`);
  }

  return res.json();
}