import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

let toastFn = null;
export function toast(message, type = 'success') {
  if (toastFn) toastFn({ message, type, id: Date.now() });
}

export function Toaster() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    toastFn = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    return () => { toastFn = null; };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={cn('flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg text-white max-w-sm', t.type === 'error' ? 'bg-red-600' : t.type === 'warning' ? 'bg-yellow-500' : 'bg-green-600')}>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}
