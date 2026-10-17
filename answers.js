// Writes ANSWERS.local.md (gitignored): the best and worst button sequences. Run: npm run answers
import fs from 'node:fs';
import { SCENES, ARCH } from './data.js';
import { ROUNDS, score } from './engine.js';
import { enumerateAll, archOf, playSeq, pureArch } from './sim.js';

const all = enumerateAll();
const fmt = seq => seq.map((i, r) => `${i + 1}`).join(' ');
const named = (seq, n) => seq.slice(0, n).map((i, r) => `${i + 1}(${ARCH[archOf(r, i)].icon})`).join(' ');
const stat = s => Object.entries(s).map(([k, v]) => `${k} ${v}`).join(', ');
const table = (seq, n) => ['| Q | topic | press | type | choice |', '|---|---|---|---|---|',
  ...seq.slice(0, n).map((i, r) => `| ${r + 1} | ${SCENES[r].topic.en} | **${i + 1}** | ${archOf(r, i)} | ${SCENES[r].choices[i].title.en} |`)].join('\n');

const winners = all.filter(r => r.won).sort((a, b) => b.score - a.score);
const seen = new Set();
const topDistinct = [];
for (const w of winners) { const key = w.seq.join(''); if (!seen.has(key)) { seen.add(key); topDistinct.push(w); } if (topDistinct.length === 5) break; }
const best = topDistinct[0];

const lossesBy = {};
for (const r of all.filter(x => !x.won)) {
  const k = r.lost[0];
  const cur = lossesBy[k];
  if (!cur || r.made < cur.made || (r.made === cur.made && r.score < cur.score)) lossesBy[k] = r;
}
const worst = Object.values(lossesBy).sort((a, b) => a.made - b.made || a.score - b.score)[0];
const causes = {};
for (const r of all) if (!r.won) causes[r.lost[0]] = (causes[r.lost[0]] || 0) + 1;

const out = [];
out.push('# Private answer sheet (gitignored, regenerate with `npm run answers`)', '',
  'Press numbers are the buttons 1, 2, 3 from top to bottom. Types: tech = tech first (nature pays), nature = nature first (tech/economy pay), sync = SolarPunk synchronized.', '',
  `Win chance under random play: **${(100 * winners.length / all.length).toFixed(1)}%** (${winners.length} of ${all.length} sequences).`, '',
  '## BEST CASE (highest score)', '',
  `Press: **${fmt(best.seq)}**   score **${best.score}**, prosperity ${best.prosperity.toFixed(1)}, harmony ${best.harmony}`, '', table(best.seq, ROUNDS), '',
  `Final stats: ${stat(best.stats)}`, '', '### Next best winning sequences', '',
  ...topDistinct.slice(1).map(w => `- ${fmt(w.seq)}   score ${w.score}`), '',
  '## WORST CASE (fastest loss)', '',
  `Press: **${fmt(worst.seq.slice(0, worst.made))}** (${worst.made} decisions), lost by **${worst.lost.join(' + ')}**, score ${worst.score}`, '', table(worst.seq, worst.made), '',
  `Final stats: ${stat(worst.stats)}`, '', '### Fastest loss for each red line', '',
  ...Object.entries(lossesBy).map(([k, r]) => `- ${k}: press ${fmt(r.seq.slice(0, r.made))} (loses after decision ${r.made}), score ${r.score}`), '',
  '## Always the same type', '');
for (const a of Object.keys(ARCH)) {
  const g = pureArch(a);
  const seq = g.log.map(l => l.i);
  out.push(`- always **${a}**: press ${fmt(seq)} ${g.lost.length ? `=> LOSE by ${g.lost.join(' + ')} after decision ${g.round}` : '=> survives'} (score ${score(g)})`);
}
for (const b of [0, 1, 2]) {
  const g = playSeq(Array(ROUNDS).fill(b));
  out.push(`- always button **${b + 1}**: ${g.lost.length ? `LOSE by ${g.lost.join(' + ')} after decision ${g.round}` : 'survives'}`);
}
out.push('', '## Why runs end (random play)', '', ...Object.entries(causes).map(([k, v]) => `- ${k}: ${(100 * v / all.length).toFixed(1)}%`), '');
fs.writeFileSync(new URL('./ANSWERS.local.md', import.meta.url), out.join('\n'));
console.log('wrote ANSWERS.local.md');
