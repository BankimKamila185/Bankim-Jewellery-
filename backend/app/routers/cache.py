"""
Cache Management API Router - Monitor and control caching.
"""

from fastapi import APIRouter, HTTPException
from app.dependencies import get_cache_service


router = APIRouter()


@router.get("/stats")
async def get_cache_stats():
    """Get cache statistics including hit rate and size."""
    cache = get_cache_service()
    return cache.get_stats()


@router.post("/clear")
async def clear_all_cache():
    """Clear all cache entries."""
    cache = get_cache_service()
    cache.clear()
    return {"message": "All cache cleared successfully"}


@router.post("/clear/{sheet_name}")
async def clear_sheet_cache(sheet_name: str):
    """Clear cache for a specific sheet."""
    cache = get_cache_service()
    cache.delete("sheets", sheet_name)
    return {"message": f"Cache cleared for sheet: {sheet_name}"}


@router.post("/refresh")
async def refresh_cache():
    """
    Alias for clear_all_cache.
    Useful for frontend 'Refresh Data' buttons.
    """
    cache = get_cache_service()
    cache.clear()
    return {"message": "Cache refreshed successfully"}
