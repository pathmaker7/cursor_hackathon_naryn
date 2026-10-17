# SolarPunk Kyrgyzstan — Future Paths

Evidence-based branching decision simulator.  
Starts in early 2026 with real Kyrgyzstan numbers. Bilingual (EN/RU). Visual Kalpak that improves with prosperity. Stat stickers. Danger zones. Real leaderboard.

## Live deploy (recommended: Vercel + Supabase)

### 1. Database (Supabase — free)
1. Go to [supabase.com](https://supabase.com) → New project.
2. Open **SQL Editor** and run the contents of `supabase-setup.sql`.
3. Go to **Settings → API**. Copy:
   - Project URL
   - `anon` public key

### 2. Connect the frontend
Open `main.js` and replace the two placeholders near the top:

```js
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";
```

### 3. Deploy on Vercel
1. Push this repo to GitHub (already done).
2. Go to [vercel.com](https://vercel.com) → Add New Project → Import `pathmaker7/cursor_hackathon_naryn`.
3. Deploy. Vercel will give you a public URL (e.g. `https://cursor-hackathon-naryn.vercel.app`).

That’s it. The leaderboard is now real and shared for everyone.

### Alternative: Cloudflare Pages
Same frontend works. Just connect the GitHub repo to Cloudflare Pages and set the same Supabase URL/key.

## Run locally
Open `index.html` in a browser (leaderboard needs the Supabase keys filled in to save scores).

## Features
- Realistic 2026 Kyrgyzstan starting stats
- Kalpak visual that becomes more beautiful as the country prospers
- Stat stickers (education, debt, nature, etc.)
- 3-year jumps + repair options
- Lose conditions in danger zones
- Persistent public leaderboard
