
import { v4 as uuidv4 } from 'uuid';
import { Product } from '@/types/models';
import { getStoredData, saveStoredData, getStoredItemById, STORAGE_KEYS } from '@/lib/localStorageUtils';
import { toast } from 'sonner';

export async function getProducts(): Promise<Product[]> {
  return getStoredData<Product>(STORAGE_KEYS.PRODUCTS);
}

export async function getProductById(id: string): Promise<Product | null> {
  return getStoredItemById<Product>(STORAGE_KEYS.PRODUCTS, id);
}

export async function createProduct(productData: Omit<Product, 'id' | 'current_stock' | 'average_cost' | 'created_at' | 'updated_at'>): Promise<Product> {
  // Check for duplicate SKU
  const products = await getProducts();
  if (products.some(p => p.sku === productData.sku)) {
    toast.error(`A product with SKU ${productData.sku} already exists`);
    throw new Error(`A product with SKU ${productData.sku} already exists`);
  }

  const now = new Date().toISOString();
  const newProduct: Product = {
    id: uuidv4(),
    ...productData,
    current_stock: 0,
    average_cost: 0,
    created_at: now,
    updated_at: now
  };

  const updatedProducts = [...products, newProduct];
  saveStoredData(STORAGE_KEYS.PRODUCTS, updatedProducts);
  toast.success('Product created successfully');
  return newProduct;
}

export async function updateProduct(productData: Pick<Product, 'id'> & Partial<Omit<Product, 'id' | 'current_stock' | 'average_cost' | 'created_at' | 'updated_at'>>): Promise<Product> {
  const products = await getProducts();
  const existingProductIndex = products.findIndex(p => p.id === productData.id);
  
  if (existingProductIndex === -1) {
    toast.error('Product not found');
    throw new Error('Product not found');
  }
  
  // Check for duplicate SKU (that isn't this product)
  if (productData.sku) {
    const duplicateSku = products.some(p => p.sku === productData.sku && p.id !== productData.id);
    if (duplicateSku) {
      toast.error(`Another product with SKU ${productData.sku} already exists`);
      throw new Error(`Another product with SKU ${productData.sku} already exists`);
    }
  }

  const existingProduct = products[existingProductIndex];
  const updatedProduct: Product = {
    ...existingProduct,
    ...productData,
    updated_at: new Date().toISOString()
  };

  products[existingProductIndex] = updatedProduct;
  saveStoredData(STORAGE_KEYS.PRODUCTS, products);
  toast.success('Product updated successfully');
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getProducts();
  const stockEntries = getStoredData(STORAGE_KEYS.STOCK_ENTRIES);
  const stockOutputs = getStoredData(STORAGE_KEYS.STOCK_OUTPUTS);
  
  // Check if the product has any stock entries or outputs
  const hasEntries = stockEntries.some((entry: any) => entry.product_id === id);
  const hasOutputs = stockOutputs.some((output: any) => output.product_id === id);
  
  if (hasEntries || hasOutputs) {
    toast.error('Cannot delete a product with inventory history');
    throw new Error('Cannot delete a product with inventory history');
  }
  
  const updatedProducts = products.filter(p => p.id !== id);
  saveStoredData(STORAGE_KEYS.PRODUCTS, updatedProducts);
  toast.success('Product deleted successfully');
}

// Update product stock and average cost
export async function updateProductStockAndCost(productId: string): Promise<void> {
  const products = await getProducts();
  const stockEntries = getStoredData<any>(STORAGE_KEYS.STOCK_ENTRIES);
  
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) return;
  
  const relevantEntries = stockEntries.filter(entry => entry.product_id === productId);
  
  // Calculate current stock and total value
  let currentStock = 0;
  let totalValue = 0;
  
  for (const entry of relevantEntries) {
    if (entry.remaining_quantity > 0) {
      currentStock += entry.remaining_quantity;
      totalValue += entry.remaining_quantity * entry.unit_price;
    }
  }
  
  // Update the product
  const product = products[productIndex];
  const updatedProduct: Product = {
    ...product,
    current_stock: currentStock,
    average_cost: currentStock > 0 ? totalValue / currentStock : 0,
    updated_at: new Date().toISOString()
  };
  
  products[productIndex] = updatedProduct;
  saveStoredData(STORAGE_KEYS.PRODUCTS, products);
}
