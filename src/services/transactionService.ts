
import { v4 as uuidv4 } from 'uuid';
import { Transaction, StockEntry, StockOutputLine } from '@/types/models';
import { getStoredData, saveStoredData, STORAGE_KEYS } from '@/lib/localStorageUtils';
import { getStockOutputLines, getTransactionsForProduct } from './wailsService';

/**
 * Creates a new transaction record
 */
export async function createTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
  const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  
  const newTransaction: Transaction = {
    id: uuidv4(),
    ...transactionData
  };
  
  const updatedTransactions = [...transactions, newTransaction];
  saveStoredData(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);
  
  return newTransaction;
}

/**
 * Gets transactions for a specific product
 */
export async function getProductTransactions(productId: string): Promise<Transaction[]> {
  try {
    // Try the Wails API first
    const wailsTransactions = await getTransactionsForProduct(productId);
    if (wailsTransactions && wailsTransactions.length > 0) {
      return wailsTransactions as unknown as Transaction[];
    }
  } catch (error) {
    console.log("Wails API not available or failed, using local storage", error);
  }
  
  // Fallback to local storage
  const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  return transactions
    .filter(t => t.product_id === productId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Gets all transactions
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Gets detailed FIFO breakdown for a stock output transaction
 */
export async function getTransactionFifoDetails(outputId: string): Promise<StockOutputLine[]> {
  try {
    // Try the Wails API first
    const wailsOutputLines = await getStockOutputLines(outputId);
    if (wailsOutputLines && wailsOutputLines.length > 0) {
      return wailsOutputLines as unknown as StockOutputLine[];
    }
  } catch (error) {
    console.log("Wails API not available or failed, using local storage", error);
  }
  
  // Fallback to local storage
  const outputLines = getStoredData<StockOutputLine>(STORAGE_KEYS.OUTPUT_LINES);
  const matchingLines = outputLines.filter(line => line.stock_output_id === outputId);
  
  // Enrich with stock entry details
  const stockEntries = getStoredData<StockEntry>(STORAGE_KEYS.STOCK_ENTRIES);
  
  return matchingLines.map(line => {
    const entry = stockEntries.find(e => e.id === line.stock_entry_id);
    return {
      ...line,
      stock_entry: entry
    };
  });
}

// Check if the window.go global is defined
// We need a separate definition here that doesn't conflict with the one in wailsService.ts
interface WindowGo {
  go?: {
    "services.InventoryService": {
      GetTransactionsForProduct: (productId: string) => Promise<any[]>;
      GetStockOutputLines: (outputId: string) => Promise<any[]>;
      GetAllTransactions: () => Promise<any[]>;
    };
  }
}

declare global {
  interface Window extends WindowGo {}
}
