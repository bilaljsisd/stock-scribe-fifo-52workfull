
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/supabase";
import { toast } from "sonner";

export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Product[] || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    toast.error('Failed to load products');
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Product;
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    toast.error('Failed to load product details');
    return null;
  }
}

export async function createProduct(product: Omit<Product, 'id' | 'current_stock' | 'average_cost' | 'created_at' | 'updated_at'>): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        sku: product.sku,
        description: product.description || null,
        current_stock: 0,
        average_cost: 0,
        is_expirable: product.is_expirable || false
      })
      .select()
      .single();
    
    if (error) throw error;
    toast.success(`Product ${product.name} added`);
    return data as Product;
  } catch (error) {
    console.error('Error creating product:', error);
    toast.error('Failed to create product');
    return null;
  }
}

export async function updateProduct(product: Partial<Product> & { id: string }): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: product.name,
        sku: product.sku,
        description: product.description,
        is_expirable: product.is_expirable,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id)
      .select()
      .single();
    
    if (error) throw error;
    toast.success(`Product ${product.name} updated`);
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    toast.error('Failed to update product');
    return null;
  }
}

export async function deleteProduct(id: string, name: string): Promise<boolean> {
  try {
    // Check if there are any transactions for this product
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);
    
    if (countError) throw countError;
    
    if (count && count > 0) {
      toast.error("Cannot delete product with transaction history");
      return false;
    }
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    toast.success(`Product ${name} deleted`);
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    toast.error('Failed to delete product');
    return false;
  }
}
