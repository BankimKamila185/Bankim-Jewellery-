"""
Utility helper functions.
"""

from datetime import datetime, date
from typing import Any, Optional
import re


def format_currency(amount: float, symbol: str = "₹") -> str:
    """Format a number as currency."""
    return f"{symbol}{amount:,.2f}"


def format_date(d: date | datetime | str, format_str: str = "%d/%m/%Y") -> str:
    """Format a date for display."""
    if isinstance(d, str):
        try:
            d = datetime.fromisoformat(d)
        except ValueError:
            return d
    return d.strftime(format_str)


def parse_date(date_str: str) -> Optional[date]:
    """Parse a date string in various formats."""
    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%d %B %Y",
        "%d %b %Y",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    
    return None


def clean_string(s: str) -> str:
    """Clean and normalize a string."""
    if not s:
        return ""
    # Remove extra whitespace
    s = " ".join(s.split())
    # Remove special characters that might break sheets
    s = s.replace("\n", " ").replace("\r", " ").replace("\t", " ")
    return s.strip()


def is_valid_email(email: str) -> bool:
    """Validate email format."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def is_valid_phone(phone: str) -> bool:
    """Validate phone number format (Indian)."""
    # Remove common separators
    phone = re.sub(r"[\s\-\+\(\)]", "", phone)
    # Check if it's a valid Indian number
    return bool(re.match(r"^(91)?[6-9]\d{9}$", phone))


def is_valid_gstin(gstin: str) -> bool:
    """Validate GSTIN format."""
    pattern = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
    return bool(re.match(pattern, gstin.upper()))


def calculate_percentage(value: float, total: float) -> float:
    """Calculate percentage with division by zero protection."""
    if total == 0:
        return 0.0
    return round((value / total) * 100, 2)


def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely convert a value to float."""
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    """Safely convert a value to int."""
    if value is None:
        return default
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default


def truncate_string(s: str, max_length: int = 50, suffix: str = "...") -> str:
    """Truncate a string to max length with suffix."""
    if len(s) <= max_length:
        return s
    return s[:max_length - len(suffix)] + suffix
