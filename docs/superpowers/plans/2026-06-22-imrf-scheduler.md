# IMRF 2026 Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone IMRF 2026 conference scheduler as a rebranded copy of the VSS 2026 Expo app, driven by `assets/imrf-data.json` extracted from the abstract booklet PDF.

**Architecture:** Copy the VSS Expo/React-Native app into `imrf-scheduler/`, rebrand it (icons already generated, app.json, strings, PWA wiring), then write a reproducible Python parser (`scripts/parse_imrf.py`) that turns the booklet PDF into a flat JSON array matching the VSS schema plus `presenter`/`organizer`/`bio` fields. Extraction is Hybrid: the parser does structural segmentation + field extraction with validation, then a manual spot-check/fix pass.

**Tech Stack:** Expo SDK 56, React Native, React Navigation, AsyncStorage (app); Python 3 + poppler `pdftotext` + Pillow (tooling).

**Reference paths:**
- VSS app (source to copy): `/Users/mark_macbookair/vss-scheduler`
- IMRF project (target): `/Users/mark_macbookair/imrf-scheduler`
- Source PDF: `/Users/mark_macbookair/Downloads/Abstract_Booklet_v1.pdf`
- Spec: `/Users/mark_macbookair/imrf-scheduler/docs/superpowers/specs/2026-06-22-imrf-scheduler-design.md`

**Conventions used throughout:**
- Dates → day: `2026-06-24`=Wednesday, `06-25`=Thursday, `06-26`=Friday, `06-27`=Saturday.
- Times → 24h: `1:45 pm`→`13:45`, `9:00 am`→`09:00`.
- IMRF web base path / slug: `imrf-2026-scheduler` (replaces VSS `vss-2026-scheduler`).
- App name: `IMRF 2026 Scheduler`; short name: `IMRF 2026`; theme color `#ffffff`.
- Commit after every task. Run all `git`/`python3`/`npx` commands from `/Users/mark_macbookair/imrf-scheduler` unless stated.

---

## File Structure

Files created or modified, by responsibility:

- `scripts/parse_imrf.py` — PDF → `assets/imrf-data.json`. The crux of the project. One file, functions per content type + validation.
- `scripts/make_icons.py` — already exists (icon generation).
- `assets/imrf-data.json` — generated data (the primary deliverable).
- `assets/icon.png`, `assets/adaptive-icon.png`, `assets/favicon.png`, `public/icons/*` — already exist (IMRF logo).
- App files copied from VSS, then edited: `App.js`, `app.json`, `package.json`, `src/context/DataContext.js`, `src/config/environment.js`, `src/screens/*`, `src/components/*`, `public/sw.js`, `.github/workflows/deploy-web.yml`, `docs/index.md`, `docs/_config.yml`, `README.md`.

---

## Task 1: Scaffold the app by copying the VSS source (preserving IMRF icons/spec)

**Files:**
- Create (copy): all VSS app source into `/Users/mark_macbookair/imrf-scheduler/`
- Preserve: existing `assets/icon.png`, `assets/adaptive-icon.png`, `assets/favicon.png`, `assets/imrf-logo-source.png`, `public/icons/*`, `scripts/make_icons.py`, `docs/superpowers/*`

- [ ] **Step 1: Copy VSS app files, excluding cruft and VSS-only data**

Run from `/Users/mark_macbookair/imrf-scheduler`:
```bash
rsync -a \
  --exclude '.git' --exclude 'node_modules' --exclude '.expo' \
  --exclude 'older_files' --exclude '.DS_Store' \
  --exclude 'assets/vss-data.json' \
  --exclude 'assets/icon.png' --exclude 'public/icons' \
  --exclude 'VSS_2026_*' --exclude 'vss-scheduler-qr.png' --exclude 'vss-web-qr.png' \
  --exclude 'docs/superpowers' \
  /Users/mark_macbookair/vss-scheduler/ /Users/mark_macbookair/imrf-scheduler/
```

- [ ] **Step 2: Verify IMRF icons and spec survived, VSS data did not copy**

