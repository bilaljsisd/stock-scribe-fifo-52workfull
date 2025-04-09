
import { supabase } from "@/integrations/supabase/client";
import { StockEntry } from "@/types/supabase";
import { toast } from "sonner";

export async function getStockEntriesForProduct(productId: string): Promise<StockEntry[]> {
  try {
    const { data, error } = await supabase
      .from('stock_entries')
      .select('*')
      .eq('product_id', productId)
      .order('entry_date', { ascending: false });
    
    if (error) throw error;
    
    console.info("Stock Entries:", data);
    return data || [];
  } catch (error) {
    console.error('Error fetching stock entries:', error);
    return [];
  }
}

export async function addStockEntry(entry: Omit<StockEntry, 'id' | 'created_at'>): Promise<StockEntry | null> {
  try {
    const { data, error } = await supabase
      .from('stock_entries')
      .insert(entry)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error adding stock entry:', error);
    toast.error('Failed to add stock entry');
    return null;
  }
}

export async function updateStockEntry(
  entry: Pick<StockEntry, 'id'> & Partial<Omit<StockEntry, 'id' | 'created_at' | 'product_id' | 'remaining_quantity'>>
): Promise<StockEntry | null> {
  try {
    const { data, error } = await supabase
      .from('stock_entries')
      .update(entry)
      .eq('id', entry.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating stock entry:', error);
    throw error;
  }
}

export async function deleteStockEntry(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stock_entries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting stock entry:', error);
    throw error;
  }
}
