import { Context } from "@oak/oak";
import { jwtVerify, SignJWT } from "npm:jose@5.9.6";
import { readUsers } from "../models/users.ts";

const SECRET = new TextEncoder().encode(Deno.env.get("JWT_SECRET") ?? "dev-secret-change-me");

/** Yhtenäinen Bearer-tokenin nouto */
export function extractBearer(
  input: Context | Request | { headers: Headers } | { request: { headers: Headers } } | Headers,
): string | null {
  const headers = toHeaders(input);
  if (!headers) return null;
  const raw = headers.get("authorization") ?? headers.get("Authorization");
  if (!raw) return null;
  const m = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return m ? m[1].trim() : null;
}

function toHeaders(
  input: Context | Request | { headers: Headers } | { request: { headers: Headers } } | Headers,
): Headers | null {
  if (input instanceof Request) return input.headers;
  if (typeof Headers !== "undefined" && input instanceof Headers) return input;
  if (typeof (input as Context)?.request?.headers !== "undefined") return (input as Context).request.headers;
  if ((input as { headers?: Headers })?.headers instanceof Headers) return (input as { headers: Headers }).headers;
  if ((input as { request?: { headers?: Headers } })?.request?.headers instanceof Headers) {
    return (input as { request: { headers: Headers } }).request.headers;
  }
  return null;
}

/** POST /api/login */
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
    ctx.response.body = { error: "Wrong username or password" };
    return;
  }

  const token = await new SignJWT({ sub: user.username, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(SECRET);

  ctx.response.body = { token, expiresInSeconds: 86400 };
}

/** Suojaava middleware */
export async function authMiddleware(ctx: Context, next: () => Promise<unknown>) {
  const token = extractBearer(ctx);
  if (!token) {
    ctx.response.status = 401;
    ctx.response.body = { error: "missing bearer token" };
    return;
  }

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

/** POST /api/logout */
export function logoutHandler(ctx: Context) {
  ctx.response.status = 204;
}