Run:
```bash
ls assets/icon.png public/icons/icon-192.png assets/imrf-logo-source.png docs/superpowers/specs/*.md
test ! -f assets/vss-data.json && echo "OK: no vss-data.json"
ls App.js app.json src/context/DataContext.js
```
Expected: all listed files present; "OK: no vss-data.json" printed.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Scaffold IMRF app from VSS source (icons/spec preserved)"
```

---

## Task 2: Rebrand app.json (name, slug, base path, theme, icons)

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Replace VSS identifiers with IMRF**

Edit `app.json` to set these exact values (leave structure otherwise intact):
- `expo.name`: `"IMRF 2026 Scheduler"`
- `expo.slug`: `"imrf-2026-scheduler"`
- `expo.version`: `"1.0.0"`
- `expo.icon`: `"./assets/icon.png"` (unchanged path, new image)
- `expo.web.baseUrl`: `"/imrf-2026-scheduler"`
- `expo.web.favicon`: `"./assets/icon.png"`
- `expo.web.name`: `"IMRF 2026 Scheduler"`
- `expo.web.shortName`: `"IMRF 2026"`
- `expo.web.description`: `"Search and organize your IMRF 2026 (Genova, June 24–27) conference schedule with full-text search, day/type filters, and calendar export."`
- `expo.web.themeColor`: `"#ffffff"`
- `expo.web.backgroundColor`: `"#ffffff"`
- `expo.web.startUrl`: `"/imrf-2026-scheduler/"`
- `expo.web.scope`: `"/imrf-2026-scheduler/"`
- `expo.android.adaptiveIcon.backgroundColor`: `"#ffffff"`
- Remove `expo.extra.eas`, `expo.owner`, `expo.updates`, and `expo.runtimeVersion` (VSS-specific EAS project; not needed for the standalone build).

- [ ] **Step 2: Validate JSON parses**

Run:
```bash
python3 -c "import json; json.load(open('app.json')); print('app.json valid')"
```
Expected: `app.json valid`

- [ ] **Step 3: Commit**

```bash
git add app.json
git commit -m "Rebrand app.json to IMRF 2026"
```

---

## Task 3: Rebrand PWA wiring (sw.js, deploy workflow, apple-touch-icon)

**Files:**
- Modify: `public/sw.js`
- Modify: `.github/workflows/deploy-web.yml`

- [ ] **Step 1: Update service worker cache name and base path**

In `public/sw.js`: change `const CACHE_NAME = 'vss-2026-v1.7.1';` to `const CACHE_NAME = 'imrf-2026-v1.0.0';` and replace every `/vss-2026-scheduler/` with `/imrf-2026-scheduler/`.

- [ ] **Step 2: Update deploy workflow base path, apple-touch-icon, and manifest icons**

In `.github/workflows/deploy-web.yml`:
- Replace every `/vss-2026-scheduler/` with `/imrf-2026-scheduler/`.
- Change the apple-touch-icon line to use the dedicated 180px icon:
  `'<link rel="apple-touch-icon" href="/imrf-2026-scheduler/icons/apple-touch-icon.png">\n'`
- Change `apple-mobile-web-app-title` content from `VSS 2026` to `IMRF 2026`.
- In the manifest icons block, set the 192/512 `src` paths to the `/imrf-2026-scheduler/icons/...` paths.

- [ ] **Step 3: Verify no stale VSS base paths remain in PWA wiring**

Run:
```bash
grep -rn 'vss-2026-scheduler\|VSS 2026' public/sw.js .github/workflows/deploy-web.yml || echo "OK: clean"
```
Expected: `OK: clean`

- [ ] **Step 4: Commit**

```bash
git add public/sw.js .github/workflows/deploy-web.yml
git commit -m "Rebrand PWA service worker and deploy workflow to IMRF"
```

---

## Task 4: Rebrand app code strings and data import

**Files:**
- Modify: `src/context/DataContext.js`
- Modify: `package.json`
- Modify: `App.js`, `src/config/environment.js`, `src/screens/*.js`, `src/components/*.js` (user-facing `VSS`→`IMRF` strings only)

- [ ] **Step 1: Point DataContext at the IMRF data file**

In `src/context/DataContext.js`: change `import vssData from '../../assets/vss-data.json';` to `import imrfData from '../../assets/imrf-data.json';` and change `setAllSessions(vssData);` to `setAllSessions(imrfData);`.

- [ ] **Step 2: Create a placeholder data file so the import resolves before parsing**

Run:
```bash
echo "[]" > assets/imrf-data.json
```

- [ ] **Step 3: Update package.json name**

In `package.json`: set `"name": "imrf-2026-scheduler"`. Leave dependencies unchanged.

- [ ] **Step 4: Replace user-facing VSS strings**

In `App.js`, `src/config/environment.js`, and each file under `src/screens/` and `src/components/`, replace user-facing occurrences of `VSS 2026` → `IMRF 2026` and standalone `VSS` (in display text, headers, titles, share/export labels, install-prompt copy) → `IMRF`. Update any hardcoded presentation count (e.g. `1,191`) to a neutral phrase like `the program` (exact count is set after parsing in Task 11). Do **not** rename code identifiers/variables — only string literals shown to users.

- [ ] **Step 5: Verify no user-facing VSS strings remain in app code**

Run:
```bash
grep -rn 'VSS' App.js src/ || echo "OK: no VSS strings in app code"
```
Expected: `OK: no VSS strings in app code` (or only non-user-facing matches you intentionally kept — review each).

- [ ] **Step 6: Commit**

```bash
git add App.js package.json src/ assets/imrf-data.json
git commit -m "Rebrand app strings to IMRF and wire imrf-data import"
```

---

## Task 5: Parser foundation — PDF→text, helpers, section split, validation harness

**Files:**
- Create: `scripts/parse_imrf.py`

- [ ] **Step 1: Write the parser foundation**

Create `scripts/parse_imrf.py` with shared helpers and section segmentation. This file grows in later tasks; start with:

```python
#!/usr/bin/env python3
"""Parse the IMRF 2026 abstract booklet PDF into assets/imrf-data.json.

Reproducible: PDF in -> JSON out. Run from project root:
    python3 scripts/parse_imrf.py
Requires poppler `pdftotext` on PATH.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF = Path("/Users/mark_macbookair/Downloads/Abstract_Booklet_v1.pdf")
OUT = ROOT / "assets" / "imrf-data.json"

DATE_BY_DAY = {
    "JUNE 24": ("Wednesday", "2026-06-24"),
    "JUNE 25": ("Thursday", "2026-06-25"),
    "JUNE 26": ("Friday", "2026-06-26"),
    "JUNE 27": ("Saturday", "2026-06-27"),
}

# lines that are page furniture and must be dropped before parsing entries
NOISE_RE = re.compile(
    r"^\s*\d{1,3}\s*$"                       # bare page numbers
    r"|^\s*(SYMPOSIUM LIST|TALK SESSIONS|POSTER SESSIONS|KEYNOTE SPEAKERS)\s*$"
    r"|^\s*(SYMPOSIUM|POSTER SESSION|KEYNOTE)\s+\d+\s*$"  # repeated footers
    r"|JUNE \d+th \| .*(AM|PM)\s*$",          # repeated date/time footers
    re.IGNORECASE,
)


def pdf_text() -> str:
    return subprocess.run(
        ["pdftotext", "-layout", str(PDF), "-"],
        capture_output=True, text=True, check=True,
    ).stdout


def to_24h(t: str) -> str:
    """'1:45 pm' / '9:00 am' -> '13:45' / '09:00'. Returns '' if unparseable."""
    m = re.match(r"\s*(\d{1,2})[:.](\d{2})\s*(am|pm)", t.strip(), re.IGNORECASE)
    if not m:
        return ""
    h, mn, ap = int(m.group(1)), m.group(2), m.group(3).lower()
    if ap == "pm" and h != 12:
        h += 12
    if ap == "am" and h == 12:
        h = 0
    return f"{h:02d}:{mn}"


def parse_header(block: str):
    """Extract (day, date, start, end, room) from a session header block like
    'JUNE 24th | 1:45 pm - 3:00 pm' + a ROOM line. Missing parts -> ''."""
    day = date = start = end = room = ""
    dm = re.search(r"(JUNE \d+)(?:th|st|nd|rd)\s*\|\s*([\d:.]+\s*[ap]m)\s*[-–—]+\s*([\d:.]+\s*[ap]m)", block)
    if dm:
        key = dm.group(1).upper()
        if key in DATE_BY_DAY:
            day, date = DATE_BY_DAY[key]
        start, end = to_24h(dm.group(2)), to_24h(dm.group(3))
    rm = re.search(r"^\s*([A-Z][A-Z ]*ROOM|HALL)\s*$", block, re.MULTILINE)
    if rm:
        room = rm.group(1).strip()
    return day, date, start, end, room


def clean_lines(block: str):
    return [ln for ln in block.splitlines() if not NOISE_RE.search(ln)]


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def parse_author_line(line: str):
    """'Cook Tyler (1), Gacoin Maeva (1) (2), Roberts Kalvin (3)*' ->
    (authors[], author_numbers[], presenter). '*' marks the presenter."""
    authors, numbers, presenter = [], [], ""
    # split on commas that separate authors (each author ends with )( groups)
    parts = [p.strip() for p in re.split(r",(?![^()]*\))", line) if p.strip()]
    for p in parts:
        nums = re.findall(r"\((\d+)\)", p)
        star = "*" in p
        name = norm(re.sub(r"\((\d+)\)|\*", "", p))
        if not name:
            continue
        authors.append(name)
        numbers.append(",".join(nums))
        if star:
            presenter = name
    return authors, numbers, presenter


def parse_affiliations(lines):
    """Lines like '1 - Durham University (United Kingdom)' -> joined '1 - ...; 2 - ...'."""
    affs = []
    for ln in lines:
        if re.match(r"^\s*\d+\s*[-–]\s*\S", ln):
            affs.append(norm(ln))
    return "; ".join(affs)


SECTION_MARKERS = [
    ("keynote", r"\n\s*KEYNOTE SPEAKERS\s*\n"),
    ("symposium", r"\n\s*SYMPOSIUM LIST\s*\n"),
    ("talk", r"\n\s*TALK SESSIONS\s*\n"),
    ("poster", r"\n\s*POSTER SESSIONS\s*\n"),
]


def split_sections(text: str) -> dict:
    """Return {name: text} for each top-level section, in document order."""
    idx = {}
    for name, pat in SECTION_MARKERS:
        m = re.search(pat, text)
        idx[name] = m.start() if m else -1
    ordered = sorted((p, n) for n, p in idx.items() if p >= 0)
    out = {}
    for i, (pos, name) in enumerate(ordered):
        end = ordered[i + 1][0] if i + 1 < len(ordered) else len(text)
        out[name] = text[pos:end]
    return out


def main():
    text = pdf_text()
    sections = split_sections(text)
    entries = []
    entries += parse_keynotes(sections.get("keynote", ""))
    entries += parse_symposia(sections.get("symposium", ""))
    entries += parse_talks(sections.get("talk", ""))
    entries += parse_posters(sections.get("poster", ""))
    entries += parse_workshops(text)
    validate(entries)
    OUT.write_text(json.dumps(entries, ensure_ascii=False, indent=1))
    print(f"wrote {OUT} ({len(entries)} entries)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Add a stubbed parser + validator so the file runs end-to-end**

Append temporary stubs (replaced in Tasks 6–10) so the script imports cleanly:

```python
def parse_keynotes(s): return []
def parse_symposia(s): return []
def parse_talks(s): return []
def parse_posters(s): return []
def parse_workshops(s): return []

def validate(entries):
    from collections import Counter
    kinds = Counter(e["kind"] for e in entries)
    print("counts:", dict(kinds))
```
Place these **above** `main()` in the file (Python resolves names at call time, but keep them defined before `main()` runs for clarity).

- [ ] **Step 3: Run the foundation and confirm sections split**

Run:
```bash
python3 - <<'PY'
import scripts.parse_imrf as p
t = p.pdf_text()
s = p.split_sections(t)
print({k: len(v) for k, v in s.items()})
print("hdr:", p.parse_header("SYMPOSIUM 1\nJUNE 24th | 1:45 pm - 3:00 pm\nSCIROCCO ROOM"))
print("auth:", p.parse_author_line("Cook Tyler (1), Gacoin Maeva (1) (2), Roberts Kalvin (3)*"))
PY
```
Expected: a dict with all four sections having large positive lengths; header prints `('Wednesday', '2026-06-24', '13:45', '15:00', 'SCIROCCO ROOM')`; author parse prints 3 authors, numbers `['1', '1,2', '3']`, presenter `Roberts Kalvin`.

- [ ] **Step 4: Commit**

```bash
git add scripts/parse_imrf.py
git commit -m "Add IMRF parser foundation: pdf text, helpers, section split"
```

---

## Task 6: Parse symposia (overview + individual talks)

**Files:**
- Modify: `scripts/parse_imrf.py` (replace `parse_symposia` stub)

Format recap: each symposium begins `SYMPOSIUM n` / date line / ROOM, then the symposium **title** (1–2 lines), an **organizer** author line ending with `*organizer`, an **overview paragraph**, then repeated `Talk: <title>` / author line / `n - affiliation` lines / abstract.

- [ ] **Step 1: Implement `parse_symposia`**

```python
def parse_symposia(section: str):
    entries = []
    blocks = re.split(r"\n\s*SYMPOSIUM\s+(\d+)\s*\n", section)
    # blocks[0] is preamble; then (num, body) pairs
    for i in range(1, len(blocks), 2):
        num = blocks[i]
        body = "\n".join(clean_lines(blocks[i + 1]))
        day, date, start, end, room = parse_header(body)
        # split overview from talks at the first 'Talk:'
        head, _, rest = body.partition("\nTalk:")
        # symposium title = first non-empty lines after the ROOM line, before organizer line
        head_lines = [l for l in head.splitlines() if l.strip()]
        # drop date/room lines
        head_lines = [l for l in head_lines if not re.search(r"JUNE \d+|ROOM|HALL", l)]
        title_lines, org_line, overview_lines, seen_org = [], "", [], False
        for l in head_lines:
            if "*organizer" in l:
                continue
            if re.search(r"\(\d+\)|\*$", l) and not seen_org and len(title_lines) > 0:
                org_line = l
                seen_org = True
            elif seen_org:
                overview_lines.append(l)
            else:
                title_lines.append(l)
        sym_title = norm(" ".join(title_lines))
        organizers, _, _ = parse_author_line(org_line) if org_line else ([], [], "")
        entries.append({
            "id": f"SYM{num}", "kind": "symposium_overview", "talk_number": None,
            "time": start, "title": sym_title,
            "authors": organizers, "author_numbers": [""] * len(organizers),
            "affiliations": "", "presenter": "", "organizer": norm(org_line.replace("*organizer", "")),
            "bio": "", "abstract": norm(" ".join(overview_lines)),
            "day": day, "date": date, "room": room,
            "session_title": sym_title, "session_kind": "Symposium",
            "session_start": start, "session_end": end,
        })
        # individual talks
        talk_chunks = ("Talk:" + rest).split("\nTalk:")
        tn = 0
        for chunk in talk_chunks:
            chunk = chunk.strip()
            if not chunk or chunk == "Talk:":
                continue
            tn += 1
            entries.append(_parse_talk_chunk(
                chunk.replace("Talk:", "", 1), idprefix=f"SYM{num}.{tn}", talk_number=str(tn),
                kind="symposium", session_title=sym_title, session_kind="Symposium",
                day=day, date=date, room=room, start=start, end=end,
            ))
    return entries
```

- [ ] **Step 2: Add the shared talk-chunk parser**

Add this helper (used by symposia, talks, posters) above `parse_symposia`:

```python
def _parse_talk_chunk(chunk, idprefix, talk_number, kind, session_title,
                      session_kind, day, date, room, start, end, time=""):
    lines = [l for l in chunk.splitlines() if l.strip()]
    # title runs until the first author line (a line containing '(n)')
    title_lines, rest_idx = [], len(lines)
    for j, l in enumerate(lines):
        if re.search(r"\(\d+\)", l) or re.match(r"^\s*\d+\s*[-–]\s*\S", l):
            rest_idx = j
            break
        title_lines.append(l)
    title = norm(" ".join(title_lines))
    author_line = lines[rest_idx] if rest_idx < len(lines) else ""
    aff_lines, abs_start = [], rest_idx + 1
    for j in range(rest_idx + 1, len(lines)):
        if re.match(r"^\s*\d+\s*[-–]\s*\S", lines[j]) or lines[j].strip() in ("*speaker", "*organizer"):
            aff_lines.append(lines[j])
            abs_start = j + 1
        else:
            break
    authors, numbers, presenter = parse_author_line(author_line)
    affiliations = parse_affiliations(aff_lines)
    abstract = norm(" ".join(lines[abs_start:]))
    return {
        "id": idprefix, "kind": kind, "talk_number": talk_number, "time": time,
        "title": title, "authors": authors, "author_numbers": numbers,
        "affiliations": affiliations, "presenter": presenter, "organizer": "",
        "bio": "", "abstract": abstract, "day": day, "date": date, "room": room,
        "session_title": session_title, "session_kind": session_kind,
        "session_start": start, "session_end": end,
    }
```

- [ ] **Step 3: Run and check symposium counts**

Run:
```bash
python3 scripts/parse_imrf.py
python3 -c "import json;d=json.load(open('assets/imrf-data.json'));from collections import Counter;print(Counter(e['kind'] for e in d))"
```
Expected: `symposium` ≈ 51 and `symposium_overview` ≈ 13–15.

- [ ] **Step 4: Spot-check one symposium talk against the PDF**

Run:
```bash
python3 -c "import json;d=json.load(open('assets/imrf-data.json'));e=[x for x in d if x['id']=='SYM1.1'][0];print(e['title']);print(e['authors']);print(e['affiliations']);print(e['abstract'][:200])"
```
Expected: title ≈ "Perceptual and causal confidence in the audiovisual McGurk illusion", authors start with `Noppeney Uta`, affiliations contain `Donders Institute`. If fields are misaligned, adjust the regexes in `_parse_talk_chunk`/`parse_symposia` and re-run before committing.

- [ ] **Step 5: Commit**

```bash
git add scripts/parse_imrf.py assets/imrf-data.json
git commit -m "Parse symposia overviews and talks"
```

---

## Task 7: Parse talk sessions (incl. Young Researcher)

**Files:**
- Modify: `scripts/parse_imrf.py` (replace `parse_talks` stub)

Format recap: `TALK SESSIONS` section contains a `YOUNG RESEARCHER TALK SESSION` and `Talk Session n. <theme>` headers, each with date/ROOM/`Chair:` lines, then `Talk #<id>: <title>` / author line / `n - aff` / abstract.

- [ ] **Step 1: Implement `parse_talks`**

```python
def parse_talks(section: str):
    entries = []
    # split into sessions on either header style
    parts = re.split(r"\n\s*(YOUNG RESEARCHER TALK SESSION|Talk Session\s+\d+\.[^\n]*)\n", section)
    for i in range(1, len(parts), 2):
        header = parts[i].strip()
        body = "\n".join(clean_lines(parts[i + 1]))
        day, date, start, end, room = parse_header(body)
        if header.startswith("YOUNG"):
            sess_no, sess_title = "YR", "Young Researcher Talk Session"
        else:
            m = re.match(r"Talk Session\s+(\d+)\.\s*(.*)", header)
            sess_no, sess_title = m.group(1), norm(m.group(2))
        chunks = re.split(r"\nTalk #([^:]+):", "\n" + body)
        for j in range(1, len(chunks), 2):
            talk_id = chunks[j].strip()
            entries.append(_parse_talk_chunk(
                chunks[j + 1], idprefix=f"T{sess_no}.{talk_id.split('.')[-1]}",
                talk_number=talk_id, kind="talk", session_title=sess_title,
                session_kind="Talk Session", day=day, date=date, room=room,
                start=start, end=end,
            ))
    return entries
```

- [ ] **Step 2: Run and check talk count**

Run:
```bash
python3 scripts/parse_imrf.py
python3 -c "import json;d=json.load(open('assets/imrf-data.json'));print('talks:',sum(1 for e in d if e['kind']=='talk'))"
```
Expected: `talks: 41` (±1; confirm against PDF if off).

- [ ] **Step 3: Spot-check the first Young Researcher talk**

Run:
```bash
python3 -c "import json;d=json.load(open('assets/imrf-data.json'));e=[x for x in d if x['kind']=='talk'][0];print(e['id'],e['talk_number']);print(e['title']);print(e['authors'],e['affiliations'])"
```
Expected: title ≈ "Neural correlates of audiovisual gaze-orienting in common marmosets", authors start `Cook Tyler`.

- [ ] **Step 4: Commit**

```bash
git add scripts/parse_imrf.py assets/imrf-data.json
git commit -m "Parse talk sessions including Young Researcher session"
```

---

## Task 8: Parse poster sessions

**Files:**
- Modify: `scripts/parse_imrf.py` (replace `parse_posters` stub)

Format recap: `POSTER SESSION n` / date / `HALL`, optional theme grouping lines, then `Poster #n.m: <title>` / author line / `n - aff` / abstract. Posters have no individual time (`time=""`).

- [ ] **Step 1: Implement `parse_posters`**

```python
def parse_posters(section: str):
    entries = []
    parts = re.split(r"\n\s*POSTER SESSION\s+(\d+)\s*\n", section)
    for i in range(1, len(parts), 2):
        sess_no = parts[i]
        body = "\n".join(clean_lines(parts[i + 1]))
        day, date, start, end, room = parse_header(body)
        chunks = re.split(r"\nPoster #([^:]+):", "\n" + body)
        for j in range(1, len(chunks), 2):
            pid = chunks[j].strip()
            entries.append(_parse_talk_chunk(
                chunks[j + 1], idprefix=f"P{pid}", talk_number=pid,
                kind="poster", session_title=f"Poster Session {sess_no}",
                session_kind="Poster Session", day=day, date=date, room=room,
                start=start, end=end, time="",
            ))
    return entries
```

- [ ] **Step 2: Run and check poster count**

Run:
```bash
python3 scripts/parse_imrf.py
python3 -c "import json;d=json.load(open('assets/imrf-data.json'));print('posters:',sum(1 for e in d if e['kind']=='poster'))"
```
Expected: `posters: 194` (±2; confirm against PDF if off).

- [ ] **Step 3: Spot-check the first poster**

Run:
```bash
python3 -c "import json;d=json.load(open('assets/imrf-data.json'));e=[x for x in d if x['kind']=='poster'][0];print(e['id']);print(e['title']);print(e['authors']);print(e['affiliations'][:120])"
```
Expected: id `P1.1`, title ≈ "Learning to use a newly functional arm: a developmental perspective", authors start `Cowie Dorothy`, affiliations include `Durham University`.

- [ ] **Step 4: Commit**

```bash
git add scripts/parse_imrf.py assets/imrf-data.json
git commit -m "Parse poster sessions"
```

---

## Task 9: Parse keynotes and workshops

**Files:**
- Modify: `scripts/parse_imrf.py` (replace `parse_keynotes` and `parse_workshops` stubs)

Keynote format recap: `Professor <Name>` / `<Affiliation>` / bio paragraph / `KEYNOTE n` / `JUNE .. | ..` / `ROOM` / `<title>` / abstract.

- [ ] **Step 1: Implement `parse_keynotes`**

```python
def parse_keynotes(section: str):
    entries = []
    # each keynote: bio block precedes 'KEYNOTE n' header
    blocks = re.split(r"\n\s*KEYNOTE\s+(\d+)\s*\n", section)
    for i in range(1, len(blocks), 2):
        num = blocks[i]
        before = blocks[i - 1]
        after = "\n".join(clean_lines(blocks[i + 1]))
        # speaker name + affiliation + bio are the LAST such block before the header
        bl = [l for l in before.splitlines() if l.strip()]
        # find last 'Professor'/'Dr' line as the speaker name
        name, affil, bio = "", "", ""
        for k in range(len(bl) - 1, -1, -1):
            if re.match(r"^(Professor|Dr\.?|Prof\.?)\b", bl[k].strip()):
                name = norm(bl[k])
                affil = norm(bl[k + 1]) if k + 1 < len(bl) else ""
                bio = norm(" ".join(bl[k + 2:]))
                break
        day, date, start, end, room = parse_header(after)
        after_lines = [l for l in after.splitlines() if l.strip()
                       and not re.search(r"JUNE \d+|ROOM|HALL", l)]
        title = norm(after_lines[0]) if after_lines else ""
        abstract = norm(" ".join(after_lines[1:]))
        entries.append({
            "id": f"KN{num}", "kind": "keynote", "talk_number": None, "time": start,
            "title": title, "authors": [name] if name else [],
            "author_numbers": [""] if name else [], "affiliations": affil,
            "presenter": name, "organizer": "", "bio": bio, "abstract": abstract,
            "day": day, "date": date, "room": room, "session_title": f"Keynote {num}",
            "session_kind": "Keynote", "session_start": start, "session_end": end,
        })
    return entries
```

- [ ] **Step 2: Implement `parse_workshops` from the SCHEDULE OF EVENTS text**

Workshops have no full abstracts in the booklet; capture title + presenters from the schedule listing.

```python
def parse_workshops(full_text: str):
    entries = []
    # Pre-conference scientific workshops appear as 'Scientific workshop N'
    for m in re.finditer(
        r"Scientific workshop\s+(\d+)\s*\n\s*(.*?)\.\s*([A-Z][a-z]+ [A-Z][^\n]*)\n",
        full_text, re.DOTALL):
        num, title, presenters = m.group(1), norm(m.group(2)), norm(m.group(3))
        entries.append({
            "id": f"WS{num}", "kind": "workshop", "talk_number": None, "time": "",
            "title": title, "authors": [a.strip() for a in re.split(r",", presenters) if a.strip()],
            "author_numbers": [], "affiliations": "", "presenter": "", "organizer": "",
            "bio": "", "abstract": "", "day": "Wednesday", "date": "2026-06-24",
            "room": "", "session_title": "Pre-conference Scientific Workshops",
            "session_kind": "Workshop", "session_start": "", "session_end": "",
        })
    return entries
```

- [ ] **Step 3: Run and check keynote + workshop counts**

Run:
```bash
python3 scripts/parse_imrf.py
python3 -c "import json;d=json.load(open('assets/imrf-data.json'));from collections import Counter;print(Counter(e['kind'] for e in d))"
```
Expected: `keynote` between 3 and 4; `workshop` ≈ 4. Verify keynote count by checking the PDF Keynote Speakers section (pp. 15–18); if a keynote is missing, widen the name regex (e.g. add `Maria`-style names without a title prefix).

- [ ] **Step 4: Spot-check Keynote 1**

Run:
```bash
python3 -c "import json;d=json.load(open('assets/imrf-data.json'));e=[x for x in d if x['id']=='KN1'][0];print(e['authors'],'|',e['affiliations']);print('TITLE:',e['title']);print('BIO:',e['bio'][:80]);print('ABS:',e['abstract'][:80])"
```
Expected: author `Professor Casey O'Callaghan`, affiliation `Washington University`, title ≈ "What's to fear in losing a sense?", bio mentions Philosophy, abstract present.

- [ ] **Step 5: Commit**

```bash
git add scripts/parse_imrf.py assets/imrf-data.json
git commit -m "Parse keynotes and pre-conference workshops"
```

---

## Task 10: Full validation harness + Hybrid manual-fix pass

**Files:**
- Modify: `scripts/parse_imrf.py` (replace `validate` stub)

- [ ] **Step 1: Implement a strict validator**

Replace the `validate` stub with:

```python
def validate(entries):
    from collections import Counter
    kinds = Counter(e["kind"] for e in entries)
    print("counts:", dict(kinds))
    # required fields per kind
    problems = []
    for e in entries:
        if not e["title"]:
            problems.append((e["id"], "empty title"))
        if e["kind"] in ("symposium", "talk", "poster", "keynote") and not e["abstract"]:
            problems.append((e["id"], "empty abstract"))
        if e["kind"] in ("symposium", "talk", "poster") and not e["authors"]:
            problems.append((e["id"], "no authors"))
        if len(e["authors"]) != len(e["author_numbers"]) and e["kind"] != "keynote":
            problems.append((e["id"], "author/number length mismatch"))
        if e["date"] and e["date"] not in {v[1] for v in DATE_BY_DAY.values()}:
            problems.append((e["id"], f"bad date {e['date']}"))
    # expected-count soft checks
    expect = {"talk": 41, "poster": 194, "symposium": 51}
    for k, n in expect.items():
        if abs(kinds.get(k, 0) - n) > 3:
            problems.append((k, f"count {kinds.get(k,0)} far from expected {n}"))
    if problems:
        print(f"\n{len(problems)} PROBLEMS:")
        for pid, msg in problems[:60]:
            print(f"  {pid}: {msg}")
    else:
        print("validation OK")
    return problems
```

- [ ] **Step 2: Run validation and record problems**

Run:
```bash
python3 scripts/parse_imrf.py 2>&1 | tee /tmp/imrf_validate.txt
```
Expected: counts near `keynote≈4, symposium_overview≈14, symposium≈51, talk≈41, poster≈194, workshop≈4`. Review every problem line.

- [ ] **Step 3: Hybrid fixes — correct garbled entries**

For each problem, open the PDF region (`pdftotext -f <page> -l <page> -layout`) and determine the cause. Fix by either (a) tightening a regex in the parser, or (b) adding a small `OVERRIDES` dict applied at the end of `main()` for one-off corrections the regex can't cleanly handle:

```python
OVERRIDES = {
    # "SYM3.2": {"title": "Corrected title", "abstract": "..."},
}

# in main(), before validate():
by_id = {e["id"]: e for e in entries}
for eid, patch in OVERRIDES.items():
    if eid in by_id:
        by_id[eid].update(patch)
```

Re-run until `validate` reports `validation OK` (or only documented, genuinely-empty workshop abstracts remain). Keep all fixes in the script so the run stays reproducible.

- [ ] **Step 4: Final spot-check across kinds**

Run:
```bash
python3 -c "
import json,random
d=json.load(open('assets/imrf-data.json'))
for k in ['keynote','symposium_overview','symposium','talk','poster','workshop']:
    s=[e for e in d if e['kind']==k]
    print(f'{k}: {len(s)}')
    if s:
        e=random.choice(s); print('  ',e['id'],'|',e['title'][:70])
"
```
Manually verify ≥2 of these printed entries against the PDF.

- [ ] **Step 5: Commit**

```bash
git add scripts/parse_imrf.py assets/imrf-data.json
git commit -m "Add strict validation and finalize parsed IMRF data"
```

---

## Task 11: Install deps, surface new fields, run the app, finalize counts

**Files:**
- Modify: `src/components/SessionDetailModal.js`
- Modify: app strings referencing the program size (from Task 4)

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install
```
Expected: completes without fatal errors (warnings OK).

- [ ] **Step 2: Surface presenter/bio/organizer in the detail modal**

In `src/components/SessionDetailModal.js`, locate where `affiliations`/`authors` render. Add conditional rendering (matching the file's existing style) so that when present:
- `bio` renders under the speaker for keynotes,
- `presenter` is labeled (e.g. "Presenter: <name>") for talks/posters/symposia,
- `organizer` renders for `symposium_overview`.

Use the existing `<Text>`/style patterns in that file; do not introduce new styling conventions. Guard each with `session.<field> ? (...) : null`.

- [ ] **Step 3: Set the program count in app strings**

Get the count and update the placeholder phrase from Task 4 (Step 4) in the relevant screen/component:
```bash
python3 -c "import json;print(len(json.load(open('assets/imrf-data.json'))),'entries')"
```
Replace the neutral phrase with the real number (e.g. "300+ presentations") where the app describes the program.

- [ ] **Step 4: Build the web bundle to confirm the app loads with real data**

Run:
```bash
npx expo export -p web
```
Expected: export completes; `dist/index.html` and `dist/_expo/` produced with no bundling errors. If the import of `assets/imrf-data.json` or a renamed string breaks the build, fix and re-run.

- [ ] **Step 5: Smoke-test the data shape the app consumes**

Run:
```bash
python3 -c "
import json
d=json.load(open('assets/imrf-data.json'))
req={'id','kind','title','authors','affiliations','abstract','day','date','room','session_title','session_kind','session_start','session_end'}
bad=[e['id'] for e in d if not req.issubset(e)]
print('missing-field entries:', bad[:10], 'total', len(bad))
print('days:', sorted({e['day'] for e in d}))
print('kinds:', sorted({e['kind'] for e in d}))
"
```
Expected: `missing-field entries: [] total 0`; days are the four conference days; kinds are the six expected values.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Surface presenter/bio/organizer, finalize counts, verify web build"
```

---

## Task 12: Update README and docs

**Files:**
- Modify: `README.md`, `docs/index.md`, `docs/_config.yml`

- [ ] **Step 1: Rewrite README for IMRF**

Replace VSS specifics in `README.md`: title, conference name/dates (IMRF 2026, Genova, June 24–27), presentation count (from Task 11), base path `/imrf-2026-scheduler/`, and any install/usage URLs. Remove VSS version-history entries that don't apply; start an IMRF v1.0.0 entry. Keep the structure, tech-stack, and PWA sections.

- [ ] **Step 2: Update Jekyll docs landing page**

In `docs/index.md` and `docs/_config.yml`, replace VSS title/description/baseurl with IMRF equivalents (`baseurl: /imrf-2026-scheduler`).

- [ ] **Step 3: Verify no stray VSS references remain repo-wide**

Run:
```bash
grep -rn 'VSS\|vss-2026\|1,191' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=docs/superpowers . || echo "OK: no VSS references"
```
Expected: `OK: no VSS references` (or only intentional ones you can justify).

- [ ] **Step 4: Commit**

```bash
git add README.md docs/index.md docs/_config.yml
git commit -m "Update README and docs for IMRF 2026"
```

---

## Done criteria (from spec)

- `python3 scripts/parse_imrf.py` runs clean; counts ≈ keynotes 4, symposium talks 51, talks 41, posters 194, plus overviews and workshops.
- No entry missing `title`/`authors`/`abstract` (except workshops lacking a booklet abstract).
- ≥2 spot-checks per kind verified against the PDF.
- `npx expo export -p web` succeeds; app renders schedule/search/detail with IMRF data and the new logo.
