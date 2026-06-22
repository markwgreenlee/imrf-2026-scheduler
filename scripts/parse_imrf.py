#!/usr/bin/env python3
"""Parse the IMRF 2026 abstract booklet PDF into assets/imrf-data.json.

Reproducible: PDF in -> JSON out. Run from project root:
    python3 scripts/parse_imrf.py
Requires poppler `pdftotext` on PATH.

Sections (in document order): KEYNOTE SPEAKERS, PRE-CONFERENCE SCIENTIFIC
WORKSHOPS, SYMPOSIUM LIST, TALK SESSIONS, POSTER SESSIONS. Networking workshops
(p.195) are not abstract entries and are skipped.
"""
import json
import re
import subprocess
from collections import Counter
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
VALID_DATES = {v[1] for v in DATE_BY_DAY.values()}

# Lines that are page furniture and must be dropped before parsing entries.
NOISE_RE = re.compile(
    r"^\s*\d{1,3}\s*$"                                     # bare page numbers
    r"|^\s*(SYMPOSIUM LIST|TALK SESSIONS|POSTER SESSIONS|KEYNOTE SPEAKERS)\s*$"
    r"|^\s*(SYMPOSIUM|POSTER SESSION|KEYNOTE|TALK SESSION|SCIENTIFIC WORKSHOP)\s+\d+\s*$"
    r"|^\s*PRE-CONFERENCE SCIENTIFIC( WORKSHOPS)?\s*$"
    r"|^\s*WORKSHOPS\s*$"
    r"|^\s*YOUNG RESEARCHER TALK SESSION\s*$"
    r"|JUNE \d+(?:th|st|nd|rd)? \| .*[APap][Mm]\s*$",      # repeated date/time footers
)


def pdf_text() -> str:
    return subprocess.run(
        ["pdftotext", "-layout", str(PDF), "-"],
        capture_output=True, text=True, check=True,
    ).stdout


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def to_24h(t: str) -> str:
    """'1:45 pm' / '9:00 am' -> '13:45' / '09:00'. '' if unparseable."""
    m = re.match(r"\s*(\d{1,2})[:.](\d{2})\s*([ap])m", t.strip(), re.IGNORECASE)
    if not m:
        return ""
    h, mn, ap = int(m.group(1)), m.group(2), m.group(3).lower()
    if ap == "p" and h != 12:
        h += 12
    if ap == "a" and h == 12:
        h = 0
    return f"{h:02d}:{mn}"


def parse_header(block: str):
    """(day, date, start, end, room) from a session header block. '' for missing."""
    day = date = start = end = room = ""
    dm = re.search(
        r"(JUNE \d+)(?:th|st|nd|rd)\s*\|\s*([\d:.]+\s*[ap]m)\s*[-–—]+\s*([\d:.]+\s*[ap]m)",
        block, re.IGNORECASE)
    if dm:
        key = dm.group(1).upper()
        if key in DATE_BY_DAY:
            day, date = DATE_BY_DAY[key]
        start, end = to_24h(dm.group(2)), to_24h(dm.group(3))
    rm = re.search(r"^\s*([A-Z][A-Za-z ]*ROOM|HALL)\s*$", block, re.MULTILINE)
    if rm:
        room = rm.group(1).strip()
    return day, date, start, end, room


def clean_lines(block: str):
    return [ln for ln in block.splitlines() if not NOISE_RE.search(ln)]


def is_author_line(line: str) -> bool:
    # an affiliation ref is a paren immediately followed by a digit, e.g. (1) or (1,2)
    return bool(re.search(r"\(\d", line)) and not is_affiliation_line(line)


def is_affiliation_line(line: str) -> bool:
    return bool(re.match(r"^\s*\d+\s*[-–]\s*\S", line))


def parse_author_line(line: str):
    """'Cook Tyler (1), Gacoin M (1) (2), Roberts K (3)*' ->
    (authors[], author_numbers[], presenter). '*' marks the presenter."""
    authors, numbers, presenter = [], [], ""
    parts = [p.strip() for p in re.split(r",(?![^()]*\))", line) if p.strip()]
    for p in parts:
        groups = re.findall(r"\(([\d,\s]+)\)", p)          # ['1', '2'] or ['1,2']
        nums = ",".join(re.sub(r"\s+", "", g) for g in groups)
        star = "*" in p
        name = norm(re.sub(r"\([\d,\s]+\)|\*", "", p))
        if not name:
            continue
        authors.append(name)
        numbers.append(nums)
        if star:
            presenter = name
    return authors, numbers, presenter


