// ResourceCard - a single resource entry in the directory.
import TierBadge from './TierBadge.jsx';

export default function ResourceCard({ entry }) {
  let host = '';
  try {
    host = new URL(entry.url).hostname.replace(/^www\./, '');
  } catch {
    host = entry.url;
  }

  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl bg-white p-4 ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-brand-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <img
              src={`https://icons.duckduckgo.com/ip3/${host}.ico`}
              alt=""
              className="h-4 w-4 shrink-0 rounded-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
              {entry.name}
            </h3>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
            {host}
          </p>
        </div>
        <TierBadge tier={entry.tier} />
      </div>

      <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
        {entry.description}
      </p>

      {entry.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.slice(0, 6).map((t) => (
            <span
              key={t}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs">
        {entry.submittedBy ? (
          <span className="text-slate-400 dark:text-slate-500">
            by @{entry.submittedBy}
          </span>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-1 font-medium text-brand-600 opacity-0 transition group-hover:opacity-100 dark:text-brand-400">
          Visit
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </a>
  );
}
