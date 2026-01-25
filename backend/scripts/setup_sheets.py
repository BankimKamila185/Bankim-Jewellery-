"""
Setup script for Google Sheets.
Creates the database spreadsheet and initializes schema.
"""

import sys
import asyncio
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from google.oauth2 import service_account
from googleapiclient.discovery import build
from app.config import get_settings
from app.services.sheets_service import SheetsService

async def main():
    print("🚀 Starting Google Sheets Setup...")
    
    settings = get_settings()
    creds_path = Path(settings.GOOGLE_CREDENTIALS_PATH)
    
    if not creds_path.exists():
        creds_path = Path(__file__).resolve().parent.parent / settings.GOOGLE_CREDENTIALS_PATH
        
    print(f"✅ Using credentials: {creds_path}")
    
    try:
        credentials = service_account.Credentials.from_service_account_file(
            str(creds_path),
            scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
        )
    except Exception as e:
        print(f"❌ Failed to load credentials: {e}")
        return

    service = build("sheets", "v4", credentials=credentials)
    drive_service = build("drive", "v3", credentials=credentials)

    # 1. Check if Spreadsheet exists in settings
    spreadsheet_id = settings.GOOGLE_SPREADSHEET_ID
    
    if spreadsheet_id and spreadsheet_id != "your_spreadsheet_id_here":
        print(f"\nℹ️ Using existing Spreadsheet ID: {spreadsheet_id}")
        # No creation needed
    else:
        # Create Spreadsheet using Drive API (safer for permissions)
        print("\n📄 Creating new Spreadsheet 'BankimJewellery_DB'...")
        file_metadata = {
            'name': 'BankimJewellery_DB',
            'mimeType': 'application/vnd.google-apps.spreadsheet',
            # Optional: Place it in the root folder we created? 
            # For now, let's just create it in root to act as a proper DB.
        }
        
        file = drive_service.files().create(body=file_metadata, fields='id, webViewLink').execute()
        
        spreadsheet_id = file.get('id')
        spreadsheet_url = file.get('webViewLink')
        print(f"   ✅ Created Spreadsheet!")
        print(f"   ID: {spreadsheet_id}")
        print(f"   URL: {spreadsheet_url}")

    # 2. Setup Schema (Sheets & Headers)
    print("\n📝 Initializing Schema...")
    
    # Map sheet keys to their column definitions from the Service
    schema = {
        "designs": SheetsService.DESIGN_COLUMNS,
        "variants": SheetsService.VARIANT_COLUMNS,
        "dealers": SheetsService.DEALER_COLUMNS,
        "designers": SheetsService.DESIGNER_COLUMNS,
        "products": SheetsService.PRODUCT_COLUMNS,
        "invoices": SheetsService.INVOICE_COLUMNS,
        "invoice_items": SheetsService.INVOICE_ITEM_COLUMNS,
        "cost_breakdown": SheetsService.COST_BREAKDOWN_COLUMNS,
        "settings": SheetsService.SETTINGS_COLUMNS,
    }

    # Batch update to create sheets and set headers
    requests = []
    
    # First rename the default "Sheet1" to the first sheet in our list to avoid deletion issues
    first_sheet_key = list(schema.keys())[0]
    first_sheet_name = SheetsService.SHEETS[first_sheet_key]
    
    requests.append({
        "updateSheetProperties": {
            "properties": {
                "sheetId": 0, # Default sheet usually has ID 0
                "title": first_sheet_name
            },
            "fields": "title"
        }
    })
    
    # Add values for the first sheet
    requests.append({
        "appendCells": {
            "sheetId": 0,
            "rows": [{
                "values": [{"userEnteredValue": {"stringValue": col}} for col in schema[first_sheet_key]]
            }],
            "fields": "*"
        }
    })
    
    # Create other sheets
    for key, columns in schema.items():
        if key == first_sheet_key:
            continue
            
        sheet_title = SheetsService.SHEETS[key]
        
        # Add Sheet
        requests.append({
            "addSheet": {
                "properties": {
                    "title": sheet_title
                }
            }
        })
        
    # Execute batch to create sheets
    body = {"requests": requests}
    service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()
    print("   ✅ Created Sheets tabs")
    
    # Now write headers for the newly created sheets (we need to fetch their IDs first or just use values.update)
    # Using values.update is easier for headers by name
    for key, columns in schema.items():
        if key == first_sheet_key:
            continue # Already done
            
        sheet_title = SheetsService.SHEETS[key]
        range_name = f"{sheet_title}!A1:Z1"
        body = {
            "values": [columns]
        }
        service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption="USER_ENTERED",
            body=body
        ).execute()
        print(f"   ✓ Initialized {sheet_title}")

    # 3. Share with user (Optional/Manual)
    # Since we don't know the users email, we make it public with link (CAUTION) or just tell them
    # For a business app, creating a permission for 'anyone with link' as 'writer' is a quick fix for testing
    # BUT better to ask user. For now, we will print the ID.
    
    print("\n🎉 Spreadsheet Setup Complete!")
    print(f"Spreadsheet ID: {spreadsheet_id}")
    
    # 4. Automate .env update
    env_path = Path(".env")
    if env_path.exists():
        content = env_path.read_text()
        lines = content.splitlines()
        new_lines = []
        found = False
        for line in lines:
            if line.startswith("GOOGLE_SPREADSHEET_ID="):
                new_lines.append(f"GOOGLE_SPREADSHEET_ID={spreadsheet_id}")
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"GOOGLE_SPREADSHEET_ID={spreadsheet_id}")
            
        env_path.write_text("\n".join(new_lines))
        print("✅ Updated .env file with new Spreadsheet ID")
    else:
        print("⚠️ .env file not found, could not update automatically.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        import traceback
        traceback.print_exc()
