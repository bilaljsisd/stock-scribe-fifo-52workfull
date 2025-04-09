
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
    
    // Ensure expiry_date is present in the data
    const stockEntries = data?.map(entry => ({
      ...entry,
      expiry_date: entry.expiry_date || null
    })) || [];
    
    return stockEntries as StockEntry[];
  } catch (error) {
    console.error('Error fetching stock entries:', error);
    toast.error('Failed to load stock entries');
    return [];
  }
}

export async function addStockEntry(stockEntry: Omit<StockEntry, 'id' | 'created_at' | 'remaining_quantity'>): Promise<StockEntry | null> {
  try {
    const entry = {
      ...stockEntry,
      remaining_quantity: stockEntry.quantity,
    };
    
    const { data, error } = await supabase
      .from('stock_entries')
      .insert(entry)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update product's current_stock and average_cost
    const { error: updateError } = await supabase
      .rpc('update_product_stock_and_cost', {
        product_id: stockEntry.product_id
      });
    
    if (updateError) throw updateError;
    
    // Ensure expiry_date is present
    const fullData = {
      ...data,
      expiry_date: data.expiry_date || null
    };
    
    toast.success(`Added ${stockEntry.quantity} units to inventory`);
    return fullData as StockEntry;
  } catch (error) {
    console.error('Error adding stock entry:', error);
    toast.error('Failed to add stock entry');
    return null;
  }
}
