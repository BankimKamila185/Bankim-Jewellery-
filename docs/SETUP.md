# Google Cloud Setup Guide

This guide walks you through setting up Google Cloud APIs for the Bankim Jewellery system.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name: `bankim-jewellery`
4. Click "Create"

## Step 2: Enable APIs

1. Go to "APIs & Services" → "Library"
2. Search and enable each:
   - **Google Sheets API**
   - **Google Drive API**
   - **Google Docs API**

## Step 3: Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: `bankim-jewellery-service`
4. Click "Create and Continue"
5. Skip role selection → "Done"

## Step 4: Download Credentials

1. Click on the created service account
2. Go to "Keys" tab
3. "Add Key" → "Create new key"
4. Select JSON → "Create"
5. Save the downloaded file as:
   ```
   backend/credentials/service_account.json
   ```

## Step 5: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet: "Bankim Jewellery Data"
3. Create these sheets (tabs):
   - Dealers
   - Designers
   - Products
   - Invoices
   - InvoiceItems
   - CostBreakdown
   - Settings

### Add Headers to Each Sheet

**Dealers Sheet:**
```
DealerID | DealerCode | DealerType | DealerCategory | Name | ContactPerson | Phone | Email | Address | GSTIN | BankName | AccountNo | IFSC | OpeningBalance | CurrentBalance | Notes | Status | CreatedAt | UpdatedAt
```

**Designers Sheet:**
```
DesignerID | Name | Company | Phone | Email | ChargeType | DefaultRate | Specialization | Portfolio | Notes | Status | CreatedAt | UpdatedAt
```

**Products Sheet:**
```
ProductID | ProductCode | Name | Category | SubCategory | DesignerID | MaterialCost | MakingCost | FinishingCost | PackingCost | DesignCost | FinalCost | SellingPrice | Profit | ProfitMargin | StockQty | MinStockAlert | ImageDriveLink | SpecDocLink | Weight | Dimensions | Notes | Status | CreatedAt | UpdatedAt
```

**Invoices Sheet:**
```
InvoiceID | InvoiceNumber | InvoiceType | DealerID | InvoiceDate | DueDate | SubTotal | TaxPercent | TaxAmount | DiscountPercent | DiscountAmount | GrandTotal | AmountPaid | BalanceDue | PaymentStatus | BillImageLink | Notes | CreatedAt | UpdatedAt
```

**InvoiceItems Sheet:**
```
ItemID | InvoiceID | ProductID | Description | Quantity | UnitPrice | TotalPrice | CostType | Notes
```

**CostBreakdown Sheet:**
```
BreakdownID | ProductID | CostType | InvoiceID | DealerID | Amount | Date | Notes | CreatedAt
```

**Settings Sheet:**
```
SettingKey | SettingValue | Category | UpdatedAt
```

## Step 6: Share Spreadsheet

1. Open your service account JSON file
2. Find `client_email` (e.g., `bankim-jewellery-service@project.iam.gserviceaccount.com`)
3. In Google Sheets, click "Share"
4. Paste the service account email
5. Set permission to "Editor"
6. Click "Send"

## Step 7: Get Spreadsheet ID

1. Open the spreadsheet
2. Copy the ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
3. Save this ID for the `.env` file

## Step 8: Create Drive Folders

1. Go to [Google Drive](https://drive.google.com)
2. Create folder: "BankimJewellery"
3. Inside, create:
   - Products
   - Invoices
   - ProductSpecs
4. Right-click each folder → "Get link"
5. Set to "Anyone with the link can view"
6. Copy folder IDs from URLs

## Step 9: Configure Environment

Edit `backend/.env`:

```env
GOOGLE_CREDENTIALS_PATH=credentials/service_account.json
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
DRIVE_PRODUCTS_FOLDER_ID=your_products_folder_id
DRIVE_INVOICES_FOLDER_ID=your_invoices_folder_id
DRIVE_SPECS_FOLDER_ID=your_specs_folder_id
```

## Step 10: Test Connection

Start the backend and visit http://localhost:8000/docs

Try the `/api/dealers` endpoint - if it returns `{"total": 0, "dealers": []}`, the connection is working!

## Troubleshooting

### "Permission denied" error
- Make sure you shared the spreadsheet with the service account email

### "API not enabled" error
- Go back to Google Cloud Console and enable the required APIs

### "File not found" error
- Check the path to `service_account.json` is correct in `.env`

---

Once setup is complete, your data will be stored in Google Sheets and images in Google Drive - all for FREE!
