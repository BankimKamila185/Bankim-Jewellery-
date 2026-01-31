#!/usr/bin/env python3
"""
Startup script for Bankim Jewellery Backend.
This script handles port binding issues and provides better error messages.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    """Start the FastAPI application."""
    import uvicorn
    from app.main import app
    from app.config import get_settings
    
    settings = get_settings()
    
    print("=" * 60)
    print("🚀 Starting Bankim Jewellery Invoice System")
    print("=" * 60)
    
    # Try different ports if default fails
    ports_to_try = [8000, 8001, 8002, 8080, 3000]
    
    for port in ports_to_try:
        try:
            print(f"\n📡 Attempting to start on http://127.0.0.1:{port}")
            uvicorn.run(
                app,
                host="127.0.0.1",
                port=port,
                log_level="info",
                access_log=True
            )
            break  # If successful, break the loop
        except OSError as e:
            if "Address already in use" in str(e) or "permission" in str(e).lower():
                print(f"⚠️  Port {port} unavailable: {e}")
                print(f"   Trying next port...")
                continue
            else:
                raise
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped by user")
            break
        except Exception as e:
            print(f"\n❌ Error starting server: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    else:
        print("\n❌ Could not start server on any available port!")
        print("   Please make sure no other servers are running.")
        sys.exit(1)

if __name__ == "__main__":
    main()
