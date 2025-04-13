
// This file contains TypeScript interfaces for our Go backend models

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  units?: string;
  currentStock: number;
  averageCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockEntry {
  id: string;
  productId: string;
  quantity: number;
  remainingQuantity: number;
  unitPrice: number;
  entryDate: Date;
  notes?: string;
}

export interface StockOutput {
  id: string;
  productId: string;
  totalQuantity: number;
  totalCost: number;
  referenceNumber?: string;
  outputDate: Date;
  notes?: string;
}

export interface StockOutputLine {
  id: string;
  stockOutputId: string;
  stockEntryId: string;
  quantity: number;
  unitPrice: number;
}

export type TransactionType = 'entry' | 'output';

export interface Transaction {
  id: string;
  type: TransactionType;
  productId: string;
  quantity: number;
  date: Date;
  referenceId: string; // StockEntry.id or StockOutput.id
  notes?: string;
}
