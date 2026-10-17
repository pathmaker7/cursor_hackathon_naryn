// SolarPunk Kyrgyzstan - Branching Decision Simulator
// Pure JS implementation for easy browser deploy

const translations = {
  en: {
    title: "SolarPunk Kyrgyzstan",
    subtitle: "Decisions shape the future. Repair is possible.",
    statsTitle: "Status after 3 years",
    restart: "Restart",
    loseDebt: "Debt exceeded critical level. The country defaulted.",
    loseLiteracy: "Literacy collapsed. The next generation is lost.",
    loseNature: "Nature was destroyed beyond recovery.",
    loseHappiness: "Social collapse. Trust and happiness hit zero.",
    win: "A balanced path. Not perfect, but the mountains are still green and the lights are on.",
    score: "Overall Score"
  },
  ru: {
    title: "СоларПанк Кыргызстан",
    subtitle: "Решения формируют будущее. Исправление возможно.",
    statsTitle: "Статус через 3 года",
    restart: "Начать заново",
    loseDebt: "Долг превысил критический уровень. Страна объявила дефолт.",
    loseLiteracy: "Грамотность рухнула. Потеряно следующее поколение.",
    loseNature: "Природа уничтожена без возможности восстановления.",
    loseHappiness: "Социальный коллапс. Доверие и счастье на нуле.",
    win: "Сбалансированный путь. Не идеально, но горы всё ещё зелёные, а свет горит.",
    score: "Общий балл"
  }
};

const STATS = [
  { key: "literacy", labelEn: "Literacy", labelRu: "Грамотность", min: 0, max: 100, criticalLow: 70 },
  { key: "poverty", labelEn: "Poverty", labelRu: "Бедность", min: 0, max: 100, criticalHigh: 50 },
  { key: "energy", labelEn: "Energy Independence", labelRu: "Энергонезависим.", min: 0, max: 100, criticalLow: 30 },
  { key: "debt", labelEn: "Debt (% GDP)", labelRu: "Долг (% ВВП)", min: 0, max: 600, criticalHigh: 200 },
  { key: "nature", labelEn: "Nature", labelRu: "Природа", min: 0, max: 100, criticalLow: 15 },
  { key: "happiness", labelEn: "Happiness", labelRu: "Счастье", min: 0, max: 100, criticalLow: 20 },
  { key: "tourism", labelEn: "Tourism", labelRu: "Туризм", min: 0, max: 100 },
  { key: "economy", labelEn: "Economy", labelRu: "Экономика", min: 0, max: 100 },
  { key: "culture", labelEn: "Culture", labelRu: "Культура", min: 0, max: 100 }
];

let lang = "en";
let state = {};
let year = 2026;
let score = 0;
let history = [];

function initState() {
  state = {
    literacy: 99,
    poverty: 24,
    energy: 75,
    debt: 40,
    nature: 40,
    happiness: 55,
    tourism: 45,
    economy: 60,
    culture: 50
  };
  year = 2026;
  score = 50;
  history = [];
}

function getText(key) {
  return translations[lang][key] || key;
}

function updateUI() {
  document.getElementById("title").textContent = getText("title");
  document.getElementById("subtitle").textContent = getText("subtitle");
  document.getElementById("stats-title").textContent = getText("statsTitle");
  document.getElementById("restart").textContent = getText("restart");
  renderStats();
}

function renderStats() {
  const grid = document.getElementById("stats-grid");
  grid.innerHTML = "";
  STATS.forEach(s => {
    const val = Math.round(state[s.key]);
    let cls = "";
    if (s.criticalLow && val < s.criticalLow) cls = "bad";
    else if (s.criticalHigh && val > s.criticalHigh) cls = "bad";
    else if (val > 70 || (s.key === "poverty" && val < 20) || (s.key === "debt" && val < 50)) cls = "good";
    else if (val < 40) cls = "warn";
    const label = lang === "ru" ? s.labelRu : s.labelEn;
    grid.innerHTML += `<div class="stat ${cls}"><div class="label">${label}</div><div class="value">${val}${s.key === "debt" ? "%" : ""}</div></div>`;
  });
  document.getElementById("score-display").textContent = `${getText("score")}: ${score}`;
  document.getElementById("stats-panel").classList.remove("hidden");
}

function checkLose() {
  if (state.debt >= 200) return getText("loseDebt");
  if (state.literacy <= 70) return getText("loseLiteracy");
  if (state.nature <= 15) return getText("loseNature");
  if (state.happiness <= 20) return getText("loseHappiness");
  return null;
}

function applyEffects(effects) {
  for (const [k, v] of Object.entries(effects)) {
    if (state[k] !== undefined) state[k] = Math.max(0, Math.min(k === "debt" ? 600 : 100, state[k] + v));
  }
  // Simple score: average of good stats minus bad ones
  const good = (state.literacy + state.energy + state.nature + state.happiness + state.tourism + state.economy + state.culture) / 7;
  const bad = (state.poverty + Math.min(state.debt, 100)) / 2;
  score = Math.round(good - bad * 0.4);
}

