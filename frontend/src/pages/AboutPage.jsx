// AboutPage - what Free4Techies is, how it works, FAQ.
import { Link } from 'react-router-dom';
import { config } from '../config.js';
import Layout from '../components/Layout.jsx';

export default function AboutPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          About Free4Techies
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
          A modern, searchable, community-driven directory of free developer
          tools, services and tiers — built to be better than free-for.dev.
        </p>

        <div className="prose mt-8 max-w-none text-slate-700 dark:text-slate-300">
          <p>
            Developers and open-source authors have hundreds of services offering
            free tiers, but finding them all takes time. Free4Techies collects
            them in one searchable place, with categories, tiers, tags and a
            submission flow that opens a real pull request against the project's
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">resources.json</code> on GitHub.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">How it works</h2>
          <p>
            Every resource lives in a single JSON file (<code>public/resources.json</code>)
            committed to the{' '}
            <a href={config.repoUrl} target="_blank" rel="noreferrer" className="section-link">
              GitHub repo
            </a>). The website is a pure static React app — there is no server.
            The browser fetches <code>resources.json</code> directly and renders
            the searchable, filterable directory.
          </p>
          <p>
            To submit a new resource, use the{' '}
            <Link to="/submit" className="section-link">submit form</Link>. No
            login is required on this site. The form validates your entry and
            generates a pre-filled GitHub issue. When you post that issue, a
            GitHub Action parses the submission, validates it against the schema,
            checks for duplicates, writes the updated <code>resources.json</code>
            to a new branch, opens a pull request, and <strong>auto-merges</strong>{' '}
            it if everything is valid. If validation fails, the bot comments on
            the issue with the exact errors so you can fix and resubmit.
          </p>
          <p>
            External pull requests (opened directly on GitHub) are handled the
            same way: a second Action runs the validator on every PR and
            auto-merges valid ones, or requests changes on invalid ones.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">What makes it different</h2>
          <ul className="list-disc pl-6">
            <li><strong>No backend</strong> — a true static site. Deploy to Vercel, Netlify, GitHub Pages, or any static host with zero server cost.</li>
            <li><strong>No login to submit</strong> — you don't authenticate on this site. You only need a (free) GitHub account to post the issue that triggers the PR.</li>
            <li><strong>Searchable & filterable</strong> — instant search by name, tag, category or URL, plus filters by tier.</li>
            <li><strong>Tier badges</strong> — every entry is labelled Free Tier, Free Trial, Free Forever or Open Source so you know what you're getting.</li>
            <li><strong>Structured data</strong> — resources live in a typed JSON file, not a giant markdown list.</li>
            <li><strong>Real, automated PR workflow</strong> — submissions open validated pull requests that auto-merge, not just comments.</li>
            <li><strong>Dark mode</strong> — built in, with system preference detection.</li>
            <li><strong>Responsive</strong> — works great on phones, tablets and desktops.</li>
            <li><strong>Ad-ready layout</strong> — reserved placements plus a sponsor page keep the project sustainable.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Submitting rules</h2>
          <ul className="list-disc pl-6">
            <li>The service must offer a <strong>free tier</strong>, not just a free trial. Time-bucketed tiers must be free for at least a year.</li>
            <li>No self-hosted software — this list is for as-a-Service offerings (plus genuinely open-source tools).</li>
            <li>No services that restrict TLS to paid-only tiers.</li>
            <li>No duplicates — the validator will reject a URL that's already listed.</li>
            <li>Be specific in the description: include the actual free limits.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tech stack</h2>
          <p>
            The frontend is <strong>React 18 + Vite + Tailwind CSS</strong> with
            React Router, deployed as a static site. Submissions are handled by{' '}
            <strong>GitHub Actions</strong> that run a Node.js validator and use
            the built-in <code>GITHUB_TOKEN</code> to create branches, commit
            <code>resources.json</code>, open and auto-merge pull requests — no
            app secrets or user tokens required. Everything is open and self-hostable.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Support the project</h2>
          <p>
            Free4Techies is free for everyone, forever. If it saves you time,
            consider <Link to="/sponsor" className="section-link">becoming a sponsor</Link>,
            or just submit a great resource and star the repo.
          </p>

          <div className="not-prose mt-8 flex flex-wrap gap-3">
            <Link to="/submit" className="btn-primary">Submit a resource</Link>
            <Link to="/sponsor" className="btn-secondary">Become a sponsor</Link>
            <Link to="/" className="btn-ghost">Browse the directory</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
