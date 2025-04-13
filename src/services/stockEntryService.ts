
import { v4 as uuidv4 } from 'uuid';
import { StockEntry } from '@/types/models';
import { getStoredData, saveStoredData, getStoredItemById, STORAGE_KEYS } from '@/lib/localStorageUtils';
import { updateProductStockAndCost } from './productService';
import { createTransaction } from './transactionService';
import { toast } from 'sonner';

export async function getStockEntriesForProduct(productId: string): Promise<StockEntry[]> {
  const entries = getStoredData<StockEntry>(STORAGE_KEYS.STOCK_ENTRIES);
  return entries.filter(entry => entry.product_id === productId)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
}

export async function getStockEntryById(id: string): Promise<StockEntry | null> {
  return getStoredItemById<StockEntry>(STORAGE_KEYS.STOCK_ENTRIES, id);
}

export async function addStockEntry(entryData: Omit<StockEntry, 'id'>): Promise<StockEntry> {
  const entries = getStoredData<StockEntry>(STORAGE_KEYS.STOCK_ENTRIES);
  
  const newEntry: StockEntry = {
    id: uuidv4(),
    ...entryData
  };
  
  // Add the new entry
  const updatedEntries = [...entries, newEntry];
  saveStoredData(STORAGE_KEYS.STOCK_ENTRIES, updatedEntries);
  
  // Create a transaction record
  await createTransaction({
    type: 'entry',
    product_id: newEntry.product_id,
    quantity: newEntry.quantity,
    date: newEntry.entry_date,
    reference_id: newEntry.id,
    notes: newEntry.notes
  });
  
  // Update product stock and cost
  await updateProductStockAndCost(newEntry.product_id);
  
  toast.success('Stock entry added successfully');
  return newEntry;
}

export async function updateStockEntry(entryData: Pick<StockEntry, 'id'> & Partial<Omit<StockEntry, 'id'>>): Promise<StockEntry> {
  const entries = getStoredData<StockEntry>(STORAGE_KEYS.STOCK_ENTRIES);
  const existingEntryIndex = entries.findIndex(e => e.id === entryData.id);
  
  if (existingEntryIndex === -1) {
    toast.error('Stock entry not found');
    throw new Error('Stock entry not found');
  }
  
  const existingEntry = entries[existingEntryIndex];
  
  // Check if we're trying to update quantity and it's already been partially consumed
  if (entryData.quantity !== undefined && entryData.quantity < (existingEntry.quantity - existingEntry.remaining_quantity)) {
    toast.error('Cannot reduce quantity below what has been consumed');
    throw new Error('Cannot reduce quantity below what has been consumed');
  }
  
  // Update remaining_quantity if quantity is being changed
  let remaining_quantity = existingEntry.remaining_quantity;
  if (entryData.quantity !== undefined) {
    const consumed = existingEntry.quantity - existingEntry.remaining_quantity;
    remaining_quantity = entryData.quantity - consumed;
  }
  
  const updatedEntry: StockEntry = {
    ...existingEntry,
    ...entryData,
    remaining_quantity
  };
  
  entries[existingEntryIndex] = updatedEntry;
  saveStoredData(STORAGE_KEYS.STOCK_ENTRIES, entries);
  
  // Update product stock and cost
  await updateProductStockAndCost(existingEntry.product_id);
  
  toast.success('Stock entry updated successfully');
  return updatedEntry;
}

export async function deleteStockEntry(id: string): Promise<void> {
  const entries = getStoredData<StockEntry>(STORAGE_KEYS.STOCK_ENTRIES);
  const existingEntry = entries.find(e => e.id === id);
  
  if (!existingEntry) {
    toast.error('Stock entry not found');
    throw new Error('Stock entry not found');
  }
  
  // Check if entry has been partially consumed
  if (existingEntry.remaining_quantity < existingEntry.quantity) {
    toast.error('Cannot delete an entry that has been partially consumed');
    throw new Error('Cannot delete an entry that has been partially consumed');
  }
  
  // Remove the entry
  const updatedEntries = entries.filter(e => e.id !== id);
  saveStoredData(STORAGE_KEYS.STOCK_ENTRIES, updatedEntries);
  
  // Remove related transaction
  const transactions = getStoredData(STORAGE_KEYS.TRANSACTIONS);
  const updatedTransactions = transactions.filter((t: any) => !(t.reference_id === id && t.type === 'entry'));
  saveStoredData(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);
  
  // Update product stock and cost
  await updateProductStockAndCost(existingEntry.product_id);
  
  toast.success('Stock entry deleted successfully');
}
