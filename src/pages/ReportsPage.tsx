import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, Printer, ChevronDown, ChevronRight, Loader2, FileText, DollarSign } from "lucide-react";
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
  
  const filteredTransactions = transactions.filter((transaction) => {
    if (productFilter !== "all" && transaction.product_id !== productFilter) {
      return false;
    }
    
    if (typeFilter !== "all" && transaction.type !== typeFilter) {
      return false;
    }
    
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
  
  const entriesCount = filteredTransactions.filter(t => t.type === 'entry').length;
  const outputsCount = filteredTransactions.filter(t => t.type === 'output').length;
  
  const entriesTotal = filteredTransactions
    .filter(t => t.type === 'entry')
    .reduce((total, t) => {
      const unitPrice = t.unit_price || 0;
      return total + (unitPrice * t.quantity);
    }, 0);
    
  const outputsTotal = filteredTransactions
    .filter(t => t.type === 'output')
    .reduce((total, t) => {
      return total + (t.total_cost || 0);
    }, 0);
  
  const toggleExpandRow = async (transaction: Transaction) => {
    if (transaction.type !== 'output') return;
    
    const transactionId = transaction.id;
    const isCurrentlyExpanded = expandedRows[transactionId] || false;
    
    setExpandedRows(prev => ({
      ...prev,
      [transactionId]: !isCurrentlyExpanded
    }));
    
    if (!isCurrentlyExpanded && !expandedRowDetails[transactionId]) {
      setLoadingDetails(prev => ({ ...prev, [transactionId]: true }));
      
      try {
        const details = await getTransactionFifoDetails(transaction.reference_id);
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
  
  const clearFilters = () => {
    setProductFilter("all");
    setTypeFilter("all");
    setDateRange(undefined);
  };
  
  const printReport = (includeDetails = false) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print reports');
      return;
    }
    
    let printContent = `
      <html>
      <head>
        <title>Rapport sur les transactions d'inventaire <br/> تقرير معاملات المخزون</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333;   display: flex;   justify-content: center;   align-items: center;   text-align: center;   flex-direction: column;  }
          .summary { display: flex; margin-bottom: 20px; flex-wrap: wrap; }
          .summary-card { border: 1px solid #ddd; padding: 15px; margin-right: 15px; margin-bottom: 15px; border-radius: 5px; width: auto; }
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
        <h1>Rapport sur les transactions d'inventaire <br/> تقرير معاملات المخزون ${includeDetails ? '(Advanced)' : ''}</h1>
        
        <div class="filters">
          <p><strong>Filters:</strong> 
            Produit/المنتج: ${productFilter === 'all' ? 'tout les Produit' : products.find(p => p.id === productFilter)?.name || productFilter}, 
            Type/نوع: ${typeFilter === 'all' ? 'tout les Types' : typeFilter === 'entry' ? 'Stock Entries' : 'Stock Withdrawals'},
            Période de temps/الفترة الزمنية: ${dateRange?.from ? formatDate(dateRange.from) : 'tout le temps'} ${dateRange?.to ? `to ${formatDate(dateRange.to)}` : ''}
          </p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <div class="summary-title">Nombre total de transactions <br/> عدد المعاملات الإجمالي</div>
            <div class="summary-value">${filteredTransactions.length}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">Le nombre d'entrées de stock <br/> عدد إدخالات المخزون</div>
            <div class="summary-value">${entriesCount}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">Le nombre de retrée de stock <br/> عدد عمليات سحب المخزون</div>
            <div class="summary-value">${outputsCount}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">Coût total des entrées <br/> التكلفة الإجمالية للإدخالات</div>
            <div class="summary-value">${formatCurrency(entriesTotal)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">Coût total des retraits <br/> التكلفة الإجمالية للاخراج</div>
            <div class="summary-value">${formatCurrency(outputsTotal)}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date - يوم</th>
              <th>Type - نوع</th>
              <th>Produit - المنتج</th>
              <th>Quantité - الكمية</th>
              <th>Unité - الوحدة</th>
              <th>Prix unitaire - سعر الوحدة</th>
              <th>Valeur totale - سعر الكلي</th>
              <th>Pour - الملاحظات</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    for (const transaction of filteredTransactions) {
      const product = products.find(p => p.id === transaction.product_id);
      
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
          <td>${product?.name || 'Unknown Product'}</td>
          <td>${transaction.quantity}</td>
          <td>${product?.units || 'units'}</td>
          <td>${formatCurrency(unitPrice)}</td>
          <td>${formatCurrency(totalPrice)}</td>
          <td>${transaction.notes || '-'}</td>
        </tr>
      `;
      
      if (includeDetails && transaction.type === 'output') {
        const details = expandedRowDetails[transaction.id];
        
        if (details && details.length > 0) {
          printContent += `
            <tr>
              <td colspan="8">
                <div class="fifo-details-header">Détails de l'allocation - تفاصيل التخصيص:</div>
                <table class="fifo-details-table">
                  <thead>
                    <tr>
                      <th>Date d'entrée - تاريخ الإدخال</th>
                      <th>Pour - الملاحظات</th>
                      <th>Quantité - الكمية</th>
                      <th>Prix unitaire - سعر الوحدة</th>
                      <th>Sous-total - المجموع الفرعي</th>
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
          <p>${formatDate(new Date())} تقرير تم إنشاؤه في </p>
          <button onclick="window.print();" style="padding: 10px 20px; background: #4F46E5; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimer le rapport طباعة التقرير</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };
  
  const prepareAdvancedPrinting = () => {
    const outputTransactions = filteredTransactions.filter(t => t.type === 'output');
    
    const loadAllDetails = async () => {
      for (const transaction of outputTransactions) {
        if (!expandedRowDetails[transaction.id]) {
          setLoadingDetails(prev => ({ ...prev, [transaction.id]: true }));
          
          try {
            const details = await getTransactionFifoDetails(transaction.reference_id);
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
      
      printReport(true);
    };
    
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
                  Imprimer le rapport طباعة التقرير
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => printReport(false)}>
                  <Printer className="h-4 w-4 mr-2" />
                  <span>Impression standard طباعة عادية</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => prepareAdvancedPrinting()}>
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Impression détaillée (avec détails FIFO) طباعة مفصلة (مع تفاصيل FIFO)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                Nombre total de transactions <br/> عدد المعاملات الإجمالي
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
                Le nombre d'entrées de stock <br/> عدد إدخالات المخزون
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
                Le nombre de retrée de stock <br/> عدد عمليات سحب المخزون
                </CardTitle>
                <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{outputsCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                Coût total des entrées <br/> التكلفة الإجمالية للإدخالات
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(entriesTotal)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                Coût total des retraits <br/> التكلفة الإجمالية للاخراج
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(outputsTotal)}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Historique des opérations سجل المعاملات</CardTitle>
              <CardDescription>
              Un historique complet de tous les mouvements de stocks selon la méthode FIFO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Produit - المنتج</label>
                    <Select value={productFilter} onValueChange={setProductFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les produits/جميع المنتجات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les produits/جميع المنتجات</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type de transaction/نوع المعاملة</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les types/جميع الأنواع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types/جميع الأنواع</SelectItem>
                        <SelectItem value="entry">Entrées en stock/إدخالات المخزون</SelectItem>
                        <SelectItem value="output">Retrait des stocks/خروج المخزون</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Période de temps/الفترة الزمنية</label>
                    <DateRangePicker 
                      value={dateRange}
                      onChange={setDateRange}
                    />
                  </div>
                </div>
                
                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                  Effacer les filtres <br/> إلغاء الفلتر
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => printReport()}
                    className="md:hidden flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimer / طباعة
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
                  <h3 className="text-lg font-medium">Aucune opération n'a été trouvée<br/>لم يتم العثور على أي عمليات </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                  Essayez de modifier vos filtres ou d'ajouter des transactions d'inventaire
                  <br/>
                  حاول تغيير عوامل التصفية أو إضافة بعض معاملات المخزون
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Date - يوم</TableHead>
                        <TableHead>Type - نوع</TableHead>
                        <TableHead>Produit - المنتج</TableHead>
                        <TableHead>Quantité - الكمية</TableHead>
                        <TableHead>Unité - الوحدة</TableHead>
                        <TableHead>Prix unitaire - سعر الوحدة</TableHead>
                        <TableHead>Valeur totale - سعر الكلي</TableHead>
                        <TableHead>Pour - الملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => {
                        const product = products.find(p => p.id === transaction.product_id);
                        
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
                              <TableCell>{product?.name || 'Unknown Product'}</TableCell>
                              <TableCell>{transaction.quantity}</TableCell>
                              <TableCell>{product?.units ? `units: ${product.units}` : 'units'}</TableCell>
                              <TableCell>{formatCurrency(unitPrice)}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(totalPrice)}</TableCell>
                              <TableCell>{transaction.notes || '-'}</TableCell>
                            </TableRow>
                            
                            {isExpanded && (
                              <TableRow className="bg-muted/20 border-0">
                                <TableCell colSpan={9} className="p-0">
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
