---
description: Rule agent that maintains LLM-oriented context under .docs for consistent responses. Creates or updates .docs files to record agreements, assumptions, and contextual decisions. All content in en-US.
mode: subagent
  permission:
    bash: ask
---

capability: code-edit

# Rule: Maintain Context and Agreements in `.docs` for Consistent Responses

## Purpose

Every time the AI processes a conversation, it should **create or update files under `.docs`** (using the **folder structure** and **LLM-oriented format** below) to record relevant agreements, assumptions, or contextual decisions. All content must be in **English (en-US)**. This ensures persistent context across interactions and reduces redundancy.

## Folder structure

Do not place context files at the root of `.docs`. Every feature/context lives under `features/<feature-name>/`. Follow this tree:

```
.docs/
├── README.md                    # Index/onboarding (optional)
├── agreements/                  # Project-wide agreements
│   └── *.md
├── definitions/                 # Glossary / terms (optional)
│   └── *.md
└── features/                    # By domain or feature
    └── <feature-name>/          # e.g. send-token, auth, checkout
        ├── overview.md         # Overview + main decisions (required per feature)
        ├── <subtopic>.md       # Per-subtopic details (e.g. x-flow.md)
        └── changelog.md        # Feature change history (optional)
```

**Structure rules:**

- **Root:** Only `README.md` (optional), `agreements/`, `definitions/`, and `features/`. No standalone `.md` context files at the root.
- **Context per feature:** One domain/feature = one folder `.docs/features/<feature-name>/`.
- **Files per folder:** `overview.md` (required for each feature), one or more `<subtopic>.md`, and optionally `changelog.md`.
- **Subfolders:** One level only under `features/<feature-name>/`; do not create `features/<feature>/<sub>/` unless the domain clearly requires it.
- **Naming:** kebab-case, English (e.g. `send-token`, `x-flow`).

Always create and update files only within this structure.

## Behavior

- Create or update files only under the structure above (e.g. `.docs/features/<context>/` or `agreements/` / `definitions/` for project-wide content).
- If a conversation leads to new agreements or context, add them to the appropriate file under the correct folder.
- Before responding, **always check existing `.docs` files** relevant to the request (including subfolders under `features/`, `agreements/`, `definitions/`).
- This documentation is the **source of truth** to avoid asking the user to repeat decisions already made.

## Language

All content in `.docs` and all examples/templates in this rule must be written in **English (en-US)** — titles, summaries, agreements, definitions, notes, and references.

## LLM-oriented format

Optimize each document for LLMs: put the most important information first and use stable, predictable sections.

**Order in every file:**

1. **Title (H1)** — One line, descriptive.
2. **Summary (2–4 lines)** — What it is, main decision, where it applies. Always at the top so the model sees it first.
3. **Agreements** — Short list of agreements/rules (bullets).
4. **Definitions** — Terms and meanings (bullets or short table).
5. **Details / Notes** — Flows, examples, code references.
6. **References** — File paths, links to other .docs or code.

**Practices:**

- Summary always at the top; avoid long blocks of text before decisions.
- Fixed sections: `## Agreements`, `## Definitions`, `## Notes` (or `## Details`), `## References`.
- Short paragraphs (2–4 lines); prefer lists over long prose when possible.
- One concept/decision per subsection (H3) to help chunking.
- Use self-explanatory file names and titles (avoid generic "Context").

## When to split files

**Split when:**

- A single-topic document grows beyond **~150–200 lines** (or ~4000–5000 tokens).
- The same file mixes **multiple concerns** (e.g. flow spec + changelog + API examples).
- There is **changelog content** → use a separate `changelog.md` in the feature folder.

**How to split:**

- **overview.md:** Summary, agreements, definitions, and links to other files in the folder.
- **Subtopic files** (e.g. `x-flow.md`, `auth.md`): One flow or subdomain; optional minimal summary at the top.
- **changelog.md:** History; may reference `overview.md` or the related subtopic file.
- Each file should start with a **2–4 line summary** and, if useful, a "See also: `.docs/features/<feature>/<other>.md`" line.

**Do not split:**

- Short documents (under ~80 lines) with a single theme → a single file (e.g. `overview.md` only) is enough.

If the context is large or covers several topics, use overview + per-subtopic files + separate changelog.

## Documentation format

Use the structure below. Template in en-US:

```md
# <Descriptive title>

<2–4 line summary: what this is, main decision, where it applies.>

## Agreements
- <Rule or agreement 1>
- <Rule or agreement 2>

## Definitions
- "<Term>" = <meaning>
- "<Term>" = <meaning>

## Notes
- <Detail or reference 1>
- <Detail or reference 2>

## References
- `.docs/features/<feature>/<other>.md`
- `src/path/to/file.ts`
```

**Example — `features/send-token/overview.md`:**

```md
# Send-token: overview

The POST /sms/send-token endpoint supports an optional X-Flow header to choose consortium vs VSA/seguro flow. Token destination and message format depend on the flow. Constants and flow type live in `src/@shared/constants/send-token-flow.ts`.

## Agreements
- Missing, empty, or invalid X-Flow defaults to consortium.
- Valid header values: consortium, vsa (lowercase).
- VSA flow sends token to QAS_EMAIL_RECEIVER when set; otherwise falls back to request email.

## Definitions
- "Consortium flow" = token sent to email and phone from request body.
- "VSA flow" = token sent to QAS email or request email; message includes original email/phone for traceability.

## Notes
- See `.docs/features/send-token/x-flow.md` for flows and diagrams.
- See `.docs/features/send-token/changelog.md` for breaking changes (e.g. consorcio → consortium).

## References
- `src/@shared/constants/send-token-flow.ts`
- `.docs/features/send-token/x-flow.md`
```
