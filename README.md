
# StockScribe FIFO - Desktop Edition

A FIFO (First-In, First-Out) inventory management system built with Go and Wails.

## Features

- Manage products with SKU, descriptions, and units
- Add inventory stock with purchase dates and costs
- Withdraw inventory using FIFO cost calculation method
- View transaction history and stock levels
- Generate reports on inventory valuation

## Development

This project uses:
- Go for backend logic
- Wails for desktop app framework
- React with TypeScript for the UI
- Tailwind CSS and Shadcn UI for styling

### Prerequisites

- Go 1.21 or higher
- Node.js 16 or higher
- Wails CLI

### Setup

1. Install the Wails CLI:
   ```
   go install github.com/wailsapp/wails/v2/cmd/wails@latest
   ```

2. Install dependencies:
   ```
   wails deps
   ```

3. Run the development server:
   ```
   wails dev
   ```

### Building

To build the application for your platform:

```
wails build
```

This will create an executable in the `build/bin` directory.

## License

MIT
