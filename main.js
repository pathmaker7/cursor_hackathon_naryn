// UI glue: renders state, animates consequences, talks to the character and the leaderboard.
// Rules live in engine.js, content in data.js, 3D in character.js.
import { SCENES, STATS, BASE, UI, ARCH, TIERS, ENDINGS, DRIFT, RIPPLES } from './data.js';
import {
  newGame, play, ROUNDS, LOSE_STATS, statDef, remaining, danger, prosperity, tier,
  won, scoreOf, harmony, endingKey, yearOf,
} from './engine.js';
import { cleanName, sameName, submitScore, loadBoard } from './leaderboard.js';

const $ = id => document.getElementById(id);
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode: fine */ } },
};
function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  e.append(...kids.flat().filter(x => x != null && x !== false));
  return e;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let fast = store.get('skg_fast') === '1';   // header toggle: no UI animation, results appear instantly
const still = () => reduced || fast;
const clamp01 = x => Math.max(0, Math.min(1, x));
const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

// Harmony = how high BOTH technology and nature are (the lower one counts). Gauge ring shows it.
const techOf = s => (typeof s.tech === 'number' ? s.tech : 34);
const harmonyOf = s => Math.round(Math.min(techOf(s), s.nature));
const GAUGE_LEN = 2 * Math.PI * 18;
function buildGauge() {
  const svg = svgEl('svg', { class: 'gauge', viewBox: '0 0 44 44', 'aria-hidden': 'true' });
  const fg = svgEl('circle', { class: 'g-fg', cx: 22, cy: 22, r: 18, 'stroke-dasharray': GAUGE_LEN.toFixed(2), 'stroke-dashoffset': GAUGE_LEN.toFixed(2) });
  const txt = svgEl('text', { x: 22, y: 23 });
  svg.append(svgEl('circle', { class: 'g-bg', cx: 22, cy: 22, r: 18 }), fg, svgEl('path', { class: 'g-tri', d: 'M22 0.5l3 5h-6z' }), txt);
  return {
    el: svg,
    set(stats) {
      const hm = harmonyOf(stats);
      fg.setAttribute('stroke-dashoffset', (GAUGE_LEN * (1 - clamp01(hm / 100))).toFixed(2));
      svg.classList.toggle('skew', Math.abs(techOf(stats) - stats.nature) > 25);
      txt.textContent = String(hm);
    },
  };
}
const stageGauge = buildGauge();

// ---------------------------------------------------------------- state
const savedLang = store.get('skg_lang');
let lang = savedLang === 'ru' || savedLang === 'en' ? savedLang : (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
let game = newGame();
let shown = { ...game.stats };   // what the stat panel displays; trails game.stats while consequences animate
let shownRound = 0;
let armedAt = 0;                 // clicks before this time are ignored, so a double click cannot answer the next question
const arm = (ms = 300) => { armedAt = performance.now() + ms; };
let phase = 'intro';             // intro | choose | impact | ended
let runId = 0;                   // bumped on restart so stale animations stop themselves
let impact = null;               // the decision being revealed
let changes = [];                // stat changes of the latest decision, shown as chips on the right: { k, d, good, group }
let showReasons = store.get('skg_reasons') === '1';
let result = null;               // end screen state
let draftName = store.get('skg_name') || '';
let character = null;
let city = null;
let muted = store.get('skg_mute') === '1';

const t = () => UI[lang];
const tr = o => o[lang];

// ---------------------------------------------------------------- sound
let audio;
const SOUNDS = {
  click: [[440, 0, 0.06, 'triangle', 0.05]],
  good: [[660, 0, 0.1, 'sine'], [880, 0.09, 0.16, 'sine']],
  bad: [[190, 0, 0.18, 'sawtooth', 0.045], [135, 0.12, 0.26, 'sawtooth', 0.045]],
  win: [[523, 0, 0.18], [659, 0.15, 0.18], [784, 0.3, 0.18], [1047, 0.45, 0.5]],
  lose: [[392, 0, 0.3, 'triangle'], [330, 0.28, 0.3, 'triangle'], [262, 0.56, 0.3, 'triangle'], [196, 0.84, 0.7, 'triangle']],
};
function sound(name) {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    for (const [freq, at, dur, type = 'sine', vol = 0.07] of SOUNDS[name]) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      const s = audio.currentTime + at;
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, s);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.connect(g).connect(audio.destination);
      o.start(s); o.stop(s + dur + 0.02);
    }
  } catch { /* no audio: fine */ }
}

