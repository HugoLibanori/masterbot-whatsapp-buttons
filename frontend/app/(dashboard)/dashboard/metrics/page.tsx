'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getJSON } from '@/lib/backend';
import type { SessionItem, SessionMetrics } from '@/types/dashboard';

export default function MetricsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selected, setSelected] = useState('');
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions() {
    try {
      const res = await getJSON<{ ok: boolean; items: SessionItem[] }>('/api/sessions', true);
      setSessions(res.items || []);
      if (!selected && res.items?.length) {
        setSelected(res.items[0].session_name);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (String(msg).startsWith('Erro 401')) {
        router.push('/login');
        return;
      }
      setError(msg || 'Falha ao listar sessões');
    }
  }

  async function loadMetrics(name: string) {
    if (!name) {
      setMetrics(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getJSON<{ ok: boolean; metrics: SessionMetrics }>(
        `/api/sessions/${encodeURIComponent(name)}/metrics`,
        true,
      );
      setMetrics(res.metrics);
    } catch (err: any) {
      const msg = err?.message || 'Erro ao carregar métricas';
      setError(msg);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selected) {
      loadMetrics(selected);
    }
  }, [selected]);

  return (
    <div>
      <h1>Métricas do bot</h1>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'flex-end',
          marginBottom: 16,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Selecione a sessão</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #2f3144' }}
          >
            <option value="">Escolha...</option>
            {sessions.map((session) => (
              <option key={session.session_name} value={session.session_name}>
                {session.session_name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn-pill btn-pill--compact"
          onClick={() => selected && loadMetrics(selected)}
          disabled={!selected || loading}
        >
          {loading ? 'Atualizando...' : 'Atualizar métricas'}
        </button>
      </div>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {!selected && (
        <p style={{ color: '#bfc0d4' }}>Escolha uma sessão para visualizar os dados.</p>
      )}

      {selected && metrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {[
            { label: 'Comandos executados', value: metrics.executed_cmds },
            { label: 'Usuários', value: metrics.users_total },
            { label: 'Grupos', value: metrics.groups_total },
            { label: 'Eventos XP', value: metrics.xp_events_total },
            {
              label: 'Iniciado em',
              value: metrics.started_at
                ? new Date(metrics.started_at).toLocaleString()
                : 'Não iniciado',
            },
            {
              label: 'Próximo reset de XP',
              value: new Date(metrics.xp_next_reset).toLocaleDateString(),
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: '#1b1c2d',
                border: '1px solid #2f3144',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <p style={{ margin: 0, color: '#bfc0d4', fontSize: 14 }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {selected && !metrics && !loading && !error && (
        <p style={{ color: '#bfc0d4' }}>Nenhuma métrica disponível para esta sessão.</p>
      )}

      {metrics && (
        <p style={{ marginTop: 16, color: '#bfc0d4' }}>
          Última atualização em {new Date(metrics.generated_at).toLocaleString()}.
        </p>
      )}
    </div>
  );
}
