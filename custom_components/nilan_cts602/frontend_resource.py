# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Point the Lovelace resource at the card shipped with this version.

The collection is only updated. A missing resource is left alone, because
creating one before Lovelace has loaded its storage can wipe the others.
"""

from __future__ import annotations

CARD_PATH = "/nilan_cts602-static/nilan-card.js"
# Existing resource on the installation this integration is tested against.
KNOWN_RESOURCE_ID = "76e93f47e5344082b69d7c95bdd17373"


def card_url(version: str) -> str:
    """Static path browsers should fetch."""

    return f"{CARD_PATH}?v={version}"


def pending_resource_updates(items, version: str) -> list[tuple[str, str]]:
    """Resource ids whose URL still points at another card version."""

    target = card_url(version)
    updates: list[tuple[str, str]] = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        url = str(item.get("url") or "")
        item_id = str(item.get("id") or "")
        if CARD_PATH not in url and item_id != KNOWN_RESOURCE_ID:
            continue
        if not item_id or url == target:
            continue
        updates.append((item_id, target))
    return updates
