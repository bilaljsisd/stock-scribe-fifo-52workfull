
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, Printer, ChevronDown, ChevronRight, Loader2, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getAllTransactions, getTransactionFifoDetails } from "@/services/transactionService";
import { getProducts } from "@/services/productService";
import { Product, Transaction } from "@/types/supabase";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const ReportsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [expandedRows, setExpandedRows] = useState<{[key: string]: boolean}>({});
  const [expandedRowDetails, setExpandedRowDetails] = useState<{[key: string]: any[]}>({});
  const [loadingDetails, setLoadingDetails] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [productsData, transactionsData] = await Promise.all([
        getProducts(),
        getAllTransactions()
      ]);
      
      setProducts(productsData);
      setTransactions(transactionsData);
      setLoading(false);
    }
    
    loadData();
  }, []);
  
  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by product
    if (productFilter !== "all" && transaction.product_id !== productFilter) {
      return false;
    }
    
    // Filter by type
    if (typeFilter !== "all" && transaction.type !== typeFilter) {
      return false;
    }
    
    // Filter by date range
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      const transactionDate = new Date(transaction.date);
      if (transactionDate < fromDate) {
        return false;
      }
    }
    
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      const transactionDate = new Date(transaction.date);
      if (transactionDate > toDate) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
  
  // Calculate totals
  const entriesCount = filteredTransactions.filter(t => t.type === 'entry').length;
  const outputsCount = filteredTransactions.filter(t => t.type === 'output').length;
  
  // Toggle expanded row and fetch FIFO details if needed
  const toggleExpandRow = async (transaction: Transaction) => {
    // Only stock withdrawals (outputs) can be expanded
    if (transaction.type !== 'output') return;
    
    const transactionId = transaction.id;
    const isCurrentlyExpanded = expandedRows[transactionId] || false;
    
    // Update expanded state
    setExpandedRows(prev => ({
      ...prev,
      [transactionId]: !isCurrentlyExpanded
    }));
    
    // If expanding and we don't have details yet, fetch them
    if (!isCurrentlyExpanded && !expandedRowDetails[transactionId]) {
      setLoadingDetails(prev => ({ ...prev, [transactionId]: true }));
      
      try {
        const details = await getTransactionFifoDetails(transactionId);
        setExpandedRowDetails(prev => ({
          ...prev,
          [transactionId]: details
        }));
      } catch (error) {
        console.error('Error loading FIFO details:', error);
      } finally {
        setLoadingDetails(prev => ({ ...prev, [transactionId]: false }));
      }
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setProductFilter("all");
    setTypeFilter("all");
    setDateRange(undefined);
  };
  
  // Print report
  const printReport = (includeDetails = false) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print reports');
      return;
    }
    
    // Create printable content
    let printContent = `
      <html>
      <head>
        <title>Inventory Transactions Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .summary { display: flex; margin-bottom: 20px; }
          .summary-card { border: 1px solid #ddd; padding: 15px; margin-right: 15px; border-radius: 5px; width: 200px; }
          .summary-title { font-size: 14px; color: #666; margin-bottom: 5px; }
          .summary-value { font-size: 20px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; }
          .filters { margin-bottom: 20px; }
          .type-entry { color: green; }
          .type-output { color: orangered; }
          .fifo-details { margin-left: 20px; margin-bottom: 15px; }
          .fifo-details-table { margin-left: 20px; width: 95%; font-size: 0.9em; }
          .fifo-details-header { font-weight: bold; margin-left: 20px; margin-top: 5px; color: #666; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Inventory Transactions Report ${includeDetails ? '(Advanced)' : ''}</h1>
        
        <div class="filters">
          <p><strong>Filters:</strong> 
            Product: ${productFilter === 'all' ? 'All Products' : products.find(p => p.id === productFilter)?.name || productFilter}, 
            Type: ${typeFilter === 'all' ? 'All Types' : typeFilter === 'entry' ? 'Stock Entries' : 'Stock Withdrawals'},
            Date Range: ${dateRange?.from ? formatDate(dateRange.from) : 'All time'} ${dateRange?.to ? `to ${formatDate(dateRange.to)}` : ''}
          </p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <div class="summary-title">Total Transactions</div>
            <div class="summary-value">${filteredTransactions.length}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">Stock Entries</div>
            <div class="summary-value">${entriesCount}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">Stock Withdrawals</div>
            <div class="summary-value">${outputsCount}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total Value</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add transaction rows with FIFO details if requested
    for (const transaction of filteredTransactions) {
      const product = products.find(p => p.id === transaction.product_id);
      
      // Get price and total based on transaction type
      let unitPrice = 0;
      let totalPrice = 0;
      
      if (transaction.type === 'entry') {
        unitPrice = transaction.unit_price || 0;
        totalPrice = unitPrice * transaction.quantity;
      } else if (transaction.type === 'output') {
        totalPrice = transaction.total_cost || 0;
        unitPrice = transaction.quantity > 0 ? totalPrice / transaction.quantity : 0;
      }
      
      printContent += `
        <tr>
          <td>${formatDate(new Date(transaction.date))}</td>
          <td class="type-${transaction.type}">${transaction.type === 'entry' ? 'Stock Entry' : 'Stock Withdrawal'}</td>
          <td>${product?.name || 'Unknown Product'} ${product.units}</td>
          <td>${transaction.quantity}</td>
          <td>${formatCurrency(unitPrice)} {product.units}</td>
          <td>${formatCurrency(totalPrice)}</td>
          <td>${transaction.notes || '-'}</td>
        </tr>
      `;
      
      // Add FIFO allocation details for outputs if advanced printing is selected
      if (includeDetails && transaction.type === 'output') {
        const details = expandedRowDetails[transaction.id];
        
        // If details are already loaded, include them
        if (details && details.length > 0) {
          printContent += `
            <tr>
              <td colspan="7">
                <div class="fifo-details-header">FIFO Allocation Details:</div>
                <table class="fifo-details-table">
                  <thead>
                    <tr>
                      <th>Entry Date</th>
                      <th>Notes</th>
                      <th>Quantity</th>
                      <th>Unit Cost</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
          `;
          
          for (const line of details) {
            printContent += `
              <tr>
                <td>${line.stock_entry ? formatDate(new Date(line.stock_entry.entry_date)) : "-"}</td>
                <td>${line.stock_entry && line.stock_entry.notes ? line.stock_entry.notes : "-"}</td>
                <td>${line.quantity}</td>
                <td>${formatCurrency(line.unit_price)}</td>
                <td>${formatCurrency(line.quantity * line.unit_price)}</td>
              </tr>
            `;
          }
          
          printContent += `
                  </tbody>
                </table>
              </td>
            </tr>
          `;
        }
      }
    }
    
    printContent += `
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center;">
          <p>Report generated on ${formatDate(new Date())}</p>
          <button onclick="window.print();" style="padding: 10px 20px; background: #4F46E5; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = function() {
      printWindow.focus();
      // Automatically trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };
  
  // Preload all FIFO details for advanced printing (fixing the async issue)
  const prepareAdvancedPrinting = () => {
    const outputTransactions = filteredTransactions.filter(t => t.type === 'output');
    
    const loadAllDetails = async () => {
      // For each output transaction, ensure we have FIFO details
      for (const transaction of outputTransactions) {
        // Only fetch if we don't already have details
        if (!expandedRowDetails[transaction.id]) {
          setLoadingDetails(prev => ({ ...prev, [transaction.id]: true }));
          
          try {
            const details = await getTransactionFifoDetails(transaction.id);
            setExpandedRowDetails(prev => ({
              ...prev,
              [transaction.id]: details
            }));
          } catch (error) {
            console.error('Error loading FIFO details:', error);
          } finally {
            setLoadingDetails(prev => ({ ...prev, [transaction.id]: false }));
          }
        }
      }
      
      // Once all details are loaded, print the report
      printReport(true);
    };
    
    // Call the async function
    loadAllDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-6">
          <div className="flex justify-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Transaction Reports</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => printReport(false)}>
                  <Printer className="h-4 w-4 mr-2" />
                  <span>Standard Print</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => prepareAdvancedPrinting()}>
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Advanced Print (with FIFO Details)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Transactions
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredTransactions.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Stock Entries
                </CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{entriesCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Stock Withdrawals
                </CardTitle>
                <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{outputsCount}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                A complete history of all inventory movements using FIFO method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Product</label>
                    <Select value={productFilter} onValueChange={setProductFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Transaction Type</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="entry">Stock Entries</SelectItem>
                        <SelectItem value="output">Stock Withdrawals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date Range</label>
                    <DateRangePicker 
                      value={dateRange}
                      onChange={setDateRange}
                    />
                  </div>
                </div>
                
                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => printReport()}
                    className="md:hidden flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
              
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-12 w-12 text-gray-300 mb-4"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  <h3 className="text-lg font-medium">No transactions found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try changing your filters or add some inventory transactions
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => {
                        const product = products.find(p => p.id === transaction.product_id);
                        
                        // Calculate price information based on transaction type
                        let unitPrice = 0;
                        let totalPrice = 0;
                        
                        if (transaction.type === 'entry') {
                          unitPrice = transaction.unit_price || 0;
                          totalPrice = unitPrice * transaction.quantity;
                        } else if (transaction.type === 'output') {
                          totalPrice = transaction.total_cost || 0;
                          unitPrice = transaction.quantity > 0 ? totalPrice / transaction.quantity : 0;
                        }
                        
                        const isExpanded = expandedRows[transaction.id] || false;
                        const canExpand = transaction.type === 'output';
                        const details = expandedRowDetails[transaction.id] || [];
                        const isLoadingDetails = loadingDetails[transaction.id] || false;
                        
                        return (
                          <>
                            <TableRow 
                              key={transaction.id}
                              className={canExpand ? "cursor-pointer hover:bg-muted/80" : ""}
                              onClick={canExpand ? () => toggleExpandRow(transaction) : undefined}
                            >
                              <TableCell className="w-[40px]">
                                {canExpand && (
                                  isExpanded ? 
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell>{formatDate(new Date(transaction.date))}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className={`rounded-full p-1 mr-2 ${
                                    transaction.type === 'entry' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {transaction.type === 'entry' ? (
                                      <ArrowUpRight className="h-3 w-3" />
                                    ) : (
                                      <ArrowDownRight className="h-3 w-3" />
                                    )}
                                  </div>
                                  {transaction.type === 'entry' ? 'Stock Entry' : 'Stock Withdrawal'}
                                </div>
                              </TableCell>
                              <TableCell>{product?.name || 'Unknown Product'} {product.units}</TableCell>
                              <TableCell>{transaction.quantity}</TableCell>
                              <TableCell>{formatCurrency(unitPrice)}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(totalPrice)}</TableCell>
                              <TableCell>{transaction.notes || '-'}</TableCell>
                            </TableRow>
                            
                            {/* FIFO Allocation Details for Expanded Output Rows */}
                            {isExpanded && (
                              <TableRow className="bg-muted/20 border-0">
                                <TableCell colSpan={8} className="p-0">
                                  <div className="py-2 px-4">
                                    <div className="text-sm font-medium text-muted-foreground mb-2">FIFO Allocation Details</div>
                                    
                                    {isLoadingDetails ? (
                                      <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                                        <span className="text-sm text-muted-foreground">Loading details...</span>
                                      </div>
                                    ) : details.length === 0 ? (
                                      <div className="text-sm text-muted-foreground italic py-2">No detailed records found</div>
                                    ) : (
                                      <div className="rounded-md border bg-background">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="py-2">Entry Date</TableHead>
                                              <TableHead className="py-2">Notes</TableHead>
                                              <TableHead className="py-2">Quantity</TableHead>
                                              <TableHead className="py-2">Unit Cost</TableHead>
                                              <TableHead className="py-2">Subtotal</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {details.map((line) => (
                                              <TableRow key={line.id} className="border-0 hover:bg-transparent">
                                                <TableCell className="py-1.5">
                                                  {line.stock_entry ? formatDate(new Date(line.stock_entry.entry_date)) : "-"}
                                                </TableCell>
                                                <TableCell className="py-1.5 text-muted-foreground">
                                                  {line.stock_entry && line.stock_entry.notes ? line.stock_entry.notes : "-"}
                                                </TableCell>
                                                <TableCell className="py-1.5">{line.quantity}</TableCell>
                                                <TableCell className="py-1.5">{formatCurrency(line.unit_price)}</TableCell>
                                                <TableCell className="py-1.5">{formatCurrency(line.quantity * line.unit_price)}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
