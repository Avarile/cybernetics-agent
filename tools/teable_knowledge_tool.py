"""Teable Knowledge Base tool — first-class access to the user's
`knowledges` + `knowledge_type` tables on https://projects.avarile.com.

Hides every Teable API wart from the model:
  - filter/orderBy use field IDs internally (model only sees names)
  - soft-delete by default (is_active=true + deleted_at IS NULL)
  - link-field lookups: model passes a type title; we resolve to record id
  - PATCH/POST body shape mismatch absorbed in handlers
  - read-only fields (id, created_at, updated_at) filtered out on writes

Gated by TEABLE_TOKEN env var. Base URL and table IDs are hardcoded —
this is a single-deployment integration, not a generic Teable mount.
"""
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

import requests

from tools.registry import registry, tool_error, tool_result

logger = logging.getLogger(__name__)

# ── Hardcoded deployment constants ────────────────────────────────────────
_BASE = "https://projects.avarile.com"
_TBL_KNOW = "tblVTWb1kxXSFPBq4Fq"  # knowledges
_TBL_TYPE = "tblWcq6Kof1AFHvbC5e"  # knowledge_type

# Field-name → field-id maps. Filter/orderBy require IDs; body uses names.
_FLD_KNOW = {
    "title":          "fldROFj15OlD8COVxX0",
    "context":        "fld5tr2rH8oJXLrjUo9",
    "created_at":     "fldRs8i67CkuzpDyubP",
    "updated_at":     "fldCpv0ts2jxxgQPg7n",
    "deleted_at":     "fldNS9SNNWG07NnBZhE",
    "is_active":      "fldZKMuaBBPd6tIzSG3",
    "id":             "fldNxPGGDuchpHCvz0U",
    "knowledge_type": "fldAEK8ULw9urxE0qiF",
}
_FLD_TYPE = {
    "title":      "fldvL1LqKmEAfNKVBCO",
    "context":    "fldsnpIqBqoYZJxZwI5",
    "created_at": "fldAPzS5RXnhHUrVlmu",
    "updated_at": "fld1TMYMRUBblTyTIuU",
    "deleted_at": "fldMcIaV4FSsuV9OG9J",
    "is_active":  "fldte086UL30roxKKAl",
    "id":         "fldD6MxhSrpatAbHd0k",
    "knowledges": "fldtBWHVokGwcAywjtc",
}
_READ_ONLY = {"id", "created_at", "updated_at"}


def _check_teable() -> bool:
    return bool(os.getenv("TEABLE_TOKEN"))


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {os.environ['TEABLE_TOKEN']}",
        "Content-Type": "application/json",
    }


def _alive_clause(field_map: dict) -> dict:
    """Default 'not soft-deleted' filter: is_active=true AND deleted_at empty."""
    return {
        "conjunction": "and",
        "filterSet": [
            {"fieldId": field_map["is_active"], "operator": "is", "value": True},
            {"fieldId": field_map["deleted_at"], "operator": "isEmpty"},
        ],
    }


def _combine_filters(*clauses: dict) -> dict | None:
    real = [c for c in clauses if c]
    if not real:
        return None
    if len(real) == 1:
        return real[0]
    flat: list = []
    for c in real:
        if c.get("conjunction") == "and" and isinstance(c.get("filterSet"), list):
            flat.extend(c["filterSet"])
        else:
            flat.append(c)
    return {"conjunction": "and", "filterSet": flat}


def _strip_readonly(fields: dict) -> dict:
    return {k: v for k, v in fields.items() if k not in _READ_ONLY}


def _get(table_id: str, params: dict) -> dict:
    r = requests.get(
        f"{_BASE}/api/table/{table_id}/record",
        headers=_headers(), params=params, timeout=30,
    )
    r.raise_for_status()
    return r.json()


def _resolve_type_id(title: str) -> str | None:
    """Look up a knowledge_type record id by its title."""
    if not title:
        return None
    flt = {
        "conjunction": "and",
        "filterSet": [
            {"fieldId": _FLD_TYPE["title"], "operator": "is", "value": title},
            {"fieldId": _FLD_TYPE["is_active"], "operator": "is", "value": True},
        ],
    }
    data = _get(_TBL_TYPE, {
        "fieldKeyType": "name",
        "filter": json.dumps(flt),
        "take": 1,
    })
    recs = data.get("records") or []
    return recs[0]["id"] if recs else None


# ── Schemas ───────────────────────────────────────────────────────────────

