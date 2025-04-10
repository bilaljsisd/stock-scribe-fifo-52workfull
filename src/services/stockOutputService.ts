
import { supabase } from "@/integrations/supabase/client";
import { StockOutput } from "@/types/supabase";
import { toast } from "sonner";

export async function getStockOutputsForProduct(productId: string): Promise<StockOutput[]> {
  try {
    const { data, error } = await supabase
      .from('stock_outputs')
      .select('*')
      .eq('product_id', productId)
      .order('output_date', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching stock outputs:', error);
    return [];
  }
}

export async function createStockOutput(
  productId: string,
  quantity: number,
  outputDate: string,
  referenceNumber?: string,
  notes?: string
): Promise<StockOutput | null> {
  try {
    // Get available stock entries using FIFO order (oldest first)
    const { data: entriesData, error: entriesError } = await supabase
      .from('stock_entries')
      .select('*')
      .eq('product_id', productId)
      .gt('remaining_quantity', 0)
      .order('entry_date', { ascending: true });
    
    if (entriesError) throw entriesError;
    
    const entries = entriesData || [];
    const totalAvailable = entries.reduce((sum, entry) => sum + entry.remaining_quantity, 0);
    
    if (totalAvailable < quantity) {
      toast.error(`Insufficient stock. Only ${totalAvailable} units available.`);
      return null;
    }
    
    // Insert the stock output record first
    const { data: outputData, error: outputError } = await supabase
      .from('stock_outputs')
      .insert({
        product_id: productId,
        total_quantity: quantity,
        total_cost: 0, // Will calculate based on actual allocations
        output_date: outputDate,
        reference_number: referenceNumber || null,
        notes: notes || null
      })
      .select()
      .single();
    
    if (outputError) throw outputError;
    
    if (!outputData) {
      throw new Error("Failed to create stock output");
    }
    
    // Allocate stock from entries using FIFO
    let remainingToAllocate = quantity;
    let totalCost = 0;
    const outputLines = [];
    
    for (const entry of entries) {
      if (remainingToAllocate <= 0) break;
      
      const quantityFromEntry = Math.min(remainingToAllocate, entry.remaining_quantity);
      const cost = quantityFromEntry * entry.unit_price;
      
      // Create output line
      const { data: lineData, error: lineError } = await supabase
        .from('stock_output_lines')
        .insert({
          stock_output_id: outputData.id,
          stock_entry_id: entry.id,
          quantity: quantityFromEntry,
          unit_price: entry.unit_price
        })
        .select()
        .single();
        
      if (lineError) throw lineError;
      outputLines.push(lineData);
      
      // Update remaining quantity in the entry
      const { error: updateError } = await supabase
        .from('stock_entries')
        .update({
          remaining_quantity: entry.remaining_quantity - quantityFromEntry
        })
        .eq('id', entry.id);
        
      if (updateError) throw updateError;
      
      totalCost += cost;
      remainingToAllocate -= quantityFromEntry;
    }
    
    // Update the total cost in the output record
    const { data: updatedOutput, error: updateOutputError } = await supabase
      .from('stock_outputs')
      .update({ total_cost: totalCost })
      .eq('id', outputData.id)
      .select()
      .single();
      
    if (updateOutputError) throw updateOutputError;
    
    // Update product's current stock and average cost
    await updateProductStock(productId);
    
    toast.success(`${quantity} units withdrawn successfully`);
    return updatedOutput;
  } catch (error) {
    console.error('Error creating stock output:', error);
    toast.error('Failed to withdraw stock');
    return null;
  }
}

export async function updateStockOutputQuantity(
  outputId: string,
  newQuantity: number,
  outputDate: string,
  referenceNumber?: string | null,
  notes?: string | null
): Promise<StockOutput | null> {
  try {
    // 1. Get the current output data including product_id
    const { data: currentOutput, error: outputError } = await supabase
      .from('stock_outputs')
      .select('*')
      .eq('id', outputId)
      .single();
    
    if (outputError || !currentOutput) throw outputError || new Error('Stock output not found');
    
    // 2. Restore all inventory from the current output lines
    // Get all lines for this output
    const { data: linesData, error: linesError } = await supabase
      .from('stock_output_lines')
      .select('*')
      .eq('stock_output_id', outputId);
    
    if (linesError) throw linesError;
    
    const productId = currentOutput.product_id;
    
    // Restore stock to entries
    for (const line of linesData || []) {
      const { data: entryData, error: getEntryError } = await supabase
        .from('stock_entries')
        .select('remaining_quantity')
        .eq('id', line.stock_entry_id)
        .single();
      
      if (getEntryError) throw getEntryError;
      
      const newRemainingQuantity = entryData.remaining_quantity + line.quantity;
      
      const { error: updateError } = await supabase
        .from('stock_entries')
        .update({
          remaining_quantity: newRemainingQuantity
        })
        .eq('id', line.stock_entry_id);
      
      if (updateError) throw updateError;
    }
    
    // 3. Delete old output lines
    const { error: deleteLineError } = await supabase
      .from('stock_output_lines')
      .delete()
      .eq('stock_output_id', outputId);
    
    if (deleteLineError) throw deleteLineError;
    
    // 4. Get available stock entries using FIFO order (oldest first)
    const { data: entriesData, error: entriesError } = await supabase
      .from('stock_entries')
      .select('*')
      .eq('product_id', productId)
      .gt('remaining_quantity', 0)
      .order('entry_date', { ascending: true });
    
    if (entriesError) throw entriesError;
    
    const entries = entriesData || [];
    const totalAvailable = entries.reduce((sum, entry) => sum + entry.remaining_quantity, 0);
    
    if (totalAvailable < newQuantity) {
      toast.error(`Insufficient stock. Only ${totalAvailable} units available.`);
      
      // Recreate the original output and lines to maintain consistency
      await recreateOriginalOutput(currentOutput, linesData || []);
      return null;
    }
    
    // 5. Update the stock output record
    const { data: outputData, error: updateOutputError } = await supabase
      .from('stock_outputs')
      .update({
        total_quantity: newQuantity,
        total_cost: 0, // Will calculate based on actual allocations
        output_date: outputDate,
        reference_number: referenceNumber,
        notes: notes
      })
      .eq('id', outputId)
      .select()
      .single();
    
    if (updateOutputError) throw updateOutputError;
    
    // 6. Allocate stock from entries using FIFO (similar to createStockOutput)
    let remainingToAllocate = newQuantity;
    let totalCost = 0;
    
    for (const entry of entries) {
      if (remainingToAllocate <= 0) break;
      
      const quantityFromEntry = Math.min(remainingToAllocate, entry.remaining_quantity);
      const cost = quantityFromEntry * entry.unit_price;
      
      // Create output line
      const { error: lineError } = await supabase
        .from('stock_output_lines')
        .insert({
          stock_output_id: outputId,
          stock_entry_id: entry.id,
          quantity: quantityFromEntry,
          unit_price: entry.unit_price
        });
        
      if (lineError) throw lineError;
      
      // Update remaining quantity in the entry
      const { error: updateError } = await supabase
        .from('stock_entries')
        .update({
          remaining_quantity: entry.remaining_quantity - quantityFromEntry
        })
        .eq('id', entry.id);
        
      if (updateError) throw updateError;
      
      totalCost += cost;
      remainingToAllocate -= quantityFromEntry;
    }
    
    // 7. Update the total cost in the output record
    const { data: updatedOutput, error: finalUpdateError } = await supabase
      .from('stock_outputs')
      .update({ total_cost: totalCost })
      .eq('id', outputId)
      .select()
      .single();
      
    if (finalUpdateError) throw finalUpdateError;
    
    // 8. Update product's current stock and average cost
    await updateProductStock(productId);
    
    return updatedOutput;
  } catch (error) {
    console.error('Error updating stock output quantity:', error);
    throw error;
  }
}

// Helper to recreate the original output if update fails
async function recreateOriginalOutput(originalOutput: StockOutput, originalLines: any[]): Promise<void> {
  try {
    // Recreate original output lines
    for (const line of originalLines) {
      // Deduct from stock entry again
      const { data: entryData, error: getEntryError } = await supabase
        .from('stock_entries')
        .select('remaining_quantity')
        .eq('id', line.stock_entry_id)
        .single();
      
      if (getEntryError) throw getEntryError;
      
      // Update entry with original deduction
      await supabase
        .from('stock_entries')
        .update({
          remaining_quantity: entryData.remaining_quantity - line.quantity
        })
        .eq('id', line.stock_entry_id);
      
      // Recreate output line
      await supabase
        .from('stock_output_lines')
        .insert({
          stock_output_id: originalOutput.id,
          stock_entry_id: line.stock_entry_id,
          quantity: line.quantity,
          unit_price: line.unit_price
        });
    }
    
    // No need to update the output record as it wasn't changed
    
    // Update product stock
    await updateProductStock(originalOutput.product_id);
  } catch (error) {
    console.error('Error recreating original output:', error);
    // Just log the error but continue, as this is a fallback operation
  }
}

export async function updateStockOutput(
  output: Pick<StockOutput, 'id'> & Partial<Omit<StockOutput, 'id' | 'created_at' | 'product_id' | 'total_quantity' | 'total_cost'>>
): Promise<StockOutput | null> {
  try {
    const { data, error } = await supabase
      .from('stock_outputs')
      .update(output)
      .eq('id', output.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating stock output:', error);
    throw error;
  }
}

export async function deleteStockOutput(id: string): Promise<boolean> {
  try {
    // 1. Get the product_id and output lines before deleting
    const { data: outputData, error: outputError } = await supabase
      .from('stock_outputs')
      .select('product_id')
      .eq('id', id)
      .single();
    
    if (outputError || !outputData) throw outputError || new Error('Stock output not found');
    
    const productId = outputData.product_id;
    
    // 2. Get all output lines for this output to know what to restore
    const { data: linesData, error: linesError } = await supabase
      .from('stock_output_lines')
      .select('*')
      .eq('stock_output_id', id);
    
    if (linesError) throw linesError;
    
    // 3. Restore stock to the original entries
    for (const line of linesData || []) {
      // Get the current remaining quantity first
      const { data: entryData, error: getEntryError } = await supabase
        .from('stock_entries')
        .select('remaining_quantity')
        .eq('id', line.stock_entry_id)
        .single();
      
      if (getEntryError) throw getEntryError;
      
      // Then update the entry to restore the quantity
      const newRemainingQuantity = entryData.remaining_quantity + line.quantity;
      
      const { error: updateError } = await supabase
        .from('stock_entries')
        .update({
          remaining_quantity: newRemainingQuantity
        })
        .eq('id', line.stock_entry_id);
      
      if (updateError) throw updateError;
    }
    
    // 4. Delete the output lines
    const { error: deleteLineError } = await supabase
      .from('stock_output_lines')
      .delete()
      .eq('stock_output_id', id);
    
    if (deleteLineError) throw deleteLineError;
    
    // 5. Delete the stock output
    const { error: deleteError } = await supabase
      .from('stock_outputs')
      .delete()
      .eq('id', id);
    
    if (deleteError) throw deleteError;
    
    // 6. Update product stock and cost after deletion
    await updateProductStock(productId);
    
    return true;
  } catch (error) {
    console.error('Error deleting stock output:', error);
    throw error;
  }
}

// Helper function to update product stock and average cost
async function updateProductStock(productId: string): Promise<void> {
  try {
    // Call the Supabase RPC function to update product stock and cost
    const { error } = await supabase.rpc('update_product_stock_and_cost', {
      p_product_id: productId  // Changed from product_id to p_product_id to match the function parameter
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}

// Updated function to fetch stock output lines with related entry data
export async function getStockOutputLines(stockOutputId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('stock_output_lines')
      .select(`
        id,
        stock_output_id,
        stock_entry_id,
        quantity,
        unit_price,
        stock_entry:stock_entry_id (
          id,
          entry_date,
          supplier,
          invoice_number,
          notes
        )
      `)
      .eq('stock_output_id', stockOutputId)
      .order('id');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching stock output lines:', error);
    toast.error('Failed to load stock output details');
    return [];
  }
}
