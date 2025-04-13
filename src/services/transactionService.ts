
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
