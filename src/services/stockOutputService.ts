
import { supabase } from "@/integrations/supabase/client";
import { StockOutput } from "@/types/supabase";
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

export async function createStockOutput(stockOutput: Omit<StockOutput, 'id' | 'created_at'>): Promise<StockOutput | null> {
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
