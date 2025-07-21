export interface Product {
  id: string;
  name: string;
  available: number;
}

export const products: Product[] = [
  { id: "1", name: "Seat at table", available: 5 },
  { id: "2", name: "Chair", available: 2 },
  { id: "3", name: "Food", available: 0 },
];