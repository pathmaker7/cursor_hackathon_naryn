// Pure game rules. No DOM, no Three.js, so test.js can run it in Node.
import { BASE, CAP, STATS, DRIFT, RIPPLES, SCENES, ARCH, PROSPERITY_WEIGHTS, START_YEAR, YEARS_PER_ROUND } from './data.js';

export const ROUNDS = SCENES.length;
export const LOSE_STATS = STATS.filter(s => s.lose);
export const statDef = Object.fromEntries(STATS.map(s => [s.k, s]));

export const yearOf = round => START_YEAR + round * YEARS_PER_ROUND;

export function newGame() {
  return {
    round: 0,
    stats: { ...BASE },
    picks: Object.fromEntries(Object.keys(ARCH).map(k => [k, 0])),
    log: [],      // [{ round, i, arch }]
    lost: [],     // stat keys that crossed their red line
    over: false,
  };
}

const clamp = (k, v) => Math.max(0, Math.min(CAP[k] ?? 100, v));

// Applies fx to stats in place and returns the changes that really happened after clamping,
// so the UI never shows a delta the player did not receive.
function bump(stats, fx) {
  const out = [];
  for (const [k, d] of Object.entries(fx)) {
    const from = stats[k];
    const to = clamp(k, from + d);
    if (to !== from) {
      stats[k] = to;
      out.push({ k, d: to - from, from, to });
    }
  }
  return out;
}

// Points left before the red line (0 or less means lost).
export function remaining(stat, v) {
  return stat.lose.dir === 'low' ? v - stat.lose.at : stat.lose.at - v;
}

// Red-line stats sorted by how close they are, as a share of the distance they started with.
export function danger(stats) {
  return LOSE_STATS.map(st => {
    const left = remaining(st, stats[st.k]);
    return { k: st.k, left, ratio: left / remaining(st, BASE[st.k]) };
  }).sort((a, b) => a.ratio - b.ratio);
}

// Plays choice i of the current scene. Returns the ordered steps the UI should animate:
// the choice itself, the yearly drift, then every aftershock rule that fired.
// Aftershocks read one snapshot, so the order of RIPPLES never changes the outcome.
export function play(game, i) {
  if (game.over) throw new Error('game is over');
  const choice = SCENES[game.round].choices[i];
  if (!choice) throw new Error(`no choice ${i}`);
  const s = game.stats;

  const steps = [{ type: 'choice', deltas: bump(s, choice.fx) }];
  steps.push({ type: 'drift', deltas: bump(s, DRIFT.fx) });
  const snapshot = { ...s };
  for (const r of RIPPLES) {
    if (r.when(snapshot)) steps.push({ type: 'ripple', id: r.id, deltas: bump(s, r.fx) });
  }

  game.picks[choice.arch]++;
  game.log.push({ round: game.round, i, arch: choice.arch });
  game.round++;
  game.lost = LOSE_STATS.filter(st => remaining(st, s[st.k]) <= 0).map(st => st.k);
  game.over = game.lost.length > 0 || game.round >= ROUNDS;
  return steps.filter(st => st.deltas.length);
}

const health = (k, v) => (k === 'poverty' ? 100 - v : k === 'debt' ? 100 - Math.min(100, v / 1.8) : v);

// 0..100 weighted wellbeing, stretched so the start (early 2026) reads about 62 and a country
// that truly coexists with its nature can reach 85+. Poverty and debt count inverted.
// Used for the character's look, the tiers, the ending and the score.
export function prosperity(stats) {
  let raw = 0;
  for (const [k, w] of Object.entries(PROSPERITY_WEIGHTS)) raw += w * health(k, stats[k]);
  const p = raw < 59 ? 30 + (raw - 36) * (32 / 23) : 62 + (raw - 59) * (26 / 12);
  return Math.max(0, Math.min(100, p));
}

export const tier = p => (p < 48 ? 0 : p < 64 ? 1 : p < 76 ? 2 : 3);

export const won = game => game.over && game.lost.length === 0;

// Survived decisions count most, then prosperity and harmony; a victory is worth a clear jump.
// Technology and nature only count together: the weaker of the two is the harmony of the country.
export const harmony = stats => Math.min(stats.tech, stats.nature);

export const scoreOf = (round, stats, victory) =>
  round * 25 + Math.round(prosperity(stats) * 4) + Math.round(harmony(stats) * 2) + (victory ? 300 : 0);
export const score = game => scoreOf(game.round, game.stats, won(game));

export function endingKey(game) {
  const p = prosperity(game.stats);
  return p >= 76 && harmony(game.stats) >= 50 ? 'gold' : p >= 55 ? 'ok' : 'thin';
}
