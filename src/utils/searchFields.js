// Which part of a presentation a search looks at.
//
// The list lives here rather than in the screen so the chips and the matcher
// cannot drift apart: one entry defines a chip's label, its placeholder and
// the text it searches. Adding a field is one entry, not three edits.

const textOf = {
  title: (s) => s.title || '',
  author: (s) => (Array.isArray(s.authors) ? s.authors.join(' ') : (s.authors || '')),
  abstract: (s) => s.abstract || '',
  affiliation: (s) => s.affiliations || '',
  session: (s) => s.session_title || '',
};

// '' is the whole record and is always first, so clearing a chip and searching
// everything are the same action.
export const SEARCH_FIELDS = [
  { id: '', label: 'All', placeholder: 'Search title, authors, abstract…' },
  { id: 'title', label: 'Title', placeholder: 'Search titles…' },
  { id: 'author', label: 'Author', placeholder: 'Search author names…' },
  { id: 'abstract', label: 'Abstract', placeholder: 'Search abstract text…' },
  { id: 'affiliation', label: 'Affiliation', placeholder: 'Search institutions…' },
  { id: 'session', label: 'Session', placeholder: 'Search session names…' },
];

// Joined with a separator no query can contain, so a search can never match
// across the join — 'smith vision' must appear inside one field, exactly as it
// did when each field was tested on its own.
const SEP = '\u0000';

// Everything 'All' looks at, including the parts with no chip of their own: the
// board code, so typing M1AM8 finds that poster directly, and the organiser and
// biography that only symposium records carry.
const allText = (s) => [
  s.id,
  textOf.title(s),
  textOf.author(s),
  textOf.abstract(s),
  textOf.session(s),
  textOf.affiliation(s),
  s.bio,
  s.organizer,
].filter(Boolean).join(SEP);

// The text a query is tested against for the chosen field. An unknown field id
// falls back to the whole record rather than matching nothing, so a stale
// saved choice cannot empty the screen.
export const searchableText = (session, field) =>
  (field && textOf[field] ? textOf[field](session) : allText(session));

export const fieldPlaceholder = (field) => {
  const entry = SEARCH_FIELDS.find(f => f.id === field);
  return (entry || SEARCH_FIELDS[0]).placeholder;
};

export const fieldLabel = (field) => {
  const entry = SEARCH_FIELDS.find(f => f.id === field);
  return (entry || SEARCH_FIELDS[0]).label;
};
