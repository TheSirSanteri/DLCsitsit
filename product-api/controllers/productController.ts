import { Router } from "@oak/oak";
import {
  getAllProducts,
} from "../models/product.ts";

const router = new Router({prefix: "/api/products"});

router.get("/", async (ctx) => {
  const products = await getAllProducts();
  ctx.response.body = products;
});

//router.post(/)
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