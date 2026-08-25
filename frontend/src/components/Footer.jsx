// Footer — minimalist black & white.
import { Link } from 'react-router-dom';
import AdSlot from './AdSlot.jsx';

export default function Footer({ categories = [] }) {
  return (
    <footer className="mt-16 border-t border-ink-200 bg-ink-50 dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-ink-900 text-xs font-black text-white dark:bg-white dark:text-ink-950">
                F4
              </span>
              <span className="text-sm font-extrabold text-ink-900 dark:text-white">
                Free4Techies
              </span>
            </div>
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
              A curated, community-driven list of free developer tools,
              services and tiers. Markdown-style, easy to scan.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">Browse all</Link></li>
              <li><Link to="/submit" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">Submit a resource</Link></li>
              <li><Link to="/sponsor" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">Become a sponsor</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
              Categories
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {categories.slice(0, 5).map((c) => (
                <li key={c.slug}>
                  <Link to={`/?cat=${c.slug}#${c.slug}`} className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
              Project
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/about" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">About</Link></li>
              <li>
                <a href="https://github.com/sparkstech-inc/free4techies" target="_blank" rel="noreferrer" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://github.com/sparkstech-inc/free4techies/issues/new?assignees=&labels=resource-submission&template=resource-submission.yml&title=%5BResource%5D+" target="_blank" rel="noreferrer" className="text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white">
                  Submit via GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <AdSlot format="leaderboard" label="Sponsored" />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-ink-200 pt-6 text-xs text-ink-500 dark:border-ink-800 dark:text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Free4Techies. Built with React + Vite + Tailwind.</p>
          <p>
            Free for everyone, forever.{' '}
            <Link to="/sponsor" className="font-medium text-ink-900 hover:underline dark:text-white">
              Support us →
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
