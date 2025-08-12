import { Router } from "@oak/oak";
import {
  getAllProducts,
  reserveProducts,
  ReservationItem,
} from "../models/product.ts";

const router = new Router({prefix: "/api/products"});

router.get("/", async (ctx) => {
  const products = await getAllProducts();
  ctx.response.body = products;
});

router.post("/reserve", async (ctx) => {
  const items = await ctx.request.source!.json() as ReservationItem[];
    try {
      const updated = await reserveProducts(items);
      ctx.response.status = 200;
      ctx.response.body = updated;
    } catch (error) {
      ctx.response.status = 400;
      ctx.response.body = { error: (error as Error).message };
    }
});
/*
router.get("/products/:id", async (ctx) => {
  const id = ctx.params.id!;
  const product = await getProductById(id);

  if (product) {
    ctx.response.body = product;
  } else {
    ctx.response.status = 404;
    ctx.response.body = { error: "Product not found" };
  }
});

router.post("/products", async (ctx) => {
  const body = await ctx.request.body({ type: "json" }).value;
  const newProduct = await addProduct(body);
  ctx.response.status = 201;
  ctx.response.body = newProduct;
});

router.put("/products/:id", async (ctx) => {
  const id = ctx.params.id!;
  const body = await ctx.request.body({ type: "json" }).value;
  const updatedProduct = await updateProduct(id, body);

  if (updatedProduct) {
    ctx.response.body = updatedProduct;
  } else {
    ctx.response.status = 404;
    ctx.response.body = { error: "Product not found" };
  }
});

router.delete("/products/:id", async (ctx) => {
  const id = ctx.params.id!;
  const success = await deleteProduct(id);

  if (success) {
    ctx.response.status = 204;
  } else {
    ctx.response.status = 404;
    ctx.response.body = { error: "Product not found" };
  }
});
*/
export default router;