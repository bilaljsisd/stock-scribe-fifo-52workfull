package services

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"stock-scribe-fifo/models"
)

// InventoryService manages all inventory operations
type InventoryService struct {
	ctx           context.Context
	products      map[string]models.Product
	stockEntries  map[string]models.StockEntry
	stockOutputs  map[string]models.StockOutput
	outputLines   map[string][]models.StockOutputLine
	transactions  []models.Transaction
	dataDirectory string
}

// NewInventoryService creates a new InventoryService
func NewInventoryService() *InventoryService {
	return &InventoryService{
		products:     make(map[string]models.Product),
		stockEntries: make(map[string]models.StockEntry),
		stockOutputs: make(map[string]models.StockOutput),
		outputLines:  make(map[string][]models.StockOutputLine),
		transactions: []models.Transaction{},
	}
}

// SetContext sets the runtime context
func (s *InventoryService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// GetProducts returns all products
func (s *InventoryService) GetProducts() []models.Product {
	products := make([]models.Product, 0, len(s.products))
	for _, product := range s.products {
		products = append(products, product)
	}
	
	// Sort by name
	sort.Slice(products, func(i, j int) bool {
		return products[i].Name < products[j].Name
	})
	
	return products
}

// GetProductByID returns a product by ID
func (s *InventoryService) GetProductByID(id string) (models.Product, error) {
	product, exists := s.products[id]
	if !exists {
		return models.Product{}, fmt.Errorf("product not found: %s", id)
	}
	return product, nil
}

// CreateProduct creates a new product
func (s *InventoryService) CreateProduct(name, sku, description string, units *string) (models.Product, error) {
	// Check for duplicate SKU
	for _, p := range s.products {
		if p.SKU == sku {
			return models.Product{}, fmt.Errorf("product with SKU %s already exists", sku)
		}
	}

	now := time.Now()
	product := models.Product{
		ID:           uuid.New().String(),
		Name:         name,
		SKU:          sku,
		Description:  description,
		Units:        units,
		CurrentStock: 0,
		AverageCost:  0,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	s.products[product.ID] = product
	s.saveData()
	return product, nil
}

// UpdateProduct updates an existing product
func (s *InventoryService) UpdateProduct(id, name, sku, description string, units *string) (models.Product, error) {
	product, exists := s.products[id]
	if !exists {
		return models.Product{}, fmt.Errorf("product not found: %s", id)
	}

	// Check for duplicate SKU (that isn't this product)
	for pid, p := range s.products {
		if p.SKU == sku && pid != id {
			return models.Product{}, fmt.Errorf("another product with SKU %s already exists", sku)
		}
	}

	product.Name = name
	product.SKU = sku
	product.Description = description
	product.Units = units
	product.UpdatedAt = time.Now()

	s.products[id] = product
	s.saveData()
	return product, nil
}

// DeleteProduct deletes a product if it has no transactions
func (s *InventoryService) DeleteProduct(id string) error {
	// Check if product exists
	if _, exists := s.products[id]; !exists {
		return fmt.Errorf("product not found: %s", id)
	}

	// Check if there are any transactions for this product
	for _, t := range s.transactions {
		if t.ProductID == id {
			return fmt.Errorf("cannot delete product with transaction history")
		}
	}

	delete(s.products, id)
	s.saveData()
	return nil
}

// AddStockEntry adds inventory to a product
func (s *InventoryService) AddStockEntry(productID string, quantity, unitPrice float64, entryDate time.Time, notes *string) (models.StockEntry, error) {
	// Check if product exists
	if _, exists := s.products[productID]; !exists {
		return models.StockEntry{}, fmt.Errorf("product not found: %s", productID)
	}

	entry := models.StockEntry{
		ID:                uuid.New().String(),
		ProductID:         productID,
		Quantity:          quantity,
		RemainingQuantity: quantity,
		UnitPrice:         unitPrice,
		EntryDate:         entryDate,
		Notes:             notes,
	}

	s.stockEntries[entry.ID] = entry

	// Create transaction record
	transaction := models.Transaction{
		ID:          uuid.New().String(),
		Type:        models.TransactionTypeEntry,
		ProductID:   productID,
		Quantity:    quantity,
		Date:        entryDate,
		ReferenceID: entry.ID,
		Notes:       notes,
	}
	s.transactions = append(s.transactions, transaction)

	// Update product totals
	s.recalculateProductTotals(productID)
	s.saveData()
	return entry, nil
}

// GetStockEntriesForProduct returns all stock entries for a product
func (s *InventoryService) GetStockEntriesForProduct(productID string) []models.StockEntry {
	entries := []models.StockEntry{}
	for _, entry := range s.stockEntries {
		if entry.ProductID == productID {
			entries = append(entries, entry)
		}
	}

	// Sort by entry date
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].EntryDate.Before(entries[j].EntryDate)
	})

	return entries
}

