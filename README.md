# Free4Techies

> A curated, searchable, community-driven directory of free developer tools, services and tiers — built to be better than [free-for.dev](https://free-for.dev).

Free4Techies is a **pure static React app** with **no backend** and **no login required to submit**. The directory reads a single `resources.json` file. Submissions are turned into auto-merging GitHub pull requests by **GitHub Actions** — no server, no secrets, no OAuth, no token-pasting.

---

## ✨ Features

- **No backend** — a true static site. Deploy to Vercel, Netlify, GitHub Pages, or any static host with zero server cost.
- **No login to submit** — you never authenticate on this site. The submit form generates a pre-filled GitHub issue; a bot turns it into an auto-merging PR. You only need a (free) GitHub account to post the issue.
- **Automated PR workflow** — a GitHub Action validates every submission, checks for duplicates, commits `resources.json` to a branch, opens a PR, and squash-merges it if valid. Invalid submissions get a comment with the exact errors and are auto-closed.
- **External PRs too** — the same validator auto-merges any PR (from anyone) that touches `resources.json` and passes validation.
- **Searchable & filterable** — instant search by name, tag, category or URL, plus filters by tier and sort options.
- **Tier badges** — every entry is labelled Free Tier, Free Trial, Free Forever or Open Source.
- **Structured data** — resources live in a typed JSON file, not a giant markdown list.
- **Dark mode** — built in, with system-preference detection and localStorage persistence.
- **Responsive** — works great on phones, tablets and desktops.
- **Ad-ready layout** — reserved, tasteful ad placements plus a sponsor page.
- **Keyboard friendly** — `⌘/Ctrl + K` focuses search.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (static React app)                                  │
│  - fetches /resources.json   (served from public/)           │
│  - renders searchable directory                              │
│  - submit form → builds a pre-filled GitHub ISSUE url        │
│      (no fetch, no token, no login on this site)             │
└──────────────────────────┬──────────────────────────────────┘
                           │ user clicks "Open GitHub issue"
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub (sparkstech-inc/free4techies)                        │
│  - user posts issue labeled "resource-submission"            │
│  - issue-submission.yml Action fires                         │
│      → scripts/issue-to-pr.mjs                               │
│      → parses JSON, validates, checks duplicates             │
│      → commits frontend/public/resources.json to a new branch         │
│      → opens PR + auto-merges (squash) if valid              │
│      → comments + closes the issue                           │
│  - auto-merge-pr.yml Action fires on any PR touching JSON    │
│      → scripts/validate-resources.mjs                        │
│      → auto-merges valid PRs, requests changes on invalid    │
└─────────────────────────────────────────────────────────────┘
```

There is **no server anywhere**. The only "backend" is GitHub itself, driven by Actions using the built-in `GITHUB_TOKEN`.

---

## 📁 Project structure

```
free4techies/
├─ public/
│  └─ resources.json          # ← the single source of truth (data)
├─ src/
│  ├─ api.js                  # fetches /resources.json, caches, normalizes
│  ├─ config.js               # repo coords + sponsor URL (VITE_ env)
│  ├─ App.jsx                 # routes
│  ├─ main.jsx                # entry
│  ├─ index.css               # Tailwind + component classes
│  ├─ context/ThemeContext.jsx
│  ├─ components/             # Header, Footer, Layout, AdSlot, ResourceCard, …
│  └─ pages/                  # HomePage, SubmitPage, SponsorPage, AboutPage, NotFound
├─ scripts/
│  ├─ validate-resources.mjs  # schema + duplicate validator (Action + CLI)
│  └─ issue-to-pr.mjs         # issue → branch → commit → PR → auto-merge
├─ .github/
│  ├─ workflows/
│  │  ├─ issue-submission.yml # fires on new "resource-submission" issues
│  │  └─ auto-merge-pr.yml    # validates + auto-merges PRs touching resources.json
│  ├─ ISSUE_TEMPLATE/
│  │  ├─ resource-submission.yml
│  │  └─ config.yml
│  └─ PULL_REQUEST_TEMPLATE.md
├─ index.html
├─ vite.config.js             # base: './' (relative paths)
├─ vercel.json                # static SPA rewrites (no functions)
├─ tailwind.config.js
├─ package.json
└─ README.md
```

---

## 📦 The data file — `frontend/public/resources.json`

All resources live in one JSON document:

```json
{
  "meta": {
    "name": "Free4Techies",
    "tagline": "A curated list of free developer tools, services and tiers.",
    "lastUpdated": "2025-01-01T00:00:00.000Z",
    "version": "1.0.0"
  },
  "categories": [
    {
      "name": "Major Cloud Providers",
      "slug": "major-cloud-providers",
      "description": "Always-free limits from the big three (and friends).",
      "entries": [
        {
          "name": "Google Cloud Platform",
          "url": "https://cloud.google.com",
          "description": "App Engine — 28 frontend instance hours/day, …",
          "tier": "free-tier",
          "tags": ["paas", "iaas", "gcp", "serverless"],
          "submittedBy": "free4techies"
        }
      ]
    }
  ]
}
```

### Schema

**Category** fields: `name` (string), `slug` (lowercase, hyphenated, unique), `description` (string), `entries` (array). Unknown fields are rejected.

**Entry** fields:

| field         | type     | rules |
|---------------|----------|-------|
| `name`        | string   | 2–80 chars, no leading/trailing whitespace |
| `url`         | string   | valid `http`/`https` URL |
| `description` | string   | 10–400 chars |
| `tier`        | string   | one of `free-tier`, `free-trial`, `free-forever`, `open-source` |
| `tags`        | string[] | 0–10 items, each `/^[a-z0-9-]{2,20}$/`, unique |
| `submittedBy` | string?  | optional, ≤60 chars |

**Duplicate rule:** no two entries may share the same URL hostname (compared after stripping `www.`).

Validate locally:

```bash
npm run validate
# or
node scripts/validate-resources.mjs frontend/public/resources.json
```

---

## 🤖 How submissions work (no login)

1. A visitor fills in the [submit form](https://free4techies.pages.dev/submit). The form validates the entry **client-side** (same rules as the server-side validator).
2. On submit, the form builds a **pre-filled GitHub issue URL** — the structured entry is embedded as a ```json fenced block in the issue body. No fetch is made; no token is present in the browser.
3. The visitor clicks "Open GitHub issue →", reviews the pre-filled issue, and clicks **Submit new issue** on GitHub. (This requires a free GitHub account — the same requirement as opening any PR on an open-source project.)
4. The `issue-submission.yml` Action fires. `scripts/issue-to-pr.mjs`:
   - extracts the JSON block,
   - validates the entry and the full resulting document,
   - checks for a duplicate URL hostname,
   - fetches the current `frontend/public/resources.json` from the default branch,
   - inserts the entry, sorts categories/entries, bumps `meta.lastUpdated`,
   - commits to a new `resource/<name>-<issue>` branch,
   - opens a PR labeled `auto-merge`,
   - **squash-merges** it immediately if possible, and
   - comments on the issue + closes it.
5. If validation fails, the bot comments with the exact errors and closes the issue so the contributor can fix and resubmit.

External PRs opened directly on GitHub are handled by `auto-merge-pr.yml`: it runs the validator and auto-merges any PR with the `auto-merge` label that passes. Invalid PRs get a failing review with the errors.

**No secrets are required.** Both Actions use the built-in `GITHUB_TOKEN`, which is granted `contents: write`, `pull-requests: write`, and `issues: write` in the workflow files.

---

## 🚀 Local development

```bash
git clone https://github.com/sparkstech-inc/free4techies.git
cd free4techies
cd frontend && npm install
npm run dev          # Vite dev server on http://localhost:5173
```

The dev server serves `frontend/public/resources.json` directly. Editing the file and reloading is enough to see changes.

```bash
npm run build        # production build → frontend/dist/
npm run preview      # preview the production build
npm run validate     # validate frontend/public/resources.json (run from repo root)
```

---

## ▲ Deploy to Vercel

This is a static site — no serverless functions.

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Vercel auto-detects Vite. The included `vercel.json` sets:
   - `buildCommand`: `cd frontend && npm install && npm run build`
   - `outputDirectory`: `frontend/dist`
   - SPA rewrites so client-side routes work on refresh
3. (Optional) Add environment variables in Project → Settings → Environment Variables:
   - `VITE_REPO_OWNER`, `VITE_REPO_NAME` (defaults to `sparkstech-inc`/`free4techies`)
   - `VITE_SPONSOR_URL`, `VITE_SPONSOR_LABEL` (for the sponsor page)
   - `VITE_AD_*` (to enable real ads — wire up the network in `src/components/AdSlot.jsx`)
4. Deploy. That's it.

**Netlify / GitHub Pages / Cloudflare Pages** work the same way: build with `cd frontend && npm run build`, publish `frontend/dist/`, and add an SPA fallback to `index.html`.

---

## 🔧 Configuration

All config is optional (see `.env.example`):

| variable             | default                  | purpose |
|----------------------|--------------------------|---------|
| `VITE_REPO_OWNER`    | `sparkstech-inc`         | GitHub org/user for issue links |
| `VITE_REPO_NAME`     | `free4techies`           | GitHub repo name for issue links |
| `VITE_SPONSOR_URL`   | GitHub Sponsors page     | where the Sponsor button links |
| `VITE_SPONSOR_LABEL` | `Sponsor on GitHub`      | label shown on the sponsor button |
| `VITE_AD_PROVIDER`   | none                     | ad network key (wire up in AdSlot.jsx) |
| `VITE_AD_CLIENT`     | none                     | ad client id |
| `VITE_AD_SLOT`       | none                     | ad slot id |

---

## 📜 Submitting rules

- The service must offer a **free tier**, not just a free trial. Time-bucketed tiers must be free for at least a year.
- No self-hosted software — this list is for as-a-Service offerings (plus genuinely open-source tools).
- No services that restrict TLS to paid-only tiers.
- No duplicates — the validator rejects a URL whose hostname is already listed.
- Be specific in the description: include the actual free limits.

---

## 🛠 Tech stack

- **React 18** + **Vite 5** + **Tailwind CSS 3** + **React Router 6**
- **GitHub Actions** (Node 20) for submission → PR automation
- No runtime backend. No database. No OAuth.

---

## 🤝 Contributing

- Submit a resource via the [submit form](https://free4techies.pages.dev/submit) (no login on the site).
- Or open a pull request directly editing `frontend/public/resources.json`. Run `npm run validate` first; add the `auto-merge` label to have it merged automatically once it passes.
- Report broken links or outdated tiers via [issues](https://github.com/sparkstech-inc/free4techies/issues).

---

## 📄 License

MIT — see [LICENSE](LICENSE). The curated resource list is community-maintained.
