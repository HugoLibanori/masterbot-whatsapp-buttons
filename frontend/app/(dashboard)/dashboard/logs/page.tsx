'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getJSON, postJSON } from '@/lib/backend';
import { useToast } from '@/components/ToastProvider';
import ConfirmModal from '@/components/ConfirmModal';
import type { SessionItem, SessionLog } from '@/types/dashboard';

export default function LogsPage() {
  const router = useRouter();
  const toast = useToast();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selected, setSelected] = useState('');
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function loadSessions() {
    try {
      const res = await getJSON<{ ok: boolean; items: SessionItem[] }>('/api/sessions', true);
      setSessions(res.items || []);
    } catch (err: any) {
      const msg = err?.message || '';
      if (String(msg).startsWith('Erro 401')) {
        router.push('/login');
        return;
      }
      setError(msg || 'Falha ao listar sessões');
    }
  }

  async function loadLogs(name?: string) {
    setLoading(true);
    setError(null);
    try {
      const query = name ? `?session=${encodeURIComponent(name)}` : '';
      const res = await getJSON<{ ok: boolean; logs: SessionLog[] }>(`/api/logs${query}`, true);
      setLogs(res.logs || []);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
    loadLogs();
  }, []);

  useEffect(() => {
    loadLogs(selected);
  }, [selected]);

  return (
    <div>
      <h1>Logs das sessões</h1>
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
          <span>Filtrar por sessão</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #2f3144' }}
          >
            <option value="">Todas as sessões</option>
            {sessions.map((session) => (
              <option key={session.session_name} value={session.session_name}>
                {session.session_name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn-pill btn-pill--compact"
          onClick={() => loadLogs(selected)}
          disabled={loading}
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
        <button
          className="btn-pill btn-pill--danger"
          onClick={() => setConfirmOpen(true)}
          disabled={clearing || loading}
        >
          {clearing ? 'Limpando...' : 'Limpar logs'}
        </button>
      </div>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {logs.length ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Data</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Sessão</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Nível</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.session_name}</td>
                <td>{log.level}</td>
                <td>
                  {log.message}
                  {log.meta && (
                    <details>
                      <summary>Detalhes</summary>
                      <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(log.meta, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p style={{ color: '#bfc0d4' }}>Nenhum log disponível.</p>
      )}
      <ConfirmModal
        open={confirmOpen}
        title="Limpar logs"
        description={
          selected
            ? `Tem certeza que deseja remover todos os logs da sessão "${selected}"?`
            : 'Tem certeza que deseja remover todos os logs registrados? Esta ação não pode ser desfeita.'
        }
        confirmText={clearing ? 'Limpando...' : 'Sim, limpar'}
        cancelText="Cancelar"
        onCancel={() => {
          if (clearing) return;
          setConfirmOpen(false);
        }}
        onConfirm={async () => {
          if (clearing) return;
          setClearing(true);
          try {
            await postJSON('/api/logs/clear', { sessionName: selected || null }, true);
            toast.success('Logs removidos.');
            await loadLogs(selected);
            setConfirmOpen(false);
          } catch (err: any) {
            toast.error(err?.message || 'Falha ao limpar logs');
          } finally {
            setClearing(false);
          }
        }}
      />
    </div>
  );
}
