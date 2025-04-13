
import { Transaction } from "@/types/inventory";
import {
  getAllTransactions as wailsGetAllTransactions,
  getStockOutputLines as wailsGetStockOutputLines
} from "./wailsService";

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    return await wailsGetAllTransactions();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// Function to get FIFO allocation details for a stock output transaction
export async function getTransactionFifoDetails(transactionId: string): Promise<any[]> {
  if (!transactionId) return [];
  
  try {
    return await wailsGetStockOutputLines(transactionId);
  } catch (error) {
    console.error('Error fetching transaction FIFO details:', error);
    return [];
  }
}
