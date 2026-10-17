// Run with: npm test   (or: node test.js)
// Checks the content is complete and that the game is genuinely losable AND winnable.
import assert from 'node:assert/strict';
import { SCENES, STATS, UI, ARCH, BASE, RIPPLES, ENDINGS, TIERS } from './data.js';
import { newGame, play, ROUNDS, LOSE_STATS, won, score, prosperity, danger } from './engine.js';
import { enumerateAll, pureArch } from './sim.js';

const LANGS = ['en', 'ru'];
const BAD_DASH = /[\u2013\u2014]|--/;
const clone = g => structuredClone(g);

// ---- content ----------------------------------------------------------------
const strings = [];
const walk = (v, path) => {
  if (typeof v === 'string') strings.push([path, v]);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (typeof x !== 'function') walk(x, `${path}.${k}`);
};
walk({ SCENES, ARCH, ENDINGS, TIERS, UI, RIPPLES }, 'data');
for (const st of STATS) walk({ name: st.name, up: st.up, down: st.down }, `stat.${st.k}`);
for (const [p, s] of strings) assert.ok(!BAD_DASH.test(s), `dash punctuation in ${p}: ${s}`);

assert.equal(ROUNDS, 10, 'ten questions');
assert.ok('tech' in BASE && STATS.some(s => s.k === 'tech'), 'technology stat exists');
const extremes = [BASE, ...[0, 100, 250].map(v => Object.fromEntries(Object.keys(BASE).map(k => [k, v])))];
for (const [i, sc] of SCENES.entries()) {
  assert.equal(sc.choices.length, 3, `scene ${i} has 3 choices`);
  assert.deepEqual(sc.choices.map(c => c.arch).sort(), Object.keys(ARCH).sort(), `scene ${i} has one choice per archetype`);
  for (const l of LANGS) {
    assert.ok(sc.topic[l]);
    for (const stats of extremes) {
      const q = sc.q[l](stats);
      assert.ok(q.length > 40 && !/undefined|NaN/.test(q), `scene ${i} ${l} question: ${q}`);
    }
    // Unique sentinel values, so the "/100" in "nature is 41/100" cannot count as a quoted stat.
    const sentinel = Object.fromEntries(Object.keys(BASE).map((k, j) => [k, 701 + j]));
    const quoted = Object.values(sentinel).filter(v => sc.q[l](sentinel).includes(String(v))).length;
    assert.ok(quoted >= 3, `scene ${i} ${l} quotes at least three live stats (found ${quoted})`);
  }
  for (const c of sc.choices) {
    assert.ok(Object.keys(c.fx).length >= 4, 'choices have real consequences');
    assert.ok(Object.entries(c.fx).every(([k, v]) => k in BASE && Number.isInteger(v)), `bad fx ${JSON.stringify(c.fx)}`);
    for (const l of LANGS) for (const f of ['title', 'sub', 'echo']) assert.ok(c[f][l], `missing ${f}.${l}`);
  }
}
for (const st of STATS) for (const l of LANGS) {
  assert.ok(st.name[l] && st.up[l] && st.down[l], `${st.k} texts`);
  if (st.lose) assert.ok(st.end.title[l] && st.end.text[l](1) && st.end.tip[l]);
}
for (const r of RIPPLES) for (const l of LANGS) assert.ok(r.label[l] && r.text[l]);
for (const a of Object.values(ARCH)) for (const l of LANGS) assert.ok(a.name[l]);
assert.deepEqual(
  LOSE_STATS.map(s => `${s.k}:${s.lose.dir}:${s.lose.at}`),
  ['literacy:low:50', 'poverty:high:55', 'energy:low:30', 'debt:high:180', 'nature:low:25', 'happiness:low:18'],
  'red lines');
for (const l of LANGS) assert.ok(UI[l].start);

// ---- clamping never lies ----------------------------------------------------
{
  const g = newGame();
  g.stats.nature = 1;
  for (const st of play(g, 0)) for (const d of st.deltas) assert.equal(d.to - d.from, d.d);
  assert.ok(g.stats.nature >= 0);
}

// ---- every sequence --------------------------------------------------------
const all = enumerateAll();
assert.equal(all.length, 3 ** ROUNDS);
const share = n => n / all.length;
const wins = all.filter(r => r.won);
const causes = {};
for (const r of all) if (!r.won) causes[r.lost[0]] = (causes[r.lost[0]] || 0) + 1;

// lose rate by how Tech-first the run was
const bins = [[0, 0.2], [0.2, 0.4], [0.4, 0.6], [0.6, 0.8], [0.8, 1.01]];
const byTech = bins.map(([a, b]) => {
  const rs = all.filter(r => r.made && r.picks.tech / r.round >= a && r.picks.tech / r.round < b);
  return { band: `${a * 100}-${Math.min(100, b * 100)}% tech-first`, runs: rs.length, lose: rs.length ? rs.filter(r => !r.won).length / rs.length : 0 };
});

// ---- pure strategies and a careful bot --------------------------------------
const pure = Object.fromEntries(Object.keys(ARCH).map(a => { const g = pureArch(a); return [a, { round: g.round, lost: g.lost, won: won(g) }]; }));
function careful() {
  const g = newGame();
  while (!g.over) {
    let best = 0, bestScore = -Infinity;
    for (let i = 0; i < 3; i++) {
      const t = clone(g); play(t, i);
      const s = t.lost.length ? -1e6 : danger(t.stats)[0].ratio * 100 + prosperity(t.stats) * 0.2;
      if (s > bestScore) { bestScore = s; best = i; }
    }
    play(g, best);
  }
  return g;
}
const bot = careful();

const pct = x => (x * 100).toFixed(1) + '%';
console.log('random play : win', pct(share(wins.length)), `(${wins.length} of ${all.length} sequences)`);
console.log('lose causes :', Object.fromEntries(Object.entries(causes).map(([k, v]) => [k, pct(share(v))])));
console.log('lose rate by tech-first share:'); for (const b of byTech) console.log('  ', b.band.padEnd(22), 'lose', pct(b.lose), `(${b.runs} runs)`);
console.log('pure paths  :', JSON.stringify(pure));
console.log('careful bot :', won(bot) ? 'WON' : 'lost ' + bot.lost, 'round', bot.round, 'score', score(bot));

assert.ok(wins.length > 0, 'the game must be winnable');
assert.ok(share(wins.length) >= 0.04 && share(wins.length) <= 0.4, `random-play win rate ${pct(share(wins.length))} should be between 4% and 40%`);
for (const st of LOSE_STATS) assert.ok(causes[st.k] > 0, `${st.k} red line is unreachable`);
for (const [name, r] of Object.entries(pure)) assert.ok(!r.won, `pure ${name} must lose`);
assert.ok(new Set(Object.values(pure).flatMap(r => r.lost)).size >= 2, 'pure strategies lose through at least two different stats');
assert.ok(byTech[4].lose >= 0.9, 'tech-first at the cost of nature must almost always lose');
assert.ok(byTech[4].lose > byTech[0].lose, 'tech-first loses more often than tech-light play');
assert.ok(won(bot), 'a player who watches the red lines can win');
console.log('\nall checks passed');
