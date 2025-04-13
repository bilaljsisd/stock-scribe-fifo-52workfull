
import { v4 as uuidv4 } from 'uuid';
import { StockOutput, StockOutputLine, StockEntry } from '@/types/models';
import { getStoredData, saveStoredData, getStoredItemById, STORAGE_KEYS } from '@/lib/localStorageUtils';
import { updateProductStockAndCost } from './productService';
import { createTransaction } from './transactionService';
import { toast } from 'sonner';

export async function getStockOutputsForProduct(productId: string): Promise<StockOutput[]> {
  const outputs = getStoredData<StockOutput>(STORAGE_KEYS.STOCK_OUTPUTS);
  return outputs.filter(output => output.product_id === productId)
    .sort((a, b) => new Date(b.output_date).getTime() - new Date(a.output_date).getTime());
}

export async function getStockOutputById(id: string): Promise<StockOutput | null> {
  return getStoredItemById<StockOutput>(STORAGE_KEYS.STOCK_OUTPUTS, id);
}

export async function getStockOutputLines(outputId: string): Promise<StockOutputLine[]> {
  const lines = getStoredData<StockOutputLine>(STORAGE_KEYS.OUTPUT_LINES);
  return lines.filter(line => line.stock_output_id === outputId);
}

export async function createStockOutput(
  productId: string,
  quantity: number,
  outputDate: string,
  referenceNumber?: string,
  notes?: string
): Promise<StockOutput | null> {
  // Get the product's available stock entries
  const stockEntries = getStoredData<StockEntry>(STORAGE_KEYS.STOCK_ENTRIES);
  const availableEntries = stockEntries
    .filter(entry => entry.product_id === productId && entry.remaining_quantity > 0)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
  
  // Check if we have enough stock
  const totalAvailable = availableEntries.reduce((sum, entry) => sum + entry.remaining_quantity, 0);
  if (totalAvailable < quantity) {
    toast.error(`Not enough stock. Only ${totalAvailable} units available.`);
    return null;
  }
  
  // Create the output record
  const outputId = uuidv4();
  const newOutput: StockOutput = {
    id: outputId,
    product_id: productId,
    total_quantity: quantity,
    total_cost: 0, // We'll calculate this as we allocate stock
    reference_number: referenceNumber || null,
    output_date: outputDate,
    notes: notes || null
  };
  
  // Allocate stock using FIFO and create output lines
  let remainingToFulfill = quantity;
  let totalCost = 0;
  const outputLines: StockOutputLine[] = [];
  const updatedEntries = [...stockEntries];
  
  for (const entry of availableEntries) {
    if (remainingToFulfill <= 0) break;
    
    const entryIndex = updatedEntries.findIndex(e => e.id === entry.id);
    if (entryIndex === -1) continue;
    
    const qtyFromThisEntry = Math.min(remainingToFulfill, entry.remaining_quantity);
    
    // Create an output line
    const outputLine: StockOutputLine = {
      id: uuidv4(),
      stock_output_id: outputId,
      stock_entry_id: entry.id,
      quantity: qtyFromThisEntry,
      unit_price: entry.unit_price
    };
    outputLines.push(outputLine);
    
    // Update the entry's remaining quantity
    updatedEntries[entryIndex] = {
      ...updatedEntries[entryIndex],
      remaining_quantity: entry.remaining_quantity - qtyFromThisEntry
    };
    
    // Update totals
    totalCost += qtyFromThisEntry * entry.unit_price;
    remainingToFulfill -= qtyFromThisEntry;
  }
  
  // Update the output with the total cost
  newOutput.total_cost = totalCost;
  
  // Save everything
  const outputs = getStoredData<StockOutput>(STORAGE_KEYS.STOCK_OUTPUTS);
  saveStoredData(STORAGE_KEYS.STOCK_OUTPUTS, [...outputs, newOutput]);
  
  const existingLines = getStoredData<StockOutputLine>(STORAGE_KEYS.OUTPUT_LINES);
  saveStoredData(STORAGE_KEYS.OUTPUT_LINES, [...existingLines, ...outputLines]);
  
  saveStoredData(STORAGE_KEYS.STOCK_ENTRIES, updatedEntries);
  
  // Create a transaction record
  await createTransaction({
    type: 'output',
    product_id: productId,
    quantity: quantity,
    date: outputDate,
    reference_id: outputId,
    notes: notes || null
  });
  
  // Update product stock and cost
  await updateProductStockAndCost(productId);
  
  toast.success('Stock withdrawn successfully using FIFO method');
  return newOutput;
}

