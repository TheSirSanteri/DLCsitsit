import { Application, Router, Context } from "jsr:@oak/oak@^17.1.5";
import { loginHandler, logoutHandler, authMiddleware } from "./auth/auth.ts";
import { isReservationArray } from "./models/product.ts";
import { getUserReservations } from "./models/users.ts";
import { getReservationGate } from "./models/config.ts";
import { reserveProductsAsOneOperationFlexible, listProducts } from "./controllers/productController.ts";
import { cors } from "./middlewares/cors.ts";

// Environment detection
const IS_DEPLOY = Boolean(Deno.env.get("DENO_DEPLOYMENT_ID"));
const PORT = Number(Deno.env.get("PORT") ?? 8000);

// ALLOWED_ORIGINS (vain deployssa).
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// --- Reitit ---
const router = new Router();

const app = new Application();

app.use(cors({
  isDeploy: IS_DEPLOY,
  allowedOrigins: ALLOWED_ORIGINS,
  allowCredentials: false, // We use Bearer-Auth,
}));

app.use(router.routes());
app.use(router.allowedMethods());

// Health check
router.get("/api/health", (ctx: Context) => {
  ctx.response.status = 200;
  ctx.response.body = { status: "ok" };
});

// Auth
router.post("/api/login", loginHandler);
router.post("/api/logout", logoutHandler);

router.get("/api/reservations/window", async (ctx: Context) => {
  const gate = await getReservationGate();
  ctx.response.status = 200;
  ctx.response.body = gate; // { canReserve, opensAt, now }
});

// Show all products
router.get("/api/products", async (ctx: Context) => {
  const products = await listProducts();
  ctx.response.status = 200;
  ctx.response.body = products;
});

// Checks time window for reservations
router.use("/api/products/reserve", async (ctx: Context, next) => {
  if (ctx.request.method.toUpperCase() === "POST") {
    const gate = await getReservationGate();
    if (!gate.canReserve) {
      ctx.response.status = 403;
      ctx.response.body = {
        error: "reservations_not_open",
        message: "Reservations have not opened yet.",
        opensAt: gate.opensAt,
        now: gate.now,
      };
      return;
    }
  }
  await next();
});

// Reservation (protected)
router.post("/api/products/reserve", authMiddleware, async (ctx: Context) => {
  console.log("[reserve] incoming");

  const body = await ctx.request.body.json().catch(() => null);
  if (!isReservationArray(body)) {
    ctx.response.status = 400;
    ctx.response.body = {
      ok: false,
      error:
        "Body must be an array of { productId, quantity } with positive integer quantity.",
    };
    return;
  }

  const user = (ctx.state as { user?: { username: string } }).user;
  if (!user) {
    ctx.response.status = 401;
    ctx.response.body = { ok: false, error: "Unauthorized" };
    return;
  }

  const result = await reserveProductsAsOneOperationFlexible(
    user.username,
    body,
  );

  if (!result.ok) {
    ctx.response.status = 400;
    ctx.response.body = { ok: false, error: result.error };
    return;
  }

  // success: full/partial
  ctx.response.status = 200;
  if (result.status === "full") {
    ctx.response.body = {
      ok: true,
      status: "full" as const,
      message: result.message,
      reservedAt: result.reservedAt,
      items: result.items,
    };
  } else {
    ctx.response.body = {
      ok: true,
      status: "partial" as const,
      message: result.message,
      reservedAt: result.reservedAt,
      items: result.items,
      partials: result.partials,
    };
  }
});

// Oma data
router.get("/api/me/reservations", authMiddleware, async (ctx) => {
  const { username } = (ctx.state as { user: { username: string } }).user;
  const reservations = await getUserReservations(username);
  ctx.response.status = 200;
  ctx.response.body = { reservations };
});

// ----- Käynnistys: Deploy vs. Local -----
if (IS_DEPLOY) {
  console.log("[boot] Deno Deploy mode (Deno.serve)");

  const handler: Deno.ServeHandler = (req, _info) =>
    app.handle(req).then((res) => res ?? new Response("Not Found", { status: 404 }));

  Deno.serve(handler);
} else {
  console.log(`[boot] Local dev mode: http://localhost:${PORT}`);
  await app.listen({ port: PORT });
}