KNOWLEDGE_SEARCH_SCHEMA = {
    "name": "knowledge_search",
    "description": (
        "Search the user's personal knowledge base (Teable 'knowledges' "
        "table). This is the FIRST place to check whenever the user asks "
        "anything that might be a saved fact, note, snippet, decision, or "
        "reference they captured previously — before web_search, before "
        "guessing from training data. Returns rows with title + context. "
        "Soft-deleted entries are excluded by default."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": (
                    "Free-text search across all fields. Use the user's own "
                    "phrasing — Teable does substring matching."
                ),
            },
            "type": {
                "type": "string",
                "description": (
                    "Optional knowledge_type title to filter by (e.g. "
                    "'recipes', 'work-notes'). Use knowledge_list_types "
                    "to see available types if unsure."
                ),
            },
            "limit": {"type": "integer", "default": 20, "maximum": 100},
            "skip": {
                "type": "integer", "default": 0,
                "description": "Pagination offset. Add `limit` to advance pages.",
            },
            "include_archived": {
                "type": "boolean", "default": False,
                "description": "Set true ONLY when the user explicitly asks about deleted/archived entries.",
            },
        },
        "required": [],
    },
}

KNOWLEDGE_GET_SCHEMA = {
    "name": "knowledge_get",
    "description": (
        "Fetch one knowledge entry by its record id. Use after "
        "knowledge_search returns a hit and you need the full context. "
        "Also resolves the linked knowledge_type to its title."
    ),
    "parameters": {
        "type": "object",
        "properties": {"record_id": {"type": "string"}},
        "required": ["record_id"],
    },
}

KNOWLEDGE_LIST_TYPES_SCHEMA = {
    "name": "knowledge_list_types",
    "description": (
        "List every active knowledge_type (the taxonomy). Use this when "
        "the user asks 'what categories do I have' or before creating a "
        "new knowledge entry to pick the right type."
    ),
    "parameters": {"type": "object", "properties": {}, "required": []},
}

KNOWLEDGE_CREATE_SCHEMA = {
    "name": "knowledge_create",
    "description": (
        "Add a new entry to the knowledge base. Use whenever the user "
        "asks to 'remember', 'save', 'note down', 'capture', or 'add to "
        "knowledge'. Always set a clear, searchable `title`. Pass the "
        "knowledge_type by title — the tool resolves to a record id."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "title":   {"type": "string", "description": "Required. Short, searchable."},
            "context": {"type": "string", "description": "Body text. Markdown OK."},
            "type":    {"type": "string", "description": "knowledge_type title (optional)."},
        },
        "required": ["title"],
    },
}

KNOWLEDGE_UPDATE_SCHEMA = {
    "name": "knowledge_update",
    "description": (
        "Patch fields on an existing knowledge entry. Only pass the fields "
        "that change. Read-only fields (id, created_at, updated_at) are "
        "silently dropped. Pass `is_active=true` to restore a previously "
        "archived entry — the tool also clears `deleted_at` in that case."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "record_id": {"type": "string"},
            "title":     {"type": "string"},
            "context":   {"type": "string"},
            "type":      {"type": "string", "description": "New knowledge_type title."},
            "is_active": {
                "type": "boolean",
                "description": (
                    "Toggle active state. Pass `true` to restore an archived "
                    "entry (tool also clears deleted_at); pass `false` to "
                    "deactivate without setting deleted_at (use "
                    "knowledge_archive for full soft-delete with timestamp)."
                ),
            },
        },
        "required": ["record_id"],
    },
}

KNOWLEDGE_ARCHIVE_SCHEMA = {
    "name": "knowledge_archive",
    "description": (
        "Soft-delete a knowledge entry: sets is_active=false and "
        "deleted_at=now(). Reversible (PATCH is_active=true to restore). "
        "Always confirm with the user before calling. Use `hard=true` "
        "only when the user explicitly asks to permanently delete."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "record_id": {"type": "string"},
            "hard": {
                "type": "boolean", "default": False,
                "description": "True = physical DELETE (irreversible). Default soft.",
            },
        },
        "required": ["record_id"],
    },
}


# ── Handlers ──────────────────────────────────────────────────────────────

