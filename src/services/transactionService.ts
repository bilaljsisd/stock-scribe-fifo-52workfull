
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/supabase";

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    // Get stock entries as transactions
    const { data: entriesData, error: entriesError } = await supabase
      .from('stock_entries')
      .select('id, product_id, quantity, unit_price, entry_date as date, notes, created_at')
      .order('entry_date', { ascending: false });
    
    if (entriesError) throw entriesError;
    
    // Transform entries to common transaction format
    const entryTransactions: Transaction[] = (entriesData || []).map(entry => ({
      id: entry.id,
      type: 'entry',
      product_id: entry.product_id,
      quantity: entry.quantity,
      date: entry.date,
      notes: entry.notes,
      created_at: entry.created_at,
      unit_price: entry.unit_price,
    }));
    
    // Get stock outputs as transactions
    const { data: outputsData, error: outputsError } = await supabase
      .from('stock_outputs')
      .select('id, product_id, total_quantity, total_cost, output_date as date, notes, created_at, reference_number')
      .order('output_date', { ascending: false });
    
    if (outputsError) throw outputsError;
    
    // Transform outputs to common transaction format
    const outputTransactions: Transaction[] = (outputsData || []).map(output => ({
      id: output.id,
      type: 'output',
      product_id: output.product_id,
      quantity: output.total_quantity,
      date: output.date,
      notes: output.notes,
      created_at: output.created_at,
      total_cost: output.total_cost,
      reference_number: output.reference_number,
    }));
    
    // Combine and sort by date (newest first)
    const allTransactions = [...entryTransactions, ...outputTransactions];
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    return allTransactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}