export async function updateStockOutput(outputData: Pick<StockOutput, 'id'> & Partial<Omit<StockOutput, 'id' | 'product_id' | 'total_quantity' | 'total_cost'>>): Promise<StockOutput> {
  const outputs = getStoredData<StockOutput>(STORAGE_KEYS.STOCK_OUTPUTS);
  const existingOutputIndex = outputs.findIndex(o => o.id === outputData.id);
  
  if (existingOutputIndex === -1) {
    toast.error('Stock output not found');
    throw new Error('Stock output not found');
  }
  
  const existingOutput = outputs[existingOutputIndex];
  const updatedOutput: StockOutput = {
    ...existingOutput,
    ...outputData
  };
  
  outputs[existingOutputIndex] = updatedOutput;
  saveStoredData(STORAGE_KEYS.STOCK_OUTPUTS, outputs);
  
  toast.success('Stock withdrawal updated successfully');
  return updatedOutput;
}

export async function updateStockOutputQuantity(
  outputId: string,
  newQuantity: number,
  outputDate?: string,
  referenceNumber?: string | null,
  notes?: string | null
): Promise<boolean> {
  // Get the existing output
  const outputs = getStoredData<StockOutput>(STORAGE_KEYS.STOCK_OUTPUTS);
  const outputIndex = outputs.findIndex(o => o.id === outputId);
  
  if (outputIndex === -1) {
    toast.error('Stock output not found');
    return false;
  }
  
  const existingOutput = outputs[outputIndex];
  
  // Delete the existing output and create a new one with the updated quantity
  await deleteStockOutput(outputId);
  
  // Create a new output with the same ID but updated quantity
  const result = await createStockOutput(
    existingOutput.product_id,
    newQuantity,
    outputDate || existingOutput.output_date,
    referenceNumber !== undefined ? referenceNumber : existingOutput.reference_number,
    notes !== undefined ? notes : existingOutput.notes
  );
  
  if (!result) {
    // If creation failed, try to restore the original output
    const outputs = getStoredData<StockOutput>(STORAGE_KEYS.STOCK_OUTPUTS);
    saveStoredData(STORAGE_KEYS.STOCK_OUTPUTS, [...outputs, existingOutput]);
    return false;
  }
  
  return true;
}

export async function deleteStockOutput(id: string): Promise<void> {
  // Get the output to delete
  const outputs = getStoredData<StockOutput>(STORAGE_KEYS.STOCK_OUTPUTS);
  const outputToDelete = outputs.find(o => o.id === id);
  
  if (!outputToDelete) {
    toast.error('Stock output not found');
    throw new Error('Stock output not found');
  }
  
  // Get the output lines to determine which stock entries to restore
  const allOutputLines = getStoredData<StockOutputLine>(STORAGE_KEYS.OUTPUT_LINES);
  const outputLines = allOutputLines.filter(line => line.stock_output_id === id);
  
  // Restore stock to the entries
  const stockEntries = getStoredData<StockEntry>(STORAGE_KEYS.STOCK_ENTRIES);
  const updatedEntries = [...stockEntries];
  
  for (const line of outputLines) {
    const entryIndex = updatedEntries.findIndex(e => e.id === line.stock_entry_id);
    if (entryIndex !== -1) {
      updatedEntries[entryIndex] = {
        ...updatedEntries[entryIndex],
        remaining_quantity: updatedEntries[entryIndex].remaining_quantity + line.quantity
      };
    }
  }
  
  // Remove the output and its lines
  const updatedOutputs = outputs.filter(o => o.id !== id);
  const updatedOutputLines = allOutputLines.filter(line => line.stock_output_id !== id);
  
  // Remove related transaction
  const transactions = getStoredData(STORAGE_KEYS.TRANSACTIONS);
  const updatedTransactions = transactions.filter((t: any) => !(t.reference_id === id && t.type === 'output'));
  
  // Save everything
  saveStoredData(STORAGE_KEYS.STOCK_ENTRIES, updatedEntries);
  saveStoredData(STORAGE_KEYS.STOCK_OUTPUTS, updatedOutputs);
  saveStoredData(STORAGE_KEYS.OUTPUT_LINES, updatedOutputLines);
  saveStoredData(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);
  
  // Update product stock and cost
  await updateProductStockAndCost(outputToDelete.product_id);
  
  toast.success('Stock withdrawal deleted and inventory returned to stock');
}
