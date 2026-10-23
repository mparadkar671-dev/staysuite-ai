"""Category plugin loader: JSON schemas that seed `properties.business_config`."""
import json
from copy import deepcopy
from functools import lru_cache
from pathlib import Path

from app.core.enums import BusinessCategory

_PLUGIN_DIR = Path(__file__).parent


@lru_cache
def _load(category: BusinessCategory) -> dict:
    with (_PLUGIN_DIR / f"{category.value.lower()}.json").open(encoding="utf-8") as fh:
        return json.load(fh)


def load_plugin(category: BusinessCategory) -> dict:
    """Returns a fresh copy so callers can mutate it safely."""
    return deepcopy(_load(category))


def default_business_config(category: BusinessCategory) -> dict:
    return load_plugin(category)
