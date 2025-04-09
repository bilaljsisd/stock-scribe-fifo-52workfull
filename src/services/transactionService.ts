
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/supabase";
import { toast } from "sonner";

export async function getTransactionsForProduct(productId: string): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('product_id', productId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    // Cast the type to ensure it matches the expected Transaction type
    return (data as Transaction[]) || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    toast.error('Failed to load transactions');
    return [];
  }
}

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    // Cast the type to ensure it matches the expected Transaction type
    return (data as Transaction[]) || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    toast.error('Failed to load transactions');
    return [];
  }
}
