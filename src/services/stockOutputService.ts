
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
    const { data, error } = await supabase.rpc('create_stock_output', {
      p_product_id: productId,
      p_quantity: quantity,
      p_output_date: outputDate,
      p_reference_number: referenceNumber || null,
      p_notes: notes || null
    });
    
    if (error) throw error;
    
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
    // This would ideally call a Supabase function that handles reverting the FIFO allocation
    const { error } = await supabase.rpc('delete_stock_output', {
      p_output_id: id
    });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting stock output:', error);
    throw error;
  }
}
