
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionType } from '@/types/models';
import { getStoredData, saveStoredData, STORAGE_KEYS } from '@/lib/localStorageUtils';

export async function getAllTransactions(): Promise<Transaction[]> {
  const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getTransactionsForProduct(productId: string): Promise<Transaction[]> {
  const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  return transactions
    .filter(t => t.product_id === productId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
  const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  
  const newTransaction: Transaction = {
    id: uuidv4(),
    ...transactionData
  };
  
  saveStoredData(STORAGE_KEYS.TRANSACTIONS, [...transactions, newTransaction]);
  return newTransaction;
}

export async function getTransactionFifoDetails(transactionId: string): Promise<any[]> {
  // If this is an output transaction, get the stock output lines
  const transactions = getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  const transaction = transactions.find(t => t.id === transactionId);
  
  if (!transaction || transaction.type !== 'output') {
    return [];
  }
  
  // Get the stock output lines for this transaction's reference_id
  const outputLines = getStoredData<any>(STORAGE_KEYS.OUTPUT_LINES)
    .filter(line => line.stock_output_id === transaction.reference_id);
  
  // Enrich with stock entry details
  const stockEntries = getStoredData<any>(STORAGE_KEYS.STOCK_ENTRIES);
  
  return outputLines.map(line => {
    const entry = stockEntries.find(e => e.id === line.stock_entry_id);
    return {
      ...line,
      stock_entry: entry || null
    };
  });
}
