
#!/bin/bash

# Build the Wails application
echo "Building StockScribe FIFO desktop application..."

# Install Wails CLI if not already installed
if ! command -v wails &> /dev/null; then
    echo "Installing Wails CLI..."
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
fi

# Build the application
wails build

echo "Build complete! You can find your executable in the build directory."