const scenes = {
  start: {
    text: {
      en: "You are advising the government of Kyrgyzstan in 2026. Glaciers are shrinking, forests cover only 6.4% of the land, and energy comes mostly from hydro. Public debt is around 40% of GDP. What do you prioritize first?",
      ru: "Вы советуете правительству Кыргызстана в 2026 году. Ледники тают, леса покрывают лишь 6,4% территории, энергия в основном от ГЭС. Государственный долг около 40% ВВП. Что приоритетнее?"
    },
    choices: [
      {
        text: { en: "Large hydro + solar parks with foreign loans (fast energy, high debt)", ru: "Крупные ГЭС + солнечные парки на иностранные кредиты (быстрая энергия, большой долг)" },
        effects: { energy: 18, debt: 25, nature: -12, happiness: -6, economy: 8 },
        next: "year3"
      },
      {
        text: { en: "Schools, local solar and tree planting (slower, more balanced)", ru: "Школы, локальная солнечная энергия и посадка деревьев (медленнее, сбалансированнее)" },
        effects: { literacy: 1, nature: 8, energy: 6, debt: 4, happiness: 7, culture: 4 },
        next: "year3"
      },
      {
        text: { en: "Tourism infrastructure and light industry (jobs now, nature pressure)", ru: "Туристическая инфраструктура и лёгкая промышленность (работа сейчас, давление на природу)" },
        effects: { tourism: 15, economy: 10, nature: -6, debt: 8, happiness: 4, poverty: -5 },
        next: "year3"
      }
    ]
  },
  year3: {
    text: {
      en: "Three years later. The consequences of your first choice are visible.",
      ru: "Три года спустя. Последствия первого выбора уже видны."
    },
    choices: [
      {
        text: { en: "Double down on the previous path", ru: "Удвоить ставку на предыдущий путь" },
        effects: { energy: 5, debt: 10, nature: -5 },
        next: "year6"
      },
      {
        text: { en: "Try to repair earlier damage (slower growth)", ru: "Попытаться исправить ранний ущерб (рост медленнее)" },
        effects: { nature: 6, happiness: 5, debt: 3, literacy: 1 },
        next: "year6"
      },
      {
        text: { en: "Focus on education and culture to stabilize society", ru: "Сфокусироваться на образовании и культуре для стабильности общества" },
        effects: { literacy: 2, culture: 8, happiness: 6, economy: -2 },
        next: "year6"
      }
    ]
  },
  year6: {
    text: {
      en: "Another three years. The country is at a crossroads.",
      ru: "Ещё три года. Страна на перепутье."
    },
    choices: [
      {
        text: { en: "Accept more external financing for big projects", ru: "Принять ещё внешнее финансирование для крупных проектов" },
        effects: { debt: 20, energy: 10, economy: 6, nature: -8 },
        next: "end"
      },
      {
        text: { en: "Protect remaining nature and invest in people", ru: "Защитить оставшуюся природу и инвестировать в людей" },
        effects: { nature: 10, literacy: 2, happiness: 8, debt: 2 },
        next: "end"
      },
      {
        text: { en: "Balance everything carefully", ru: "Аккуратно сбалансировать всё" },
        effects: { energy: 4, nature: 3, happiness: 4, economy: 3, debt: 5 },
        next: "end"
      }
    ]
  }
};

let currentScene = "start";

function showScene() {
  const scene = scenes[currentScene];
  const storyEl = document.getElementById("story");
  const choicesEl = document.getElementById("choices");
  storyEl.innerHTML = `<p>${scene.text[lang]}</p>`;
  choicesEl.innerHTML = "";
  scene.choices.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.textContent = c.text[lang];
    btn.onclick = () => {
      applyEffects(c.effects);
      year += 3;
      history.push(c.text[lang]);
      const lose = checkLose();
      if (lose) {
        endGame(lose);
        return;
      }
      currentScene = c.next;
      if (currentScene === "end") {
        endGame(getText("win"));
        return;
      }
      showScene();
      renderStats();
    };
    choicesEl.appendChild(btn);
  });
  renderStats();
}

function endGame(msg) {
  document.getElementById("story").innerHTML = "";
  document.getElementById("choices").innerHTML = "";
  document.getElementById("end-title").textContent = lang === "ru" ? "Конец пути" : "End of Path";
  document.getElementById("end-text").textContent = msg;
  document.getElementById("game-over").classList.remove("hidden");
}

function restart() {
  initState();
  currentScene = "start";
  document.getElementById("game-over").classList.add("hidden");
  showScene();
}

document.getElementById("lang-en").onclick = () => { lang = "en"; document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active")); document.getElementById("lang-en").classList.add("active"); updateUI(); showScene(); };
document.getElementById("lang-ru").onclick = () => { lang = "ru"; document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active")); document.getElementById("lang-ru").classList.add("active"); updateUI(); showScene(); };
document.getElementById("restart").onclick = restart;

initState();
updateUI();
showScene();
