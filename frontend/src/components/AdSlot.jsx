// AdSlot - reserved advertisement placements integrated into the layout.
// Designed to support multiple ad networks (Google AdSense, Carbon Ads,
// EthicalAds, BuySellAds) via a single config. Falls back to a tasteful
// "Your ad here" placeholder so the layout never breaks.
//
// To enable real ads, set window.__ADS__ = { provider: 'adsense', slot: '...' }
// or wire up the network snippet inside the effect below.

import { useEffect, useRef } from 'react';

const ADS_CONFIG = (() => {
  if (typeof window !== 'undefined' && window.__ADS__) return window.__ADS__;
  // Read from env as a fallback
  if (import.meta.env.VITE_AD_PROVIDER) {
    return {
      provider: import.meta.env.VITE_AD_PROVIDER,
      client: import.meta.env.VITE_AD_CLIENT,
      slot: import.meta.env.VITE_AD_SLOT,
    };
  }
  return null;
})();

export default function AdSlot({
  format = 'horizontal',
  className = '',
  label = 'Sponsored',
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ADS_CONFIG || !ref.current) return;
    // Provider-specific mounting logic could go here, e.g.:
    // if (ADS_CONFIG.provider === 'adsense') {
    //   const ins = document.createElement('ins');
    //   ins.className = 'adsbygoogle';
    //   ins.style.display = 'block';
    //   ins.dataset.adClient = ADS_CONFIG.client;
    //   ins.dataset.adSlot = ADS_CONFIG.slot;
    //   ref.current.appendChild(ins);
    //   (window.adsbygoogle = window.adsbygoogle || []).push({});
    // }
  }, []);

  const sizes = {
    horizontal: 'min-h-[90px] h-[90px] md:h-[90px]',
    leaderboard: 'min-h-[90px] h-[90px]',
    rectangle: 'min-h-[250px] h-[250px] w-full max-w-[336px] mx-auto',
    sidebar: 'min-h-[600px] h-[600px] w-full max-w-[300px]',
    sticky: 'min-h-[250px] h-[250px]',
  };

  return (
    <div
      ref={ref}
      className={`group relative flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-100/60 px-4 text-center dark:border-slate-700 dark:bg-slate-900/40 ${sizes[format] || sizes.horizontal} ${className}`}
      aria-label="Advertisement"
    >
      {ADS_CONFIG ? (
        <span className="text-xs text-slate-400">Loading ad…</span>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {label}
          </span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Your ad here
          </span>
          <a
            href="/sponsor"
            className="text-xs text-brand-600 hover:underline dark:text-brand-400"
          >
            Become a sponsor →
          </a>
        </div>
      )}
    </div>
  );
}
