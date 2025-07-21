import { Context } from "@oak/oak";
import { products } from "../db/productsdb.ts";

export const getProducts = (ctx: Context) => {
  ctx.response.body = products;
};