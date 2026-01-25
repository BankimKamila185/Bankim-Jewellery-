"""Models package - Pydantic models for API validation."""

from app.models.dealer import (
    Dealer,
    DealerCreate,
    DealerUpdate,
    DealerType,
    DealerCategory,
)
from app.models.designer import (
    Designer,
    DesignerCreate,
    DesignerUpdate,
    ChargeType,
)
# Product model removed in favor of Design+Variant

from app.models.invoice import (
    Invoice,
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceItem,
    InvoiceType,
    PaymentStatus,
)
from app.models.design import (
    Design,
    DesignCreate,
    DesignUpdate,
    DesignStatus,
)
from app.models.variant import (
    Variant,
    VariantCreate,
    VariantUpdate,
    VariantStatus,
    FinishType,
)
