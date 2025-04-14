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

// Export all localStorage data as a JSON file
export function exportDataToFile() {
  const dataToExport = {};
  
  Object.values(STORAGE_KEYS).forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      dataToExport[key] = JSON.parse(data);
    }
  });

  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `stockscribe_backup_${new Date().toISOString().replace(/:/g, '-')}.json`;
  link.click();
}

// Import data from a JSON file
export function importDataFromFile(file: File) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target?.result as string);
      
      Object.entries(importedData).forEach(([key, value]) => {
        if (Object.values(STORAGE_KEYS).includes(key)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      // Optionally, trigger a page reload or app refresh
      window.location.reload();
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import backup file. Please check the file format.');
    }
  };
  reader.readAsText(file);
}

// Export the storage keys for use in services
export { STORAGE_KEYS };
