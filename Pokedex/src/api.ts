const BACKEND_BASE_URL = "http://localhost:3000/api"; // change if your backend uses another URL/port

export type Character = {
  id: number;
  name: string;
  // add other fields if you want: level, class, etc.
};

export async function getAllCharacters(): Promise<Character[]> {
  const res = await fetch(`${BACKEND_BASE_URL}/character`);

  if (!res.ok) {
    throw new Error(`Failed to fetch characters: ${res.status}`);
  }

  return res.json();
}