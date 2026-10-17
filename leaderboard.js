// Supabase leaderboard. Table: scores(player_name, score, year, created_at).
// The publishable key is meant to be public; row level security limits it to select and insert.
const URL = 'https://cgkmcpocfikqeawynvzq.supabase.co/rest/v1/scores';
const KEY = 'sb_publishable_PhTCDBstLhWJrQoam7iQRA_rThrW1vT';
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// Strips control, invisible and format characters and angle brackets, collapses spaces, caps at 20 characters.
export const cleanName = raw => raw.replace(/[\u0000-\u001f\u007f<>\p{Cf}\u115f\u1160\u2800\u3164\uffa0]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 20);

export const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// With json=true the body is read before the timer stops, so a stalled body also times out.
async function request(url, init, json = false) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal });
    if (!res.ok) throw new Error(`leaderboard ${res.status}`);
    return json ? await res.json() : res;
  } finally {
    clearTimeout(timer);
  }
}

export async function submitScore(name, score, year) {
  await request(URL, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ player_name: name, score, year }),
  });
}

// One row per player: the table keeps every run, so keep only each name's best score.
export async function loadBoard() {
  const rows = await request(`${URL}?select=player_name,score,year&order=score.desc&limit=300`, { headers: HEADERS }, true);
  if (!Array.isArray(rows)) throw new Error('leaderboard bad response');
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const key = String(r.player_name ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ name: String(r.player_name).slice(0, 20), score: r.score, year: r.year });
  }
  return out;
}
