
import { StockEntry } from "@/types/inventory";
import { toast } from "sonner";
import {
  getStockEntriesForProduct as wailsGetStockEntriesForProduct,
  addStockEntry as wailsAddStockEntry,
  updateStockEntry as wailsUpdateStockEntry
} from "./wailsService";

export async function getStockEntriesForProduct(productId: string): Promise<StockEntry[]> {
  try {
    const data = await wailsGetStockEntriesForProduct(productId);
    
    console.info("Stock Entries:", data);
    return data || [];
  } catch (error) {
    console.error('Error fetching stock entries:', error);
    return [];
  }
}

export async function addStockEntry(entry: Omit<StockEntry, 'id' | 'remainingQuantity'>): Promise<StockEntry | null> {
  try {
    const data = await wailsAddStockEntry(entry);
    
    return data;
  } catch (error) {
    console.error('Error adding stock entry:', error);
    toast.error('Failed to add stock entry');
    return null;
  }
}

export async function updateStockEntry(
  entry: Pick<StockEntry, 'id'> & Partial<Omit<StockEntry, 'id' | 'productId' | 'remainingQuantity'>>
): Promise<StockEntry | null> {
  try {
    const data = await wailsUpdateStockEntry(entry);
    
    return data;
  } catch (error) {
    console.error('Error updating stock entry:', error);
    throw error;
  }
}

export async function deleteStockEntry(id: string): Promise<boolean> {
  try {
    // In our Go version, we don't have a direct delete method
    // We would need to add this to the Go backend
    toast.error("Delete operation not supported yet");
    return false;
  } catch (error) {
    console.error('Error deleting stock entry:', error);
    throw error;
  }
}
