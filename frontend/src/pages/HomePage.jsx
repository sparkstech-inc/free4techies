// HomePage — the directory, rendered as a free-for.dev style markdown list.
//
// Instead of a card grid, resources are shown as a scannable bulleted list:
// each category is an <h2> section with an anchor, and each entry is a
// [Name](url) link with the description as a sub-bullet. A sticky Table of
// Contents on the left (desktop) / collapsible panel (mobile) lets you jump
// to any category instantly — just like free-for.dev's README.
//
// Search filters the list in place. When searching, the TOC hides and only
// matching entries (grouped by category) are shown.
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import Layout from '../components/Layout.jsx';
import TierBadge from '../components/TierBadge.jsx';

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const sectionRefs = useRef({});

  const q = searchParams.get('q') || '';
  const cat = searchParams.get('cat') || 'all';
  const tier = searchParams.get('tier') || 'all';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .resources()
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const categories = data?.categories || [];

  // Flatten entries for counting / searching
  const allEntries = useMemo(() => {
    if (!data) return [];
    const out = [];
    for (const c of data.categories || []) {
      for (const e of c.entries || []) {
        out.push({ ...e, category: c.name, categorySlug: c.slug });
      }
    }
    return out;
  }, [data]);

  // Filtered categories — each category keeps only matching entries
  const filteredCategories = useMemo(() => {
    let cats = categories;
    if (cat !== 'all') cats = cats.filter((c) => c.slug === cat);

    return cats
      .map((c) => {
        let entries = c.entries || [];
        if (tier !== 'all') entries = entries.filter((e) => e.tier === tier);
        if (q.trim()) {
          const needle = q.toLowerCase();
          entries = entries.filter(
            (e) =>
              e.name.toLowerCase().includes(needle) ||
              e.description.toLowerCase().includes(needle) ||
              (e.tags || []).some((t) => t.toLowerCase().includes(needle)) ||
              e.url.toLowerCase().includes(needle)
          );
        }
        return { ...c, entries };
      })
      .filter((c) => c.entries.length > 0);
  }, [categories, cat, tier, q]);

  const totalResources = allEntries.length;
  const isSearching = q.trim() || cat !== 'all' || tier !== 'all';

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  // Scroll-spy: highlight the TOC entry for the section currently in view.
  useEffect(() => {
    if (loading || isSearching) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    for (const slug of Object.keys(sectionRefs.current)) {
      const el = sectionRefs.current[slug];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [loading, isSearching, filteredCategories]);

  const scrollToSection = useCallback((slug) => {
    const el = sectionRefs.current[slug];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(slug);
    }
    setTocOpen(false);
  }, []);

  return (
    <Layout>
      {/* Hero — minimal, B/W */}
      <section className="mb-6 border-b border-ink-200 pb-6 dark:border-ink-800">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
            Free tools for every techie
          </h1>
          <p className="mt-2 text-ink-600 dark:text-ink-400">
            A curated list of SaaS, PaaS, IaaS and other offerings with free
            developer tiers. {loading ? 'Loading…' : `${totalResources} resources across ${categories.length} categories.`}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link to="/submit" className="btn-primary text-sm">
              + Submit a resource
            </Link>
            <a href="https://github.com/sparkstech-inc/free4techies" target="_blank" rel="noreferrer" className="btn-secondary text-sm">
              ★ Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Filter bar — tier + clear (search is in header) */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={tier}
          onChange={(e) => setParam('tier', e.target.value)}
          className="rounded-md border-0 bg-ink-100 px-3 py-1.5 text-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-ink-900 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-ink-300"
        >
          <option value="all">All tiers</option>
          <option value="free-tier">Free Tier</option>
          <option value="free-trial">Free Trial</option>
          <option value="free-forever">Free Forever</option>
          <option value="open-source">Open Source</option>
        </select>

        {isSearching && (
          <button onClick={() => setSearchParams({}, { replace: true })} className="btn-ghost text-sm">
            ✕ Clear filters
          </button>
        )}

        <div className="ml-auto text-sm text-ink-500 dark:text-ink-400">
          {loading ? '…' : `${filteredCategories.reduce((n, c) => n + c.entries.length, 0)} results`}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : filteredCategories.length === 0 ? (
        <EmptyState q={q} />
      ) : (
        <div className="flex gap-8">
          {/* TOC sidebar — desktop */}
          {!isSearching && (
            <aside className="hidden w-56 shrink-0 lg:block">
              <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Table of Contents
                </p>
                <nav className="space-y-0.5">
                  {filteredCategories.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => scrollToSection(c.slug)}
                      className={`toc-link w-full text-left ${activeSection === c.slug ? 'active' : ''}`}
                    >
                      {c.name} <span className="text-ink-400">({c.entries.length})</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Main list */}
          <div className="min-w-0 flex-1">
            {/* TOC — mobile collapsible */}
            {!isSearching && (
              <div className="mb-6 lg:hidden">
                <button
                  onClick={() => setTocOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-md border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-900 dark:border-ink-800 dark:text-white"
                >
                  <span>📋 Table of Contents ({filteredCategories.length})</span>
                  <svg className={`h-4 w-4 transition-transform ${tocOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {tocOpen && (
                  <nav className="mt-2 max-h-64 space-y-0.5 overflow-y-auto rounded-md border border-ink-200 p-2 dark:border-ink-800">
                    {filteredCategories.map((c) => (
                      <button
                        key={c.slug}
                        onClick={() => scrollToSection(c.slug)}
                        className={`toc-link w-full text-left ${activeSection === c.slug ? 'active' : ''}`}
                      >
                        {c.name} <span className="text-ink-400">({c.entries.length})</span>
                      </button>
                    ))}
                  </nav>
                )}
              </div>
            )}

            <div className="resource-list">
              {filteredCategories.map((c) => (
                <section
                  key={c.slug}
                  id={c.slug}
                  ref={(el) => { sectionRefs.current[c.slug] = el; }}
                  className="resource-section scroll-mt-20"
                >
                  <h2>
                    {c.name}
                    <a href={`#${c.slug}`} className="anchor-hash" aria-label="Permalink">#</a>
                    <span className="ml-2 text-sm font-normal text-ink-400">({c.entries.length})</span>
                  </h2>
                  {c.description && <p>{c.description}</p>}
                  <ul className="entry-list">
                    {c.entries.map((e, i) => (
                      <Entry key={`${c.slug}-${i}`} entry={e} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 rounded-lg border border-dashed border-ink-300 p-6 text-center dark:border-ink-700">
              <p className="text-ink-600 dark:text-ink-400">
                Know a free tool that's missing from this list?
              </p>
              <Link to="/submit" className="btn-primary mt-3 text-sm">
                + Submit a resource
              </Link>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── A single entry rendered as a markdown-style list item ──
function Entry({ entry }) {
  let host = '';
  try {
    host = new URL(entry.url).hostname.replace(/^www\./, '');
  } catch {
    host = entry.url;
  }

  return (
    <li>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="entry-name"
        >
          {entry.name}
        </a>
        <TierBadge tier={entry.tier} />
      </div>
      {/* Description as the "sub-bullet" — indented, muted */}
      <p className="entry-desc mt-0.5 pl-0 text-sm">
        {entry.description}
      </p>
      {/* Tags + submitter as inline meta */}
      <div className="entry-meta mt-1 pl-0">
        <span className="font-mono text-ink-400">{host}</span>
        {entry.tags?.length > 0 && (
          <>
            <span className="text-ink-300">·</span>
            <span className="flex flex-wrap gap-1">
              {entry.tags.slice(0, 8).map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </span>
          </>
        )}
        {entry.submittedBy && (
          <>
            <span className="text-ink-300">·</span>
            <span>by @{entry.submittedBy}</span>
          </>
        )}
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div className="flex gap-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-6 w-full" />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1 space-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton h-7 w-1/3" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-xl font-bold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
        !
      </div>
      <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
        Couldn't load resources
      </h3>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{message}</p>
      <button onClick={() => location.reload()} className="btn-secondary mt-4">
        Try again
      </button>
    </div>
  );
}

function EmptyState({ q }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-xl font-bold text-ink-400 dark:bg-ink-800">
        ?
      </div>
      <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
        No resources found
      </h3>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
        {q ? (
          <>Nothing matched <span className="font-semibold">"{q}"</span>. Maybe it doesn't exist yet?</>
        ) : (
          'Try changing your filters.'
        )}
      </p>
      <Link to="/submit" className="btn-primary mt-4">
        Submit a new resource
      </Link>
    </div>
  );
}
