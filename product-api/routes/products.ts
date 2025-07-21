import { Router } from "@oak/oak";
import { getProducts } from "../controllers/productController.ts";

const router = new Router();

router.get("/api/products", getProducts);

export default router;