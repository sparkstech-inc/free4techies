import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-7xl font-extrabold text-brand-500">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
          Page not found
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          The page you're looking for doesn't exist or was moved.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Back to the directory
        </Link>
      </div>
    </Layout>
  );
}
