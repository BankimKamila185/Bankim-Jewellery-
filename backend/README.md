# Bankim Jewellery - Backend

FastAPI backend for the Invoice & Product Management System.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Mac/Linux
# or: venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

### 2. Install Tesseract OCR

**Mac:**
```bash
brew install tesseract
```

**Windows:**
Download from: https://github.com/UB-Mannheim/tesseract/wiki

### 3. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable these APIs:
   - Google Sheets API
   - Google Drive API
   - Google Docs API
4. Create a Service Account:
   - Go to IAM & Admin → Service Accounts
   - Create Service Account
   - Download JSON key
   - Save as `credentials/service_account.json`

### 4. Create Google Sheet

1. Create a new Google Spreadsheet
2. Add these sheets (tabs):
   - Dealers
   - Designers  
   - Products
   - Invoices
   - InvoiceItems
   - CostBreakdown
   - Settings
3. Share the spreadsheet with your service account email (found in JSON key)

### 5. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 6. Run Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access API docs at: http://localhost:8000/docs

## API Endpoints

- `/api/dealers` - Dealer management
- `/api/designers` - Designer management
- `/api/products` - Product management
- `/api/invoices` - Invoice management
- `/api/ocr` - Bill scanning
- `/api/reports` - Business reports
- `/api/settings` - App settings
