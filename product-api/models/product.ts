const PRODUCTS_PATH = "./models/products.json";

export interface Product {
  id: string;
  name: string;
  available: number;
}


export async function readProducts(): Promise<Product[]> {
  const raw = await Deno.readTextFile(PRODUCTS_PATH);
  return JSON.parse(raw);
}

export async function writeProducts(products: Product[]): Promise<void> {
  await Deno.writeTextFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
}

export async function findProductById(productId: string): Promise<Product | undefined> {
  const products = await readProducts();
  return products.find((p) => p.id === productId);
}