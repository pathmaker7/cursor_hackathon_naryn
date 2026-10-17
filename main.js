// SolarPunk Kyrgyzstan — Evidence-based branching simulator
// Starting stats grounded in early-2026 data (IMF, World Bank, national sources)

const translations = {
  en: {
    title: "SolarPunk Kyrgyzstan",
    subtitle: "Early 2026. Mountains, water, and hard choices.",
    statsTitle: "National Status",
    restart: "Play Again",
    loseDebt: "Debt crossed the danger zone. Creditors stopped lending. Default.",
    loseLiteracy: "Literacy fell too far. The next generation cannot rebuild.",
    loseNature: "Forests and glaciers are beyond recovery. The land is dying.",
    loseHappiness: "Trust collapsed. People stopped cooperating.",
    win: "The country held together. Not perfect, but the mountains are still green and the lights stay on.",
    score: "Score",
    prosperity: ["Struggling", "Stabilizing", "Growing", "Flourishing"],
    leaderboard: "Local Leaderboard"
  },
  ru: {
    title: "СоларПанк Кыргызстан",
    subtitle: "Начало 2026. Горы, вода и сложные решения.",
    statsTitle: "Статус страны",
    restart: "Играть снова",
    loseDebt: "Долг вошёл в опасную зону. Кредиторы остановились. Дефолт.",
    loseLiteracy: "Грамотность упала слишком низко. Следующее поколение не сможет восстановить страну.",
    loseNature: "Леса и ледники за гранью восстановления. Земля умирает.",
    loseHappiness: "Доверие рухнуло. Люди перестали сотрудничать.",
    win: "Страна удержалась. Не идеально, но горы ещё зелёные, а свет горит.",
    score: "Балл",
    prosperity: ["Тяжело", "Стабилизация", "Рост", "Процветание"],
    leaderboard: "Локальный рейтинг"
  }
};

// Realistic early-2026 baselines (percentages)
// Literacy ~99.6%, national poverty ~25%, debt ~40% GDP, energy self-sufficiency ~79% (15.5/19.6), forest cover 6.4% → nature index ~38
const BASE_STATE = {
  literacy: 99,
  poverty: 25,
  energy: 79,
  debt: 40,
  nature: 38,
  happiness: 52,
  tourism: 42,
  economy: 62,
  culture: 55
};

const STATS = [
  { key: "literacy", labelEn: "Literacy", labelRu: "Грамотность", criticalLow: 75, sticker: (v) => v >= 98 ? "🧠" : v >= 90 ? "📚" : v >= 80 ? "😐" : "😵" },
  { key: "poverty", labelEn: "Poverty", labelRu: "Бедность", criticalHigh: 45, sticker: (v) => v <= 15 ? "💚" : v <= 25 ? "🟡" : "🔴" },
  { key: "energy", labelEn: "Energy Independence", labelRu: "Энергонезависим.", criticalLow: 40, sticker: (v) => v >= 90 ? "⚡" : v >= 70 ? "🔋" : "⚠️" },
  { key: "debt", labelEn: "Debt (% GDP)", labelRu: "Долг (% ВВП)", criticalHigh: 180, sticker: (v) => v >= 120 ? "💸" : v >= 70 ? "📉" : "💰" },
  { key: "nature", labelEn: "Nature / Forests", labelRu: "Природа / Леса", criticalLow: 18, sticker: (v) => v >= 55 ? "🌲" : v >= 35 ? "🌿" : "🏜️" },
  { key: "happiness", labelEn: "Happiness / Trust", labelRu: "Счастье / Доверие", criticalLow: 25, sticker: (v) => v >= 70 ? "😊" : v >= 45 ? "🙂" : "😟" },
  { key: "tourism", labelEn: "Tourism", labelRu: "Туризм", sticker: (v) => v >= 60 ? "🏔️" : "🚶" },
  { key: "economy", labelEn: "Economy", labelRu: "Экономика", sticker: (v) => v >= 70 ? "📈" : v >= 50 ? "📊" : "📉" },
  { key: "culture", labelEn: "Culture", labelRu: "Культура", sticker: (v) => v >= 65 ? "🎭" : "📜" }
];

let lang = "en";
let state = {};
let year = 2026;
let score = 0;
let currentScene = "start";

function initState() {
  state = { ...BASE_STATE };
  year = 2026;
  score = 48;
  currentScene = "start";
  document.body.className = "";
}

function getText(key) {
  return translations[lang][key] || key;
}

function prosperityLevel() {
  const avg = (state.nature + state.happiness + state.energy + (100 - state.poverty) + Math.max(0, 100 - state.debt / 2)) / 5;
  if (avg >= 70) return 3;
  if (avg >= 55) return 2;
  if (avg >= 40) return 1;
  return 0;
}

