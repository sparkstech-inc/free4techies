// Layout - wraps every page with header, top ad, content, footer.
import { useEffect, useState } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import AdSlot from './AdSlot.jsx';
import { api } from '../api.js';

export default function Layout({ children, onSearch, showSidebarAd = false }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .categories()
      .then((cats) => setCategories(cats))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onSearch={onSearch} />

      {/* Top leaderboard ad slot - present on all pages */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <AdSlot format="leaderboard" label="Advertisement" />
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {showSidebarAd ? (
          <div className="flex gap-6">
            <div className="min-w-0 flex-1">{children}</div>
            <aside className="hidden w-[300px] shrink-0 lg:block">
              <div className="sticky top-24 space-y-6">
                <AdSlot format="sidebar" label="Advertisement" />
                <AdSlot format="sticky" label="Advertisement" />
              </div>
            </aside>
          </div>
        ) : (
          children
        )}
      </main>

      <Footer categories={categories} />
    </div>
  );
}
