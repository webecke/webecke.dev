import type { InviteRow } from './db';

const COLUMNS: Array<[header: string, get: (r: InviteRow) => string | null]> = [
  ['Name', (r) => r.household_name],
  ['Street', (r) => r.street1],
  ['Street 2', (r) => r.street2],
  ['City', (r) => r.city],
  ['State', (r) => r.state],
  ['ZIP', (r) => r.postal_code],
  ['Email', (r) => r.email],
  ['Invite by', (r) => r.delivery],
  ['Reception', (r) => r.attending],
  ['Note', (r) => r.note],
  ['ZIP check', (r) => r.zip_warning],
  ['Submitted', (r) => r.created_at],
];

/** One CSV cell, quoted, with spreadsheet formula injection neutralized. */
export function csvCell(value: string | null): string {
  let s = value ?? '';
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: InviteRow[]): string {
  const lines = [COLUMNS.map(([h]) => csvCell(h)).join(',')];
  for (const r of rows) lines.push(COLUMNS.map(([, get]) => csvCell(get(r))).join(','));
  return '﻿' + lines.join('\r\n') + '\r\n';
}
