export type UserReservation = {
  reservedAt: string; // ISO for the whole operation
  items: Array<{ productId: string; quantity: number }>;
};

export type ReservedProduct = {
  productId: string;
  quantity: number;
  reservedAt: string; // legacy per-item; we won't write new entries here
};

export type User = {
  username: string;
  name: string;
  email: string;
  password: string;
  reservations?: UserReservation[];    // reservation
};

// --- IO-apurit Deno-ympäristöön ---
const USERS_URL = new URL("./users.json", import.meta.url);

export async function readUsers(): Promise<User[]> {
  const txt = await Deno.readTextFile(USERS_URL);
  return JSON.parse(txt) as User[];
}

export async function writeUsers(data: User[]): Promise<void> {
  const tmp = new URL("./users.json.tmp", import.meta.url);
  await Deno.writeTextFile(tmp, JSON.stringify(data, null, 2));
  await Deno.rename(tmp, USERS_URL); // atominen vaihto
}

export async function getUserByUsername(
  username: string
): Promise<User | undefined> {
  const users = await readUsers();
  return users.find(u => u.username === username);
}

export async function getUserReservations(
  username: string
): Promise<UserReservation[]> {
  const user = await getUserByUsername(username);
  return user?.reservations ?? [];
}