// ---------------------------------------------------------------- stat panel
const rows = {};
function buildStats() {
  const ul = $('stats');
  for (const st of STATS) {
    const r = {
      icon: h('span', { class: 'stat-icon' }),
      name: h('span', { class: 'stat-name' }),
      val: h('span', { class: 'stat-val' }),
      chg: h('span', { class: 'stat-chg' }),
      why: h('div', { class: 'stat-why' }),
      zone: h('i', { class: 'zone' }),
      fill: h('i', { class: 'fill' }),
      mark: st.lose ? h('i', { class: 'mark' }) : null,
      redline: h('span', { class: 'redline' }),
      left: h('span', { class: 'left' }),
      disp: shown[st.k],
      flashId: 0,
    };
    r.li = h('li', { class: 'stat' + (st.lose ? '' : ' none'), 'data-k': st.k },
      h('div', { class: 'stat-top' }, r.icon, r.name, r.chg, r.val),
      r.why,
      h('div', { class: 'bar' }, st.lose ? r.zone : null, r.fill, r.mark),
      h('div', { class: 'stat-foot' }, r.redline, r.left));
    rows[st.k] = r;
    ul.append(r.li);
  }
}

// The engine judges a decision only after the aftershocks, so a stat that dips below its line mid-animation
// is not lost until the decision has settled (shownRound caught up with the game).
const settled = () => shownRound === game.round;
function nearest() {
  const d = danger(shown)[0];
  return d.left <= 0 && !settled() ? { ...d, left: 0, ratio: 0.02 } : d;
}

// ok / warn / crit / lost for red-line stats, based on distance left as a share of the starting distance.
function level(st, v) {
  if (st.lose) {
    const left = remaining(st, v);
    if (left <= 0) return settled() ? 'lost' : 'crit';
    const ratio = left / remaining(st, BASE[st.k]);
    return ratio <= 0.25 ? 'crit' : ratio <= 0.5 ? 'warn' : 'ok';
  }
  const good = st.good === 'up' ? v : 100 - v;
  return good >= 60 ? 'ok' : good <= 30 ? 'warn' : '';
}

const unit = st => (st.unit === '%' ? '%' : '');
function paintStatText(k, v) {
  const st = statDef[k], r = rows[k];
  r.val.replaceChildren(String(Math.round(v)), h('small', {}, unit(st)));
}
function paintStat(k) {
  const st = statDef[k], r = rows[k], v = shown[k];
  r.name.textContent = tr(st.name);
  r.icon.textContent = st.icon(v);
  paintStatText(k, r.disp);
  r.fill.style.width = `${Math.min(100, (v / st.max) * 100)}%`;
  const lv = level(st, v);
  r.li.dataset.level = lv;
  r.fill.style.setProperty('--c', lv === 'lost' || lv === 'crit' ? 'var(--bad)' : lv === 'warn' ? 'var(--warn)' : 'var(--lime)');
  if (st.lose) {
    const at = (st.lose.at / st.max) * 100;
    r.mark.style.left = `${at}%`;
    r.zone.style.left = st.lose.dir === 'low' ? '0' : `${at}%`;
    r.zone.style.width = st.lose.dir === 'low' ? `${at}%` : `${100 - at}%`;
    const sign = st.lose.dir === 'low' ? '≤' : '≥';
    r.redline.textContent = `☠ ${t().lose} ${sign} ${st.lose.at}`;
    const left = remaining(st, v);
    r.left.textContent = left <= 0 && settled() ? t().crossed : t().toGo(Math.max(0, Math.round(left)));
  } else {
    r.redline.textContent = t().noLine;
    r.left.textContent = '';
  }
}
function paintAllStats() { for (const st of STATS) paintStat(st.k); }

