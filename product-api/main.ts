import { Application, Router } from "@oak/oak";
import productsRouter from "./controllers/productController.ts"

const app = new Application();
const router = new Router();

router.get("/", (ctx) => {
  ctx.response.body = "Hello world!";
});


app.use(router.routes());
app.use(router.allowedMethods());
app.use(productsRouter.routes());
app.use(productsRouter.allowedMethods());

app.listen({ port: 8000 });
console.log("Server running on http://localhost:8000");