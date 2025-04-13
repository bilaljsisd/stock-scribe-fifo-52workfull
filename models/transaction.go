
package models

import (
	"time"
)

type TransactionType string

const (
	TransactionTypeEntry  TransactionType = "entry"
	TransactionTypeOutput TransactionType = "output"
)

type Transaction struct {
	ID          string          `json:"id"`
	Type        TransactionType `json:"type"`
	ProductID   string          `json:"productId"`
	Quantity    float64         `json:"quantity"`
	Date        time.Time       `json:"date"`
	ReferenceID string          `json:"referenceId"` // StockEntry.id or StockOutput.id
	Notes       *string         `json:"notes,omitempty"`
}