def _handle_search(args: dict, **kw) -> str:
    try:
        params: dict[str, Any] = {
            "fieldKeyType": "name",
            "take": min(int(args.get("limit", 20)), 100),
            "skip": int(args.get("skip", 0)),
            "projection": ["title", "context", "knowledge_type"],
        }
        if q := (args.get("query") or "").strip():
            params["search"] = q

        clauses = []
        if not args.get("include_archived"):
            clauses.append(_alive_clause(_FLD_KNOW))
        if t := (args.get("type") or "").strip():
            type_id = _resolve_type_id(t)
            if not type_id:
                return tool_error(
                    f"knowledge_type '{t}' not found. "
                    "Call knowledge_list_types to see available types."
                )
            clauses.append({
                "conjunction": "and",
                "filterSet": [{
                    "fieldId": _FLD_KNOW["knowledge_type"],
                    "operator": "contains", "value": type_id,
                }],
            })
        if flt := _combine_filters(*clauses):
            params["filter"] = json.dumps(flt)

        params["orderBy"] = json.dumps(
            [{"fieldId": _FLD_KNOW["updated_at"], "order": "desc"}]
        )

        data = _get(_TBL_KNOW, params)
        hits = [
            {"id": r["id"], **(r.get("fields") or {})}
            for r in data.get("records", [])
        ]
        return tool_result(success=True, count=len(hits), records=hits)
    except Exception as e:
        logger.exception("knowledge_search failed")
        return tool_error(f"knowledge_search: {e}")


def _handle_get(args: dict, **kw) -> str:
    try:
        rid = args["record_id"]
        r = requests.get(
            f"{_BASE}/api/table/{_TBL_KNOW}/record/{rid}",
            headers=_headers(), params={"fieldKeyType": "name"}, timeout=15,
        )
        r.raise_for_status()
        payload = r.json()
        rec = payload.get("record") if isinstance(payload, dict) and "record" in payload else payload
        if not isinstance(rec, dict):
            rec = {}
        fields = rec.get("fields") or {}
        type_link = fields.get("knowledge_type") or []
        if type_link and isinstance(type_link, list):
            try:
                t = requests.get(
                    f"{_BASE}/api/table/{_TBL_TYPE}/record/{type_link[0]}",
                    headers=_headers(), params={"fieldKeyType": "name"}, timeout=10,
                ).json()
                tpayload = t.get("record") if isinstance(t, dict) and "record" in t else t
                tfields = (tpayload or {}).get("fields") or {}
                fields["knowledge_type_title"] = tfields.get("title")
            except Exception:
                logger.debug("knowledge_get: failed to resolve type title", exc_info=True)
        return tool_result(success=True, record={"id": rec.get("id", rid), **fields})
    except Exception as e:
        logger.exception("knowledge_get failed")
        return tool_error(f"knowledge_get: {e}")


def _handle_list_types(args: dict, **kw) -> str:
    try:
        data = _get(_TBL_TYPE, {
            "fieldKeyType": "name",
            "filter": json.dumps(_alive_clause(_FLD_TYPE)),
            "projection": ["title", "context"],
            "take": 200,
            "orderBy": json.dumps(
                [{"fieldId": _FLD_TYPE["title"], "order": "asc"}]
            ),
        })
        types = [
            {"id": r["id"], **(r.get("fields") or {})}
            for r in data.get("records", [])
        ]
        return tool_result(success=True, count=len(types), types=types)
    except Exception as e:
        logger.exception("knowledge_list_types failed")
        return tool_error(f"knowledge_list_types: {e}")


def _handle_create(args: dict, **kw) -> str:
    try:
        fields = _strip_readonly({
            "title":     args["title"],
            "context":   args.get("context", ""),
            "is_active": True,
        })
        if t := (args.get("type") or "").strip():
            type_id = _resolve_type_id(t)
            if not type_id:
                return tool_error(
                    f"knowledge_type '{t}' not found. "
                    "Call knowledge_list_types or create the type first."
                )
            fields["knowledge_type"] = [type_id]

        r = requests.post(
            f"{_BASE}/api/table/{_TBL_KNOW}/record",
            headers=_headers(),
            data=json.dumps({
                "fieldKeyType": "name",
                "records": [{"fields": fields}],
            }),
            timeout=30,
        )
        r.raise_for_status()
        payload = r.json() if r.content else {}
        # Surface the new record id at the top level so a follow-up
        # knowledge_update / knowledge_get has a clean handle without the
        # model needing to know Teable's response shape. Defensive about
        # both {records: [...]} and {record: {...}} response variants.
        created_id = None
        if isinstance(payload, dict):
            records = payload.get("records")
            if isinstance(records, list) and records:
                first = records[0]
                if isinstance(first, dict):
                    created_id = first.get("id")
            if not created_id:
                rec = payload.get("record")
                if isinstance(rec, dict):
                    created_id = rec.get("id")
        return tool_result(
            success=True, created_id=created_id, raw=payload,
        )
    except Exception as e:
        logger.exception("knowledge_create failed")
        return tool_error(f"knowledge_create: {e}")