def split_authors_affs_abstract(lines, start):
    """From `lines[start:]`, return (author_block_str, aff_lines, abstract_lines).
    Author block = consecutive author lines; affs = consecutive 'n -' lines
    (plus standalone *speaker/*organizer legends); rest = abstract."""
    i = start
    author_lines = []
    while i < len(lines) and is_author_line(lines[i]) and not is_affiliation_line(lines[i]):
        author_lines.append(lines[i].strip())
        i += 1
    aff_lines = []
    while i < len(lines) and (is_affiliation_line(lines[i])
                              or lines[i].strip() in ("*speaker", "*organizer", "*presenter")):
        if is_affiliation_line(lines[i]):
            aff_lines.append(norm(lines[i]))
        i += 1
    abstract = norm(" ".join(lines[i:]))
    return " ".join(author_lines), aff_lines, abstract


def parse_entry_chunk(chunk, entry_id, talk_number, kind, session_title,
                      session_kind, day, date, room, start, end, time=""):
    """Parse a title/authors/affiliations/abstract chunk into an entry dict."""
    lines = [l for l in chunk.splitlines() if l.strip()]
    title_lines, idx = [], len(lines)
    for j, l in enumerate(lines):
        if is_author_line(l) or is_affiliation_line(l):
            idx = j
            break
        title_lines.append(l)
    title = norm(" ".join(title_lines))
    author_block, aff_lines, abstract = split_authors_affs_abstract(lines, idx)
    authors, numbers, presenter = parse_author_line(author_block)
    # A '*speaker/*organizer/*presenter' legend marks the boundary between
    # author/affiliation metadata and the abstract. When an affiliation wraps
    # across a page break, the legend (and an affiliation fragment) can leak into
    # the abstract; recover by cutting at the last legend token.
    lm = list(re.finditer(r"\*(?:speaker|organizer|presenter)\b", abstract))
    if lm:
        frag = abstract[:lm[-1].start()].strip()
        abstract = abstract[lm[-1].end():].strip()
        if frag:
            aff_lines.append(frag)
    # withdrawn entries reserve a number but have no content -> skip
    if not title and not authors and not abstract:
        return None
    return {
        "id": entry_id, "kind": kind, "talk_number": talk_number, "time": time,
        "title": title, "authors": authors, "author_numbers": numbers,
        "affiliations": "; ".join(aff_lines), "presenter": presenter,
        "organizer": "", "bio": "", "abstract": abstract,
        "day": day, "date": date, "room": room,
        "session_title": session_title, "session_kind": session_kind,
        "session_start": start, "session_end": end,
    }


# ---- section boundaries ------------------------------------------------------

def _pos(text, pattern, default=None):
    m = re.search(pattern, text)
    return m.start() if m else default


def split_sections(text: str) -> dict:
    p_key = _pos(text, r"\n\s*KEYNOTE SPEAKERS\s*\n")
    p_wsh = _pos(text, r"\n\s*SCIENTIFIC WORKSHOP 1\b")
    p_sym = _pos(text, r"\n\s*SYMPOSIUM LIST\s*\n")
    p_tlk = _pos(text, r"\n\s*TALK SESSIONS\s*\n")
    p_pos = _pos(text, r"\n\s*POSTER SESSIONS\s*\n")
    p_net = _pos(text, r"\n\s*NETWORKING WORKSHOPS\s*\n", len(text))
    return {
        "keynote": text[p_key:p_wsh],
        "workshop": text[p_wsh:p_sym],
        "symposium": text[p_sym:p_tlk],
        "talk": text[p_tlk:p_pos],
        "poster": text[p_pos:p_net],
    }


# ---- per-section parsers -----------------------------------------------------

def parse_keynotes(section: str):
    entries = []
    blocks = re.split(r"\n\s*KEYNOTE\s+(\d+)\s*\n", section)
    for i in range(1, len(blocks), 2):
        num = blocks[i]
        before = [l for l in blocks[i - 1].splitlines() if l.strip()]
        name = affil = bio = ""
        for k in range(len(before) - 1, -1, -1):
            if re.match(r"^\s*(Professor|Prof\.?|Dr\.?)\b", before[k]):
                name = norm(before[k])
                affil = norm(before[k + 1]) if k + 1 < len(before) else ""
                bio = norm(" ".join(before[k + 2:]))
                break
        day, date, start, end, room = parse_header(blocks[i + 1])
        after = clean_lines(blocks[i + 1])
        body = [l for l in after if l.strip()
                and not re.search(r"JUNE \d+|ROOM|HALL", l)]
        title = norm(body[0]) if body else ""
        abstract = norm(" ".join(body[1:]))
        entries.append({
            "id": f"KN{num}", "kind": "keynote", "talk_number": None, "time": start,
            "title": title, "authors": [name] if name else [],
            "author_numbers": [""] if name else [], "affiliations": affil,
            "presenter": name, "organizer": "", "bio": bio, "abstract": abstract,
            "day": day, "date": date, "room": room, "session_title": f"Keynote {num}",
            "session_kind": "Keynote", "session_start": start, "session_end": end,
        })
    return entries


