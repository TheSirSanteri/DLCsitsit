import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";

import { loginHandler, authMiddleware } from "./auth/auth.ts";
import { reserveProduct, myReservations } from "./controllers/productController.ts";
import { readProducts } from "./models/product.ts";

const app = new Application();
const router = new Router();

router.get("/api/health", (ctx) => (ctx.response.body = { ok: true }));
router.post("/api/login", loginHandler);
router.get("/api/products", async (ctx) => (ctx.response.body = await readProducts()));

router.post("/api/products/reserve", authMiddleware, reserveProduct);
router.get("/api/me/reservations", authMiddleware, myReservations);

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

const port = Number(Deno.env.get("PORT") ?? 8000);
console.log(`Server running on http://localhost:${port}`);
await app.listen({ port });