function tween(k, to) {
  const r = rows[k], from = r.disp, t0 = performance.now(), id = ++r.flashId;
  r.disp = to;
  (function step(now) {
    if (id !== r.flashId) return;
    const p = Math.min(1, (now - t0) / 450);
    paintStatText(k, from + (to - from) * p);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
function setStat(k, v, animate) {
  shown[k] = v;
  if (animate) { paintStat(k); tween(k, v); } else { rows[k].disp = v; rows[k].flashId++; paintStat(k); }
}

function flashRow(k, good) {
  const li = rows[k].li;
  li.classList.remove('flash-good', 'flash-bad');
  void li.offsetWidth;
  li.classList.add(good ? 'flash-good' : 'flash-bad');
  setTimeout(() => li.classList.remove('flash-good', 'flash-bad'), 900);
}
const deltaText = (st, d) => `${d > 0 ? '+' : ''}${d}${st.k === 'debt' ? '%' : ''}`;
// Changes stay on the stat rows (+N green, -N red) until the next decision; reasons are opt in.
const reasonText = c => {
  const st = statDef[c.k];
  return `${c.group ? `${tr(c.group.label)}: ` : ''}${tr(c.d > 0 ? st.up : st.down)}`;
};
function renderRowChanges(k, popLast = false) {
  const r = rows[k], st = statDef[k], list = changes.filter(c => c.k === k);
  r.chg.replaceChildren(...list.map((c, i) => h('b', { class: `chg ${c.good ? 'good' : 'bad'}${popLast && i === list.length - 1 ? ' pop' : ''}` }, deltaText(st, c.d))));
  r.why.replaceChildren(...list.map(c => h('div', { class: c.good ? 'good' : 'bad' }, reasonText(c))));
}
function renderAllChanges() { for (const st of STATS) renderRowChanges(st.k); }
function clearChanges() { changes = []; renderAllChanges(); }
function paintFastToggle() {
  const b = $('fast-btn');
  b.setAttribute('aria-pressed', String(fast));
  b.textContent = `${fast ? '☑' : '☐'} ⚡ `;
  const label = document.createElement('span');
  label.className = 'toggle-label';
  label.textContent = t().fast;
  b.append(label);
  b.title = b.ariaLabel = t().fast;
  document.body.classList.toggle('fast', fast);
}
function paintReasonsToggle() {
  const b = $('reasons-btn');
  b.setAttribute('aria-pressed', String(showReasons));
  b.textContent = `${showReasons ? '☑' : '☐'} ${t().reasons}`;
  $('stats').classList.toggle('reasons', showReasons);
}
let floaterCount = 0;
function floater(good, text) {
  const f = h('span', { class: `floater ${good ? 'good' : 'bad'}` }, text);
  f.style.left = `${22 + ((floaterCount * 23) % 50)}%`;
  f.style.bottom = `${16 + (floaterCount % 3) * 11}%`;
  floaterCount++;
  $('floaters').append(f);
  setTimeout(() => f.remove(), 2000);
}
function flashStage(good, shake) {
  const s = $('stage');
  s.classList.remove('flash-good', 'flash-bad');
  void s.offsetWidth;
  s.classList.add(good ? 'flash-good' : 'flash-bad');
  setTimeout(() => s.classList.remove('flash-good', 'flash-bad'), 380);
  if (shake) { s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
}

// ---------------------------------------------------------------- header, banner, character
function renderTop() {
  $('brand-name').textContent = t().title;
  document.title = t().title;
  document.documentElement.lang = lang;
  $('lang-en').classList.toggle('active', lang === 'en');
  $('lang-ru').classList.toggle('active', lang === 'ru');
  $('sound-btn').setAttribute('aria-pressed', String(!muted));
  paintFastToggle();
  $('sound-btn').textContent = muted ? '🔇' : '🔊';
  $('sound-btn').title = t().sound;
  $('year-badge').textContent = yearOf(shownRound);
  $('stats-title').textContent = t().status;
  paintReasonsToggle();
  const crashed = game.lost.length > 0 && shownRound === game.round;
  const dots = [];
  for (let i = 0; i < ROUNDS; i++) {
    const cls = i < shownRound ? (crashed && i === shownRound - 1 ? 'lost' : 'done')
      : i === shownRound && !(game.over && shownRound === game.round) ? 'now' : '';
    dots.push(h('li', { class: cls }));
  }
  $('progress').replaceChildren(...dots);
  const P = prosperity(shown), ti = tier(P);
  $('tier-pill').textContent = `${['🥀', '🌱', '🌳', '🌞'][ti]} ${t().prosperity}: ${tr(TIERS[ti])}`;
  $('score-pill').textContent = `${t().score}: ${scoreOf(shownRound, shown, game.over && settled() && won(game))}`;
  paintHarmony();
}
let hmText;
function paintHarmony() {
  const box = $('stage-harmony');
  if (!hmText) {
    hmText = { label: h('small', {}), line: h('b', {}) };
    box.replaceChildren(stageGauge.el, h('span', { class: 'hm-text' }, hmText.label, hmText.line));
  }
  hmText.label.textContent = t().harmony;
  hmText.line.textContent = t().harmonyLine(Math.round(techOf(shown)), Math.round(shown.nature));
  stageGauge.set(shown);
}

function paintDanger() {
  const d = nearest(), st = statDef[d.k], box = $('danger');
  const gone = d.left <= 0 && settled();     // a dip that the aftershocks lift again is not a loss
  const lv = d.left <= 0 ? 'crit' : d.ratio <= 0.25 ? 'crit' : d.ratio <= 0.5 ? 'warn' : 'ok';
  box.className = `danger ${lv}`;
  const icon = gone ? '☠' : lv === 'ok' ? '🛡️' : '⚠️';
  const text = gone ? `${t().crossed}: ${tr(st.name)} ${Math.round(shown[d.k])}`
    : lv === 'ok' ? `${t().safe}. ${t().closest(tr(st.name), Math.round(d.left))}`
      : t().closest(tr(st.name), Math.round(d.left));
  box.replaceChildren(h('span', {}, icon), h('span', {}, text));
}

function syncCity() {
  if (!city) return;
  try {
    const d = nearest();
    city.update(shown, prosperity(shown), 1 - clamp01(d.ratio));
  } catch (err) { console.warn('city update failed:', err); }
}

function syncCharacter() {
  const P = prosperity(shown), d = nearest();
  character?.setLook(P, Math.max(0, d.ratio), shown);
  const f = $('stage-fallback');
  if (!f.hidden) {
    const face = game.lost.length && shownRound === game.round ? '😵' : d.ratio <= 0.25 ? '😰' : P >= 70 ? '😄' : P >= 52 ? '🙂' : '😟';
    f.replaceChildren(h('span', {}, face), h('small', {}, t().noWebgl));
  }
}

// ---------------------------------------------------------------- question card
function renderCard() {
  const idx = impact ? impact.sceneIdx : Math.min(game.round, ROUNDS - 1);
  const sc = SCENES[idx];
  const stats = impact ? impact.before : game.stats;
  $('topic').textContent = `${t().decision(idx + 1, ROUNDS)}  ·  ${tr(sc.topic)}  ·  ${yearOf(idx)}`;
  const prev = game.log[idx - 1];
  const echo = prev && tr(SCENES[prev.round].choices[prev.i].echo);
  $('lead').replaceChildren(...(echo ? [h('strong', {}, `${t().lastTime}: `), echo] : []));
  typeInto($('question'), tr(sc.q)(roundStats(stats)));

  const box = $('choices');
  if (phase === 'choose' || phase === 'intro') {
    $('impact').hidden = true;
    box.hidden = false;
    // No archetype label on the buttons: the player must not see which choice is the synthesis one.
    box.replaceChildren(...sc.choices.map((c, i) => h('button', { class: 'choice', type: 'button', style: `--i:${i}`, onclick: () => choose(i) },
      h('span', { class: 'key' }, String(i + 1)),
      h('span', { class: 'title' }, tr(c.title)),
      h('span', { class: 'sub' }, tr(c.sub)))));
  } else {
    box.hidden = true;
    renderImpact();
  }
}
// Quick typewriter (550ms at most). The full text is always in the DOM, the unrevealed tail is only hidden,
// so layout never jumps. Any click or key press finishes it.
let typeId = 0, finishTyping = null;
function typeInto(el, text) {
  const id = ++typeId;
  finishTyping = null;
  el.textContent = text;
  if (still() || text.length < 3) return;
  const head = h('span', {}), tail = h('span', { class: 'ghost' }, text);
  el.replaceChildren(head, tail);
  const total = Math.min(550, Math.max(260, text.length * 8)), t0 = performance.now();
  const stop = () => { if (id === typeId) { typeId++; finishTyping = null; el.textContent = text; } };
  finishTyping = stop;
  (function step(now) {
    if (id !== typeId) return;
    const n = Math.min(text.length, Math.floor(((now - t0) / total) * text.length));
    head.textContent = text.slice(0, n);
    tail.textContent = text.slice(n);
    if (n < text.length) requestAnimationFrame(step); else stop();
  })(t0);
}
const roundStats = s => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Math.round(v)]));

function renderImpact() {
  const c = impact.choice, box = $('impact');
  box.hidden = false;
  box.replaceChildren(
    h('div', { class: 'picked' }, h('span', { class: `arch ${c.arch}` }, ARCH[c.arch]?.icon ?? ''), h('span', { class: 'title' }, tr(c.title))),
    h('p', { class: 'echo' }, tr(c.echo)),
    h('div', { class: 'impact-actions', id: 'impact-actions' }));
  renderActions();
}
function renderActions() {
  const box = $('impact-actions');
  if (!box) return;
  if (!impact.done) {
    box.replaceChildren(h('button', { class: 'btn', type: 'button', onclick: skip }, `${t().skip} ▸▸`));
  } else {
    const b = h('button', { class: 'btn primary', type: 'button', onclick: next }, game.over ? t().result : `${t().next} ▸`);
    box.replaceChildren(b);
    b.focus({ preventScroll: true });
  }
}

// ---------------------------------------------------------------- turn flow
async function choose(i) {
  if (phase !== 'choose' || performance.now() < armedAt) return;       // guards double clicks and key mashing
  phase = 'impact';
  finishTyping?.();
  const my = runId;
  const sceneIdx = game.round;
  const before = { ...game.stats };
  const steps = play(game, i);
  impact = { sceneIdx, choice: SCENES[sceneIdx].choices[i], before, done: false, skip: false, live: false, wake: null };
  shown = { ...before };
  clearChanges();
  sound('click');
  const btns = [...$('choices').children];
  if (btns.length && !still()) {   // chosen button glows, the others fade and shrink, then the feed takes over
    btns.forEach((b, j) => { b.disabled = true; b.classList.add(j === i ? 'chosen' : 'dim'); });
    await sleep(480);
    if (my !== runId) return;
  }
  impact.live = true;
  impact.skip = fast;                  // instant mode: no waits between changes
  renderCard();
  window.scrollTo({ top: 0, behavior: fast ? 'auto' : 'smooth' });   // watch the character react
  await animate(steps, my);
}

const nap = ms => new Promise(r => {
  if (impact.skip) return r();
  impact.wake = r;
  setTimeout(r, ms);
});
function skip() { if (impact && impact.live && !impact.done) { impact.skip = true; impact.wake?.(); } }

function reveal(d, group = null) {
  const st = statDef[d.k], good = (st.good === 'up') === (d.d > 0), mag = Math.abs(d.d);
  changes.push({ k: d.k, d: d.d, good, group });
  const quiet = fast || impact.skip;   // skipped or instant: show the numbers, no effects
  setStat(d.k, d.to, !quiet);
  renderRowChanges(d.k, !quiet);
  if (!quiet) flashRow(d.k, good);
  const text = `${tr(st.name)} ${deltaText(st, d.d)}`;
  if (!quiet) {
    floater(good, `${st.icon(d.to)} ${text}`);
    flashStage(good, !good && mag >= 8);
    character?.react(good, mag);
    sound(good ? 'good' : 'bad');
  }
  paintDanger();
  syncCharacter();
  syncCity();
  renderTop();
}

async function animate(steps, my) {
  for (const step of steps) {
    if (my !== runId) return;
    if (step.type === 'choice') {
      for (const d of [...step.deltas].sort((a, b) => Math.abs(b.d) - Math.abs(a.d))) {
        if (my !== runId) return;
        reveal(d);
        await nap(750);
      }
      continue;
    }
    const info = step.type === 'drift' ? DRIFT : RIPPLES.find(r => r.id === step.id);
    await nap(250);
    if (my !== runId) return;
    for (const d of step.deltas) reveal(d, info);
    await nap(1000);
  }
  if (my !== runId) return;
  finishImpact();
}

function finishImpact() {
  shown = { ...game.stats };
  shownRound = game.round;             // settled: from here a crossed red line is a real loss
  for (const st of STATS) setStat(st.k, shown[st.k], false);
  impact.done = true;
  if (game.over) {
    const win = won(game);
    character?.setEnding(win ? 'win' : 'lose');
    city?.setEnding(win ? 'win' : 'lose');
    sound(win ? 'win' : 'lose');
    if (win && !fast) confetti();
    const final = scoreOf(game.round, game.stats, win);
    const newBest = final > Number(store.get('skg_best') || 0);
    if (newBest) store.set('skg_best', String(final));
    result = { saving: false, saved: null, msg: null, board: undefined, score: final, newBest };
    loadBoardInto(result);
  }
  paintDanger(); syncCharacter(); syncCity(); renderTop(); renderActions();
  if (fast && !game.over) next(); else arm();   // instant mode: straight to the next question, the numbers stay in the stat chips. The last result stays manual.
}

function next() {
  if (phase !== 'impact' || !impact?.done || performance.now() < armedAt) return;
  if (game.over) { phase = 'ended'; renderOverlay(); return; }
  impact = null;
  phase = 'choose';
  arm();
  renderTop(); renderCard();
  $('card').scrollIntoView({ block: 'start', behavior: fast ? 'auto' : 'smooth' });   // read the next question
}

function startRun() {
  runId++;
  game = newGame();
  shown = { ...game.stats };
  shownRound = 0;
  impact = null;
  result = null;
  phase = 'choose';
  arm();
  character?.reset();
  city?.setEnding(null);
  $('floaters').replaceChildren();
  clearChanges();
  for (const st of STATS) setStat(st.k, shown[st.k], false);
  $('overlay').hidden = true;
  paintDanger(); syncCharacter(); syncCity(); renderTop(); renderCard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------------------------------------------------------- overlay: intro and result
async function loadBoardInto(target) {
  target.board = undefined;
  const my = runId;
  try { target.board = await loadBoard(); } catch { target.board = null; }
  if (my === runId && !$('overlay').hidden) renderOverlay();
}

function boardView(target) {
  if (target.board === undefined) return h('p', { class: 'board-note' }, '...');
  if (target.board === null) {
    return h('div', {}, h('p', { class: 'board-note' }, t().offline),
      h('button', { class: 'btn', type: 'button', onclick: () => { loadBoardInto(target); renderOverlay(); } }, t().retry));
  }
  if (!target.board.length) return h('p', { class: 'board-note' }, t().empty);
  const me = result?.saved ? result.saved.name : null;
  const li = (r, i) => h('li', { class: me && sameName(r.name, me) ? 'me' : '', style: `--i:${i}` },
    h('span', { class: 'nm' }, r.name, me && sameName(r.name, me) ? h('span', { class: 'badge' }, t().you) : null),
    h('span', { class: 'sc' }, String(r.score)));
  const top = target.board.slice(0, 10).map(li);
  const mine = me ? target.board.findIndex(r => sameName(r.name, me)) : -1;
  if (mine >= 10) top.push(h('li', { class: 'me', style: `counter-set: rank ${mine + 1}` }, h('span', { class: 'nm' }, target.board[mine].name), h('span', { class: 'sc' }, String(target.board[mine].score))));
  return h('ol', { class: 'board' }, top);
}

let modalFresh = true;   // true only when the overlay was hidden: full entrance animation, no replay on re-render
function renderOverlay() {
  const ov = $('overlay');
  modalFresh = ov.hidden;
  ov.hidden = false;
  const input = document.activeElement?.id === 'name-input' ? document.activeElement : null;
  const caret = input?.selectionStart;
  ov.replaceChildren(phase === 'intro' ? introView() : resultView());
  if (input) { const again = $('name-input'); again.focus({ preventScroll: true }); again.setSelectionRange(caret, caret); }
  if (phase === 'intro') ov.querySelector('.btn.primary')?.focus({ preventScroll: true });
}

const modalClass = () => 'modal' + (modalFresh ? ' enter' : '');
function logoClone() {
  const l = document.querySelector('.brand-logo').cloneNode(true);
  l.setAttribute('class', 'modal-logo');
  l.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  l.querySelector('rect')?.setAttribute('fill', '#0f3a2a');
  return l;
}
function messageBox(long) {
  return h('div', { class: 'message' },
    h('div', { class: 'mlabel' }, t().themeLabel),
    h('p', { class: 'mtheme' }, t().theme),
    long ? h('p', { class: 'mlong' }, t().themeLong) : null);
}
function harmonyCard(stats) {
  const g = buildGauge();
  if (modalFresh && !still()) { g.el.querySelector('.g-fg').style.transitionDuration = '1.4s'; requestAnimationFrame(() => requestAnimationFrame(() => g.set(stats))); }
  else { g.el.querySelector('.g-fg').style.transition = 'none'; g.set(stats); }
  return h('div', { class: 'harmony-card' }, g.el,
    h('div', { class: 'hm-text' },
      h('small', {}, t().harmony),
      h('b', {}, t().harmonyLine(Math.round(techOf(stats)), Math.round(stats.nature))),
      h('span', {}, t().harmonyHint)));
}

let introBoard = { board: undefined };
function introView() {
  if (introBoard.board === undefined && !introBoard.loading) { introBoard.loading = true; loadBoardInto(introBoard); }
  return h('div', { class: modalClass() },
    h('h2', {}, logoClone(), t().title),
    h('p', {}, t().tagline),
    messageBox(true),
    h('p', { class: 'goal' }, t().goal),
    h('h3', {}, t().redLines),
    h('ul', { class: 'redlines' }, LOSE_STATS.map((st, i) => h('li', { style: `--i:${i}` },
      h('span', { class: 'ic' }, st.icon(st.lose.at)),
      h('span', {}, tr(st.name), h('small', {}, `${t().lose} ${st.lose.dir === 'low' ? '≤' : '≥'} ${st.lose.at}`))))),
    h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'button', onclick: startRun }, `${t().start} ▸`)),
    h('h3', {}, t().leaderboard),
    boardView(introBoard));
}

