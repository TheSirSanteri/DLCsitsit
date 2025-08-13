export interface Reservation {
  productId: string;
  quantity: number;
  reservedAt: string;
}

export interface User {
  username: string;       // user ID
  name: string;
  email: string;
  password: string;
  reservedProducts: Reservation[];
}

const USERS_PATH = "./models/users.json";

export async function readUsers(): Promise<User[]> {
  const raw = JSON.parse(await Deno.readTextFile(USERS_PATH));
  // pienenä kompatina tuetaan legacy "id" ja "reservations" kenttiä
  return raw.map((u: any) => ({
    username: u.username ?? u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    reservedProducts: u.reservedProducts ?? u.reservations ?? [],
  })) as User[];
}

export async function writeUsers(users: User[]): Promise<void> {
  await Deno.writeTextFile(USERS_PATH, JSON.stringify(users, null, 2));
}

export async function updateUser(user: User): Promise<void> {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.username === user.username);
  if (idx === -1) throw new Error("User not found");
  users[idx] = user;
  await writeUsers(users);
}