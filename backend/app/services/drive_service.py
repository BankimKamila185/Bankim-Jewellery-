"""
Google Drive Service - Image upload and file management.
Uses Service Account authentication for server-to-server access.
"""

import io
from datetime import datetime
from pathlib import Path
from typing import Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
from googleapiclient.errors import HttpError


class DriveService:
    """Service for Google Drive operations."""
    
    def __init__(
        self,
        credentials_path: str,
        products_folder_id: str = "",
        invoices_folder_id: str = "",
        specs_folder_id: str = "",
        credentials_json: Optional[str] = None
    ):
        """Initialize the Drive service with credentials."""
        self.products_folder_id = products_folder_id
        self.invoices_folder_id = invoices_folder_id
        self.specs_folder_id = specs_folder_id
        self.service = None
        
        if credentials_json:
             self._authenticate_from_json(credentials_json)
        elif credentials_path:
            self._authenticate(credentials_path)
    
    def _authenticate(self, credentials_path: str):
        """Authenticate with Google Drive API using service account file."""
        try:
            creds_path = Path(credentials_path)
            if not creds_path.is_absolute():
                creds_path = Path(__file__).resolve().parent.parent.parent / credentials_path
            
            if not creds_path.exists():
                print(f"⚠️ Credentials file not found: {creds_path}")
                return
            
            credentials = service_account.Credentials.from_service_account_file(
                str(creds_path),
                scopes=[
                    "https://www.googleapis.com/auth/drive",
                    "https://www.googleapis.com/auth/drive.file",
                ]
            )
            
            self.service = build("drive", "v3", credentials=credentials)
            print("✅ Google Drive service authenticated (File)")
            
        except Exception as e:
            print(f"❌ Failed to authenticate with Google Drive: {e}")
            self.service = None

    def _authenticate_from_json(self, json_content: str):
         """Authenticate using JSON string content."""
         try:
            import json
            info = json.loads(json_content)
            credentials = service_account.Credentials.from_service_account_info(
                info,
                scopes=[
                    "https://www.googleapis.com/auth/drive",
                    "https://www.googleapis.com/auth/drive.file",
                ]
            )
            self.service = build("drive", "v3", credentials=credentials)
            print("✅ Google Drive service authenticated (Env Var)")
         except Exception as e:
            print(f"❌ Failed to authenticate with Google Drive JSON: {e}")
            self.service = None
    
    async def create_folder(self, name: str, parent_id: Optional[str] = None) -> Optional[str]:
        """Create a folder in Drive and return its ID."""
        if not self.service:
            return None
        
        try:
            file_metadata = {
                "name": name,
                "mimeType": "application/vnd.google-apps.folder",
            }
            
            if parent_id:
                file_metadata["parents"] = [parent_id]
            
            folder = self.service.files().create(
                body=file_metadata,
                fields="id"
            ).execute()
            
            folder_id = folder.get("id")
            
            # Make folder publicly viewable
            await self._make_public(folder_id)
            
            return folder_id
            
        except HttpError as e:
            print(f"Error creating folder: {e}")
            return None
    
    async def get_or_create_folder(self, name: str, parent_id: str) -> Optional[str]:
        """Get existing folder or create new one."""
        if not self.service:
            return None
        
        try:
            # Search for existing folder
            query = f"name='{name}' and '{parent_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
            
            results = self.service.files().list(
                q=query,
                spaces="drive",
                fields="files(id, name)",
            ).execute()
            
            files = results.get("files", [])
            
            if files:
                return files[0]["id"]
            
            # Create new folder
            return await self.create_folder(name, parent_id)
            
        except HttpError as e:
            print(f"Error getting/creating folder: {e}")
            return None
    
    async def _make_public(self, file_id: str) -> bool:
        """Make a file/folder publicly viewable."""
        if not self.service:
            return False
        
        try:
            self.service.permissions().create(
                fileId=file_id,
                body={"type": "anyone", "role": "reader"},
            ).execute()
            return True
            
        except HttpError as e:
            print(f"Error making file public: {e}")
            return False
    
    async def upload_image(
        self,
        file_content: bytes,
        filename: str,
        folder_id: str,
        mime_type: str = "image/jpeg",
    ) -> Optional[dict]:
        """Upload an image to Drive and return file info."""
        if not self.service:
            return None
        
        try:
            file_metadata = {
                "name": filename,
                "parents": [folder_id],
            }
            
            media = MediaIoBaseUpload(
                io.BytesIO(file_content),
                mimetype=mime_type,
                resumable=True,
            )
            
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields="id, name, webViewLink, webContentLink",
            ).execute()
            
            file_id = file.get("id")
            
            # Make file publicly viewable
            await self._make_public(file_id)
            
            # Generate direct view link
            view_link = f"https://drive.google.com/uc?id={file_id}"
            
            return {
                "file_id": file_id,
                "filename": file.get("name"),
                "view_link": view_link,
                "web_view_link": file.get("webViewLink"),
            }
            
        except HttpError as e:
            print(f"Error uploading image: {e}")
            return None
    
    async def upload_product_image(
        self,
        product_id: str,
        file_content: bytes,
        filename: str,
        mime_type: str = "image/jpeg",
    ) -> Optional[str]:
        """Upload a product image and return the view link."""
        if not self.products_folder_id:
            print("⚠️ Products folder ID not configured")
            return None
        
        # Get or create product subfolder
        product_folder_id = await self.get_or_create_folder(
            product_id,
            self.products_folder_id
        )
        
        if not product_folder_id:
            return None
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = filename.split(".")[-1] if "." in filename else "jpg"
        new_filename = f"{product_id}_{timestamp}.{ext}"
        
        result = await self.upload_image(
            file_content,
            new_filename,
            product_folder_id,
            mime_type,
        )
        
        return result["view_link"] if result else None
    
    async def upload_variant_image(
        self,
        variant_id: str,
        file_content: bytes,
        filename: str,
        mime_type: str = "image/jpeg",
    ) -> Optional[str]:
        """Upload a variant image and return the view link."""
        if not self.products_folder_id:
            print("⚠️ Products folder ID not configured")
            return None
        
        # Get or create variant subfolder
        # Using products_folder_id as the parent because Variants live under Products folder
        variant_folder_id = await self.get_or_create_folder(
            variant_id,
            self.products_folder_id
        )
        
        if not variant_folder_id:
            return None
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = filename.split(".")[-1] if "." in filename else "jpg"
        new_filename = f"{variant_id}_{timestamp}.{ext}"
        
        result = await self.upload_image(
            file_content,
            new_filename,
            variant_folder_id,
            mime_type,
        )
        
        return result["view_link"] if result else None
    
    async def upload_invoice_image(
        self,
        invoice_id: str,
        file_content: bytes,
        filename: str,
        mime_type: str = "image/jpeg",
    ) -> Optional[str]:
        """Upload a scanned invoice/bill image and return the view link."""
        if not self.invoices_folder_id:
            print("⚠️ Invoices folder ID not configured")
            return None
        
        # Organize by year/month
        now = datetime.now()
        year_folder = await self.get_or_create_folder(
            str(now.year),
            self.invoices_folder_id
        )
        
        if not year_folder:
            return None
        
        month_folder = await self.get_or_create_folder(
            f"{now.month:02d}-{now.strftime('%B')}",
            year_folder
        )
        
        if not month_folder:
            return None
        
        # Generate filename
        ext = filename.split(".")[-1] if "." in filename else "jpg"
        new_filename = f"{invoice_id}.{ext}"
        
        result = await self.upload_image(
            file_content,
            new_filename,
            month_folder,
            mime_type,
        )
        
        return result["view_link"] if result else None
    
    async def delete_file(self, file_id: str) -> bool:
        """Delete a file from Drive."""
        if not self.service:
            return False
        
        try:
            self.service.files().delete(fileId=file_id).execute()
            return True
            
        except HttpError as e:
            print(f"Error deleting file: {e}")
            return False
    
    async def list_product_images(self, product_id: str) -> list[dict]:
        """List all images for a product."""
        if not self.service or not self.products_folder_id:
            return []
        
        try:
            # Find product folder
            product_folder_id = await self.get_or_create_folder(
                product_id,
                self.products_folder_id
            )
            
            if not product_folder_id:
                return []
            
            # List files in folder
            query = f"'{product_folder_id}' in parents and mimeType contains 'image' and trashed=false"
            
            results = self.service.files().list(
                q=query,
                spaces="drive",
                fields="files(id, name, webViewLink, createdTime)",
                orderBy="createdTime desc",
            ).execute()
            
            files = results.get("files", [])
            
            return [
                {
                    "file_id": f["id"],
                    "filename": f["name"],
                    "view_link": f"https://drive.google.com/uc?id={f['id']}",
                    "web_view_link": f.get("webViewLink"),
                    "created_at": f.get("createdTime"),
                }
                for f in files
            ]
            
        except HttpError as e:
            print(f"Error listing product images: {e}")
            return []
    
    async def download_file(self, file_id: str) -> Optional[bytes]:
        """Download a file's content."""
        if not self.service:
            return None
        
        try:
            request = self.service.files().get_media(fileId=file_id)
            
            file_buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(file_buffer, request)
            
            done = False
            while not done:
                _, done = downloader.next_chunk()
            
            return file_buffer.getvalue()
            
        except HttpError as e:
            print(f"Error downloading file: {e}")
            return None
