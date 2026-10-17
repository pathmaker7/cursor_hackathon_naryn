// All game content and tuning numbers. No game logic lives here.
// Every player-facing string is { en, ru }.

export const START_YEAR = 2026;
export const YEARS_PER_ROUND = 2;

// Early 2026 starting point.
export const BASE = {
  literacy: 99, poverty: 25, energy: 79, debt: 40, nature: 38,
  happiness: 52, tourism: 42, economy: 62, culture: 55, tech: 34,
};

// Every stat lives in 0..100 except debt (% of GDP), which can climb to 250.
export const CAP = { debt: 250 };

// lose.dir "low": game over when value <= at.  "high": game over when value >= at.
// good "up": higher is better.  "down": lower is better (poverty, debt).
// max is only the width of the progress bar.
export const STATS = [
  {
    k: 'literacy', good: 'up', unit: '%', max: 100, lose: { dir: 'low', at: 50 },
    name: { en: 'Literacy', ru: 'Грамотность' },
    icon: v => (v >= 90 ? '🎓' : v >= 75 ? '📚' : v >= 60 ? '📖' : '😵'),
    up: { en: 'Classrooms fill with learning', ru: 'Классы наполняются знаниями' },
    down: { en: 'Schools lose teachers and pupils', ru: 'Школы теряют учителей и учеников' },
    end: {
      title: { en: 'A lost generation', ru: 'Потерянное поколение' },
      text: {
        en: v => `Literacy fell to ${v}%. Schools emptied, skilled people left and the state can no longer run itself.`,
        ru: v => `Грамотность упала до ${v}%. Школы опустели, специалисты уехали, государство перестало работать.`,
      },
      tip: { en: 'Austerity and early factory work eat education fast. Protect the schools.', ru: 'Жёсткая экономия и ранняя работа на заводах быстро съедают образование. Берегите школы.' },
    },
  },
  {
    k: 'poverty', good: 'down', unit: '%', max: 100, lose: { dir: 'high', at: 55 },
    name: { en: 'Poverty', ru: 'Бедность' },
    icon: v => (v >= 48 ? '🆘' : v >= 36 ? '🥖' : v >= 24 ? '🏠' : '💚'),
    up: { en: 'More families fall below the line', ru: 'Больше семей уходит за черту бедности' },
    down: { en: 'Families climb out of poverty', ru: 'Семьи выбираются из бедности' },
    end: {
      title: { en: 'A hungry country', ru: 'Голодная страна' },
      text: {
        en: v => `Poverty reached ${v}%. More than half the people cannot afford food and heat, and the government falls.`,
        ru: v => `Бедность достигла ${v}%. Больше половины людей не могут купить еду и тепло, правительство пало.`,
      },
      tip: { en: 'Pure nature and pure austerity both leave people poor. Keep some jobs coming.', ru: 'Чистая природа и чистая экономия оставляют людей бедными. Держите рабочие места.' },
    },
  },
  {
    k: 'energy', good: 'up', unit: '%', max: 100, lose: { dir: 'low', at: 30 },
    name: { en: 'Energy Independence', ru: 'Энергонезависимость' },
    icon: v => (v >= 85 ? '⚡' : v >= 65 ? '🔋' : v >= 45 ? '🕯️' : '🌑'),
    up: { en: 'More homes keep their lights on', ru: 'В большем числе домов горит свет' },
    down: { en: 'Winter blackouts creep back', ru: 'Зимние отключения возвращаются' },
    end: {
      title: { en: 'The lights go out', ru: 'Свет погас' },
      text: {
        en: v => `Energy independence fell to ${v}%. Blackouts shut factories and hospitals, and the country survives on neighbors' power.`,
        ru: v => `Энергонезависимость упала до ${v}%. Отключения остановили заводы и больницы, страна живёт на чужом электричестве.`,
      },
      tip: { en: 'Demand grows every year. Protecting rivers and forests without new supply drains the grid.', ru: 'Спрос растёт каждый год. Защита рек и лесов без новой генерации истощает сеть.' },
    },
  },
  {
    k: 'debt', good: 'down', unit: '%', max: 200, lose: { dir: 'high', at: 180 },
    name: { en: 'Debt (% of GDP)', ru: 'Долг (% ВВП)' },
    icon: v => (v < 50 ? '💰' : v < 100 ? '🧾' : v < 150 ? '💸' : '⛓️'),
    up: { en: 'Lenders hold more of your future', ru: 'Кредиторы владеют большей частью вашего будущего' },
    down: { en: 'Creditors relax a little', ru: 'Кредиторы немного успокаиваются' },
    end: {
      title: { en: 'Sovereign default', ru: 'Государственный дефолт' },
      text: {
        en: v => `Debt hit ${v}% of GDP. Creditors seize revenues and the currency collapses.`,
        ru: v => `Долг достиг ${v}% ВВП. Кредиторы забирают доходы, валюта рушится.`,
      },
      tip: { en: 'Every big project, even a green one, is a loan. Mix in choices that pay the debt down.', ru: 'Любой крупный проект, даже зелёный, это кредит. Чередуйте с выбором, который гасит долг.' },
    },
  },
  {
    k: 'nature', good: 'up', unit: '', max: 100, lose: { dir: 'low', at: 25 },
    name: { en: 'Nature', ru: 'Природа' },
    icon: v => (v >= 55 ? '🌲' : v >= 35 ? '🌿' : v >= 20 ? '🍂' : '🏜️'),
    up: { en: 'Forests and rivers recover', ru: 'Леса и реки восстанавливаются' },
    down: { en: 'Forests and glaciers pay the price', ru: 'Леса и ледники платят цену' },
    end: {
      title: { en: 'Dead mountains', ru: 'Мёртвые горы' },
      text: {
        en: v => `Nature fell to ${v}. The glaciers are gone, rivers run dry and pastures turn to dust.`,
        ru: v => `Природа упала до ${v}. Ледников нет, реки пересохли, пастбища стали пылью.`,
      },
      tip: { en: 'Loans for dams and fast growth both burn nature. Restore it before it is too late.', ru: 'Кредиты на плотины и быстрый рост сжигают природу. Восстанавливайте её заранее.' },
    },
  },
  {
    k: 'happiness', good: 'up', unit: '', max: 100, lose: { dir: 'low', at: 18 },
    name: { en: 'Happiness', ru: 'Счастье' },
    icon: v => (v >= 70 ? '😄' : v >= 50 ? '🙂' : v >= 30 ? '😟' : '😡'),
    up: { en: 'People trust the future again', ru: 'Люди снова верят в будущее' },
    down: { en: 'Anger spreads in the streets', ru: 'Гнев распространяется по улицам' },
    end: {
      title: { en: 'Trust collapses', ru: 'Доверие рухнуло' },
      text: {
        en: v => `Happiness fell to ${v}. Protests become unrest and the government is overthrown.`,
        ru: v => `Счастье упало до ${v}. Протесты переросли в беспорядки, правительство свергнуто.`,
      },
      tip: { en: 'Displacement and austerity make people furious. Do not only chase numbers.', ru: 'Переселение и экономия вызывают ярость. Не гонитесь только за цифрами.' },
    },
  },
  {
    k: 'tech', good: 'up', unit: '', max: 100,
    name: { en: 'Technology', ru: 'Технологии' },
    icon: v => (v >= 70 ? '🛰️' : v >= 50 ? '💡' : v >= 30 ? '💻' : '📟'),
    up: { en: 'Smart tools and clean tech spread', ru: 'Умные инструменты и чистые технологии распространяются' },
    down: { en: 'Innovation stalls and talent leaves', ru: 'Инновации буксуют, таланты уезжают' },
  },
  {
    k: 'tourism', good: 'up', unit: '', max: 100,
    name: { en: 'Tourism', ru: 'Туризм' },
    icon: v => (v >= 65 ? '🏔️' : v >= 40 ? '🥾' : v >= 20 ? '🚌' : '🏚️'),
    up: { en: 'Hikers and guests arrive', ru: 'Приезжают туристы и гости' },
    down: { en: 'Guest houses stand empty', ru: 'Гостевые дома пустуют' },
  },
  {
    k: 'economy', good: 'up', unit: '', max: 100,
    name: { en: 'Economy', ru: 'Экономика' },
    icon: v => (v >= 75 ? '📈' : v >= 55 ? '📊' : v >= 35 ? '📉' : '🏚️'),
    up: { en: 'Markets and wages grow', ru: 'Рынки и зарплаты растут' },
    down: { en: 'Factories slow and wages stall', ru: 'Заводы замедляются, зарплаты стоят' },
  },
  {
    k: 'culture', good: 'up', unit: '', max: 100,
    name: { en: 'Culture', ru: 'Культура' },
    icon: v => (v >= 70 ? '🎭' : v >= 50 ? '🪕' : v >= 30 ? '📜' : '🥀'),
    up: { en: 'Songs, crafts and epics thrive', ru: 'Песни, ремёсла и эпос процветают' },
    down: { en: 'Old traditions fade', ru: 'Старые традиции угасают' },
  },
];

