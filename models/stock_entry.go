
package models

import (
	"time"
)

type StockEntry struct {
	ID                string    `json:"id"`
	ProductID         string    `json:"productId"`
	Quantity          float64   `json:"quantity"`
	RemainingQuantity float64   `json:"remainingQuantity"`
	UnitPrice         float64   `json:"unitPrice"`
	EntryDate         time.Time `json:"entryDate"`
	Notes             *string   `json:"notes,omitempty"`
}
