# SolarPunk Kyrgyzstan

Hackathon theme: **SolarPunk**. Technology and nature work together to create a beautiful, sustainable and equitable world.
RU: технологии, которые улучшают жизнь, не вредя природе.

You lead Kyrgyzstan from 2026 to 2046 through ten decisions. Chasing one number (the economy, technology, or nature alone) breaks the balance and the country falls.
The only way through is to keep technology and nature growing together, and to choose rationally.

## How it plays

- 10 questions, each quoting the live numbers and the consequences of your earlier choices.
- 3 radical choices per question: technology first (nature pays), nature first (technology and money pay), or a SolarPunk synthesis that has its own costs.
- After every click each affected stat flashes green or red with its exact change ("Energy +12", "Debt +25%").
- Six red lines are always visible next to the stats:

| Stat | You lose if |
|---|---|
| Literacy | 50 or below |
| Poverty | 55 or above |
| Energy independence | 30 or below |
| Debt (% of GDP) | 180 or above |
| Nature | 25 or below |
| Happiness | 18 or below |

- Start (early 2026): Literacy 99, Poverty 25, Energy 79, Debt 40, Nature 38, Happiness 52, Tourism 42, Economy 62, Culture 55, Technology 34.
- Aftershock rules turn bad habits into spirals (debt interest, blackouts, poverty trap) and reward synergy (healthy technology and nature together).
- English and Russian, Three.js character that reacts to every result, animated city that changes with the state of the country, Supabase leaderboard (one row per player).

## Run locally

ES modules need a web server (opening index.html from disk will not work):

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Pure static site, no build step. Import the repo in Vercel and deploy. `vercel.json` only enables clean URLs.

## Leaderboard

`leaderboard.js` holds the Supabase URL and the publishable key. Create the table with `supabase-setup.sql` (table `scores`: `player_name`, `score`, `year`).
The table keeps every run; the game shows only each player's best score. Only one save per run is possible.

## Tests and balance

```
npm test
```

Checks that content is complete in both languages, that all 3^10 button sequences behave, that every red line is reachable, that the game is winnable, that always picking the same type loses, and that tech-first play at nature's expense almost always loses.

```
npm run answers
```

Writes `ANSWERS.local.md` (gitignored, never pushed) with the best and worst button sequences.

## Files

| File | Purpose |
|---|---|
| `data.js` | stats, red lines, aftershock rules, tuning numbers |
| `scenes.js` | the ten questions and their choices |
| `text.js` | interface copy, tiers, endings |
| `engine.js` | pure rules (no DOM), used by the game and the tests |
| `main.js` | interface, animation, turn flow |
| `character.js` | Three.js character |
| `city.js` | animated city backdrop |
| `leaderboard.js` | Supabase client |
| `sim.js`, `test.js`, `answers.js` | balance simulation, checks, private answer sheet |
