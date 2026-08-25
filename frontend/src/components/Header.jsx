// Header — sticky top nav. Black & white monochrome theme.
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Header({ onSearch }) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('q')) setQ(params.get('q'));
  }, [location.search]);

  const submit = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate(`/?q=${encodeURIComponent(q)}`);
    }
    onSearch?.(q);
    setMobileOpen(false);
  };

  const navItems = [
    { to: '/', label: 'Browse' },
    { to: '/submit', label: 'Submit' },
    { to: '/sponsor', label: 'Sponsor' },
    { to: '/about', label: 'About' },
  ];

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-ink-900 text-sm font-black text-white dark:bg-white dark:text-ink-950">
            F4
          </span>
          <span className="hidden text-base font-extrabold tracking-tight text-ink-900 dark:text-white sm:block">
            Free4Techies
          </span>
        </Link>

        {/* Desktop search */}
        <form onSubmit={submit} className="relative hidden flex-1 md:block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search free dev tools…  (⌘K)"
            className="w-full rounded-md border-0 bg-ink-100 py-1.5 pl-9 pr-14 text-sm text-ink-900 placeholder:text-ink-400 ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-ink-900 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-ink-300"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-ink-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink-400 dark:border-ink-700 dark:bg-ink-800">
            ⌘K
          </kbd>
        </form>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isActive(n.to)
                  ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-950'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="rounded-md p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
        >
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>

        {/* GitHub */}
        <a
          href="https://github.com/sparkstech-inc/free4techies"
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-md p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800 lg:block"
          aria-label="GitHub"
        >
          <GithubIcon className="h-5 w-5" />
        </a>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800 md:hidden"
          aria-label="Menu"
        >
          {mobileOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-ink-200 bg-white px-4 py-3 md:hidden dark:border-ink-800 dark:bg-ink-950">
          <form onSubmit={submit} className="relative mb-3">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search free dev tools…"
              className="w-full rounded-md border-0 bg-ink-100 py-2 pl-9 pr-3 text-sm text-ink-900 ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-ink-900 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-ink-300"
            />
          </form>
          <nav className="flex flex-col gap-0.5">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(n.to)
                    ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-950'
                    : 'text-ink-700 dark:text-ink-200'
                }`}
              >
                {n.label}
              </Link>
            ))}
            <a
              href="https://github.com/sparkstech-inc/free4techies"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 dark:text-ink-200"
            >
              GitHub ↗
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function MoonIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinejoin="round" />
    </svg>
  );
}
function SunIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
    </svg>
  );
}
function GithubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.02 11.02 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.42.36.79 1.08.79 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}
function MenuIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}
