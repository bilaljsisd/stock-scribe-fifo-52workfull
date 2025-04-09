
import { supabase } from "@/integrations/supabase/client";
import { StockEntry, StockOutput, StockOutputLine } from "@/types/supabase";
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
    toast.error('Failed to load stock outputs');
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
    // Get available stock entries for this product
    const { data: availableEntries, error: entriesError } = await supabase
      .from('stock_entries')
      .select('*')
      .eq('product_id', productId)
      .gt('remaining_quantity', 0)
      .order('entry_date');
    
    if (entriesError) throw entriesError;
    
    // Calculate total available quantity
    const totalAvailable = availableEntries ? availableEntries.reduce(
      (sum, entry) => sum + entry.remaining_quantity, 0
    ) : 0;
    
    if (totalAvailable < quantity) {
      toast.error(`Insufficient stock. Only ${totalAvailable} units available`);
      return null;
    }
    
    // Create the stock output record
    const { data: stockOutput, error: outputError } = await supabase
      .from('stock_outputs')
      .insert({
        product_id: productId,
        total_quantity: quantity,
        total_cost: 0, // Will be calculated as we create output lines
        reference_number: referenceNumber || null,
        output_date: outputDate,
        notes: notes || null
      })
      .select()
      .single();
    
    if (outputError) throw outputError;
    
    // Apply FIFO logic to create output lines
    let remainingToFulfill = quantity;
    let totalCost = 0;
    const outputLines: Omit<StockOutputLine, 'id' | 'created_at'>[] = [];
    
    for (const entry of availableEntries!) {
      if (remainingToFulfill <= 0) break;
      
      const quantityFromThisEntry = Math.min(remainingToFulfill, entry.remaining_quantity);
      remainingToFulfill -= quantityFromThisEntry;
      
      // Create output line
      outputLines.push({
        stock_output_id: stockOutput.id,
        stock_entry_id: entry.id,
        quantity: quantityFromThisEntry,
        unit_price: entry.unit_price
      });
      
      // Update cost
      totalCost += quantityFromThisEntry * entry.unit_price;
      
      // Update the entry's remaining quantity
      const { error: updateError } = await supabase
        .from('stock_entries')
        .update({
          remaining_quantity: entry.remaining_quantity - quantityFromThisEntry
        })
        .eq('id', entry.id);
      
      if (updateError) throw updateError;
    }
    
    // Update the output with the calculated cost
    const { data: updatedOutput, error: updateOutputError } = await supabase
      .from('stock_outputs')
      .update({ total_cost: totalCost })
      .eq('id', stockOutput.id)
      .select()
      .single();
    
    if (updateOutputError) throw updateOutputError;
    
    // Insert all output lines
    const { error: linesError } = await supabase
      .from('stock_output_lines')
      .insert(outputLines);
    
    if (linesError) throw linesError;
    
    // Create a transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        type: 'output',
        product_id: productId,
        quantity: quantity,
        date: outputDate,
        reference_id: stockOutput.id,
        notes: notes || null
      });
    
    if (transactionError) throw transactionError;
    
    toast.success(`Withdrew ${quantity} units using FIFO method`);
    return updatedOutput;
  } catch (error) {
    console.error('Error creating stock output:', error);
    toast.error('Failed to create stock output');
    return null;
  }
}
