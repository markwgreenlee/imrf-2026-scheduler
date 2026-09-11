// Day and type chips are derived from the data rather than hard-coded, so the
// same screens work for VSS and IMRF, which run on different days and need not
// carry every presentation type.
import conference from '../config/conference';

const KIND_ORDER = conference.kindOrder;
const KIND_LABELS = conference.kindLabels;
const KIND_ALIAS = conference.kindAlias || {};

// The kind a filter chip matches on. An aliased kind answers to its target's
// chip, so a symposium overview is found by filtering for Symposia.
export const effectiveKind = (kind) => KIND_ALIAS[kind] || kind;

// 'symposium_overview' -> 'Symposium overview'. Only reached for kinds the
// config does not name, which is how an unexpected kind in a new export shows
// up readably instead of as a raw field value.
const humanise = (kind) => {
  const words = String(kind).replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const kindLabel = (kind) => {
  const entry = KIND_LABELS[kind];
  if (entry) return entry.many;
  const one = humanise(kind);
  return one.endsWith('s') ? one : `${one}s`;
};

// Singular form, for a card's badge rather than a filter chip.
export const kindName = (kind) => {
  const entry = KIND_LABELS[kind];
  return entry ? entry.one : humanise(kind);
};

// Day names in calendar order, ordered by each day's ISO date rather than by a
// fixed Sunday-first list.
export const daysInOrder = (sessions) => {
  const dateOf = new Map();
  for (const s of sessions) {
    if (s.day && !dateOf.has(s.day)) dateOf.set(s.day, s.date || '');
  }
  return [...dateOf.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([day]) => day);
};

export const kindsInOrder = (sessions) => {
  const present = new Set(sessions.map(s => effectiveKind(s.kind)).filter(Boolean));
  return [
    ...KIND_ORDER.filter(k => present.has(k)),
    ...[...present].filter(k => !KIND_ORDER.includes(k)).sort(),
  ];
};

export const matchesFilters = (session, day, kind) =>
  (!day || session.day === day) && (!kind || effectiveKind(session.kind) === kind);
