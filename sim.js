// Shared by test.js and answers.js: plays every possible button sequence.
import { SCENES } from './data.js';
import { newGame, play, ROUNDS, won, score, prosperity, harmony } from './engine.js';

export const archOf = (round, i) => SCENES[round].choices[i].arch;

// Plays all 3^10 button sequences (a loss ends the run, later presses change nothing).
// Uniform over sequences, so the share of a result equals its chance under random play.
export function enumerateAll() {
  const out = [];
  (function dfs(g, seq) {
    if (g.over || seq.length === ROUNDS) {
      const rest = ROUNDS - seq.length;
      const res = {
        round: g.round, lost: [...g.lost], won: won(g), score: score(g),
        stats: { ...g.stats }, picks: { ...g.picks }, prosperity: prosperity(g.stats), harmony: harmony(g.stats),
      };
      for (let k = 0; k < 3 ** rest; k++) {
        const tail = [];
        for (let d = 0, x = k; d < rest; d++, x = Math.floor(x / 3)) tail.push(x % 3);
        out.push({ ...res, seq: [...seq, ...tail], made: seq.length });
      }
      return;
    }
    for (let i = 0; i < 3; i++) {
      const n = structuredClone(g);
      play(n, i);
      dfs(n, [...seq, i]);
    }
  })(newGame(), []);
  return out;
}

// Plays a fixed sequence of button indexes (0..2) and returns the finished game.
export function playSeq(seq) {
  const g = newGame();
  for (const i of seq) { if (g.over) break; play(g, i); }
  return g;
}

// Always presses the button whose archetype matches.
export const pureArch = arch => {
  const g = newGame();
  while (!g.over) play(g, SCENES[g.round].choices.findIndex(c => c.arch === arch));
  return g;
};
