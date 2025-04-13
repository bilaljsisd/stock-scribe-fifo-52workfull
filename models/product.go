
package models

import (
	"time"
)

type Product struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	SKU          string    `json:"sku"`
	Description  string    `json:"description"`
	Units        *string   `json:"units,omitempty"`
	CurrentStock float64   `json:"currentStock"`
	AverageCost  float64   `json:"averageCost"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
