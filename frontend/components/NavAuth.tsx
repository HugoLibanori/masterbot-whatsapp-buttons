'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBackendBaseURL } from '@/lib/backend';
import { usePathname, useRouter } from 'next/navigation';

export default function NavAuth() {
  const [auth, setAuth] = useState<{ ok: boolean; email?: string | null } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          if (active) setAuth({ ok: false });
          if (pathname !== '/login') router.push('/login');
          return;
        }
        const res = await fetch(`${getBackendBaseURL()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({ ok: false }));
        if (active) {
          setAuth(data);
          if (!data.ok && pathname !== '/login') {
            router.push('/login');
          }
        }
      } catch {
        if (active) {
          setAuth({ ok: false });
          if (pathname !== '/login') router.push('/login');
        }
      }
    }
    check();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  function logout() {
    localStorage.removeItem('token');
    setAuth({ ok: false });
    router.push('/login');
  }

  const isLogin = pathname === '/login';

  if (auth === null) return null;

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {auth?.ok ? (
        <button onClick={logout}>Sair</button>
      ) : (
        !isLogin && <Link href="/login">Entrar</Link>
      )}
    </nav>
  );
}
