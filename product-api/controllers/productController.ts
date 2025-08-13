import { Context } from "@oak/oak";
import { findProductById, readProducts, writeProducts } from "../models/product.ts";
import { updateUser, type Reservation } from "../models/users.ts";

export async function reserveProduct(ctx: Context) {
  const user = (ctx.state as any).user as { username: string; reservedProducts?: Reservation[] } | undefined;
  if (!user) {
    ctx.response.status = 401;
    ctx.response.body = { error: "unauthorized" };
    return;
  }

  const { productId, quantity } = await ctx.request.body.json();
  if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: "productId and positive integer quantity required" };
    return;
  }

  const product = await findProductById(productId);
  if (!product) {
    ctx.response.status = 404;
    ctx.response.body = { error: "product not found" };
    return;
  }
  if (product.available < quantity) {
    ctx.response.status = 409;
    ctx.response.body = { error: "not enough stock", available: product.available };
    return;
  }

  // update availability
  const products = await readProducts();
  const idx = products.findIndex((p) => p.id === productId);
  products[idx] = { ...product, available: product.available - quantity };
  await writeProducts(products);

  // store reservation to user
  const reservation: Reservation = { productId, quantity, reservedAt: new Date().toISOString() };
  user.reservedProducts = user.reservedProducts ?? [];
  user.reservedProducts.push(reservation);
  await updateUser(user as any);

  ctx.response.body = {
    ok: true,
    productId,
    reservedQuantity: quantity,
    remaining: products[idx].available,
    username: user.username,
  };
}

export async function myReservations(ctx: Context) {
  const user = (ctx.state as any).user;
  if (!user) {
    ctx.response.status = 401;
    ctx.response.body = { error: "unauthorized" };
    return;
  }
  ctx.response.body = { username: user.username, reservedProducts: user.reservedProducts ?? [] };
}