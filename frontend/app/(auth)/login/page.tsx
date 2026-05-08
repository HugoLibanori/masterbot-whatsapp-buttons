'use client';

import { useState } from 'react';
import { postJSON } from '@/lib/backend';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function submit() {
    setLoading(true);
    try {
      const res = await postJSON<{ ok: boolean; token: string }>(`/api/auth/login`, {
        email,
        password,
      });
      localStorage.setItem('token', res.token);
      toast.success('Login realizado com sucesso');
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(e?.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#232336',
          border: '1px solid #2f2f40',
          borderRadius: 16,
          padding: '2rem',
          boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Entrar</h1>
        <div style={{ display: 'grid', gap: 12 }}>
          <input
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={submit} disabled={loading || !email || !password}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <small style={{ color: '#bfc0d4' }}>Acesso exclusivo do administrador.</small>
        </div>
      </div>
    </div>
  );
}
