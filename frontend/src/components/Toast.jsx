// Toast - lightweight notifications (no dep).
import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext({ push: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { ...toast, id }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, toast.duration || 5000);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-fade-in rounded-lg px-4 py-3 text-sm shadow-lg ring-1 ${
              t.type === 'error'
                ? 'bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-800'
                : t.type === 'success'
                ? 'bg-ink-900 text-white ring-ink-900 dark:bg-white dark:text-ink-950 dark:ring-white'
                : 'bg-white text-ink-800 ring-ink-200 dark:bg-ink-800 dark:text-ink-100 dark:ring-ink-700'
            }`}
          >
            {t.title && <p className="font-semibold">{t.title}</p>}
            <p>{t.message}</p>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
