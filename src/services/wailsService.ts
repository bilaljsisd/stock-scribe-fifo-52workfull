
import { Product, StockEntry, StockOutput, StockOutputLine, Transaction } from "@/types/inventory";

// This is a TypeScript wrapper for our Go functions exposed by Wails
// The global window object will have these functions injected by Wails at runtime

interface WailsGo {
  // Product operations
  GetProducts: () => Promise<Product[]>;
  GetProductByID: (id: string) => Promise<Product>;
  CreateProduct: (name: string, sku: string, description: string, units: string | null) => Promise<Product>;
  UpdateProduct: (id: string, name: string, sku: string, description: string, units: string | null) => Promise<Product>;
  DeleteProduct: (id: string) => Promise<void>;

  // Stock entry operations
  AddStockEntry: (
    productId: string, 
    quantity: number, 
    unitPrice: number, 
    entryDate: Date, 
    notes: string | null
  ) => Promise<StockEntry>;
  GetStockEntriesForProduct: (productId: string) => Promise<StockEntry[]>;
  UpdateStockEntry: (
    id: string, 
    unitPrice: number, 
    entryDate: Date, 
    notes: string | null, 
    quantity?: number
  ) => Promise<StockEntry>;

  // Stock output operations
  CreateStockOutput: (
    productId: string, 
    quantity: number, 
    outputDate: Date, 
    referenceNumber: string | null, 
    notes: string | null
  ) => Promise<StockOutput>;
  GetStockOutputsForProduct: (productId: string) => Promise<StockOutput[]>;
  GetStockOutputLines: (outputId: string) => Promise<StockOutputLine[]>;

  // Transaction operations
  GetTransactionsForProduct: (productId: string) => Promise<Transaction[]>;
  GetAllTransactions: () => Promise<Transaction[]>;
}

declare global {
  interface Window {
    go: {
      "services.InventoryService": WailsGo
    };
  }
}

// Service functions that will call our Go backend via Wails

// Product methods
export async function getProducts(): Promise<Product[]> {
  try {
    return await window.go["services.InventoryService"].GetProducts();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    return await window.go["services.InventoryService"].GetProductByID(id);
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    return null;
  }
}

export async function createProduct(product: Omit<Product, 'id' | 'currentStock' | 'averageCost' | 'createdAt' | 'updatedAt'>): Promise<Product | null> {
  try {
    return await window.go["services.InventoryService"].CreateProduct(
      product.name,
      product.sku,
      product.description || '',
      product.units || null
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

export async function updateProduct(product: Partial<Product> & { id: string }): Promise<Product | null> {
  try {
    return await window.go["services.InventoryService"].UpdateProduct(
      product.id,
      product.name || '',
      product.sku || '',
      product.description || '',
      product.units || null
    );
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

export async function deleteProduct(id: string, name: string): Promise<boolean> {
  try {
    await window.go["services.InventoryService"].DeleteProduct(id);
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

// Stock entry methods
export async function getStockEntriesForProduct(productId: string): Promise<StockEntry[]> {
  try {
    return await window.go["services.InventoryService"].GetStockEntriesForProduct(productId);
  } catch (error) {
    console.error('Error fetching stock entries:', error);
    return [];
  }
}

export async function addStockEntry(entry: Omit<StockEntry, 'id' | 'remainingQuantity'>): Promise<StockEntry | null> {
  try {
    return await window.go["services.InventoryService"].AddStockEntry(
      entry.productId,
      entry.quantity,
      entry.unitPrice,
      entry.entryDate,
      entry.notes || null
    );
  } catch (error) {
    console.error('Error adding stock entry:', error);
    return null;
  }
}

export async function updateStockEntry(
  entry: Pick<StockEntry, 'id'> & Partial<Omit<StockEntry, 'id' | 'productId' | 'remainingQuantity'>>
): Promise<StockEntry | null> {
  try {
    return await window.go["services.InventoryService"].UpdateStockEntry(
      entry.id,
      entry.unitPrice || 0,
      entry.entryDate || new Date(),
      entry.notes || null,
      entry.quantity
    );
  } catch (error) {
    console.error('Error updating stock entry:', error);
    throw error;
  }
}

// Stock output methods
export async function createStockOutput(
  productId: string,
  quantity: number,
  outputDate: Date,
  referenceNumber?: string,
  notes?: string
): Promise<StockOutput | null> {
  try {
    return await window.go["services.InventoryService"].CreateStockOutput(
      productId,
      quantity,
      outputDate,
      referenceNumber || null,
      notes || null
    );
  } catch (error) {
    console.error('Error creating stock output:', error);
    return null;
  }
}

export async function getStockOutputsForProduct(productId: string): Promise<StockOutput[]> {
  try {
    return await window.go["services.InventoryService"].GetStockOutputsForProduct(productId);
  } catch (error) {
    console.error('Error fetching stock outputs:', error);
    return [];
  }
}

export async function getStockOutputLines(outputId: string): Promise<StockOutputLine[]> {
  try {
    return await window.go["services.InventoryService"].GetStockOutputLines(outputId);
  } catch (error) {
    console.error('Error fetching stock output lines:', error);
    return [];
  }
}

// Transaction methods
export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    return await window.go["services.InventoryService"].GetAllTransactions();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function getTransactionsForProduct(productId: string): Promise<Transaction[]> {
  try {
    return await window.go["services.InventoryService"].GetTransactionsForProduct(productId);
  } catch (error) {
    console.error('Error fetching transactions for product:', error);
    return [];
  }
}
