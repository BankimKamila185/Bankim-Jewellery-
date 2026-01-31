#!/bin/bash
# Simple startup script for Bankim Jewellery Backend
# This bypasses some macOS permission issues

cd "$(dirname "$0")"

echo "============================================================"
echo "🚀 Starting Bankim Jewellery Invoice System"
echo "============================================================"
echo ""

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "❌ Virtual environment not found. Run: python3 -m venv venv"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please edit it with your credentials."
    fi
fi

echo ""
echo "Starting server..."
echo "Access the API at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo "============================================================"
echo ""

# Run without reload to avoid permission issues
python3 -c "
import uvicorn
from app.main import app

# Try different ports
ports = [8000, 8001, 8002, 8080]
for port in ports:
    try:
        print(f'\\n📡 Starting on http://localhost:{port}')
        uvicorn.run(app, host='localhost', port=port, log_level='info')
        break
    except OSError as e:
        if 'Address already in use' in str(e):
            print(f'Port {port} in use, trying next...')
            continue
        print(f'Error: {e}')
        break
" || {
    echo ""
    echo "❌ Failed to start server"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check if another server is running: lsof -i :8000"
   echo "  2. Grant Terminal 'Full Disk Access' in System Settings"
    echo "  3. Try: python3 -m uvicorn app.main:app --reload"
    exit 1
}
