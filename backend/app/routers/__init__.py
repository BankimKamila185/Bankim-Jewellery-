"""Routers package."""
# Expose only what's needed or keep it empty if main.py imports submodules directly.
# But main.py imports from app.routers.
# Let's verify what main.py uses.
from app.routers import (
    dealers, 
    designers, 
    designs, 
    variants, 
    materials, 
    plating, 
    progress,
    invoices, 
    ocr, 
    reports, 
    settings
)