// UpdateStockEntry updates a stock entry
func (s *InventoryService) UpdateStockEntry(id string, unitPrice float64, entryDate time.Time, notes *string, quantity *float64) (models.StockEntry, error) {
	entry, exists := s.stockEntries[id]
	if !exists {
		return models.StockEntry{}, fmt.Errorf("stock entry not found: %s", id)
	}

	// If quantity is provided, make sure it's not less than what's been consumed
	if quantity != nil {
		consumedQuantity := entry.Quantity - entry.RemainingQuantity
		if *quantity < consumedQuantity {
			return models.StockEntry{}, fmt.Errorf("cannot reduce quantity below what has been consumed (%f)", consumedQuantity)
		}
		
		// Update remaining quantity based on the difference
		remainingDiff := *quantity - entry.Quantity
		entry.Quantity = *quantity
		entry.RemainingQuantity += remainingDiff
	}

	entry.UnitPrice = unitPrice
	entry.EntryDate = entryDate
	entry.Notes = notes

	s.stockEntries[id] = entry
	s.recalculateProductTotals(entry.ProductID)
	s.saveData()
	return entry, nil
}

// CreateStockOutput withdraws inventory using FIFO
func (s *InventoryService) CreateStockOutput(productID string, quantity float64, outputDate time.Time, referenceNumber, notes *string) (models.StockOutput, error) {
	// Check if product exists
	product, exists := s.products[productID]
	if !exists {
		return models.StockOutput{}, fmt.Errorf("product not found: %s", productID)
	}

	// Check if we have enough stock
	if product.CurrentStock < quantity {
		return models.StockOutput{}, fmt.Errorf("insufficient stock. Only %f units available", product.CurrentStock)
	}

	// Get available entries sorted by date (FIFO)
	availableEntries := []models.StockEntry{}
	for _, entry := range s.stockEntries {
		if entry.ProductID == productID && entry.RemainingQuantity > 0 {
			availableEntries = append(availableEntries, entry)
		}
	}

	sort.Slice(availableEntries, func(i, j int) bool {
		return availableEntries[i].EntryDate.Before(availableEntries[j].EntryDate)
	})

	// Create output record
	output := models.StockOutput{
		ID:              uuid.New().String(),
		ProductID:       productID,
		TotalQuantity:   quantity,
		TotalCost:       0,
		ReferenceNumber: referenceNumber,
		OutputDate:      outputDate,
		Notes:           notes,
	}

	// Allocate stock using FIFO
	remainingToFulfill := quantity
	totalCost := 0.0
	outputLines := []models.StockOutputLine{}

	for i, entry := range availableEntries {
		if remainingToFulfill <= 0 {
			break
		}

		qtyFromThisEntry := remainingToFulfill
		if qtyFromThisEntry > entry.RemainingQuantity {
			qtyFromThisEntry = entry.RemainingQuantity
		}

		outputLine := models.StockOutputLine{
			ID:            uuid.New().String(),
			StockOutputID: output.ID,
			StockEntryID:  entry.ID,
			Quantity:      qtyFromThisEntry,
			UnitPrice:     entry.UnitPrice,
		}
		outputLines = append(outputLines, outputLine)

		// Update the entry's remaining quantity
		entry.RemainingQuantity -= qtyFromThisEntry
		s.stockEntries[entry.ID] = entry
		
		// Update totals
		totalCost += qtyFromThisEntry * entry.UnitPrice
		remainingToFulfill -= qtyFromThisEntry
		
		// Update our working copy for the next iteration
		availableEntries[i] = entry
	}

	output.TotalCost = totalCost
	s.stockOutputs[output.ID] = output
	s.outputLines[output.ID] = outputLines

	// Create transaction record
	transaction := models.Transaction{
		ID:          uuid.New().String(),
		Type:        models.TransactionTypeOutput,
		ProductID:   productID,
		Quantity:    quantity,
		Date:        outputDate,
		ReferenceID: output.ID,
		Notes:       notes,
	}
	s.transactions = append(s.transactions, transaction)

	// Update product totals
	s.recalculateProductTotals(productID)
	s.saveData()
	return output, nil
}

