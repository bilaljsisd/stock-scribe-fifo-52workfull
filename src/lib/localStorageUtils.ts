
/**
 * Utility functions for working with localStorage to persist application data
 */

// Define keys for different data types
const STORAGE_KEYS = {
  PRODUCTS: 'stockscribe_products',
  STOCK_ENTRIES: 'stockscribe_stock_entries',
  STOCK_OUTPUTS: 'stockscribe_stock_outputs',
  OUTPUT_LINES: 'stockscribe_output_lines',
  TRANSACTIONS: 'stockscribe_transactions'
};

// Generic function to get data from localStorage
export function getStoredData<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error retrieving data from localStorage (${key}):`, error);
    return [];
  }
}

// Generic function to save data to localStorage
export function saveStoredData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data to localStorage (${key}):`, error);
  }
}

// Get a single item by ID from localStorage
export function getStoredItemById<T extends { id: string }>(key: string, id: string): T | null {
  const items = getStoredData<T>(key);
  return items.find(item => item.id === id) || null;
}

// Add a new item to localStorage
export function addStoredItem<T>(key: string, item: T): void {
  const items = getStoredData<T>(key);
  items.push(item);
  saveStoredData(key, items);
}

// Update an existing item in localStorage
export function updateStoredItem<T extends { id: string }>(key: string, updatedItem: T): void {
  const items = getStoredData<T>(key);
  const index = items.findIndex(item => item.id === updatedItem.id);
  
  if (index !== -1) {
    items[index] = updatedItem;
    saveStoredData(key, items);
  }
}

// Delete an item from localStorage
export function deleteStoredItem<T extends { id: string }>(key: string, id: string): void {
  const items = getStoredData<T>(key);
  const filteredItems = items.filter(item => item.id !== id);
  saveStoredData(key, filteredItems);
}

// Clear all data for a specific key
export function clearStoredData(key: string): void {
  localStorage.removeItem(key);
}

// Export the storage keys for use in services
export { STORAGE_KEYS };