// How much each stat counts toward overall prosperity (sums to 1).
// Drives the character's look, the ending tier and the score.
export const PROSPERITY_WEIGHTS = {
  happiness: 0.2, nature: 0.17, poverty: 0.13, economy: 0.12, energy: 0.1,
  debt: 0.09, tech: 0.08, literacy: 0.04, culture: 0.04, tourism: 0.03,
};

// Happens after every decision: the world does not stand still.
export const DRIFT = {
  fx: { energy: -4, nature: -2 },
  label: { en: 'Time passes', ru: 'Время идёт' },
  text: { en: 'Demand grows and glaciers keep retreating', ru: 'Спрос растёт, ледники продолжают таять' },
};

// Aftershocks. Each rule reads the state after the decision and may add more changes.
// This is what turns one bad habit into a downward spiral.
export const RIPPLES = [
  { id: 'interest_hi', when: s => s.debt >= 150, fx: { economy: -6, happiness: -4, poverty: 3, debt: 6 },
    label: { en: 'Debt crisis', ru: 'Долговой кризис' }, text: { en: 'Debt payments swallow the budget', ru: 'Выплаты по долгу съедают бюджет' } },
  { id: 'interest_mid', when: s => s.debt >= 100 && s.debt < 150, fx: { economy: -3, happiness: -2, debt: 3 },
    label: { en: 'Debt interest', ru: 'Проценты по долгу' }, text: { en: 'Interest payments squeeze public spending', ru: 'Проценты давят на госрасходы' } },
  { id: 'blackout', when: s => s.energy <= 45, fx: { economy: -4, happiness: -3 },
    label: { en: 'Blackouts', ru: 'Отключения' }, text: { en: 'Power cuts hit factories and homes', ru: 'Отключения бьют по заводам и домам' } },
  { id: 'deadland', when: s => s.nature <= 22, fx: { tourism: -6, happiness: -3, poverty: 2 },
    label: { en: 'Dying valleys', ru: 'Умирающие долины' }, text: { en: 'Tourists and shepherds abandon the land', ru: 'Туристы и пастухи покидают землю' } },
  { id: 'hardship', when: s => s.poverty >= 40, fx: { happiness: -3, literacy: -3 },
    label: { en: 'Hardship', ru: 'Нужда' }, text: { en: 'Hungry families pull children out of school', ru: 'Голодные семьи забирают детей из школ' } },
  { id: 'unrest', when: s => s.happiness <= 30, fx: { economy: -3, poverty: 2 },
    label: { en: 'Unrest', ru: 'Волнения' }, text: { en: 'Strikes and protests stall the economy', ru: 'Забастовки и протесты тормозят экономику' } },
  { id: 'recession', when: s => s.economy <= 40, fx: { poverty: 4, happiness: -2 },
    label: { en: 'Recession', ru: 'Рецессия' }, text: { en: 'Jobs vanish and savings run out', ru: 'Работа исчезает, сбережения тают' } },
  { id: 'trap', when: s => s.poverty >= 45, fx: { poverty: 3, happiness: -2 },
    label: { en: 'Poverty trap', ru: 'Ловушка бедности' }, text: { en: 'No savings, no way out', ru: 'Нет сбережений, нет выхода' } },
  { id: 'synergy', when: s => s.tech >= 50 && s.nature >= 45, fx: { economy: 5, happiness: 4, debt: -5, energy: 3, poverty: -1 },
    label: { en: 'SolarPunk synergy', ru: 'СоларПанк-синергия' }, text: { en: 'Clean technology on healthy land pays off for everyone', ru: 'Чистые технологии на здоровой земле выгодны всем' } },
  { id: 'flourish', when: s => s.tech >= 62 && s.nature >= 58, fx: { economy: 3, tourism: 3, culture: 2, happiness: 2, poverty: -1 },
    label: { en: 'A country in bloom', ru: 'Страна в расцвете' }, text: { en: 'Green cities, clean power and proud people feed each other', ru: 'Зелёные города, чистая энергия и гордые люди питают друг друга' } },
  { id: 'deadtech', when: s => s.tech >= 55 && s.nature <= 32, fx: { happiness: -4, tourism: -4, economy: -2 },
    label: { en: 'Smog cities', ru: 'Города в смоге' }, text: { en: 'Advanced machines on a dying land: nobody wants to live there', ru: 'Совершенные машины на умирающей земле: жить там никто не хочет' } },
  { id: 'stagnation', when: s => s.nature >= 55 && s.tech <= 30, fx: { economy: -3, poverty: 2 },
    label: { en: 'Stagnation', ru: 'Застой' }, text: { en: 'Beautiful nature, but no tools to earn a living', ru: 'Красивая природа, но нет инструментов зарабатывать' } },
  { id: 'brain_drain', when: s => s.literacy <= 82, fx: { economy: -3, literacy: -4 },
    label: { en: 'Brain drain', ru: 'Утечка мозгов' }, text: { en: 'Skilled workers leave the country', ru: 'Специалисты уезжают из страны' } },
  { id: 'surplus', when: s => s.energy >= 90, fx: { debt: -4 },
    label: { en: 'Power exports', ru: 'Экспорт энергии' }, text: { en: 'Electricity sales repay loans', ru: 'Продажа электричества гасит кредиты' } },
  { id: 'taxes', when: s => s.economy >= 70, fx: { debt: -3 },
    label: { en: 'Tax revenue', ru: 'Налоговые доходы' }, text: { en: 'A strong economy pays down debt', ru: 'Сильная экономика гасит долг' } },
  { id: 'visitors', when: s => s.tourism >= 65 && s.nature >= 35, fx: { economy: 3, poverty: -2 },
    label: { en: 'Visitor spending', ru: 'Траты гостей' }, text: { en: 'Guests spend money in the villages', ru: 'Гости тратят деньги в селах' } },
  { id: 'pride', when: s => s.culture >= 70, fx: { happiness: 3 },
    label: { en: 'Cultural pride', ru: 'Культурная гордость' }, text: { en: 'Shared heritage lifts spirits', ru: 'Общее наследие поднимает настроение' } },
  { id: 'clean', when: s => s.nature >= 55, fx: { happiness: 2, tourism: 2 },
    label: { en: 'Clean land', ru: 'Чистая земля' }, text: { en: 'Clean air and rivers make people proud', ru: 'Чистый воздух и реки радуют людей' } },
];

// Three archetypes, one per button. Every choice belongs to one.
export const ARCH = {
  tech: { icon: '⚙️', name: { en: 'Tech first', ru: 'Технологии прежде всего' }, blurb: { en: 'Technology and growth, nature pays', ru: 'Технологии и рост, природа платит' } },
  nature: { icon: '🌿', name: { en: 'Nature first', ru: 'Природа прежде всего' }, blurb: { en: 'Nature, technology and money pay', ru: 'Природа, технологии и деньги платят' } },
  sync: { icon: '☀️', name: { en: 'SolarPunk sync', ru: 'СоларПанк-синхрон' }, blurb: { en: 'Technology that serves nature', ru: 'Технологии на службе природы' } },
};

export { SCENES } from './scenes.js';
export { TIERS, ENDINGS, UI } from './text.js';
