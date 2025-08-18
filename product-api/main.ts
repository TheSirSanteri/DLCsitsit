import { Application, Router, Context } from "@oak/oak";
import { loginHandler, logoutHandler, authMiddleware } from "./auth/auth.ts";
import { isReservationArray } from "./models/product.ts";
import { getUserReservations} from "./models/users.ts";
import { reserveProductsAsOneOperationFlexible, listProducts } from "./controllers/productController.ts";

// --- Reitit ---
const router = new Router();

// Health check
router.get("/api/health", (ctx: Context) => {
  ctx.response.status = 200;
  ctx.response.body = { status: "ok" }
})

// Auth
router.post("/api/login", loginHandler);
router.post("/api/logout", logoutHandler);

// Show all products
router.get("/api/products", async (ctx: Context) => {
  const products = await listProducts();
  ctx.response.status = 200;
  ctx.response.body = products;
});

// Reservation (protected)
router.post("/api/products/reserve", authMiddleware, async (ctx: Context) => {
  const body = await ctx.request.body.json().catch(() => null);
  if (!isReservationArray(body)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Body must be an array of { productId, quantity } with positive integer quantity." };
    return;
  }

  const user = (ctx.state as any).user as { username: string } | undefined;
  if (!user) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const result = await reserveProductsAsOneOperationFlexible(user.username, body);

  if (!result.ok) {
    ctx.response.status = 400;
    ctx.response.body = { error: result.error };
    return;
  }

  // success: full/partial
  ctx.response.status = 200;
  if (result.status === "full") {
    ctx.response.body = {
      success: true,
      status: "full",
      message: result.message, // "Products reserved successfully"
      reservedAt: result.reservedAt,
      items: result.items,
    };
  } else {
    ctx.response.body = {
      success: true,
      status: "partial",
      message: result.message, // "Products reserved partially, because there weren't enough"
      reservedAt: result.reservedAt,
      items: result.items,
      partials: result.partials,
    };
  }
});


router.get("/api/me/reservations", authMiddleware, async (ctx) => {
  const { username } = (ctx.state as { user: { username: string } }).user;
  const reservations = await getUserReservations(username);
  ctx.response.status = 200;
  ctx.response.body = { reservations };
});

// --- Sovellus ---
const app = new Application();

// (valinnainen) hyvin yksinkertainen CORS kaikille
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  await next();
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = Number(Deno.env.get("PORT") ?? 8000);
console.log(`Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });
