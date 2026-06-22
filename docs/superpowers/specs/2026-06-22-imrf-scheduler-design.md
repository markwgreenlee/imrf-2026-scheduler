# IMRF 2026 Scheduler — Design Spec

**Date:** 2026-06-22
**Status:** Approved (design), pending spec review
**Source data:** `/Users/mark_macbookair/Downloads/Abstract_Booklet_v1.pdf` (IMRF 2026 Abstract Booklet v1, 196 pp.)
**Model project:** `/Users/mark_macbookair/vss-scheduler` (VSS 2026 Scheduler — Expo / React Native app)

## Goal

Produce a standalone conference scheduler for the **International Multisensory
Research Forum (IMRF) 2026** (Genova, **June 24–27, 2026**, Wed–Sat), built as a
rebranded copy of the VSS 2026 Scheduler app, driven by a new
`assets/imrf-data.json` extracted from the abstract booklet PDF.

The **primary deliverable** is `imrf-data.json` in the same field structure used
by the VSS app, so the existing UI code (schedule, search, session detail,
selected-sessions, export, PWA) works with minimal changes.

## Location

`imrf-scheduler/` is created as a **sibling** of `vss-scheduler`, i.e.
`/Users/mark_macbookair/imrf-scheduler/`, with its own git repo — parallel to how
`vss-scheduler` is its own project. (Not nested inside the VSS repo, to avoid
tangling `node_modules` and git history.)

## Scope (confirmed)

Full app, all content types, PDF author order, and added presenter/organizer/bio
fields.

Expected entry counts (from PDF, to be validated during parsing):

| Content type | Sessions | Entries |
|---|---|---|
| Keynotes | — | ~3–4 keynote lectures |
| Symposia (overview entries) | ~13–15 | one overview each |
| Symposium talks | — | 51 individual talks |
| Talk sessions | 6 | 41 talks (incl. Young Researcher session) |
| Poster sessions | 5 | 194 posters |
| Workshops | — | 4 scientific workshops + networking workshops |

Total ≈ 290 abstract entries plus ~13–15 symposium-overview entries.

## Data schema — `assets/imrf-data.json`

A single flat JSON array of entry objects. Field names mirror the VSS schema
(`id`, `kind`, `talk_number`, `time`, `title`, `authors`, `author_numbers`,
`affiliations`, `abstract`, `day`, `date`, `room`, `session_title`,
`session_kind`, `session_start`, `session_end`) so existing app code keeps
working, plus three new optional fields (`presenter`, `organizer`, `bio`).

| field | type | notes |
|---|---|---|
| `id` | string | `KN1`; `SYM1` (overview); `SYM1.2` (symposium 1 / talk 2); `T1.3` (talk-session 1 / talk 3); `P1.45` (poster-session 1 / poster 45); `WS1` (workshop) |
| `kind` | string | `keynote` \| `symposium_overview` \| `symposium` \| `talk` \| `poster` \| `workshop` |
| `talk_number` | string\|null | within-session order; `null` for overviews/posters where N/A |
| `time` | string | individual start time `"HH:MM"` (24h) when known; `""` when not individually timed (e.g. posters) |
| `title` | string | full title (multi-line titles in the PDF are joined to one line) |
| `authors` | string[] | **"Lastname Firstname"** order exactly as printed in the booklet |
| `author_numbers` | string[] | per-author affiliation indices, e.g. `["1","1,2"]`; aligned 1:1 with `authors` |
| `affiliations` | string | numbered affiliation list, `"1 - Durham University (United Kingdom); 2 - …"` |
| `presenter` | string | the starred `*speaker`/presenter name; `""` if none marked |
| `organizer` | string | symposium organizer(s) (`*organizer`); used on `symposium_overview` entries; `""` otherwise |
| `bio` | string | keynote speaker bio (keynote entries only); `""` otherwise |
| `abstract` | string | full abstract text, whitespace-normalized |
| `day` | string | `Wednesday` / `Thursday` / `Friday` / `Saturday` |
| `date` | string | `2026-06-24` … `2026-06-27` |
| `room` | string | e.g. `SCIROCCO ROOM`, `PONENTE ROOM`, `HALL` |
| `session_title` | string | talk/poster session theme, or symposium title |
| `session_kind` | string | `Keynote` \| `Symposium` \| `Talk Session` \| `Poster Session` \| `Workshop` |
| `session_start` | string | session start `"HH:MM"` (24h) |
| `session_end` | string | session end `"HH:MM"` (24h) |

Notes:
- Times normalized to 24-hour (`1:45 pm` → `13:45`).
- Date→day-of-week: 2026-06-24=Wed, 06-25=Thu, 06-26=Fri, 06-27=Sat.
- Session timing/room come from the per-section headers in the abstract booklet
  (e.g. `JUNE 24th | 1:45 pm – 3:00 pm` / `SCIROCCO ROOM`), cross-checked against
  the SCHEDULE OF EVENTS section (pp. 5–10).

## Extraction strategy — Hybrid (C)

`imrf-scheduler/scripts/parse_imrf.py`:

1. Convert PDF → text with `pdftotext -layout` (poppler).
2. Segment into top-level sections: Keynote Speakers, Symposium List, Talk
   Sessions, Poster Sessions, Workshops.
3. Within each section, split into sessions using header patterns
   (`SYMPOSIUM n`, `Talk Session n.`, `POSTER SESSION n`, `KEYNOTE n`,
   `Scientific workshop n`), capturing each session's date/time/room/title.
4. Within each session, split into entries by entry-marker patterns
   (`Talk:`, `Talk #X.Y:`, `Poster #X.Y:`, keynote header block), and for each:
   strip repeated page headers/footers, then parse title → author line →
   affiliation lines (`n - …`) → presenter star → abstract body.
5. Emit `assets/imrf-data.json` and print a validation report (counts per kind,
   any entries missing required fields).
6. **Hybrid step:** review the validation report and spot-check a sample of each
   kind against the PDF; hand-fix the small number of entries the parser garbles
   (correction overrides applied in the script so the run stays reproducible).

The script is re-runnable: PDF in → JSON out, deterministic.

## App rebranding scope

Copy the VSS app into `imrf-scheduler/`, then:
- `DataContext.js`: import `imrf-data.json` instead of `vss-data.json`.
- `app.json`: name/slug → IMRF; update title/description.
- User-facing strings: `VSS 2026` → `IMRF 2026`; conference dates and rooms.
- README and docs: IMRF specifics.
- Keep PWA (service worker, manifest, install prompt) and overall structure.
- Surface new fields (`presenter`, `bio`, `organizer`) in the session-detail view
  where present; leave other components unchanged.

Deep UI logic, navigation, search, and export are reused as-is.

## Validation / done criteria

- `parse_imrf.py` runs clean and prints counts matching expectations
  (keynotes ≈ 4, symposium talks = 51, talks = 41, posters = 194, plus
  symposium overviews and workshops).
- No entry missing `title`, `authors`, or `abstract` (except workshops that
  genuinely lack a full abstract in the booklet).
- Manual spot-check of ≥2 entries per kind against the PDF passes.
- App launches (web) and renders the IMRF schedule, search, and session detail.

## Out of scope

- Publishing/deploying the app or store submission.
- Changes to VSS scheduler itself.
- Any content not present in the booklet PDF.