def _handle_update(args: dict, **kw) -> str:
    try:
        rid = args["record_id"]
        fields = _strip_readonly({
            k: v for k, v in args.items()
            if k in {"title", "context"} and v is not None
        })
        if t := (args.get("type") or "").strip():
            type_id = _resolve_type_id(t)
            if not type_id:
                return tool_error(f"knowledge_type '{t}' not found.")
            fields["knowledge_type"] = [type_id]
        # is_active toggle. Restoring (True) also clears deleted_at so the
        # row re-enters default knowledge_search results. Deactivating (False)
        # is intentionally NOT the same as archiving — knowledge_archive is
        # the path that sets deleted_at; bare is_active=false leaves it
        # untouched so the entry stays in any time-range archives the user
        # might be querying.
        if args.get("is_active") is not None:
            fields["is_active"] = bool(args["is_active"])
            if fields["is_active"] is True:
                fields["deleted_at"] = None
        if not fields:
            return tool_error("knowledge_update: nothing to change.")

        r = requests.patch(
            f"{_BASE}/api/table/{_TBL_KNOW}/record/{rid}",
            headers=_headers(),
            data=json.dumps({
                "fieldKeyType": "name",
                "record": {"fields": fields},
            }),
            timeout=30,
        )
        r.raise_for_status()
        return tool_result(success=True, updated=r.json())
    except Exception as e:
        logger.exception("knowledge_update failed")
        return tool_error(f"knowledge_update: {e}")


def _handle_archive(args: dict, **kw) -> str:
    try:
        rid = args["record_id"]
        if args.get("hard"):
            r = requests.delete(
                f"{_BASE}/api/table/{_TBL_KNOW}/record/{rid}",
                headers=_headers(), timeout=15,
            )
            r.raise_for_status()
            return tool_result(success=True, deleted=rid, mode="hard")

        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        r = requests.patch(
            f"{_BASE}/api/table/{_TBL_KNOW}/record/{rid}",
            headers=_headers(),
            data=json.dumps({
                "fieldKeyType": "name",
                "record": {"fields": {"is_active": False, "deleted_at": now}},
            }),
            timeout=15,
        )
        r.raise_for_status()
        return tool_result(success=True, archived=rid, mode="soft", deleted_at=now)
    except Exception as e:
        logger.exception("knowledge_archive failed")
        return tool_error(f"knowledge_archive: {e}")


# ── Registration ──────────────────────────────────────────────────────────
# Top-level register() calls so the AST-based auto-discovery in
# tools/registry.py:_module_registers_tools picks the module up. Loops or
# helper functions are not inspected, so each call must be inline.

registry.register(
    name="knowledge_search",
    toolset="knowledge",
    schema=KNOWLEDGE_SEARCH_SCHEMA,
    handler=_handle_search,
    check_fn=_check_teable,
    emoji="📚",
)

registry.register(
    name="knowledge_get",
    toolset="knowledge",
    schema=KNOWLEDGE_GET_SCHEMA,
    handler=_handle_get,
    check_fn=_check_teable,
    emoji="📚",
)

registry.register(
    name="knowledge_list_types",
    toolset="knowledge",
    schema=KNOWLEDGE_LIST_TYPES_SCHEMA,
    handler=_handle_list_types,
    check_fn=_check_teable,
    emoji="📚",
)

registry.register(
    name="knowledge_create",
    toolset="knowledge",
    schema=KNOWLEDGE_CREATE_SCHEMA,
    handler=_handle_create,
    check_fn=_check_teable,
    emoji="📚",
)

registry.register(
    name="knowledge_update",
    toolset="knowledge",
    schema=KNOWLEDGE_UPDATE_SCHEMA,
    handler=_handle_update,
    check_fn=_check_teable,
    emoji="📚",
)

registry.register(
    name="knowledge_archive",
    toolset="knowledge",
    schema=KNOWLEDGE_ARCHIVE_SCHEMA,
    handler=_handle_archive,
    check_fn=_check_teable,
    emoji="📚",
)
