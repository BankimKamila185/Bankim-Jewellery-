"""
Setup script for Google Drive.
Creates required folders and sets permissions.
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.services.drive_service import DriveService
from app.config import get_settings

async def main():
    print("🚀 Starting Google Drive Setup...")
    
    settings = get_settings()
    creds_path = settings.GOOGLE_CREDENTIALS_PATH
    
    if not os.path.exists(creds_path):
        # Try finding it relative to backend root
        creds_path = Path(__file__).resolve().parent.parent / settings.GOOGLE_CREDENTIALS_PATH
    
    if not os.path.exists(creds_path):
        print(f"❌ Error: Credentials file not found at {creds_path}")
        print("   Please place your 'service_account.json' in backend/credentials/")
        return

    print(f"✅ Found credentials at: {creds_path}")
    
    # Initialize service without folder IDs initially
    drive = DriveService(str(creds_path))
    if not drive.service:
        print("❌ Failed to authenticate with Google Drive")
        return

    # Create Root Folder
    print("\n📂 setting up folders...")
    root_name = "BankimJewellery_Assets"
    
    # Check if root exists (naive check by creating new one for now, or you could search)
    # Ideally, we ask user for root ID or create new one. 
    # Let's create a new one to be safe and separate.
    
    print(f"   Creating root folder: {root_name}")
    root_id = await drive.create_folder(root_name)
    
    if not root_id:
        print("❌ Failed to create root folder")
        return
        
    print(f"   ✅ Root Folder ID: {root_id}")
    
    # Create Subfolders
    print("   Creating subfolders...")
    
    folders = {
        "Products": "DRIVE_PRODUCTS_FOLDER_ID",
        "Invoices": "DRIVE_INVOICES_FOLDER_ID",
        "Specs": "DRIVE_SPECS_FOLDER_ID"
    }
    
    ids = {}
    
    for name, env_var in folders.items():
        folder_id = await drive.create_folder(name, parent_id=root_id)
        if folder_id:
            print(f"   ✅ Created '{name}': {folder_id}")
            ids[env_var] = folder_id
        else:
            print(f"   ❌ Failed to create '{name}'")
    
    print("\n🎉 Setup Complete!")
    print("\n👇 ADD THESE TO YOUR .env FILE: 👇")
    print("=================================================")
    for env_var, folder_id in ids.items():
        print(f"{env_var}={folder_id}")
    print("=================================================")

if __name__ == "__main__":
    asyncio.run(main())
