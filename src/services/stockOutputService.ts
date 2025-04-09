
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
    // This function would call a Supabase function or RPC that handles the FIFO logic
    // For now we use update_product_stock_and_cost as placeholder since create_stock_output doesn't exist
    const { data: functionData, error: functionError } = await supabase.rpc('update_product_stock_and_cost', {
      product_id: productId
    });
    
    if (functionError) throw functionError;
    
    // Insert the stock output record
    const { data, error } = await supabase
      .from('stock_outputs')
      .insert({
        product_id: productId,
        total_quantity: quantity,
        total_cost: 0, // Will be calculated based on FIFO allocation
        output_date: outputDate,
        reference_number: referenceNumber || null,
        notes: notes || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update stock and cost after creating the output
    await supabase.rpc('update_product_stock_and_cost', {
      product_id: productId
    });
    
    if (data) {
      toast.success(`${quantity} units withdrawn successfully`);
      return data;
    }
    
    return null;
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
    // Get the product_id before deleting
    const { data: outputData } = await supabase
      .from('stock_outputs')
      .select('product_id')
      .eq('id', id)
      .single();
    
    if (!outputData) throw new Error('Stock output not found');
    
    // Delete the stock output
    const { error } = await supabase
      .from('stock_outputs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Update product stock and cost after deletion
    await supabase.rpc('update_product_stock_and_cost', {
      product_id: outputData.product_id
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting stock output:', error);
    throw error;
  }
}
