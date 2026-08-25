// Layout — wraps every page with header, optional top ad, content, footer.
// Single-column reading layout (no sidebar ads on content — cleaner like free-for.dev).
import { useEffect, useState } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import AdSlot from './AdSlot.jsx';
import { api } from '../api.js';

export default function Layout({ children, onSearch, showTopAd = true }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.categories().then((cats) => setCategories(cats)).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onSearch={onSearch} />

      {showTopAd && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-3 sm:px-6">
          <AdSlot format="leaderboard" label="Advertisement" />
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>

      <Footer categories={categories} />
    </div>
  );
}
