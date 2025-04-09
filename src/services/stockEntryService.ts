
import { supabase } from "@/integrations/supabase/client";
import { StockEntry } from "@/types/supabase";
import { toast } from "sonner";

export async function getStockEntriesForProduct(productId: string): Promise<StockEntry[]> {
  try {
    console.info("Fetching stock entries for product:", productId);
    
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
    toast.error('Failed to load stock entries');
    return [];
  }
}

export async function addStockEntry(entry: Omit<StockEntry, 'id' | 'created_at' | 'remaining_quantity'>): Promise<StockEntry | null> {
  try {
    // Make sure to set remaining_quantity equal to quantity for new entries
    const entryWithRemaining = {
      ...entry,
      remaining_quantity: entry.quantity
    };
    
    const { data, error } = await supabase
      .from('stock_entries')
      .insert(entryWithRemaining)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update product's current_stock and average_cost
    await updateProductStockInfo(entry.product_id);
    
    toast.success(`Added ${entry.quantity} units to inventory`);
    return data;
  } catch (error) {
    console.error('Error adding stock entry:', error);
    toast.error('Failed to add stock entry');
    return null;
  }
}

export async function updateProductStockInfo(productId: string): Promise<void> {
  try {
    // Get all stock entries for this product
    const { data: entries, error: entriesError } = await supabase
      .from('stock_entries')
      .select('*')
      .eq('product_id', productId);
    
    if (entriesError) throw entriesError;
    
    if (!entries) return;
    
    // Calculate current stock and average cost
    let totalStock = 0;
    let totalValue = 0;
    
    for (const entry of entries) {
      totalStock += entry.remaining_quantity;
      totalValue += entry.remaining_quantity * entry.unit_price;
    }
    
    const averageCost = totalStock > 0 ? totalValue / totalStock : 0;
    
    // Update the product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        current_stock: totalStock,
        average_cost: averageCost,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);
    
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating product stock info:', error);
    // Don't show toast here, as this is a background operation
  }
}
