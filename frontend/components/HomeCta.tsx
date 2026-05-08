'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBackendBaseURL } from '@/lib/backend';

export default function HomeCta() {
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        if (active) setLogged(false);
        return;
      }
      try {
        const res = await fetch(`${getBackendBaseURL()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({ ok: false }));
        if (active) setLogged(!!data?.ok);
      } catch {
        if (active) setLogged(false);
      }
    }
    check();
  }, []);

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {logged ? (
        <Link href="/dashboard">
          <button>Ir para o Dashboard</button>
        </Link>
      ) : (
        <Link href="/login">
          <button>Começar agora</button>
        </Link>
      )}
    </div>
  );
}
