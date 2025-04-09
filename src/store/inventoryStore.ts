
import { create } from 'zustand';
import { Product, StockEntry, StockOutput, StockOutputLine, Transaction } from '@/types/inventory';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface InventoryStore {
  products: Product[];
  stockEntries: StockEntry[];
  stockOutputs: StockOutput[];
  stockOutputLines: StockOutputLine[];
  transactions: Transaction[];
  
  // Product operations
  addProduct: (product: Omit<Product, 'id' | 'currentStock' | 'averageCost' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  
  // Stock entry operations
  addStockEntry: (entry: Omit<StockEntry, 'id' | 'remainingQuantity'>) => void;
  updateStockEntry: (entry: StockEntry) => void;
  getStockEntriesForProduct: (productId: string) => StockEntry[];
  
  // Stock output operations
  createStockOutput: (productId: string, quantity: number, outputDate: Date, referenceNumber?: string, notes?: string) => StockOutput | null;
  getStockOutputsForProduct: (productId: string) => StockOutput[];
  
  // Transaction operations
  getTransactionsForProduct: (productId: string) => Transaction[];
  
  // Utility
  calculateProductTotals: (productId: string) => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [],
  stockEntries: [],
  stockOutputs: [],
  stockOutputLines: [],
  transactions: [],
  
  addProduct: (productData) => {
    const newProduct: Product = {
      id: uuidv4(),
      ...productData,
      currentStock: 0,
      averageCost: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      products: [...state.products, newProduct]
    }));
    
    toast.success(`Product ${newProduct.name} added`);
  },
  
  updateProduct: (updatedProduct) => {
    set((state) => ({
      products: state.products.map(product => 
        product.id === updatedProduct.id ? 
        { ...updatedProduct, updatedAt: new Date() } : 
        product
      )
    }));
    
    toast.success(`Product ${updatedProduct.name} updated`);
  },
  
  deleteProduct: (id) => {
    // Check if there are any transactions for this product
    const hasTransactions = get().transactions.some(t => t.productId === id);
    
    if (hasTransactions) {
      toast.error("Cannot delete product with transaction history");
      return;
    }
    
    const productToDelete = get().products.find(p => p.id === id);
    
    set((state) => ({
      products: state.products.filter(product => product.id !== id)
    }));
    
    if (productToDelete) {
      toast.success(`Product ${productToDelete.name} deleted`);
    }
  },
  
  getProductById: (id) => {
    return get().products.find(product => product.id === id);
  },
  
  addStockEntry: (entryData) => {
    const newEntry: StockEntry = {
      id: uuidv4(),
      ...entryData,
      remainingQuantity: entryData.quantity,
    };
    
    set((state) => ({
      stockEntries: [...state.stockEntries, newEntry]
    }));
    
    // Create a transaction record
    const newTransaction: Transaction = {
      id: uuidv4(),
      type: 'entry',
      productId: entryData.productId,
      quantity: entryData.quantity,
      date: entryData.entryDate,
      referenceId: newEntry.id,
      notes: entryData.notes
    };
    
    set((state) => ({
      transactions: [...state.transactions, newTransaction]
    }));
    
    // Update product totals
    get().calculateProductTotals(entryData.productId);
    
    toast.success(`Added ${entryData.quantity} units to inventory`);
  },
  
  updateStockEntry: (updatedEntry) => {
    set((state) => ({
      stockEntries: state.stockEntries.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    }));
    
    // Update product totals
    get().calculateProductTotals(updatedEntry.productId);
  },
  
  getStockEntriesForProduct: (productId) => {
    return get().stockEntries
      .filter(entry => entry.productId === productId)
      .sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
  },
  
  createStockOutput: (productId, quantity, outputDate, referenceNumber, notes) => {
    // Get all entries for this product with remaining quantity
    const availableEntries = get().stockEntries
      .filter(entry => entry.productId === productId && entry.remainingQuantity > 0)
      .sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
    
    // Calculate total available quantity
    const totalAvailable = availableEntries.reduce((sum, entry) => sum + entry.remainingQuantity, 0);
    
    if (totalAvailable < quantity) {
      toast.error(`Insufficient stock. Only ${totalAvailable} units available`);
      return null;
    }
    
    // Create stock output
    const newOutput: StockOutput = {
      id: uuidv4(),
      productId,
      totalQuantity: quantity,
      totalCost: 0, // Will be calculated
      referenceNumber,
      outputDate,
      notes
    };
    
    let remainingToFulfill = quantity;
    let totalCost = 0;
    const outputLines: StockOutputLine[] = [];
    const updatedEntries: StockEntry[] = [];
    
    // Apply FIFO logic - take from oldest entries first
    for (const entry of availableEntries) {
      if (remainingToFulfill <= 0) break;
      
      const quantityFromThisEntry = Math.min(remainingToFulfill, entry.remainingQuantity);
      remainingToFulfill -= quantityFromThisEntry;
      
      // Create output line
      const outputLine: StockOutputLine = {
        id: uuidv4(),
        stockOutputId: newOutput.id,
        stockEntryId: entry.id,
        quantity: quantityFromThisEntry,
        unitPrice: entry.unitPrice
      };
      
      outputLines.push(outputLine);
      
      // Update cost
      totalCost += quantityFromThisEntry * entry.unitPrice;
      
      // Update the entry's remaining quantity
      const updatedEntry = {
        ...entry,
        remainingQuantity: entry.remainingQuantity - quantityFromThisEntry
      };
      
      updatedEntries.push(updatedEntry);
    }
    
    // Update the output with the calculated cost
    newOutput.totalCost = totalCost;
    
    // Update state
    set((state) => ({
      stockOutputs: [...state.stockOutputs, newOutput],
      stockOutputLines: [...state.stockOutputLines, ...outputLines],
      stockEntries: state.stockEntries.map(entry => {
        const updatedEntry = updatedEntries.find(updated => updated.id === entry.id);
        return updatedEntry || entry;
      })
    }));
    
    // Create a transaction record
    const newTransaction: Transaction = {
      id: uuidv4(),
      type: 'output',
      productId,
      quantity,
      date: outputDate,
      referenceId: newOutput.id,
      notes
    };
    
    set((state) => ({
      transactions: [...state.transactions, newTransaction]
    }));
    
    // Update product totals
    get().calculateProductTotals(productId);
    
    toast.success(`Withdrew ${quantity} units using FIFO method`);
    return newOutput;
  },
  
  getStockOutputsForProduct: (productId) => {
    return get().stockOutputs
      .filter(output => output.productId === productId)
      .sort((a, b) => b.outputDate.getTime() - a.outputDate.getTime());
  },
  
  getTransactionsForProduct: (productId) => {
    return get().transactions
      .filter(transaction => transaction.productId === productId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  },
  
  calculateProductTotals: (productId) => {
    const entries = get().stockEntries.filter(entry => entry.productId === productId);
    
    // Calculate current stock
    const currentStock = entries.reduce((sum, entry) => sum + entry.remainingQuantity, 0);
    
    // Calculate average cost (weighted average)
    let totalValue = 0;
    let totalItems = 0;
    
    for (const entry of entries) {
      if (entry.remainingQuantity > 0) {
        totalValue += entry.remainingQuantity * entry.unitPrice;
        totalItems += entry.remainingQuantity;
      }
    }
    
    const averageCost = totalItems > 0 ? totalValue / totalItems : 0;
    
    // Update product
    const product = get().getProductById(productId);
    if (product) {
      const updatedProduct = {
        ...product,
        currentStock,
        averageCost,
        updatedAt: new Date()
      };
      
      set((state) => ({
        products: state.products.map(p => 
          p.id === productId ? updatedProduct : p
        )
      }));
    }
  }
}));
