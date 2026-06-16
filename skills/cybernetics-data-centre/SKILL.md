---
name: cybernetics-data-centre
description: >
  The user's personal knowledge base. ALWAYS search here FIRST whenever
  the user asks about a fact, decision, snippet, recipe, reference, or
  anything that sounds like recall ("what did I save about X", "remind
  me how I do Y", "find my note on Z") — before web_search, before
  answering from training data, before asking. Also use to save new
  entries when the user says remember/save/note/capture.
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [knowledge, teable, data-source, recall, notes]
    requires_env: [TEABLE_TOKEN]
---

# Personal Knowledge Base

The user maintains their own structured knowledge base in Teable at
`projects.avarile.com`. Two tables:

- **knowledges** — individual entries: `title`, `context`, `knowledge_type`
- **knowledge_type** — the taxonomy (one type → many knowledges)

Treat this as the user's **first-party source of truth**. The user
curated it deliberately; web search and training-data answers are
fallbacks, not defaults.

## Decision flow — when to reach for which tool

**Recall ("what do I have about X?", "find my note on Y", "did I save Z?")**
1. `knowledge_search(query="<user's phrasing>")` — start broad.
2. If 0 hits, try a synonym before declaring nothing exists.
3. If many hits, narrow with `type=<category>`. Call
   `knowledge_list_types` first if you don't know the categories.
4. For a specific hit, `knowledge_get(record_id=...)` returns the full
   context plus resolves the linked knowledge_type title.

**Capture ("remember this", "save", "note down", "add to knowledge")**
1. `knowledge_list_types` — find the right category, don't invent one.
2. `knowledge_create(title=..., context=..., type=<type title>)`.
3. Make the `title` searchable — short, keyword-rich, the way the user
   will look for it later. Not a sentence.
4. If no category fits, ask the user whether to skip the type or
   create a new one (creating a new type is a separate decision worth
   confirming).

**Update ("change the entry for X", "fix that note")**
1. `knowledge_search` to find the record, then `knowledge_get` to read
   the current state. Always show the user the current value before
   patching — silent edits to their KB destroy trust.
2. `knowledge_update(record_id=..., <changed fields>)`.

**Delete ("remove that", "I don't need it anymore")**
- Default to `knowledge_archive(record_id=...)` — soft delete is
  reversible: `knowledge_update(record_id=..., is_active=true)` brings
  it back (the tool also clears `deleted_at` automatically).
- Only pass `hard=true` if the user explicitly says "permanently
  delete" / "purge" / "remove for real". Always confirm by repeating
  the title back before the call.

**Restore ("bring back X", "undelete that note")**
1. `knowledge_search(query="<title>", include_archived=true)` — archived
   rows are hidden by default; this flag surfaces them.
2. `knowledge_update(record_id=..., is_active=true)` — restores and
   clears `deleted_at` in one call.

## Hard rules

1. **Search first, answer second.** Do not answer a recall question
   from training data without checking the KB. Even a 0-hit search is
   a meaningful signal ("you don't have anything saved about X yet —
   want me to add one?").
2. **One synonym before "I can't find it."** Models often phrase
   differently than the user did. If the literal query misses, try one
   synonym or a broader term before saying no.
3. **Confirm before destructive writes.** `knowledge_archive` and any
   `knowledge_update` that changes existing content needs an OK from
   the user — show the current value, the proposed value, then act.
4. **Don't dump fields the user didn't ask for.** `knowledge_search`
   returns title + context + type. That's usually enough to answer.
   Don't fetch all fields with `knowledge_get` unless you actually
   need them.

## Boundary — knowledge vs memory vs skills

| Use… | When |
|---|---|
| `knowledge_*` | Topical facts and references the user has curated (notes, snippets, decisions, recipes). Searchable, taxonomic, the user reviews them. |
| `memory` | Persona facts about the user (their role, preferences, work style). Background context, not retrieval. |
| `skills` | How to do a class of task. Workflows, conventions, pitfalls. |

If unsure: a thing the user looks up = knowledge; a thing the agent
should just know about the user = memory; a thing about *how to do
something* = a skill.

## Pitfalls (already absorbed by the tool — do not work around)

- The tool handles the Teable field-id-vs-name split. Pass field
  *names* in your tool calls; never construct `fld…` ids.
- `knowledge_search` excludes soft-deleted rows by default. Pass
  `include_archived=true` only if the user explicitly asks about
  archived entries.
- Linking by type: pass the type *title*, not a record id. The tool
  resolves it (and tells you if the title doesn't exist).
- Pagination is `skip` + `limit`. To page, add `limit` to the previous
  `skip`. Max 100 per call from this tool.
- PATCH (update) uses a singular record envelope; POST (create) uses
  a records array. The tool absorbs this — you only pass field name/values.
