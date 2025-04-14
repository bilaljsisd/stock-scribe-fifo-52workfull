
import { v4 as uuidv4 } from 'uuid';
import { Transaction, StockEntry, StockOutputLine } from '@/types/models';
import { getStoredData, saveStoredData, STORAGE_KEYS } from '@/lib/localStorageUtils';

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
    if (window.go && window.go["services.InventoryService"] && 
        typeof window.go["services.InventoryService"].GetTransactionsForProduct === 'function') {
      const wailsTransactions = await window.go["services.InventoryService"].GetTransactionsForProduct(productId);
      if (wailsTransactions && wailsTransactions.length > 0) {
        // Enrich transactions with additional data from entries or outputs
        const enrichedTransactions = await enrichTransactions(wailsTransactions);
        return enrichedTransactions;
      }
    }
  } catch (error) {
    console.log("Wails API not available or failed, using local storage", error);
  }
  
  // Fallback to local storage
  const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  const filteredTransactions = transactions
    .filter(t => t.product_id === productId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return enrichTransactions(filteredTransactions);
}

/**
 * Gets all transactions
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    // Try the Wails API first
    if (window.go && window.go["services.InventoryService"] && 
        typeof window.go["services.InventoryService"].GetAllTransactions === 'function') {
      const wailsTransactions = await window.go["services.InventoryService"].GetAllTransactions();
      if (wailsTransactions && wailsTransactions.length > 0) {
        // Enrich transactions with additional data from entries or outputs
        const enrichedTransactions = await enrichTransactions(wailsTransactions);
        return enrichedTransactions;
      }
    }
  } catch (error) {
    console.log("Wails API not available or failed, using local storage", error);
  }
  
  // Fallback to local storage
  const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  const sortedTransactions = transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return enrichTransactions(sortedTransactions);
}

/**
 * Gets detailed FIFO breakdown for a stock output transaction
 */
export async function getTransactionFifoDetails(outputId: string): Promise<StockOutputLine[]> {
  try {
    // Try the Wails API first
    if (window.go && window.go["services.InventoryService"] && 
        typeof window.go["services.InventoryService"].GetStockOutputLines === 'function') {
      const wailsOutputLines = await window.go["services.InventoryService"].GetStockOutputLines(outputId);
      if (wailsOutputLines && wailsOutputLines.length > 0) {
        // Enrich output lines with stock entry details
        const stockEntries = getStoredData<StockEntry>(STORAGE_KEYS.STOCK_ENTRIES);
        
        return wailsOutputLines.map(line => {
          const entry = stockEntries.find(e => e.id === line.stock_entry_id);
          return {
            ...line,
            stock_entry: entry
          };
        });
      }
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

/**
 * Enriches transactions with additional data from entries or outputs
 */
async function enrichTransactions(transactions: Transaction[]): Promise<Transaction[]> {
  const stockEntries = getStoredData<StockEntry>(STORAGE_KEYS.STOCK_ENTRIES);
  const stockOutputs = getStoredData<any>(STORAGE_KEYS.STOCK_OUTPUTS);
  
  return transactions.map(transaction => {
    if (transaction.type === 'entry') {
      // For entries, find the stock entry to get unit price
      const stockEntry = stockEntries.find(entry => entry.id === transaction.reference_id);
      if (stockEntry) {
        return {
          ...transaction,
          unit_price: stockEntry.unit_price,
          total_cost: stockEntry.unit_price * transaction.quantity
        };
      }
    } else if (transaction.type === 'output') {
      // For outputs, find the stock output to get total cost
      const stockOutput = stockOutputs.find(output => output.id === transaction.reference_id);
      if (stockOutput) {
        return {
          ...transaction,
          total_cost: stockOutput.total_cost,
          unit_price: stockOutput.total_cost / transaction.quantity
        };
      }
    }
    
    return transaction;
  });
}

// Check if the window.go global is defined
interface WindowGo {
  go?: {
    "services.InventoryService": {
      GetTransactionsForProduct: (productId: string) => Promise<Transaction[]>;
      GetStockOutputLines: (outputId: string) => Promise<StockOutputLine[]>;
      GetAllTransactions: () => Promise<Transaction[]>;
    };
  }
}

declare global {
  interface Window extends WindowGo {}
}
