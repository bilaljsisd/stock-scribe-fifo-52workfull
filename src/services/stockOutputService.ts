
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
      // Update the entry to restore the quantity
      const { error: updateError } = await supabase
        .from('stock_entries')
        .update({
          remaining_quantity: supabase.rpc('increment', { 
            row_id: line.stock_entry_id,
            table_name: 'stock_entries',
            column_name: 'remaining_quantity',
            value: line.quantity
          })
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
      product_id: productId
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}
