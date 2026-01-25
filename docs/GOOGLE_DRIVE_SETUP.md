# Google Drive Setup Guide

To enable image uploads for Designs and Variants, you need to configure Google Drive API access.

## 1. Get Credentials

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project (or create one).
3.  Go to **IAM & Admin** > **Service Accounts**.
4.  Create a new Service Account (e.g., `jewellery-app-service`).
5.  **Important**: Grant the service account the **"Editor"** role (so it can create files/folders).
6.  Click on the newly created service account > **Keys** tab.
7.  Click **Add Key** > **Create new key** > **JSON**.
8.  A `.json` file will download to your computer.

## 2. Enable APIs

1.  Go to **APIs & Services** > **Library**.
2.  Search for and ENABLE:
    -   **Google Drive API**
    -   **Google Sheets API**

## 3. Place Credentials File

1.  Rename the downloaded JSON file to `service_account.json`.
2.  Move it to the following directory in your project:
    ```
    backend/credentials/service_account.json
    ```

## 4. Run Setup Script

Once the file is in place, I (or you) can run the setup script to automatically create the required folders:

```bash
cd backend
venv/bin/python3 scripts/setup_drive.py
```

This script will:
1.  Authenticate with your Service Account.
2.  Create a root folder `BankimJewellery_Assets`.
3.  Create subfolders `Products`, `Invoices`, and `Specs`.
4.  **Output the Folder IDs** you need to put in your `.env` file.
