
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  current_stock: number;
  average_cost: number;
  is_expirable: boolean;
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
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface StockOutput {
  id: string;
  product_id: string;
  total_quantity: number;
  total_cost: number;
  reference_number: string | null;
  output_date: string;
  notes: string | null;
  created_at: string;
}

export interface StockOutputLine {
  id: string;
  stock_output_id: string;
  stock_entry_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'entry' | 'output';
  product_id: string;
  quantity: number;
  date: string;
  reference_id: string;
  notes: string | null;
  created_at: string;
}
