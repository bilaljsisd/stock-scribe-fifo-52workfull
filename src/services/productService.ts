
import { Product } from "@/types/inventory";
import { toast } from "sonner";
import { 
  getProducts as wailsGetProducts,
  getProductById as wailsGetProductById,
  createProduct as wailsCreateProduct,
  updateProduct as wailsUpdateProduct,
  deleteProduct as wailsDeleteProduct
} from "./wailsService";

export async function getProducts(): Promise<Product[]> {
  try {
    return await wailsGetProducts();
  } catch (error) {
    console.error('Error fetching products:', error);
    toast.error('Failed to load products');
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    return await wailsGetProductById(id);
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    toast.error('Failed to load product details');
    return null;
  }
}

export async function createProduct(product: Omit<Product, 'id' | 'currentStock' | 'averageCost' | 'createdAt' | 'updatedAt'>): Promise<Product | null> {
  try {
    const data = await wailsCreateProduct(product);
    
    if (data) {
      toast.success(`Product ${product.name} added`);
    }
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    toast.error('Failed to create product');
    return null;
  }
}

export async function updateProduct(product: Partial<Product> & { id: string }): Promise<Product | null> {
  try {
    const data = await wailsUpdateProduct(product);
    
    if (data) {
      toast.success(`Product ${product.name} updated`);
    }
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    toast.error('Failed to update product');
    return null;
  }
}

export async function deleteProduct(id: string, name: string): Promise<boolean> {
  try {
    const success = await wailsDeleteProduct(id, name);
    
    if (success) {
      toast.success(`Product ${name} deleted`);
    }
    return success;
  } catch (error) {
    console.error('Error deleting product:', error);
    toast.error('Failed to delete product');
    return false;
  }
}
