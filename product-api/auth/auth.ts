import { Context } from "@oak/oak";
import { jwtVerify, SignJWT } from "npm:jose@5.9.6";
import { readUsers } from "../models/users.ts";

const SECRET = new TextEncoder().encode(Deno.env.get("JWT_SECRET") ?? "dev-secret-change-me");

export async function loginHandler(ctx: Context) {
  const { username, password } = await ctx.request.body.json();
  if (!username || !password) {
    ctx.response.status = 400;
    ctx.response.body = { error: "username and password required" };
    return;
  }

  const users = await readUsers();
  const user = users.find((u) => u.username === username);
  if (!user || user.password !== password) {
    ctx.response.status = 401;
    ctx.response.body = { error: "invalid credentials" };
    return;
  }

  const token = await new SignJWT({ sub: user.username, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(SECRET);

  ctx.response.body = { token, expiresInSeconds: 86400 };
}

export async function authMiddleware(ctx: Context, next: () => Promise<unknown>) {
  const auth = ctx.request.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: "missing bearer token" };
    return;
  }
  const token = auth.slice("bearer ".length);

  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ["HS256"] });
    const users = await readUsers();
    const me = users.find((u) => u.username === payload.sub);
    if (!me) {
      ctx.response.status = 401;
      ctx.response.body = { error: "user not found" };
      return;
    }
    (ctx.state as any).user = me;
    await next();
  } catch {
    ctx.response.status = 401;
    ctx.response.body = { error: "invalid or expired token" };
  }
}