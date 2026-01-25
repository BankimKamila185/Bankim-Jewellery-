# Bankim Jewellery - Frontend

React + Vite + Tailwind frontend for the Invoice & Product Management System.

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at: http://localhost:5173

### 3. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── common/       # Reusable UI components
│   └── layout/       # Layout components (Sidebar, Header, etc.)
├── pages/            # Page components
├── services/         # API client
├── hooks/            # Custom React hooks
└── utils/            # Utility functions
```

## Pages

- **Dashboard** - Overview with stats, recent invoices, alerts
- **Scan Bill** - Camera OCR for physical bills
- **Invoices** - Create and manage invoices
- **Products** - Product catalog with images
- **Designers** - Designer management
- **Dealers** - BUY/SELL dealer management
- **Reports** - Business analytics
- **Settings** - Application configuration

## Features

- 📱 Mobile-first responsive design
- 🎨 Dark theme with glassmorphism
- 📷 Camera integration for bill scanning
- 📊 Real-time dashboard updates
- 🔍 Search and filtering
- 💾 Google Sheets data persistence
- 🖼️ Google Drive image storage
