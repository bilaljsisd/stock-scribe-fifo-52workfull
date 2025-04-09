
import { supabase } from "@/integrations/supabase/client";
import { StockOutput, StockOutputLine } from "@/types/supabase";
import { toast } from "sonner";

export async function getStockOutputsForProduct(productId: string): Promise<StockOutput[]> {
  try {
    const { data, error } = await supabase
      .from('stock_outputs')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching stock outputs:', error);
    toast.error('Failed to load stock outputs');
    return [];
  }
}

// Simple version for direct insertion of a stock output record
export async function createStockOutputRecord(stockOutput: Omit<StockOutput, 'id' | 'created_at'>): Promise<StockOutput | null> {
  try {
    const { data, error } = await supabase
      .from('stock_outputs')
      .insert(stockOutput)
      .select()
      .single();
    
    if (error) throw error;
    toast.success(`Successfully withdrew ${stockOutput.total_quantity} units from inventory`);
    return data;
  } catch (error) {
    console.error('Error creating stock output record:', error);
    toast.error('Failed to create stock output');
    return null;
  }
}

// Main function to match StockOutputForm's call pattern
export async function createStockOutput(
  productId: string,
  quantity: number,
  outputDate: string,
  referenceNumber?: string,
  notes?: string
): Promise<StockOutput | null> {
  try {
    // First check if there's enough stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', productId)
      .single();
    
    if (productError) throw productError;
    
    if (!product || product.current_stock < quantity) {
      toast.error(`Not enough stock. Only ${product?.current_stock || 0} units available.`);
      return null;
    }
    
    // Create the output record
    const stockOutput = {
      product_id: productId,
      total_quantity: quantity,
      total_cost: 0, // Will be calculated later
      output_date: outputDate,
      reference_number: referenceNumber || null,
      notes: notes || null
    };
    
    const { data, error } = await supabase
      .from('stock_outputs')
      .insert(stockOutput)
      .select()
      .single();
    
    if (error) throw error;
    
    // Now we need to find stock entries to fulfill this output (FIFO)
    const { data: entries, error: entriesError } = await supabase
      .from('stock_entries')
      .select('*')
      .eq('product_id', productId)
      .gt('remaining_quantity', 0)
      .order('entry_date');
    
    if (entriesError) throw entriesError;
    
    if (!entries || entries.length === 0) {
      toast.error('No stock entries found to fulfill this output');
      return null;
    }
    
    let remainingToFulfill = quantity;
    let totalCost = 0;
    const outputLines = [];
    const updatedEntries = [];
    
    for (const entry of entries) {
      if (remainingToFulfill <= 0) break;
      
      const quantityFromThisEntry = Math.min(remainingToFulfill, entry.remaining_quantity);
      remainingToFulfill -= quantityFromThisEntry;
      
      const lineCost = quantityFromThisEntry * entry.unit_price;
      totalCost += lineCost;
      
      // Create an output line
      outputLines.push({
        stock_output_id: data.id,
        stock_entry_id: entry.id,
        quantity: quantityFromThisEntry,
        unit_price: entry.unit_price
      });
      
      // Update the remaining quantity in the entry
      updatedEntries.push({
        id: entry.id,
        remaining_quantity: entry.remaining_quantity - quantityFromThisEntry
      });
    }
    
    // If we couldn't fulfill the entire quantity
    if (remainingToFulfill > 0) {
      toast.error(`Could only fulfill ${quantity - remainingToFulfill} out of ${quantity} units`);
      // TODO: Should we cancel the operation here?
    }
    
    // Update the total cost in the output
    const { error: updateError } = await supabase
      .from('stock_outputs')
      .update({ total_cost: totalCost })
      .eq('id', data.id);
    
    if (updateError) throw updateError;
    
    // Insert output lines
    if (outputLines.length > 0) {
      const { error: linesError } = await supabase
        .from('stock_output_lines')
        .insert(outputLines);
      
      if (linesError) throw linesError;
    }
    
    // Update stock entries
    for (const entry of updatedEntries) {
      const { error: entryError } = await supabase
        .from('stock_entries')
        .update({ remaining_quantity: entry.remaining_quantity })
        .eq('id', entry.id);
      
      if (entryError) throw entryError;
    }
    
    // Update product's current_stock
    const { error: stockError } = await supabase
      .from('products')
      .update({ 
        current_stock: product.current_stock - quantity,
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);
    
    if (stockError) throw stockError;
    
    toast.success(`Successfully withdrew ${quantity} units from inventory`);
    return data;
  } catch (error) {
    console.error('Error creating stock output:', error);
    toast.error('Failed to create stock output');
    return null;
  }
}

export async function deleteStockOutput(id: string): Promise<boolean> {
  try {
    // First check if there are any stock_output_lines for this output
    const { data: lines, error: linesError } = await supabase
      .from('stock_output_lines')
      .select('id')
      .eq('stock_output_id', id);
    
    if (linesError) throw linesError;
    
    // Begin a transaction to delete both the output and its lines
    if (lines && lines.length > 0) {
      // Delete the lines first
      const { error: deleteLineError } = await supabase
        .from('stock_output_lines')
        .delete()
        .eq('stock_output_id', id);
      
      if (deleteLineError) throw deleteLineError;
    }
    
    // Now delete the output
    const { error } = await supabase
      .from('stock_outputs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting stock output:', error);
    toast.error('Failed to delete stock output');
    return false;
  }
}