def parse_workshops(section: str):
    entries = []
    blocks = re.split(r"\n\s*SCIENTIFIC WORKSHOP\s+(\d+)\s*\n", section)
    for i in range(1, len(blocks), 2):
        num = blocks[i]
        day, date, start, end, room = parse_header(blocks[i + 1])
        body = clean_lines(blocks[i + 1])
        # drop header furniture lines (date, room, 'sponsored by ...')
        kept = [l for l in body if l.strip()
                and not re.search(r"JUNE \d+|ROOM|HALL", l)
                and not re.match(r"^\s*sponsored by", l, re.IGNORECASE)]
        e = parse_entry_chunk(
            "\n".join(kept), entry_id=f"WS{num}", talk_number=num, kind="workshop",
            session_title="Pre-conference Scientific Workshops", session_kind="Workshop",
            day=day, date=date, room=room, start=start, end=end)
        if e:
            entries.append(e)
    return entries


def parse_symposia(section: str):
    entries = []
    blocks = re.split(r"\n\f?SYMPOSIUM\s+(\d+)\s*\n", section)
    for i in range(1, len(blocks), 2):
        num = blocks[i]
        day, date, start, end, room = parse_header(blocks[i + 1])
        body = clean_lines(blocks[i + 1])
        text = "\n".join(body)
        head, sep, rest = text.partition("\nTalk:")
        # --- overview: title, organizer line, overview paragraph ---
        hlines = [l for l in head.splitlines() if l.strip()
                  and not re.search(r"JUNE \d+|ROOM|HALL", l)]
        title_lines, org_line, overview, seen_org = [], "", [], False
        for l in hlines:
            if re.match(r"^\s*\*organizer", l):
                seen_org = True
                continue
            if not seen_org and not org_line and title_lines and (
                    "," in l or l.rstrip().endswith("*")):
                org_line = l
            elif org_line:
                overview.append(l)
            else:
                title_lines.append(l)
        sym_title = norm(" ".join(title_lines))
        org_clean = norm(org_line.replace("*", ""))
        entries.append({
            "id": f"SYM{num}", "kind": "symposium_overview", "talk_number": None,
            "time": start, "title": sym_title, "authors": [], "author_numbers": [],
            "affiliations": "", "presenter": "", "organizer": org_clean, "bio": "",
            "abstract": norm(" ".join(overview)), "day": day, "date": date, "room": room,
            "session_title": sym_title, "session_kind": "Symposium",
            "session_start": start, "session_end": end,
        })
        # --- individual talks ---
        if sep:
            raw = [c for c in ("Talk:" + rest).split("\nTalk:")]
            tn = 0
            for chunk in raw:
                chunk = chunk[5:].strip() if chunk.startswith("Talk:") else chunk.strip()
                if not chunk:
                    continue
                tn += 1
                e = parse_entry_chunk(
                    chunk, entry_id=f"SYM{num}.{tn}", talk_number=str(tn),
                    kind="symposium", session_title=sym_title, session_kind="Symposium",
                    day=day, date=date, room=room, start=start, end=end)
                if e:
                    entries.append(e)
    return entries


def session_theme(raw: str, default: str) -> str:
    """The talk-session theme sits between the ROOM line and 'Chair:'/first talk."""
    lines = [l.strip() for l in raw.splitlines() if l.strip()]
    collected = []
    seen_room = False
    for l in lines:
        if re.search(r"ROOM$|^HALL$", l):
            seen_room = True
            continue
        if not seen_room:
            continue
        if l.startswith("Chair:") or l.startswith("Talk #") or re.search(r"JUNE \d", l):
            break
        collected.append(l)
    return norm(" ".join(collected)) or default


