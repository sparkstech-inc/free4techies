// validate-resources.mjs — schema + duplicate validator for resources.json.
//
// Used by:
//   - `npm run validate` locally
//   - .github/workflows/auto-merge-pr.yml (validates PRs)
//   - scripts/issue-to-pr.mjs (validates a single new entry)
//
// Exit codes:
//   0 = valid
//   1 = invalid (errors printed to stderr)
//
// Usage:
//   node scripts/validate-resources.mjs <path-to-resources.json>
//   node scripts/validate-resources.mjs              # defaults to public/resources.json

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = resolve(__dirname, '..', 'frontend', 'public', 'resources.json');

const VALID_TIERS = ['free-tier', 'free-trial', 'free-forever', 'open-source'];

const ENTRY_FIELDS = {
  name: 'string',
  url: 'string',
  description: 'string',
  tier: 'string',
  tags: 'object', // array
  submittedBy: 'string',
};

const CATEGORY_FIELDS = {
  name: 'string',
  slug: 'string',
  description: 'string',
  entries: 'object', // array
};

function fail(errors, msg) {
  errors.push(msg);
}

function typeOf(v) {
  return Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v;
}

function validateEntry(entry, path, errors) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    fail(errors, `${path}: must be an object.`);
    return;
  }
  // Reject unknown fields
  for (const key of Object.keys(entry)) {
    if (!(key in ENTRY_FIELDS)) {
      fail(errors, `${path}: unknown field "${key}". Allowed: ${Object.keys(ENTRY_FIELDS).join(', ')}.`);
    }
  }
  // name
  if (typeof entry.name !== 'string') {
    fail(errors, `${path}.name: required string.`);
  } else {
    const n = entry.name;
    if (n.trim().length < 2 || n.trim().length > 80) {
      fail(errors, `${path}.name: must be 2–80 characters (got ${n.trim().length}).`);
    } else if (n !== n.trim()) {
      fail(errors, `${path}.name: no leading/trailing whitespace.`);
    }
  }
  // url
  if (typeof entry.url !== 'string') {
    fail(errors, `${path}.url: required string.`);
  } else {
    try {
      const u = new URL(entry.url.trim());
      if (!['http:', 'https:'].includes(u.protocol)) {
        fail(errors, `${path}.url: must be http(s) URL.`);
      }
    } catch {
      fail(errors, `${path}.url: not a valid URL.`);
    }
  }
  // description
  if (typeof entry.description !== 'string') {
    fail(errors, `${path}.description: required string.`);
  } else {
    const d = entry.description.trim();
    if (d.length < 10 || d.length > 400) {
      fail(errors, `${path}.description: must be 10–400 characters (got ${d.length}).`);
    }
  }
  // tier
  if (typeof entry.tier !== 'string') {
    fail(errors, `${path}.tier: required string.`);
  } else if (!VALID_TIERS.includes(entry.tier)) {
    fail(errors, `${path}.tier: must be one of ${VALID_TIERS.join(', ')} (got "${entry.tier}").`);
  }
  // tags
  if (!Array.isArray(entry.tags)) {
    fail(errors, `${path}.tags: required array.`);
  } else {
    if (entry.tags.length > 10) {
      fail(errors, `${path}.tags: at most 10 tags (got ${entry.tags.length}).`);
    }
    for (const [i, t] of entry.tags.entries()) {
      if (typeof t !== 'string') {
        fail(errors, `${path}.tags[${i}]: must be a string.`);
      } else if (!/^[a-z0-9-]{2,20}$/.test(t)) {
        fail(errors, `${path}.tags[${i}]: must be 2–20 chars, lowercase letters/numbers/hyphens only (got "${t}").`);
      }
    }
    // uniqueness
    const dupes = entry.tags.filter((t, i, arr) => arr.indexOf(t) !== i);
    if (dupes.length) {
      fail(errors, `${path}.tags: duplicates not allowed (${[...new Set(dupes)].join(', ')}).`);
    }
  }
  // submittedBy (optional)
  if ('submittedBy' in entry && entry.submittedBy != null) {
    if (typeof entry.submittedBy !== 'string') {
      fail(errors, `${path}.submittedBy: must be a string.`);
    } else if (entry.submittedBy.length > 60) {
      fail(errors, `${path}.submittedBy: at most 60 characters.`);
    }
  }
}

