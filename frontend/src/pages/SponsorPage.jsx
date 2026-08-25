// SponsorPage — sponsor Free4Techies. Pure frontend, no backend.
//
// Instead of a server-side PayNow integration, this page links out to a
// configurable sponsor destination: GitHub Sponsors, a PayNow payment
// link, Buy Me a Coffee, or any URL you set via VITE_SPONSOR_URL at
// build time. If no URL is configured, it shows a tasteful "become a
// sponsor" CTA pointing at the repo's sponsor settings.
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { config } from '../config.js';
import { useToast } from '../components/Toast.jsx';
import Layout from '../components/Layout.jsx';
import AdSlot from '../components/AdSlot.jsx';

// Override at build time with VITE_SPONSOR_URL (e.g. a PayNow payment
// link, GitHub Sponsors URL, or Buy Me a Coffee page).
const SPONSOR_URL =
  import.meta.env.VITE_SPONSOR_URL ||
  `https://github.com/sponsors/${config.repoOwner}`;

const SPONSOR_LABEL =
  import.meta.env.VITE_SPONSOR_LABEL || 'Sponsor on GitHub';

const PRESETS = [
  { amount: 5, label: 'Coffee', emoji: '☕' },
  { amount: 15, label: 'Lunch', emoji: '🍱' },
  { amount: 50, label: 'Server month', emoji: '🖥️' },
  { amount: 100, label: 'Hero', emoji: '🦸' },
];

const TIERS_INFO = [
  {
    name: 'Supporter',
    price: 'USD 5+',
    perks: ['Listed on the sponsors wall', 'Good karma', 'Early access to new features'],
    highlight: false,
  },
  {
    name: 'Sponsor',
    price: 'USD 50+/mo',
    perks: ['Logo on the homepage', 'Featured sponsor badge', 'Priority PR reviews', 'Newsletter shoutout'],
    highlight: true,
  },
  {
    name: 'Partner',
    price: 'Custom',
    perks: ['Co-branded content', 'Dedicated ad placements', 'Direct line to the team', 'Custom integrations'],
    highlight: false,
  },
];

export default function SponsorPage() {
  const { push } = useToast();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState(15);
  const [custom, setCustom] = useState('');
  const [returnedStatus, setReturnedStatus] = useState(null);

  // If we returned from an external payment flow with ?status=, show it.
  useState(() => {
    const status = searchParams.get('status');
    const ref = searchParams.get('reference');
    if (status) {
      setReturnedStatus({ status, ref });
      if (/paid/i.test(status)) {
        push({ type: 'success', title: 'Thank you!', message: 'Your sponsorship was received. 💚' });
      } else if (status !== 'unknown') {
        push({ type: 'info', title: 'Payment status', message: `Status: ${status}` });
      }
    }
  }, []);

  const finalAmount = custom ? Number(custom) : amount;

  const goSponsor = () => {
    if (!finalAmount || finalAmount < 1) {
      push({ type: 'error', message: 'Please choose an amount of at least USD 1.' });
      return;
    }
    push({ type: 'success', title: 'Opening sponsor page…', message: 'Complete your contribution there.' });
    window.open(SPONSOR_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Sponsor Free4Techies
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            Free4Techies is free and open for everyone, forever. Your
            sponsorship keeps the lights on, the resources reviewed, and the
            project growing.
          </p>
        </div>

        {/* Returned status banner */}
        {returnedStatus && (
          <div
            className={`mb-8 rounded-xl border p-5 text-center ${
              /paid/i.test(returnedStatus.status)
                ? 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200'
                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {/paid/i.test(returnedStatus.status) ? (
              <>
                <p className="text-lg font-bold">Thank you for your sponsorship! 💚</p>
                <p className="mt-1 text-sm">Reference: {returnedStatus.ref || '—'}</p>
              </>
            ) : (
              <p className="text-sm">
                Payment status: <strong>{returnedStatus.status}</strong>. Reference: {returnedStatus.ref || '—'}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Sponsor tiers */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Sponsorship tiers
            </h2>
            {TIERS_INFO.map((t) => (
              <div
                key={t.name}
                className={`card relative p-5 ${
                  t.highlight ? 'ring-2 ring-brand-500' : ''
                }`}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-5 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t.name}
                  </h3>
                  <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                    {t.price}
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Other ways to support
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                <li>⭐ Star the project on GitHub</li>
                <li>📝 Submit new resources (no login needed on this site)</li>
                <li>📢 Share Free4Techies with your team</li>
                <li>🐛 Report broken links or outdated tiers</li>
              </ul>
            </div>
          </div>

          {/* Contribution panel */}
          <div className="card sticky top-24 self-start p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Make a contribution
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pick an amount, then we'll open the sponsor page to finish.
            </p>

            {/* preset amounts */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map((p) => (
                <button
                  key={p.amount}
                  type="button"
                  onClick={() => {
                    setAmount(p.amount);
                    setCustom('');
                  }}
                  className={`rounded-lg border p-3 text-center transition ${
                    !custom && amount === p.amount
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-950'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="text-lg">{p.emoji}</div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-white">
                    ${p.amount}
                  </div>
                  <div className="text-[10px] text-slate-400">{p.label}</div>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="label">Custom amount (USD)</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="Other amount"
                  className="input pl-7"
                />
              </div>
            </div>

            <button
              onClick={goSponsor}
              className="btn-primary mt-6 w-full text-base"
            >
              Sponsor ${finalAmount || ''} →
            </button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Opens {SPONSOR_LABEL} in a new tab to complete securely.
            </p>

            <div className="mt-4 flex items-center justify-center gap-3 opacity-70">
              <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4z" strokeLinejoin="round" />
                </svg>
                Secure &amp; powered by {SPONSOR_LABEL}
              </span>
            </div>
          </div>
        </div>

        {/* Sponsors wall (placeholder) */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Our sponsors
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-dashed border-slate-300 px-6 py-4 text-sm text-slate-400 dark:border-slate-700">
              Be the first sponsor — your logo here 🙌
            </div>
          </div>
        </div>

        <div className="mt-10">
          <AdSlot format="leaderboard" label="Advertisement" />
        </div>
      </div>
    </Layout>
  );
}
