# Bankim Jewellery - Invoice & Product Management System

A 100% FREE, production-ready invoice and product management system for manufacturing + trading businesses.

## 🌟 Features

- **Multi-device support** - Works on phones, laptops, and desktops via browser
- **Dual dealer types** - BUY (suppliers) and SELL (customers)
- **5-stage cost tracking** - Material → Making → Finishing → Packing → Design
- **Automatic profit calculation** - Selling Price - Final Cost
- **Multiple invoice types** - Material, Making, Finishing, Packing, Sales
- **Designer module** - Separate from dealers, linked to products
- **OCR bill scanning** - Tesseract-powered text extraction
- **Google Drive images** - 200-300 product images stored free
- **Google Sheets database** - Free, accessible, shareable data

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Python + FastAPI |
| OCR | Tesseract (pytesseract) |
| Database | Google Sheets API |
| File Storage | Google Drive API |
| Authentication | Service Account (no OAuth) |

## 📁 Project Structure

```
BankimJewellery/
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── routers/   # API endpoints
│   │   ├── services/  # Business logic
│   │   ├── models/    # Pydantic schemas
│   │   └── utils/     # Helpers
│   └── credentials/   # Google service account key
│
├── frontend/          # React Vite frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
│
└── docs/              # Documentation
```

## 🚀 Quick Start

### Prerequisites

1. Python 3.9+
2. Node.js 18+
3. Tesseract OCR installed
4. Google Cloud project with APIs enabled

### 1. Clone and Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Google APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Sheets, Drive, Docs APIs
3. Create Service Account → Download JSON key
4. Save as `backend/credentials/service_account.json`
5. Create spreadsheet → Share with service account email

### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
# Edit .env with your Spreadsheet ID and Drive folder IDs
```

### 4. Setup Frontend

```bash
cd frontend
npm install
```

### 5. Run Both Servers

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 6. Access the App

- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

## 📱 Multi-Device Access

To access from phones on the same network:

1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac)
2. Access from phone: `http://YOUR_IP:5173`

## 📊 Google Sheets Schema

The system uses 7 sheets:
- **Dealers** - BUY/SELL contacts
- **Designers** - Design partners
- **Products** - Catalog with costs
- **Invoices** - All invoice types
- **InvoiceItems** - Line items
- **CostBreakdown** - Cost history
- **Settings** - App configuration

## 🔧 API Endpoints

| Module | Endpoints |
|--------|-----------|
| Dealers | GET/POST/PUT/DELETE `/api/dealers` |
| Designers | GET/POST/PUT/DELETE `/api/designers` |
| Products | GET/POST/PUT/DELETE `/api/products` |
| Invoices | GET/POST/PUT/DELETE `/api/invoices` |
| OCR | POST `/api/ocr/scan` |
| Reports | GET `/api/reports/*` |
| Settings | GET/PUT `/api/settings` |

## 🆓 Cost Breakdown

| Service | Cost |
|---------|------|
| Google Sheets API | FREE |
| Google Drive API | FREE (15GB) |
| Tesseract OCR | FREE |
| React + Vite | FREE |
| FastAPI | FREE |
| **Total** | **₹0** |

## 📞 Support

For issues or questions, check the documentation in the `docs/` folder.

---

Built with ❤️ for real business needs.
