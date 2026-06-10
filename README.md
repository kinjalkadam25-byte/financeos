# FinanceOS

A premium financial operating system — React + Tailwind + Framer Motion.

Live: https://kinjalkadam25-byte.github.io/financeos/

## Run locally

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

## How deploy works

Every push to `main` triggers the GitHub Action in `.github/workflows/deploy.yml`,
which builds the app and publishes it to GitHub Pages. No manual build needed.

One-time setup in the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions.**

## Notes

- Tailwind is loaded via CDN in `index.html`, so there is no PostCSS/Tailwind config to maintain.
- Data lives in memory: the app starts empty and clears on refresh. Use **Import** (Axis Bank CSV)
  or **Add** to populate, and **⌘K → Clear all data** to reset.
- To make data persist across visits, wire `buildSample()` in `src/App.jsx` to a fetch against
  your Google Apps Script Web App returning rows shaped:
  `{ id, date: "YYYY-MM-DD", cat, type: "credit"|"debit", amt, note }`.

## Structure

```
index.html                 Tailwind CDN + root div
src/main.jsx               React entry
src/App.jsx                the entire FinanceOS app
vite.config.js             base: "/financeos/" for Project Pages
.github/workflows/deploy.yml   auto build + deploy
```
