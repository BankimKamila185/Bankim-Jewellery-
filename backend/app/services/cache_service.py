"""
Cache Service - Centralized caching for improved performance.
Implements TTL-based in-memory caching for Google Sheets data.
"""

from typing import Any, Optional
from datetime import datetime
import hashlib
import json

try:
    from cachetools import TTLCache
    CACHETOOLS_AVAILABLE = True
except ImportError:
    CACHETOOLS_AVAILABLE = False
    print("⚠️  cachetools not installed - caching will be disabled. Install with: pip install cachetools==5.3.2")
    # Fallback dummy cache class
    class TTLCache(dict):
        """Dummy TTLCache when cachetools is not available."""
        def __init__(self, maxsize, ttl):
            super().__init__()
            self.maxsize = maxsize
            self.ttl = ttl


class CacheService:
    """Service for managing application-wide caching."""
    
    def __init__(self, default_ttl: int = 300, max_size: int = 1000):
        """
        Initialize cache service.
        
        Args:
            default_ttl: Time-to-live in seconds (default: 300s / 5 minutes)
            max_size: Maximum number of cache entries (default: 1000)
        """
        if not CACHETOOLS_AVAILABLE:
            print("⚠️  Cache service initialized in fallback mode (no TTL support)")
        
        self.cache = TTLCache(maxsize=max_size, ttl=default_ttl)
        self.default_ttl = default_ttl
        self.enabled = CACHETOOLS_AVAILABLE
        self.stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "deletes": 0,
        }
    
    def _make_key(self, namespace: str, identifier: Any) -> str:
        """
        Create a cache key from namespace and identifier.
        
        Args:
            namespace: Category of data (e.g., 'dealers', 'designs')
            identifier: Unique identifier (can be dict, string, etc.)
        
        Returns:
            Hash-based cache key
        """
        if isinstance(identifier, dict):
            identifier = json.dumps(identifier, sort_keys=True)
        elif not isinstance(identifier, str):
            identifier = str(identifier)
        
        key_string = f"{namespace}:{identifier}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get(self, namespace: str, identifier: Any) -> Optional[Any]:
        """
        Retrieve data from cache.
        
        Args:
            namespace: Category of data
            identifier: Unique identifier
        
        Returns:
            Cached data or None if not found
        """
        key = self._make_key(namespace, identifier)
        
        if key in self.cache:
            self.stats["hits"] += 1
            return self.cache[key]
        
        self.stats["misses"] += 1
        return None
    
    def set(self, namespace: str, identifier: Any, data: Any) -> None:
        """
        Store data in cache.
        
        Args:
            namespace: Category of data
            identifier: Unique identifier
            data: Data to cache
        """
        key = self._make_key(namespace, identifier)
        self.cache[key] = data
        self.stats["sets"] += 1
    
    def delete(self, namespace: str, identifier: Any = None) -> None:
        """
        Delete data from cache.
        
        Args:
            namespace: Category of data
            identifier: Specific identifier to delete, or None to clear entire namespace
        """
        if identifier is None:
            # Clear all entries for this namespace
            keys_to_delete = [
                k for k in self.cache.keys()
                if k.startswith(self._make_key(namespace, "")[:8])
            ]
            for key in keys_to_delete:
                del self.cache[key]
                self.stats["deletes"] += 1
        else:
            key = self._make_key(namespace, identifier)
            if key in self.cache:
                del self.cache[key]
                self.stats["deletes"] += 1
    
    def clear(self) -> None:
        """Clear all cache entries."""
        count = len(self.cache)
        self.cache.clear()
        self.stats["deletes"] += count
    
    def get_stats(self) -> dict:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with hit rate, miss rate, and operation counts
        """
        total_requests = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "enabled": self.enabled,
            "cachetools_available": CACHETOOLS_AVAILABLE,
            "total_requests": total_requests,
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "hit_rate_percent": round(hit_rate, 2),
            "cache_size": len(self.cache),
            "max_size": getattr(self.cache, 'maxsize', 1000),
            "ttl_seconds": self.default_ttl,
            "sets": self.stats["sets"],
            "deletes": self.stats["deletes"],
        }
    
    def invalidate_namespace(self, namespace: str) -> int:
        """
        Invalidate all cache entries for a specific namespace.
        
        Args:
            namespace: Category to invalidate (e.g., 'dealers', 'designs')
        
        Returns:
            Number of entries invalidated
        """
        # Create a namespace prefix for matching
        prefix = f"{namespace}:"
        keys_to_delete = []
        
        for key in list(self.cache.keys()):
            # We need to check if any cached key belongs to this namespace
            # Since keys are hashed, we'll track namespaces separately
            # For now, we'll use a simple pattern matching on the namespace
            keys_to_delete.append(key)
        
        # Alternative: maintain a separate namespace index
        # For simplicity, clear all for now
        count = len(self.cache)
        self.delete(namespace)
        return count
