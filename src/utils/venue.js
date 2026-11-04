// Rooms as the programme writes them, and rooms as a person reads them.
//
// The data's `room` is an identifier in caps ('TALK ROOM 1'), which is right
// for grouping and wrong for a sentence. conference.rooms maps each one to a
// readable label and to the part only the venue knows — the ballroom name and
// floor. Anything missing from that table still renders, just without a
// location, so a new room in next year's export cannot break a screen.

import conference from '../config/conference';

const TABLE = conference.rooms || {};

const titleCase = (room) =>
  String(room)
    .toLowerCase()
    .replace(/\b[a-z]/g, c => c.toUpperCase());

export const roomLabel = (room) => {
  if (!room) return '';
  const entry = TABLE[room];
  return (entry && entry.label) || titleCase(room);
};

export const roomLocation = (room) => {
  const entry = room ? TABLE[room] : null;
  return (entry && entry.location) || '';
};

// 'Talk Room 1 · Columbia A, floor 3', or just 'Talk Room 1' while the
// location is unknown.
export const roomLine = (room) => {
  const label = roomLabel(room);
  const where = roomLocation(room);
  return where ? `${label} · ${where}` : label;
};

// Every room in the programme, in the order conference.rooms lists them, with
// any room the table does not know appended rather than dropped.
export const roomsInProgramme = (sessions) => {
  const present = new Set(sessions.map(s => s.room).filter(Boolean));
  const known = Object.keys(TABLE).filter(r => present.has(r));
  const unknown = [...present].filter(r => !TABLE[r]).sort();
  return [...known, ...unknown];
};

export const hasFloorPlans = () => Array.isArray(conference.floors) && conference.floors.length > 0;
