// App - routes. ToastProvider wraps everything for notifications.
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast.jsx';
import HomePage from './pages/HomePage.jsx';
import SubmitPage from './pages/SubmitPage.jsx';
import SponsorPage from './pages/SponsorPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/sponsor" element={<SponsorPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  );
}
