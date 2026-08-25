// AdSlot — reserved advertisement placements, B/W minimal.
// Falls back to a tasteful "Your ad here" placeholder.
import { useEffect, useRef } from 'react';

const ADS_CONFIG = (() => {
  if (typeof window !== 'undefined' && window.__ADS__) return window.__ADS__;
  if (import.meta.env.VITE_AD_PROVIDER) {
    return {
      provider: import.meta.env.VITE_AD_PROVIDER,
      client: import.meta.env.VITE_AD_CLIENT,
      slot: import.meta.env.VITE_AD_SLOT,
    };
  }
  return null;
})();

export default function AdSlot({ format = 'horizontal', className = '', label = 'Sponsored' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ADS_CONFIG || !ref.current) return;
    // Provider mounting logic would go here.
  }, []);

  const sizes = {
    horizontal: 'min-h-[90px] h-[90px]',
    leaderboard: 'min-h-[90px] h-[90px]',
    rectangle: 'min-h-[250px] h-[250px] w-full max-w-[336px] mx-auto',
    sidebar: 'min-h-[600px] h-[600px] w-full max-w-[300px]',
    sticky: 'min-h-[250px] h-[250px]',
  };

  return (
    <div
      ref={ref}
      className={`group relative flex items-center justify-center overflow-hidden rounded-md border border-dashed border-ink-300 bg-ink-50 px-4 text-center dark:border-ink-700 dark:bg-ink-900/40 ${sizes[format] || sizes.horizontal} ${className}`}
      aria-label="Advertisement"
    >
      {ADS_CONFIG ? (
        <span className="text-xs text-ink-400">Loading ad…</span>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-400 dark:text-ink-500">
            {label}
          </span>
          <span className="text-sm font-medium text-ink-500 dark:text-ink-400">
            Your ad here
          </span>
          <a href="/sponsor" className="text-xs text-ink-700 hover:underline dark:text-ink-300">
            Become a sponsor →
          </a>
        </div>
      )}
    </div>
  );
}