function updateVisuals() {
  const level = prosperityLevel();
  const kalpak = document.getElementById("kalpak");
  const label = document.getElementById("prosperity-label");
  kalpak.className = "kalpak level-" + level;
  label.textContent = getText("prosperity")[level];
  document.body.className = "prosper-" + level;
  // Kalpak gets greener / more golden as country prospers
  if (level >= 2) kalpak.textContent = "🏔️";
  else kalpak.textContent = "⛰️";
}

function renderStats() {
  const grid = document.getElementById("stats-grid");
  grid.innerHTML = "";
  STATS.forEach(s => {
    const val = Math.round(state[s.key]);
    let cls = "";
    if (s.criticalLow && val < s.criticalLow) cls = "bad";
    else if (s.criticalHigh && val > s.criticalHigh) cls = "bad";
    else if ((s.key === "poverty" && val < 20) || (s.key === "debt" && val < 55) || val > 75) cls = "good";
    else if (val < 45) cls = "warn";
    const label = lang === "ru" ? s.labelRu : s.labelEn;
    const sticker = s.sticker ? s.sticker(val) : "";
    const unit = s.key === "debt" ? "%" : "";
    grid.innerHTML += `<div class="stat ${cls}"><div><div class="label">${label}</div><div class="value">${val}${unit}</div></div><span class="sticker">${sticker}</span></div>`;
  });
  document.getElementById("score-display").textContent = `${getText("score")}: ${score}`;
  document.getElementById("stats-title").textContent = `${getText("statsTitle")} — ${year}`;
  updateVisuals();
}

function applyEffects(effects) {
  for (const [k, v] of Object.entries(effects)) {
    if (state[k] !== undefined) {
      const max = k === "debt" ? 600 : 100;
      state[k] = Math.max(0, Math.min(max, state[k] + v));
    }
  }
  const good = (state.literacy + state.energy + state.nature + state.happiness + state.tourism + state.economy + state.culture) / 7;
  const bad = (state.poverty * 0.6 + Math.min(state.debt, 150) * 0.25);
  score = Math.max(0, Math.round(good - bad * 0.35));
}

function checkLose() {
  if (state.debt >= 180) return getText("loseDebt");
  if (state.literacy <= 75) return getText("loseLiteracy");
  if (state.nature <= 18) return getText("loseNature");
  if (state.happiness <= 25) return getText("loseHappiness");
  return null;
}

// === LEADERBOARD CONFIG ===
const SUPABASE_URL = "https://cgkmcpocfikqeawynvzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_PhTCDBstLhWJrQoam7iQRA_rThrW1vT";
// ==========================

async function saveScoreToDB(name = "Anonymous") {
  if (SUPABASE_URL.includes("YOUR_PROJECT")) return null;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ player_name: name, score, year })
    });
  } catch (e) {
    console.warn("Could not save score", e);
  }
}