function resultView() {
  const win = won(game);
  const lostSt = statDef[game.lost[0]];
  const end = win ? ENDINGS[endingKey(game)] : null;
  const P = Math.round(prosperity(game.stats));
  const doSave = e => { e.preventDefault(); save(); };
  return h('div', { class: modalClass() },
    h('h2', { class: win ? 'win' : 'lose' }, win ? `${end.icon} ${tr(end.title)}` : `☠ ${tr(lostSt.end.title)}`),
    h('p', {}, win ? tr(end.text) : tr(lostSt.end.text)(Math.round(game.stats[lostSt.k]))),
    h('p', { class: 'endmsg' }, win ? t().endWin : t().endLose),
    harmonyCard(game.stats),
    messageBox(true),
    h('div', { class: 'bigscore' },
      h('b', {}, String(result.score)),
      h('span', {}, `${win ? t().youWin : t().youLose}. ${t().roundsDone(game.round, ROUNDS)}`),
      result.newBest ? h('span', { class: 'badge' }, `${t().best}!`) : null),
    h('p', { class: 'sub' }, t().breakdown(game.round, P, Math.round(harmony(game.stats)), win)),
    win ? null : h('div', { class: 'tip' }, h('strong', {}, `${t().tipTitle}: `), tr(lostSt.end.tip)),
    h('h3', {}, t().pathTitle),
    h('ul', { class: 'path' }, game.log.map(l => {
      const c = SCENES[l.round].choices[l.i];
      const a = ARCH[l.arch];
      return h('li', { title: tr(c.title) }, `${yearOf(l.round)} ${a?.icon ?? ''} ${a ? tr(a.name) : ''}`);
    })),
    h('h3', {}, t().nameLabel),
    h('form', { class: 'save-form', onsubmit: doSave },
      h('input', {
        type: 'text', id: 'name-input', maxlength: '20', value: draftName, placeholder: t().namePh, autocomplete: 'nickname',
        disabled: !!result.saved || result.saving,
        oninput: e => { draftName = e.target.value; },
      }),
      h('button', { class: 'btn primary', type: 'submit', disabled: !!result.saved || result.saving },
        result.saving ? t().saving : result.saved ? `${t().saved} ✓` : t().save)),
    h('p', { class: `msg ${result.msg?.err ? 'err' : result.saved ? 'okk' : ''}` },
      result.msg ? result.msg.text : result.saved ? (result.saved.rank ? t().rankLine(result.saved.rank) : t().saved) : ''),
    h('h3', {}, t().leaderboard),
    boardView(result),
    h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'button', onclick: startRun }, `${t().again} ▸`)));
}

