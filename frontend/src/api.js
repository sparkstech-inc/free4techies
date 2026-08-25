// api.js — pure frontend data layer for Free4Techies.
//
// There is NO backend. The directory reads `resources.json` from the
// public/ folder (served as a static file). Submissions do NOT hit an
// API either — the submit form generates a pre-filled GitHub issue URL
// that a GitHub Action turns into an auto-merged pull request.
//
// This module exposes a tiny, promise-based API so the rest of the app
// doesn't care where the data comes from.

// Where the resources file lives. With Vite `base: './'` the built app
// may be served from a sub-path, so we resolve against the current
// document base URL instead of hard-coding an absolute path.
const RESOURCES_URL = new URL('resources.json', document.baseURI).href;

let _cache = null;
let _cachePromise = null;

// Fetch + parse resources.json once, cache the result for the session.
async function loadResources() {
  if (_cache) return _cache;
  if (_cachePromise) return _cachePromise;
  _cachePromise = (async () => {
    const res = await fetch(RESOURCES_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Could not load resources.json (HTTP ${res.status})`);
    const data = await res.json();
    if (!data || !Array.isArray(data.categories)) {
      throw new Error('resources.json is malformed (missing categories array)');
    }
    _cache = data;
    return data;
  })();
  return _cachePromise;
}

// Slugify helper used to derive category slugs client-side.
function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Ensure every category has a slug + entries array (defensive).
function normalize(data) {
  return {
    ...data,
    categories: (data.categories || []).map((c) => ({
      ...c,
      slug: c.slug || slugify(c.name),
      entries: Array.isArray(c.entries) ? c.entries : [],
    })),
  };
}

export const api = {
  // Full resources document (meta + categories + entries).
  resources: async () => normalize(await loadResources()),

  // Just the categories (for nav/footer/dropdowns).
  categories: async () => {
    const data = normalize(await loadResources());
    return data.categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      count: c.entries.length,
    }));
  },

  // Meta block (name, tagline, version, lastUpdated).
  meta: async () => (await loadResources()).meta || {},

  // Bust the cache (e.g. after a known upstream change).
  refresh: () => {
    _cache = null;
    _cachePromise = null;
  },
};
