
package models

import (
	"time"
)

type StockOutput struct {
	ID              string    `json:"id"`
	ProductID       string    `json:"productId"`
	TotalQuantity   float64   `json:"totalQuantity"`
	TotalCost       float64   `json:"totalCost"`
	ReferenceNumber *string   `json:"referenceNumber,omitempty"`
	OutputDate      time.Time `json:"outputDate"`
	Notes           *string   `json:"notes,omitempty"`
}

type StockOutputLine struct {
	ID            string  `json:"id"`
	StockOutputID string  `json:"stockOutputId"`
	StockEntryID  string  `json:"stockEntryId"`
	Quantity      float64 `json:"quantity"`
	UnitPrice     float64 `json:"unitPrice"`
}