// GetStockOutputsForProduct returns all stock outputs for a product
func (s *InventoryService) GetStockOutputsForProduct(productID string) []models.StockOutput {
	outputs := []models.StockOutput{}
	for _, output := range s.stockOutputs {
		if output.ProductID == productID {
			outputs = append(outputs, output)
		}
	}

	// Sort by output date (newest first)
	sort.Slice(outputs, func(i, j int) bool {
		return outputs[i].OutputDate.After(outputs[j].OutputDate)
	})

	return outputs
}

// GetStockOutputLines returns the FIFO allocation details for a stock output
func (s *InventoryService) GetStockOutputLines(outputID string) []models.StockOutputLine {
	return s.outputLines[outputID]
}

// GetTransactionsForProduct returns all transactions for a product
func (s *InventoryService) GetTransactionsForProduct(productID string) []models.Transaction {
	transactions := []models.Transaction{}
	for _, transaction := range s.transactions {
		if transaction.ProductID == productID {
			transactions = append(transactions, transaction)
		}
	}

	// Sort by date (newest first)
	sort.Slice(transactions, func(i, j int) bool {
		return transactions[i].Date.After(transactions[j].Date)
	})

	return transactions
}

// GetAllTransactions returns all transactions
func (s *InventoryService) GetAllTransactions() []models.Transaction {
	// Sort by date (newest first)
	transactions := make([]models.Transaction, len(s.transactions))
	copy(transactions, s.transactions)
	
	sort.Slice(transactions, func(i, j int) bool {
		return transactions[i].Date.After(transactions[j].Date)
	})

	return transactions
}

// recalculateProductTotals updates a product's stock and cost values
func (s *InventoryService) recalculateProductTotals(productID string) {
	product, exists := s.products[productID]
	if !exists {
		return
	}

	// Calculate current stock and average cost
	currentStock := 0.0
	totalValue := 0.0

	for _, entry := range s.stockEntries {
		if entry.ProductID == productID && entry.RemainingQuantity > 0 {
			currentStock += entry.RemainingQuantity
			totalValue += entry.RemainingQuantity * entry.UnitPrice
		}
	}

	product.CurrentStock = currentStock
	if currentStock > 0 {
		product.AverageCost = totalValue / currentStock
	} else {
		product.AverageCost = 0
	}
	product.UpdatedAt = time.Now()

	s.products[productID] = product
}

// saveData persists all data to disk
func (s *InventoryService) saveData() {
	// Implementation of data persistence would go here
	// For now, we're just keeping data in memory
	// In a real app, you'd save to a database or JSON files
	
	// Notify the frontend that data has changed
	if s.ctx != nil {
		runtime.EventsEmit(s.ctx, "data-changed")
	}
}
