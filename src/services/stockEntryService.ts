
import { supabase } from "@/integrations/supabase/client";
import { StockEntry, Transaction } from "@/types/supabase";
import { toast } from "sonner";

export async function getStockEntriesForProduct(productId: string): Promise<StockEntry[]> {
  try {
    const { data, error } = await supabase
      .from('stock_entries')
      .select('*')
      .eq('product_id', productId)
      .order('entry_date');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching stock entries:', error);
    toast.error('Failed to load stock entries');
    return [];
  }
}

export async function addStockEntry(entry: Omit<StockEntry, 'id' | 'created_at'>): Promise<StockEntry | null> {
  try {
    // Start a transaction
    const { data: stockEntry, error: stockEntryError } = await supabase
      .from('stock_entries')
      .insert({
        product_id: entry.product_id,
        quantity: entry.quantity,
        remaining_quantity: entry.quantity,
        unit_price: entry.unit_price,
        entry_date: entry.entry_date,
        notes: entry.notes
      })
      .select()
      .single();
    
    if (stockEntryError) throw stockEntryError;
    
    // Create a transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        type: 'entry',
        product_id: entry.product_id,
        quantity: entry.quantity,
        date: entry.entry_date,
        reference_id: stockEntry.id,
        notes: entry.notes
      });
    
    if (transactionError) throw transactionError;
    
    toast.success(`Added ${entry.quantity} units to inventory`);
    return stockEntry;
  } catch (error) {
    console.error('Error adding stock entry:', error);
    toast.error('Failed to add stock entry');
    return null;
  }
}