function validateCategory(cat, idx, errors, seenSlugs) {
  const path = `categories[${idx}]`;
  if (!cat || typeof cat !== 'object' || Array.isArray(cat)) {
    fail(errors, `${path}: must be an object.`);
    return;
  }
  for (const key of Object.keys(cat)) {
    if (!(key in CATEGORY_FIELDS)) {
      fail(errors, `${path}: unknown field "${key}". Allowed: ${Object.keys(CATEGORY_FIELDS).join(', ')}.`);
    }
  }
  if (typeof cat.name !== 'string' || !cat.name.trim()) {
    fail(errors, `${path}.name: required non-empty string.`);
  }
  if (typeof cat.slug !== 'string' || !cat.slug.trim()) {
    fail(errors, `${path}.slug: required non-empty string.`);
  } else if (!/^[a-z0-9-]+$/.test(cat.slug)) {
    fail(errors, `${path}.slug: must be lowercase letters/numbers/hyphens only.`);
  } else if (seenSlugs.has(cat.slug)) {
    fail(errors, `${path}.slug: duplicate slug "${cat.slug}".`);
  } else {
    seenSlugs.add(cat.slug);
  }
  if (typeof cat.description !== 'string' || !cat.description.trim()) {
    fail(errors, `${path}.description: required non-empty string.`);
  }
  if (!Array.isArray(cat.entries)) {
    fail(errors, `${path}.entries: required array.`);
  } else {
    cat.entries.forEach((e, i) => validateEntry(e, `${path}.entries[${i}]`, errors));
  }
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

// Normalize a URL for duplicate comparison: lowercase host (strip www.),
// strip trailing slash, drop query/fragment. This lets us catch genuine
// duplicates (same resource) while allowing distinct sub-resources on the
// same domain (e.g. cloudflare.com/ vs cloudflare.com/dns/).
function urlKey(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    let path = u.pathname.replace(/\/+$/, '') || '/';
    return `${host}${path}`;
  } catch {
    return null;
  }
}

/**
 * Validate the full resources.json document.
 * Returns { valid, errors, duplicates }.
 */
export function validateResources(data) {
  const errors = [];
  const duplicates = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['root: must be an object.'], duplicates };
  }
  if (!Array.isArray(data.categories)) {
    return { valid: false, errors: ['root: "categories" must be an array.'], duplicates };
  }

  const seenSlugs = new Set();
  data.categories.forEach((c, i) => validateCategory(c, i, errors, seenSlugs));

  // Global duplicate-URL check (by normalized full path across all entries).
  // Same hostname with a DIFFERENT path is allowed (e.g. cloudflare.com/ vs
  // cloudflare.com/dns/), so genuinely distinct sub-resources can coexist.
  const seenKeys = new Map(); // urlKey -> [firstCategory, firstName]
  for (const cat of data.categories) {
    if (!Array.isArray(cat.entries)) continue;
    for (const e of cat.entries) {
      const key = urlKey(e.url);
      if (!key) continue;
      if (seenKeys.has(key)) {
        const [firstCat, firstName] = seenKeys.get(key);
        duplicates.push({
          url: e.url,
          key,
          existingCategory: firstCat,
          existingName: firstName,
          newCategory: cat.name,
          newName: e.name,
        });
      } else {
        seenKeys.set(key, [cat.name, e.name]);
      }
    }
  }

  if (duplicates.length) {
    for (const d of duplicates) {
      fail(
        errors,
        `Duplicate URL: "${d.newName}" (${d.newCategory}) is the same resource as "${d.existingName}" (${d.existingCategory}): ${d.key}`
      );
    }
  }

  return { valid: errors.length === 0, errors, duplicates };
}

/**
 * Validate a single new entry being inserted.
 * Returns { valid, errors }.
 */
export function validateSingleEntry(entry) {
  const errors = [];
  validateEntry(entry, 'entry', errors);
  return { valid: errors.length === 0, errors };
}

/**
 * Check whether an entry's URL already exists in the document
 * (matched by normalized full path, not just hostname, so distinct
 * sub-resources on the same domain are allowed).
 * Returns the existing entry's category+name if found, else null.
 */
export function findDuplicate(data, url) {
  const key = urlKey(url);
  if (!key) return null;
  for (const cat of data.categories || []) {
    for (const e of cat.entries || []) {
      if (urlKey(e.url) === key) {
        return { category: cat.name, name: e.name };
      }
    }
  }
  return null;
}

/**
 * Insert an entry into a category (creating the category if needed).
 * Mutates and returns the data object.
 */
export function insertEntry(data, { categoryName, newCategoryDescription }, entry) {
  const slug = String(categoryName)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let cat = (data.categories || []).find(
    (c) => c.slug === slug || c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (!cat) {
    cat = {
      name: categoryName,
      slug,
      description: newCategoryDescription || categoryName,
      entries: [],
    };
    data.categories = [...(data.categories || []), cat];
  }
  cat.entries = [...cat.entries, entry];
  return data;
}

/**
 * Recursively sort categories + entries by name for deterministic diffs.
 * Returns a new object (does not mutate input).
 */
export function sortResources(data) {
  const cats = (data.categories || [])
    .map((c) => ({
      ...c,
      entries: [...(c.entries || [])].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { ...data, categories: cats };
}

// ---- CLI entry point ----
function main() {
  const file = process.argv[2] || DEFAULT_PATH;
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (e) {
    console.error(`Could not read ${file}: ${e.message}`);
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`Invalid JSON in ${file}: ${e.message}`);
    process.exit(1);
  }
  const { valid, errors, duplicates } = validateResources(data);
  if (valid) {
    const count = (data.categories || []).reduce((n, c) => n + (c.entries?.length || 0), 0);
    console.log(`✓ ${file} is valid — ${data.categories.length} categories, ${count} entries.`);
    process.exit(0);
  } else {
    console.error(`✗ ${file} is INVALID:\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

// Run CLI only when invoked directly (not when imported).
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
