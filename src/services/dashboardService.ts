
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExpiringProduct {
  id: string;
  name: string;
  sku: string;
  expiry_date: string;
  quantity: number;
  days_until_expiry: number;
}

export async function getExpiringProducts(daysThreshold = 30): Promise<ExpiringProduct[]> {
  try {
    // Get the date 30 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);
    
    // Format dates for the query
    const today = new Date().toISOString().split('T')[0];
    const futureDateString = futureDate.toISOString().split('T')[0];
    
    // First check if there are any expirable products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('is_expirable', true);
    
    if (productsError) throw productsError;
    
    if (!products || products.length === 0) return [];
    
    // Query for stock entries with expiry dates in the next X days
    const { data, error } = await supabase
      .from('stock_entries')
      .select(`
        id,
        product_id,
        remaining_quantity,
        expiry_date,
        products(id, name, sku)
      `)
      .gt('remaining_quantity', 0)
      .not('expiry_date', 'is', null)
      .gte('expiry_date', today)
      .lte('expiry_date', futureDateString)
      .order('expiry_date');
    
    if (error) {
      console.error("Error in query:", error);
      throw error;
    }
    
    if (!data || data.length === 0) return [];
    
    // Process the results to format them correctly
    const expiringProducts: Record<string, ExpiringProduct> = {};
    
    data.forEach((entry) => {
      const product = entry.products as any;
      const expiryDate = new Date(entry.expiry_date);
      const today = new Date();
      
      // Calculate days until expiry
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (!expiringProducts[product.id]) {
        expiringProducts[product.id] = {
          id: product.id,
          name: product.name,
          sku: product.sku,
          expiry_date: entry.expiry_date,
          quantity: entry.remaining_quantity,
          days_until_expiry: daysUntilExpiry
        };
      } else {
        // If we already have this product, update the quantity
        expiringProducts[product.id].quantity += entry.remaining_quantity;
        
        // If this entry expires sooner, update the expiry date
        if (new Date(entry.expiry_date) < new Date(expiringProducts[product.id].expiry_date)) {
          expiringProducts[product.id].expiry_date = entry.expiry_date;
          expiringProducts[product.id].days_until_expiry = daysUntilExpiry;
        }
      }
    });
    
    return Object.values(expiringProducts).sort((a, b) => a.days_until_expiry - b.days_until_expiry);
  } catch (error) {
    console.error('Error fetching expiring products:', error);
    toast.error('Failed to load expiring products');
    return [];
  }
}