def parse_talks(section: str):
    entries = []
    parts = re.split(r"\n\f?(YOUNG RESEARCHER TALK SESSION|TALK SESSION\s+\d+)\s*\n",
                     section)
    for i in range(1, len(parts), 2):
        header = parts[i].strip()
        day, date, start, end, room = parse_header(parts[i + 1])
        body = clean_lines(parts[i + 1])
        text = "\n".join(body)
        if header.upper().startswith("YOUNG"):
            sess_no, sess_title = "YR", "Young Researcher Talk Session"
        else:
            m = re.match(r"TALK SESSION\s+(\d+)", header, re.IGNORECASE)
            sess_no = m.group(1)
            sess_title = session_theme(parts[i + 1], f"Talk Session {sess_no}")
        chunks = re.split(r"\n\s*Talk #([A-Za-z0-9.]+):?", "\n" + text)
        for j in range(1, len(chunks), 2):
            talk_id = chunks[j].strip()
            e = parse_entry_chunk(
                chunks[j + 1], entry_id=f"T{talk_id}", talk_number=talk_id,
                kind="talk", session_title=sess_title, session_kind="Talk Session",
                day=day, date=date, room=room, start=start, end=end)
            if e:
                entries.append(e)
    return entries


def parse_posters(section: str):
    entries = []
    parts = re.split(r"\n\f?POSTER SESSION\s+(\d+)\s*\n", section)
    for i in range(1, len(parts), 2):
        sess_no = parts[i]
        day, date, start, end, room = parse_header(parts[i + 1])
        body = clean_lines(parts[i + 1])
        text = "\n".join(body)
        chunks = re.split(r"\n\s*Poster #([0-9.]+):?", "\n" + text)
        for j in range(1, len(chunks), 2):
            pid = chunks[j].strip()
            e = parse_entry_chunk(
                chunks[j + 1], entry_id=f"P{pid}", talk_number=pid, kind="poster",
                session_title=f"Poster Session {sess_no}", session_kind="Poster Session",
                day=day, date=date, room=room, start=start, end=end, time="")
            if e:
                entries.append(e)
    return entries


# ---- validation --------------------------------------------------------------

# Real entry counts after excluding withdrawn placeholders (Talk #1.3, Poster #1.9
# reserve a number but carry no abstract in the booklet).
EXPECT = {"keynote": 3, "symposium_overview": 11, "symposium": 51,
          "talk": 40, "poster": 187, "workshop": 4}

# Hybrid corrections for booklet typos the parser can't recover automatically.
# SYMPOSIUM 11's header reads "9:15 m" (missing the 'a'), breaking time parsing.
SESSION_FIXES = {
    "SYM11": dict(day="Saturday", date="2026-06-27",
                  session_start="09:15", session_end="10:30"),
}


def apply_session_fixes(entries):
    for e in entries:
        for prefix, patch in SESSION_FIXES.items():
            if e["id"] == prefix or e["id"].startswith(prefix + "."):
                e.update(patch)
                if e["kind"] in ("symposium_overview", "keynote"):
                    e["time"] = patch["session_start"]


def validate(entries):
    kinds = Counter(e["kind"] for e in entries)
    print("counts:", dict(kinds))
    problems = []
    for e in entries:
        if not e["title"]:
            problems.append((e["id"], "empty title"))
        if e["kind"] in ("symposium", "talk", "poster", "keynote", "workshop") and not e["abstract"]:
            problems.append((e["id"], "empty abstract"))
        if e["kind"] in ("symposium", "talk", "poster", "workshop") and not e["authors"]:
            problems.append((e["id"], "no authors"))
        if len(e["authors"]) != len(e["author_numbers"]):
            problems.append((e["id"], "author/number length mismatch"))
        if e["date"] and e["date"] not in VALID_DATES:
            problems.append((e["id"], f"bad date {e['date']}"))
        if not e["date"] or not e["session_start"]:
            problems.append((e["id"], "missing date/time"))
    for k, n in EXPECT.items():
        got = kinds.get(k, 0)
        if abs(got - n) > 2:
            problems.append((k, f"count {got} far from expected {n}"))
    if problems:
        print(f"\n{len(problems)} PROBLEMS:")
        for pid, msg in problems[:80]:
            print(f"  {pid}: {msg}")
    else:
        print("validation OK")
    return problems


def main():
    text = pdf_text()
    sections = split_sections(text)
    entries = []
    entries += parse_keynotes(sections["keynote"])
    entries += parse_workshops(sections["workshop"])
    entries += parse_symposia(sections["symposium"])
    entries += parse_talks(sections["talk"])
    entries += parse_posters(sections["poster"])
    apply_session_fixes(entries)
    validate(entries)
    OUT.write_text(json.dumps(entries, ensure_ascii=False, indent=1))
    print(f"wrote {OUT} ({len(entries)} entries)")


if __name__ == "__main__":
    main()
