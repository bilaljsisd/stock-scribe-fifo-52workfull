
package main

import (
	"context"
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	
	"stock-scribe-fifo/services"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the inventory service
	inventoryService := services.NewInventoryService()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "StockScribe FIFO",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		OnStartup: func(ctx context.Context) {
			inventoryService.SetContext(ctx)
		},
		Bind: []interface{}{
			inventoryService,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
