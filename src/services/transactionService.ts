
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionType, StockOutputLine } from '@/types/models';
import { getStoredData, saveStoredData, STORAGE_KEYS } from '@/lib/localStorageUtils';

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    // First try to get from Go backend via Wails
    if (window.go && window.go["services.InventoryService"]?.GetAllTransactions) {
      return await window.go["services.InventoryService"].GetAllTransactions();
    } 
    // Fallback to local storage
    const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
}

export async function getTransactionsForProduct(productId: string): Promise<Transaction[]> {
  try {
    // First try to get from Go backend via Wails
    if (window.go && window.go["services.InventoryService"]?.GetTransactionsForProduct) {
      return await window.go["services.InventoryService"].GetTransactionsForProduct(productId);
    }
    // Fallback to local storage
    const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    return transactions
      .filter(t => t.product_id === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error(`Error getting transactions for product ${productId}:`, error);
    return [];
  }
}

export async function createTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
  try {
    const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    
    const newTransaction: Transaction = {
      id: uuidv4(),
      ...transactionData
    };
    
    saveStoredData(STORAGE_KEYS.TRANSACTIONS, [...transactions, newTransaction]);
    return newTransaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

export async function getTransactionFifoDetails(stockOutputId: string): Promise<StockOutputLine[]> {
  try {
    // First try to get from Go backend via Wails
    if (window.go && window.go["services.InventoryService"]?.GetStockOutputLines) {
      return await window.go["services.InventoryService"].GetStockOutputLines(stockOutputId);
    }
    
    // Fallback to local storage implementation
    // Get the stock output lines for this transaction's reference_id
    const outputLines = getStoredData<StockOutputLine>(STORAGE_KEYS.OUTPUT_LINES)
      .filter(line => line.stock_output_id === stockOutputId);
    
    // Enrich with stock entry details
    const stockEntries = getStoredData<any>(STORAGE_KEYS.STOCK_ENTRIES);
    
    return outputLines.map(line => {
      const entry = stockEntries.find(e => e.id === line.stock_entry_id);
      return {
        ...line,
        stock_entry: entry || null
      };
    });
  } catch (error) {
    console.error(`Error getting FIFO details for output ${stockOutputId}:`, error);
    return [];
  }
}

// Add a global typescript definition for the Go services
declare global {
  interface Window {
    go?: {
      "services.InventoryService": {
        GetAllTransactions: () => Promise<Transaction[]>;
        GetTransactionsForProduct: (productId: string) => Promise<Transaction[]>;
        GetStockOutputLines: (outputId: string) => Promise<StockOutputLine[]>;
      }
    };
  }
}
