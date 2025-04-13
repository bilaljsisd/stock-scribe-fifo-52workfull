
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllTransactions, getTransactionFifoDetails } from '@/services/transactionService';
import { getProducts } from '@/services/productService';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Product, Transaction } from '@/types/models';

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

  // Get product name by ID helper function
  const getProductName = (productId: string): string => {
    const product = products?.find((p: Product) => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Type</th>
                        <th className="py-2 px-4 text-left">Product</th>
                        <th className="py-2 px-4 text-left">Quantity</th>
                        <th className="py-2 px-4 text-left">Date</th>
                        <th className="py-2 px-4 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions && transactions.map((transaction: Transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              transaction.type === 'entry' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type === 'entry' ? 'Stock In' : 'Stock Out'}
                            </span>
                          </td>
                          <td className="py-2 px-4">{getProductName(transaction.product_id)}</td>
                          <td className="py-2 px-4">{transaction.quantity}</td>
                          <td className="py-2 px-4">{formatDate(new Date(transaction.date))}</td>
                          <td className="py-2 px-4">{transaction.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Product</th>
                        <th className="py-2 px-4 text-left">SKU</th>
                        <th className="py-2 px-4 text-left">Current Stock</th>
                        <th className="py-2 px-4 text-left">Average Cost</th>
                        <th className="py-2 px-4 text-left">Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products && products.map((product: Product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{product.name}</td>
                          <td className="py-2 px-4">{product.sku}</td>
                          <td className="py-2 px-4">{product.current_stock} {product.units}</td>
                          <td className="py-2 px-4">{formatCurrency(product.average_cost)}</td>
                          <td className="py-2 px-4">{formatCurrency(product.average_cost * product.current_stock)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
