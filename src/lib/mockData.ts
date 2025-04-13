
import { v4 as uuidv4 } from 'uuid';
import { Product, StockEntry, StockOutput, StockOutputLine, Transaction } from '@/types/models';
import { getStoredData, STORAGE_KEYS, saveStoredData } from './localStorageUtils';

// Function to add demo products
export function addDemoData() {
  // Check if data already exists
  const existingProducts = getStoredData<Product>(STORAGE_KEYS.PRODUCTS);
  
  if (existingProducts.length > 0) {
    return; // Don't add demo data if products already exist
  }
  
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();
  
  // Create some demo products
  const products: Product[] = [
    {
      id: uuidv4(),
      name: 'Widget A',
      sku: 'WDG-001',
      description: 'Standard widget for general use',
      units: 'pcs',
      current_stock: 0, // Will be calculated
      average_cost: 0, // Will be calculated
      created_at: lastWeek,
      updated_at: now
    },
    {
      id: uuidv4(),
      name: 'Widget B',
      sku: 'WDG-002',
      description: 'Premium widget with advanced features',
      units: 'pcs',
      current_stock: 0, // Will be calculated
      average_cost: 0, // Will be calculated
      created_at: lastWeek,
      updated_at: now
    },
    {
      id: uuidv4(),
      name: 'Raw Material X',
      sku: 'RM-001',
      description: 'Basic raw material for manufacturing',
      units: 'kg',
      current_stock: 0, // Will be calculated
      average_cost: 0, // Will be calculated
      created_at: lastWeek,
      updated_at: now
    }
  ];
  
  // Save products
  saveStoredData(STORAGE_KEYS.PRODUCTS, products);
  
  // Create stock entries
  const stockEntries: StockEntry[] = [
    {
      id: uuidv4(),
      product_id: products[0].id,
      quantity: 100,
      remaining_quantity: 80,
      unit_price: 5.0,
      entry_date: lastWeek,
      notes: 'Initial stock'
    },
    {
      id: uuidv4(),
      product_id: products[0].id,
      quantity: 50,
      remaining_quantity: 50,
      unit_price: 5.5,
      entry_date: yesterday,
      notes: 'Regular restocking'
    },
    {
      id: uuidv4(),
      product_id: products[1].id,
      quantity: 75,
      remaining_quantity: 65,
      unit_price: 12.0,
      entry_date: lastWeek,
      notes: 'Initial stock'
    },
    {
      id: uuidv4(),
      product_id: products[2].id,
      quantity: 200,
      remaining_quantity: 140,
      unit_price: 3.2,
      entry_date: lastWeek,
      notes: 'Bulk purchase'
    }
  ];
  
  // Save stock entries
  saveStoredData(STORAGE_KEYS.STOCK_ENTRIES, stockEntries);
  
  // Create stock outputs
  const stockOutputs: StockOutput[] = [
    {
      id: uuidv4(),
      product_id: products[0].id,
      total_quantity: 20,
      total_cost: 100, // 20 * 5.0
      reference_number: 'ORD-001',
      output_date: yesterday,
      notes: 'Customer order'
    },
    {
      id: uuidv4(),
      product_id: products[1].id,
      total_quantity: 10,
      total_cost: 120, // 10 * 12.0
      reference_number: 'ORD-002',
      output_date: now,
      notes: 'Internal use'
    },
    {
      id: uuidv4(),
      product_id: products[2].id,
      total_quantity: 60,
      total_cost: 192, // 60 * 3.2
      reference_number: 'MFG-001',
      output_date: now,
      notes: 'Production run'
    }
  ];
  
  // Save stock outputs
  saveStoredData(STORAGE_KEYS.STOCK_OUTPUTS, stockOutputs);
  
  // Create output lines
  const outputLines: StockOutputLine[] = [
    {
      id: uuidv4(),
      stock_output_id: stockOutputs[0].id,
      stock_entry_id: stockEntries[0].id,
      quantity: 20,
      unit_price: 5.0
    },
    {
      id: uuidv4(),
      stock_output_id: stockOutputs[1].id,
      stock_entry_id: stockEntries[2].id,
      quantity: 10,
      unit_price: 12.0
    },
    {
      id: uuidv4(),
      stock_output_id: stockOutputs[2].id,
      stock_entry_id: stockEntries[3].id,
      quantity: 60,
      unit_price: 3.2
    }
  ];
  
  // Save output lines
  saveStoredData(STORAGE_KEYS.OUTPUT_LINES, outputLines);
  
  // Create transactions
  const transactions: Transaction[] = [
    {
      id: uuidv4(),
      type: 'entry',
      product_id: products[0].id,
      quantity: 100,
      date: lastWeek,
      reference_id: stockEntries[0].id,
      notes: 'Initial stock'
    },
    {
      id: uuidv4(),
      type: 'entry',
      product_id: products[0].id,
      quantity: 50,
      date: yesterday,
      reference_id: stockEntries[1].id,
      notes: 'Regular restocking'
    },
    {
      id: uuidv4(),
      type: 'entry',
      product_id: products[1].id,
      quantity: 75,
      date: lastWeek,
      reference_id: stockEntries[2].id,
      notes: 'Initial stock'
    },
    {
      id: uuidv4(),
      type: 'entry',
      product_id: products[2].id,
      quantity: 200,
      date: lastWeek,
      reference_id: stockEntries[3].id,
      notes: 'Bulk purchase'
    },
    {
      id: uuidv4(),
      type: 'output',
      product_id: products[0].id,
      quantity: 20,
      date: yesterday,
      reference_id: stockOutputs[0].id,
      notes: 'Customer order'
    },
    {
      id: uuidv4(),
      type: 'output',
      product_id: products[1].id,
      quantity: 10,
      date: now,
      reference_id: stockOutputs[1].id,
      notes: 'Internal use'
    },
    {
      id: uuidv4(),
      type: 'output',
      product_id: products[2].id,
      quantity: 60,
      date: now,
      reference_id: stockOutputs[2].id,
      notes: 'Production run'
    }
  ];
  
  // Save transactions
  saveStoredData(STORAGE_KEYS.TRANSACTIONS, transactions);
  
  // Update product stock and costs
  products[0].current_stock = 130; // 100 + 50 - 20
  products[0].average_cost = 5.25; // Weighted average
  
  products[1].current_stock = 65; // 75 - 10
  products[1].average_cost = 12.0;
  
  products[2].current_stock = 140; // 200 - 60
  products[2].average_cost = 3.2;
  
  // Save updated products
  saveStoredData(STORAGE_KEYS.PRODUCTS, products);
}

// Export a function to clear all data
export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
