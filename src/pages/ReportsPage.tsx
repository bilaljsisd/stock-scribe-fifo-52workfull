import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllTransactions, getTransactionFifoDetails } from '@/services/transactionService';
import { getProducts } from '@/services/productService';

const ReportsPage = () => {
  // Fetch all transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['allTransactions'],
    queryFn: getAllTransactions
  });

  // Fetch all products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  });

  return (
    <div className="container py-6">
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                A comprehensive list of all stock-related transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div>Loading transactions...</div>
              ) : (
                <ul>
                  {transactions && transactions.map((transaction) => (
                    <li key={transaction.id} className="py-2 border-b last:border-b-0">
                      <strong>{transaction.type === 'entry' ? 'Stock In' : 'Stock Out'}</strong> -{' '}
                      Product ID: {transaction.product_id}, Quantity: {transaction.quantity}, Date:{' '}
                      {new Date(transaction.date).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory Levels</CardTitle>
              <CardDescription>
                Overview of the current stock levels for each product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div>Loading products...</div>
              ) : (
                <ul>
                  {products && products.map((product) => (
                    <li key={product.id} className="py-2 border-b last:border-b-0">
                      <strong>{product.name}</strong> - Current Stock: {product.current_stock} {product.units}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
