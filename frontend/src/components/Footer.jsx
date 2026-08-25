// Footer - links, ad slot, credits, back-to-top.
import { Link } from 'react-router-dom';
import AdSlot from './AdSlot.jsx';

export default function Footer({ categories = [] }) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="" className="h-7 w-7" />
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                Free<span className="text-brand-500">4</span>Techies
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              A curated, community-driven directory of free developer tools,
              services and tiers. Built better than free-for.dev.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
                  Browse all
                </Link>
              </li>
              <li>
                <Link to="/submit" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
                  Submit a resource
                </Link>
              </li>
              <li>
                <Link to="/sponsor" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
                  Become a sponsor
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Top categories
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {categories.slice(0, 5).map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/?cat=${c.slug}`}
                    className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Project
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
                  About
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/sparkstech-inc/free4techies"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/sparkstech-inc/free4techies/issues/new?assignees=&labels=resource-submission&template=resource-submission.yml&title=%5BResource%5D+"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                >
                  Submit via GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <AdSlot format="leaderboard" label="Sponsored" />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Free4Techies. Built with React + Vite + Tailwind.</p>
          <p>
            Free for everyone, forever.{' '}
            <Link to="/sponsor" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Support us →
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
