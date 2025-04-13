
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockEntryList } from '@/components/inventory/StockEntryList';
import { StockOutputList } from '@/components/inventory/StockOutputList';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import { getProductById, deleteProduct } from '@/services/productService';
import { getStockEntriesForProduct } from '@/services/stockEntryService';
import { getStockOutputsForProduct } from '@/services/stockOutputService';
import { getTransactionsForProduct } from '@/services/transactionService';
import { formatCurrency, formatNumber } from '@/lib/formatters';

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productId ? getProductById(productId) : null,
    enabled: !!productId
  });

  // Fetch stock entries
  const { data: stockEntries } = useQuery({
    queryKey: ['stockEntries', productId],
    queryFn: () => productId ? getStockEntriesForProduct(productId) : [],
    enabled: !!productId
  });

  // Fetch stock outputs
  const { data: stockOutputs } = useQuery({
    queryKey: ['stockOutputs', productId],
    queryFn: () => productId ? getStockOutputsForProduct(productId) : [],
    enabled: !!productId
  });

  // Fetch transactions
  const { data: transactions } = useQuery({
    queryKey: ['transactions', productId],
    queryFn: () => productId ? getTransactionsForProduct(productId) : [],
    enabled: !!productId
  });

  const handleDelete = async () => {
    if (!productId) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct(productId);
      toast.success('Product deleted successfully');
      navigate('/products');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete product');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full max-w-sm" />
            <Skeleton className="h-4 w-full max-w-xs" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Failed to load product</CardTitle>
            <CardDescription>
              The product you're looking for might not exist or an error occurred.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/products')}>Go to Products</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <div className="ml-auto flex space-x-2">
          <Button variant="ghost" onClick={() => navigate(`/products/${productId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the product and all related data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          <CardDescription>
            {product.description || 'No description provided.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium leading-none">SKU</p>
              <p>{product.sku}</p>
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Units</p>
              <p>{product.units || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Current Stock</p>
              <p>{formatNumber(product.current_stock)}</p>
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Average Cost</p>
              <p>{formatCurrency(product.average_cost)}</p>
            </div>
          </div>
          <Separator />
          <Tabs defaultValue="stock-entries" className="w-full">
            <TabsList>
              <TabsTrigger value="stock-entries">Stock Entries</TabsTrigger>
              <TabsTrigger value="stock-outputs">Stock Outputs</TabsTrigger>
            </TabsList>
            <TabsContent value="stock-entries" className="mt-4">
              <StockEntryList product={product} stockEntries={stockEntries || []} />
            </TabsContent>
            <TabsContent value="stock-outputs" className="mt-4">
              <StockOutputList product={product} stockOutputs={stockOutputs || []} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetailPage;
