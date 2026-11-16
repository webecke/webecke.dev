import type { InviteRow } from './db';

const esc = (s: string | null | undefined) =>
  (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const RECEPTION: Record<string, string> = { utah: 'Utah', missouri: 'Missouri', both: 'Both', unsure: 'Not sure' };

export function renderAdminPage(rows: InviteRow[], all: boolean): string {
  const count = (pred: (r: InviteRow) => boolean) => rows.filter(pred).length;
  const stats: Array<[string, number]> = [
    [all ? 'Submissions' : 'Households', rows.length],
    ['By mail', count((r) => r.delivery !== 'email')],
    ['By email', count((r) => r.delivery !== 'mail')],
    ['Utah', count((r) => r.attending === 'utah' || r.attending === 'both')],
    ['Missouri', count((r) => r.attending === 'missouri' || r.attending === 'both')],
    ['ZIP to check', count((r) => !!r.zip_warning)],
  ];

  const body = rows.length === 0
    ? '<tr><td colspan="6" class="empty">No one has sent their address yet. Once the link goes out, households show up here.</td></tr>'
    : rows.map((r) => {
        const addr = r.street1
          ? `${esc(r.street1)}${r.street2 ? `<br>${esc(r.street2)}` : ''}<br>${esc(r.city)}, ${esc(r.state)} ${esc(r.postal_code)}`
          : '<span class="muted">—</span>';
        const warn = r.zip_warning ? `<div class="warn">${esc(r.zip_warning)}</div>` : '';
        return `<tr>
          <td><b>${esc(r.household_name)}</b>${r.note ? `<div class="note">“${esc(r.note)}”</div>` : ''}</td>
          <td>${addr}${warn}</td>
          <td>${r.email ? esc(r.email) : '<span class="muted">—</span>'}</td>
          <td>${esc(r.delivery)}</td>
          <td>${r.attending ? esc(RECEPTION[r.attending] ?? r.attending) : '<span class="muted">—</span>'}</td>
          <td class="when">${esc(r.created_at.slice(0, 16).replace('T', ' '))}</td>
        </tr>`;
      }).join('');

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Guest addresses · Sierra & Dallin</title>
<style>
  :root { --ink:#1E2433; --muted:#6A7190; --line:#E3E6F0; --navy:#22335E; --lav:#6F5DAE; --bg:#FAFBFD; color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui, sans-serif; padding: 28px max(16px, env(safe-area-inset-left)); }
  main { max-width: 1100px; margin: 0 auto; display: grid; gap: 18px; }
  header { display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; }
  h1 { margin:0; font: 600 1.6rem Georgia, serif; }
  .actions { display:flex; gap:8px; flex-wrap:wrap; }
  a.btn { background:var(--navy); color:#fff; text-decoration:none; padding:8px 14px; border-radius:999px; font-weight:600; }
  a.btn.ghost { background:#fff; color:var(--navy); border:1px solid var(--line); }
  .stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; }
  .stat { background:#fff; border:1px solid var(--line); border-radius:12px; padding:10px 14px; }
  .stat b { display:block; font-size:1.5rem; font-variant-numeric: tabular-nums; color:var(--navy); }
  .stat span { color:var(--muted); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; }
  .wrap { overflow-x:auto; background:#fff; border:1px solid var(--line); border-radius:12px; }
  table { border-collapse:collapse; width:100%; min-width: 760px; }
  th, td { text-align:left; vertical-align:top; padding:10px 12px; border-top:1px solid var(--line); }
  th { border-top:0; font-size:.72rem; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
  .muted { color:var(--muted); } .when { white-space:nowrap; color:var(--muted); font-variant-numeric: tabular-nums; }
  .note { color:var(--muted); font-style:italic; font-size:.9rem; }
  .warn { color:#9A5B00; font-size:.85rem; margin-top:4px; }
  .empty { text-align:center; color:var(--muted); padding:36px; }
  p.hint { color:var(--muted); margin:0; font-size:.9rem; }
</style></head>
<body><main>
  <header>
    <h1>Guest addresses</h1>
    <div class="actions">
      <a class="btn" href="/admin/export${all ? '?all=1' : ''}">Download CSV</a>
      <a class="btn ghost" href="/admin${all ? '' : '?all=1'}">${all ? 'Show one row per household' : 'Show every submission'}</a>
    </div>
  </header>
  <div class="stats">${stats.map(([l, n]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
  <p class="hint">${all ? 'Every submission, newest first, including corrections.' : 'One row per household: when someone resends the form, only their newest submission shows.'}</p>
  <div class="wrap"><table>
    <thead><tr><th>Name</th><th>Address</th><th>Email</th><th>Invite by</th><th>Reception</th><th>Sent (UTC)</th></tr></thead>
    <tbody>${body}</tbody>
  </table></div>
</main></body></html>`;
}
