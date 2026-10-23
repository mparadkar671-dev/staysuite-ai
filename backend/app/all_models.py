"""Imports every ORM model so Alembic autogenerate and metadata.create_all see them all."""
from app.core import sync_models  # noqa: F401
from app.modules.billing_pos import models as _billing  # noqa: F401
from app.modules.bookings import models as _bookings  # noqa: F401
from app.modules.compliance_kyc import models as _kyc  # noqa: F401
from app.modules.dining_bom import models as _dining  # noqa: F401
from app.modules.properties import models as _properties  # noqa: F401
from app.modules.staff_hr import models as _staff  # noqa: F401
