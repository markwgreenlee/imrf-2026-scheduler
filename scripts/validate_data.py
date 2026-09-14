#!/usr/bin/env python3
"""Check the programme data for the mistakes that survive a human read.

Run it before dropping in a new export, and in CI before every deploy:

    python3 scripts/validate_data.py                # finds assets/*-data.json
    python3 scripts/validate_data.py path/to.json   # check a candidate first

Errors exit 1 and should stop a deploy; warnings are printed and exit 0.

The check that prompted this: the seven talks of one VSS session recorded their
room as "Talk Room 1" where the other 110 entries in that room wrote
"TALK ROOM 1". Nothing was double-booked and nothing was hidden, so it read as
merely untidy — but room, day and kind are used as identifiers, not just
labels. The live view groups sessions by room, the filter chips are built from
the set of kinds, and the day ordering is taken from each day's date. A value
that differs only in case silently becomes a second room, a second chip, or a
second day, and no amount of reading the file catches it.
"""

import json
import os
import re
import sys
from collections import Counter, defaultdict

# Fields that are identifiers rather than free text: a small, closed set of
# values that the app groups and filters on.
CONTROLLED = ('room', 'day', 'kind')

errors = []
warnings = []


def find_data_file(argv):
    if len(argv) > 1:
        return argv[1]
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets = os.path.join(here, 'assets')
    found = sorted(f for f in os.listdir(assets) if f.endswith('-data.json'))
    if not found:
        sys.exit(f'no *-data.json found in {assets}')
    if len(found) > 1:
        sys.exit(f'several data files in {assets}: {found} — name one explicitly')
    return os.path.join(assets, found[0])


def canonical(value):
    """What two values must share to count as the same thing."""
    return re.sub(r'\s+', ' ', str(value)).strip().lower()


def check_controlled_vocabulary(entries):
    for field in CONTROLLED:
        counts = Counter(e.get(field) or '' for e in entries)
        groups = defaultdict(list)
        for value, n in counts.items():
            groups[canonical(value)].append((value, n))

        for key, variants in groups.items():
            if len(variants) > 1:
                variants.sort(key=lambda v: -v[1])
                spellings = ', '.join(f'{v!r} on {n}' for v, n in variants)
                dominant = variants[0][0]
                errors.append(
                    f'{field}: {len(variants)} spellings of the same value — {spellings}.\n'
                    f'      They differ only in case or spacing, so the app treats them as\n'
                    f'      separate {field}s. Settle on {dominant!r}.'
                )

        for value in counts:
            if value and (value != value.strip() or '  ' in value):
                warnings.append(f'{field}: {value!r} has stray whitespace')

        blank = counts.get('', 0)
        if blank and field != 'room':      # posters legitimately have no room
            warnings.append(f'{field}: {blank} entries leave it empty')


def check_day_dates(entries):
    dates_for_day = defaultdict(set)
    days_for_date = defaultdict(set)
    for e in entries:
        if e.get('day') and e.get('date'):
            dates_for_day[e['day']].add(e['date'])
            days_for_date[e['date']].add(e['day'])
    for day, dates in sorted(dates_for_day.items()):
        if len(dates) > 1:
            errors.append(
                f'day: {day!r} is dated {sorted(dates)}. The live view orders days by '
                f'their date, so one day with two dates sorts into two places.'
            )
    for date, days in sorted(days_for_date.items()):
        if len(days) > 1:
            errors.append(f'date: {date} is named {sorted(days)}')


def check_identity(entries):
    ids = [e.get('id') for e in entries]
    repeated = [i for i, n in Counter(ids).items() if n > 1]
    if repeated:
        errors.append(
            f'id: {len(repeated)} repeated — {repeated[:5]}. Ids key the schedule, '
            f'share links and calendar events, so a duplicate merges two presentations.'
        )
    missing = sum(1 for i in ids if not i)
    if missing:
        errors.append(f'id: {missing} entries have none')


def check_times(entries):
    pattern = re.compile(r'^\d{2}:\d{2}$')
    for field in ('time', 'session_start', 'session_end'):
        bad = [e.get('id') for e in entries
               if e.get(field) and not pattern.match(str(e[field]))]
        if bad:
            errors.append(f'{field}: not HH:MM on {len(bad)} entries — {bad[:5]}')
    undated = [e.get('id') for e in entries if not e.get('date')]
    if undated:
        errors.append(f'date: missing on {len(undated)} entries — {undated[:5]}')


def report_inventory(entries):
    print(f'  {len(entries)} entries')
    for field in CONTROLLED:
        counts = Counter(e.get(field) or '(none)' for e in entries)
        print(f'  {field}:')
        for value, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
            print(f'    {n:6d}  {value}')


def main():
    path = find_data_file(sys.argv)
    with open(path, encoding='utf-8') as handle:
        entries = json.load(handle)

    print(f'Validating {os.path.relpath(path)}')
    report_inventory(entries)

    check_controlled_vocabulary(entries)
    check_day_dates(entries)
    check_identity(entries)
    check_times(entries)

    print()
    for warning in warnings:
        print(f'  WARNING  {warning}')
    for error in errors:
        print(f'  ERROR    {error}')

    if errors:
        print(f'\n{len(errors)} error(s) — not fit to deploy.')
        return 1
    print(f'\nNo errors{f", {len(warnings)} warning(s)" if warnings else ""}.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