async function save() {
  if (!result || result.saving || result.saved) return;      // one save per run, ever
  const name = cleanName(draftName);
  if (name.length < 2) { result.msg = { err: true, text: t().nameShort }; renderOverlay(); return; }
  result.saving = true; result.msg = null;
  renderOverlay();
  const my = runId, target = result;
  try {
    await submitScore(name, target.score, yearOf(game.round));
  } catch {
    target.saving = false;
    target.msg = { err: true, text: t().saveFail };
    if (my === runId) renderOverlay();
    return;
  }
  store.set('skg_name', name);
  draftName = name;
  target.saving = false;
  target.saved = { name, rank: 0 };
  if (my === runId) renderOverlay();     // show "Saved" at once, the rank follows when the board reloads
  try {
    target.board = await loadBoard();
    target.saved.rank = target.board.findIndex(r => sameName(r.name, name)) + 1;
  } catch { target.board = null; }
  if (my === runId) renderOverlay();
}

// ---------------------------------------------------------------- confetti
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('confetti'), ctx = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const colors = ['#f6c453', '#9be15d', '#3fd0b0', '#ffffff', '#ff9a6b'];
  const ps = Array.from({ length: 170 }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.6, vx: (Math.random() - 0.5) * 3,
    vy: 2 + Math.random() * 4, s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of ps) {
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    if (++frames < 280) requestAnimationFrame(tick); else ctx.clearRect(0, 0, c.width, c.height);
  })();
}

