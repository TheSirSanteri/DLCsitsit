import { readJson, writeJson } from "https://deno.land/x/jsonfile/mod.ts";

const DATA_PATH = "./models/products.json";

interface Product {
  id: string;
  name: string;
  available: number;
}

export interface ReservationItem {
  id: string;
  quantity: number;
}

async function readProducts(): Promise<Product[]> {
  try {
    const data = await readJson(DATA_PATH) as Product[];
    return data ?? [];
  } catch {
    return [];
  }
}

async function writeProducts(products: Product[]): Promise<void> {
  await writeJson(DATA_PATH, products, { spaces: 2 });
}

export async function getAllProducts(): Promise<Product[]> {
  return await readProducts();
}

export async function reserveProducts(items: ReservationItem[]): Promise<Product[]> {
  const products = await readProducts();

  for (const { id, quantity } of items) {
    const product = products.find(p => p.id === id);
    if (!product) {
      throw new Error(`Tuotetta ${id} ei löydy`);
    }
    if (product.available < quantity) {
      throw new Error(
        `Tuotteesta ${id} ei ole tarpeeksi saatavilla (pyydettiin ${quantity}, saatavilla ${product.available})`
      );
    }
    product.available -= quantity;
  }

  await writeProducts(products);
  return products;
}

/*
export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await readProducts();
  return products.find((p) => p.id === id);
}

export async function addProduct(productData: Partial<Product>): Promise<Product> {
  const products = await readProducts();

  const newProduct: Product = {
    id: crypto.randomUUID(),
    name: productData.name ?? "Unnamed Product",
    available: productData.available ?? 0,
  };

  products.push(newProduct);
  await writeProducts(products);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const products = await readProducts();
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) return null;

  products[index] = { ...products[index], ...updates };
  await writeProducts(products);
  return products[index];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await readProducts();
  const filtered = products.filter((p) => p.id !== id);

  if (filtered.length === products.length) return false;

  await writeProducts(filtered);
  return true;
}
*/