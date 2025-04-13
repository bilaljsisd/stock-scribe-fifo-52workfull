
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  units: string;
  current_stock: number;
  average_cost: number;
  created_at: string;
  updated_at: string;
}

export interface StockEntry {
  id: string;
  product_id: string;
  quantity: number;
  remaining_quantity: number;
  unit_price: number;
  entry_date: string;
  notes: string | null;
}

export interface StockOutput {
  id: string;
  product_id: string;
  total_quantity: number;
  total_cost: number;
  reference_number: string | null;
  output_date: string;
  notes: string | null;
}

export interface StockOutputLine {
  id: string;
  stock_output_id: string;
  stock_entry_id: string;
  quantity: number;
  unit_price: number;
}

export type TransactionType = 'entry' | 'output';

export interface Transaction {
  id: string;
  type: TransactionType;
  product_id: string;
  quantity: number;
  date: string;
  reference_id: string; // StockEntry.id or StockOutput.id
  notes: string | null;
}