// ---------------------------------------------------------------- wiring
function setLang(l) {
  lang = l;
  store.set('skg_lang', l);
  renderAllChanges();
  paintAllStats(); paintDanger(); syncCharacter(); renderTop(); renderCard();
  if (!$('overlay').hidden) renderOverlay();
}
$('reasons-btn').addEventListener('click', () => {
  showReasons = !showReasons;
  store.set('skg_reasons', showReasons ? '1' : '0');
  paintReasonsToggle();
});
$('lang-en').addEventListener('click', () => setLang('en'));
$('lang-ru').addEventListener('click', () => setLang('ru'));
$('fast-btn').addEventListener('click', () => {
  fast = !fast;
  store.set('skg_fast', fast ? '1' : '0');
  paintFastToggle();
  if (fast) { finishTyping?.(); skip(); }   // turning it on mid-animation finishes the animation now
});
$('sound-btn').addEventListener('click', () => { muted = !muted; store.set('skg_mute', muted ? '1' : '0'); renderTop(); if (!muted) sound('click'); });

document.addEventListener('keydown', e => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea')) return;   // a held key must not answer several questions
  if (phase === 'choose' && ['1', '2', '3'].includes(e.key)) choose(Number(e.key) - 1);
  else if (phase === 'impact' && impact && ['ArrowRight', ' ', 'Enter'].includes(e.key) && !e.target.closest('button')) {
    e.preventDefault();
    impact.done ? next() : skip();
  }
});

async function initCharacter() {
  try {
    const mod = await import('./character.js');
    character = mod.createCharacter($('stage'));
    $('stage-fallback').hidden = true;
  } catch (err) {
    console.warn('3D character unavailable:', err);
    $('stage-fallback').hidden = false;
  }
  syncCharacter();
}

async function initCity() {
  try {
    const mod = await import('./city.js');
    city = mod.createCity($('stage'));
    if (phase === 'ended' || (phase === 'impact' && impact?.done && game.over)) city.setEnding(won(game) ? 'win' : 'lose');
  } catch (err) {
    console.warn('City backdrop unavailable:', err);
    city = null;
  }
  syncCity();
}

buildStats();
paintAllStats(); paintDanger(); renderTop(); renderCard();
renderOverlay();
initCity();
initCharacter();
