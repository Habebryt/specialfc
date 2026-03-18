# ⚽ Special FC — 2026 League Hub

Friend league website for the 2026 Special FC season in Abuja.  
Built with vanilla JS + Vite. Deployable to Vercel in one command.

---

## Project Structure

```
specialfc-project/
├── index.html          ← HTML shell (don't edit often)
├── src/
│   ├── data.js         ← ⭐ EDIT THIS: teams, fixtures, squads, config
│   ├── main.js         ← App logic (rendering, admin, state)
│   └── style.css       ← All styles
├── package.json
├── vercel.json
└── .gitignore
```

> **Rule of thumb:** 99% of updates (new players, score corrections, fixture changes) only require touching `src/data.js`.

---

## Local Development

### 1. Install dependencies (once)
```bash
npm install
```

### 2. Start the dev server
```bash
npm run dev
```

Open **http://localhost:5173** in your browser.  
The page hot-reloads instantly every time you save a file.

---

## Deploying to Vercel

### First time — connect your repo

1. Push this folder to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial Special FC site"
   git remote add origin https://github.com/YOUR_USERNAME/specialfc.git
   git push -u origin main
   ```

2. Go to **vercel.com → New Project → Import** your GitHub repo  
3. Vercel auto-detects the settings from `vercel.json` — just click **Deploy**  
4. Your site is live at `https://specialfc-xxxx.vercel.app`

### Every update after that

```bash
git add .
git commit -m "Update scores matchday 2"
git push
```

Vercel auto-deploys on every push to `main`. Usually live within ~30 seconds.

### Or deploy via Vercel CLI (no git needed)

```bash
npm install -g vercel
vercel           # first time — follow prompts
vercel --prod    # subsequent deploys
```

---

## Common Edits

### Add/remove a player
Open `src/data.js` → find the team under `SQUADS` → add or remove the name string.

```js
Wolfsburg: [
  "Sam", "Brown", "Gbenga", "Kanayo",
  "Bright", "Kayode", "Habeeb", "Lawman", "Austin",
  "NewPlayer",  // ← add here
],
```

### Change the admin password
Open `src/data.js` → update `adminPassword`:
```js
export const LEAGUE = {
  adminPassword: "yournewpassword",
  ...
};
```

### Change team colour
Open `src/data.js` → update the `color` hex for the team:
```js
export const TEAMS = {
  Wolfsburg: { color: "#27A43C", abbr: "WOL" },
  ...
};
```

### Add a matchday or change fixture dates
Open `src/data.js` → edit the `FIXTURES` array. Each matchday block looks like:
```js
{
  md: 1,
  date: "Sat 21 Mar 2026",
  matches: [
    { home: "Ajax", away: "Flamengo", slot: "Early" },
    { home: "Lyon", away: "Wolfsburg", slot: "Late"  },
  ],
},
```

---

## Entering Scores (Admin)

1. Open the live site
2. Click the ⚽ logo **7 times** → enter password: `sfc2026`
3. Admin panel opens above the league table
4. Select the matchday tab → enter scores + goal scorers + assists
5. Click **Save Match** — data saves to browser localStorage instantly
6. All stats, standings, and fixtures update live

### Moving data between devices
- Admin panel → Data tab → **Export Data** → copy the JSON
- On the other device: Admin → Data tab → **Import Data** → paste → Confirm

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Vanilla JS (ES Modules) | App logic |
| Vite | Local dev server + build |
| localStorage | Match data persistence |
| Vercel | Hosting & CI/CD |
| Google Fonts | Bebas Neue, DM Sans, JetBrains Mono |

No framework, no database, no backend. Pure static site.