async function fetchLeaderboard() {
  if (SUPABASE_URL.includes("YOUR_PROJECT")) {
    return JSON.parse(localStorage.getItem("solarpunk_kg_scores") || "[]");
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/scores?select=player_name,score,year,created_at&order=score.desc&limit=10`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    );
    return await res.json();
  } catch (e) {
    console.warn("Could not load leaderboard", e);
    return [];
  }
}

const scenes = {
  start: {
    text: {
      en: "Early 2026. You advise the Cabinet. Glaciers are retreating, forests cover only 6.4% of the land, and the country still imports roughly 4 billion kWh of electricity every year. Debt sits near 40% of GDP. Literacy is high, but quality and rural access vary. What do you prioritize?",
      ru: "Начало 2026. Вы советуете Кабинету. Ледники отступают, леса занимают лишь 6,4% территории, страна ежегодно импортирует около 4 млрд кВт·ч электроэнергии. Долг около 40% ВВП. Грамотность высокая, но качество и доступ в сёлах различаются. Что в приоритете?"
    },
    choices: [
      {
        text: { en: "Push large hydro (Kambarata-scale) + solar parks with foreign loans", ru: "Крупные ГЭС (масштаб Камбараты) + солнечные парки на иностранные кредиты" },
        effects: { energy: 14, debt: 22, nature: -10, happiness: -5, economy: 7 },
        next: "y2029"
      },
      {
        text: { en: "Invest in schools, small hydro, rooftop solar and forest restoration", ru: "Инвестировать в школы, малые ГЭС, крышную солнечную энергию и восстановление лесов" },
        effects: { literacy: 1, nature: 7, energy: 5, debt: 5, happiness: 6, culture: 3 },
        next: "y2029"
      },
      {
        text: { en: "Accelerate tourism and light manufacturing along existing roads", ru: "Ускорить туризм и лёгкую промышленность вдоль существующих дорог" },
        effects: { tourism: 14, economy: 9, nature: -5, debt: 7, poverty: -4, happiness: 3 },
        next: "y2029"
      }
    ]
  },
  y2029: {
    text: {
      en: "2029. Three years have passed. The first consequences are visible in the numbers and on the ground.",
      ru: "2029. Прошло три года. Первые последствия видны в цифрах и на земле."
    },
    choices: [
      {
        text: { en: "Double down on the same strategy", ru: "Удвоить ставку на ту же стратегию" },
        effects: { energy: 6, debt: 12, nature: -6, economy: 4 },
        next: "y2032"
      },
      {
        text: { en: "Open a repair window: restore damaged land and renegotiate terms", ru: "Окно ремонта: восстановить повреждённые земли и пересмотреть условия" },
        effects: { nature: 8, happiness: 5, debt: 4, literacy: 1 },
        next: "y2032"
      },
      {
        text: { en: "Shift budget toward education quality and cultural programs", ru: "Перенаправить бюджет на качество образования и культурные программы" },
        effects: { literacy: 2, culture: 7, happiness: 6, economy: -1 },
        next: "y2032"
      }
    ]
  },
  y2032: {
    text: {
      en: "2032. Another three years. Water timing is shifting. Neighbors are watching the rivers. People are watching the lights.",
      ru: "2032. Ещё три года. Сроки воды меняются. Соседи смотрят на реки. Люди смотрят на свет."
    },
    choices: [
      {
        text: { en: "Take more external financing for remaining big projects", ru: "Взять ещё внешнее финансирование для оставшихся крупных проектов" },
        effects: { debt: 18, energy: 9, economy: 5, nature: -7 },
        next: "end"
      },
      {
        text: { en: "Protect remaining forests and invest in people and local grids", ru: "Защитить оставшиеся леса и инвестировать в людей и локальные сети" },
        effects: { nature: 9, literacy: 1, happiness: 7, debt: 3 },
        next: "end"
      },
      {
        text: { en: "Careful balance: modest infrastructure + education + nature buffers", ru: "Осторожный баланс: скромная инфраструктура + образование + природные буферы" },
        effects: { energy: 4, nature: 4, happiness: 4, economy: 3, debt: 6 },
        next: "end"
      }
    ]
  }
};

function showScene() {
  const scene = scenes[currentScene];
  document.getElementById("story").innerHTML = `<p>${scene.text[lang]}</p>`;
  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";
  scene.choices.forEach(c => {
    const btn = document.createElement("button");
    btn.textContent = c.text[lang];
    btn.onclick = () => {
      applyEffects(c.effects);
      year += 3;
      const lose = checkLose();
      if (lose) { endGame(lose); return; }
      currentScene = c.next;
      if (currentScene === "end") { endGame(getText("win")); return; }
      showScene();
      renderStats();
    };
    choicesEl.appendChild(btn);
  });
  renderStats();
}

async function endGame(msg) {
  document.getElementById("story").innerHTML = "";
  document.getElementById("choices").innerHTML = "";
  document.getElementById("end-title").textContent = lang === "ru" ? "Конец пути" : "End of Path";
  document.getElementById("end-text").textContent = msg;

  // Ask for name and save
  const name = prompt(lang === "ru" ? "Ваше имя для рейтинга:" : "Your name for the leaderboard:") || "Anonymous";
  await saveScoreToDB(name);

  const top = await fetchLeaderboard();
  const el = document.getElementById("leaderboard");
  if (top && top.length) {
    let html = `<h4>${getText("leaderboard")}</h4><ol>`;
    top.forEach(e => html += `<li>${e.player_name || "Anonymous"} — ${e.score} pts (${e.year || ""})</li>`);
    html += "</ol>";
    el.innerHTML = html;
  } else {
    el.innerHTML = `<p>${lang === "ru" ? "Рейтинг пока пуст" : "Leaderboard is empty so far"}</p>`;
  }

  document.getElementById("game-over").classList.remove("hidden");
}

function restart() {
  initState();
  document.getElementById("game-over").classList.add("hidden");
  showScene();
}

document.getElementById("lang-en").onclick = () => {
  lang = "en";
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("lang-en").classList.add("active");
  updateUI(); showScene();
};
document.getElementById("lang-ru").onclick = () => {
  lang = "ru";
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("lang-ru").classList.add("active");
  updateUI(); showScene();
};
document.getElementById("restart").onclick = restart;

function updateUI() {
  document.getElementById("title").textContent = getText("title");
  document.getElementById("subtitle").textContent = getText("subtitle");
  document.getElementById("restart").textContent = getText("restart");
  renderStats();
}

initState();
updateUI();
showScene();
