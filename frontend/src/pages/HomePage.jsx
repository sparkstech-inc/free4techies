// HomePage - the directory. Search, filter by category & tier, sort, and a
// responsive card grid. Reads resources from the backend and updates the URL
// query string so searches are shareable.
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import Layout from '../components/Layout.jsx';
import ResourceCard from '../components/ResourceCard.jsx';

const TIERS = ['free-tier', 'free-trial', 'free-forever', 'open-source'];
const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'tier', label: 'Tier' },
];

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') || '';
  const cat = searchParams.get('cat') || 'all';
  const tier = searchParams.get('tier') || 'all';
  const sort = searchParams.get('sort') || 'relevance';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .resources()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = data?.categories || [];

  // Flatten entries with category context for filtering
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

  const filtered = useMemo(() => {
    let list = allEntries;
    if (cat !== 'all') list = list.filter((e) => e.categorySlug === cat);
    if (tier !== 'all') list = list.filter((e) => e.tier === tier);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(needle) ||
          e.description.toLowerCase().includes(needle) ||
          (e.tags || []).some((t) => t.toLowerCase().includes(needle)) ||
          e.category.toLowerCase().includes(needle) ||
          e.url.toLowerCase().includes(needle)
      );
    }
    // sort
    const sorted = [...list];
    if (sort === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'tier') {
      const order = { 'free-forever': 0, 'free-tier': 1, 'open-source': 2, 'free-trial': 3 };
      sorted.sort((a, b) => (order[a.tier] ?? 9) - (order[b.tier] ?? 9) || a.name.localeCompare(b.name));
    } else if (q.trim()) {
      // relevance: name match > tag match > description match
      const needle = q.toLowerCase();
      const score = (e) => {
        if (e.name.toLowerCase().includes(needle)) return 0;
        if ((e.tags || []).some((t) => t.toLowerCase().includes(needle))) return 1;
        if (e.category.toLowerCase().includes(needle)) return 2;
        return 3;
      };
      sorted.sort((a, b) => score(a) - score(b));
    }
    return sorted;
  }, [allEntries, cat, tier, q, sort]);

  // grouped view when not searching and category = all
  const grouped = useMemo(() => {
    if (q.trim() || cat !== 'all') return null;
    const map = new Map();
    for (const c of categories) {
      map.set(c.slug, { name: c.name, slug: c.slug, description: c.description, entries: [] });
    }
    for (const e of filtered) {
      const g = map.get(e.categorySlug);
      if (g) g.entries.push(e);
    }
    return [...map.values()].filter((g) => g.entries.length > 0);
  }, [filtered, categories, q, cat]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const totalResources = allEntries.length;

  return (
    <Layout showSidebarAd>
      {/* Hero */}
      <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            {loading ? 'Loading resources…' : `${totalResources} free resources & counting`}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Free tools for every techie
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-brand-50/90 sm:text-lg">
            A curated, searchable directory of SaaS, PaaS, IaaS and dev tools with
            free tiers. Discover, filter, and submit new resources via pull request.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href="#directory" className="btn bg-white text-brand-700 hover:bg-brand-50">
              Browse the directory
            </a>
          </div>
        </div>
      </section>

      {/* Filters bar */}
      <div
        id="directory"
        className="sticky top-16 z-20 -mx-4 mb-6 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:mx-0 sm:rounded-lg sm:border sm:px-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={cat}
            onChange={(e) => setParam('cat', e.target.value)}
            className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.entries?.length || c.count || 0})
              </option>
            ))}
          </select>

          <select
            value={tier}
            onChange={(e) => setParam('tier', e.target.value)}
            className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All tiers</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t.replace('-', ' ')}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-slate-100"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>

          <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
            {loading ? '…' : <span>{filtered.length} results</span>}
          </div>

          {(q || cat !== 'all' || tier !== 'all') && (
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="btn-ghost text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState q={q} />
      ) : grouped ? (
        <div className="space-y-12">
          {grouped.map((g) => (
            <section key={g.slug} id={g.slug} className="scroll-mt-32">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {g.name}
                </h2>
                <span className="text-sm text-slate-400">{g.entries.length}</span>
              </div>
              {g.description && (
                <p className="mb-4 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  {g.description}
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {g.entries.map((e, i) => (
                  <ResourceCard key={`${g.slug}-${i}`} entry={e} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e, i) => (
            <ResourceCard key={`${e.categorySlug}-${i}`} entry={e} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton mt-3 h-3 w-1/3" />
          <div className="skeleton mt-4 h-16 w-full" />
          <div className="skeleton mt-4 h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
        !
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Couldn't load resources
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
      <button onClick={() => location.reload()} className="btn-secondary mt-4">
        Try again
      </button>
    </div>
  );
}

function EmptyState({ q }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
        ?
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        No resources found
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {q ? (
          <>
            Nothing matched <span className="font-semibold">"{q}"</span>. Maybe it
            doesn't exist yet?
          </>
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
