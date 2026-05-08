'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setItems((prev) => [...prev, { id, type, message }]);
    // auto remove
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  function bgFor(type: ToastType) {
    switch (type) {
      case 'success':
        return '#bbf7d0'; // green-200
      case 'error':
        return '#fecaca'; // red-200
      default:
        return '#bfdbfe'; // blue-200
    }
  }

  function borderFor(type: ToastType) {
    switch (type) {
      case 'success':
        return '#065f46';
      case 'error':
        return '#991b1b';
      default:
        return '#1e3a8a';
    }
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container fixo no canto direito */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          display: 'grid',
          gap: 8,
          zIndex: 9999,
          maxWidth: 380,
          width: 'min(92vw, 380px)',
        }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'grid',
              justifyItems: 'center',
              textAlign: 'center',
              padding: '12px 14px',
              borderRadius: 10,
              color: '#0f172a',
              background: bgFor(t.type),
              border: `1px solid ${borderFor(t.type)}20`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            <div
              style={{
                opacity: 0.95,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.45,
              }}
            >
              {t.message}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
