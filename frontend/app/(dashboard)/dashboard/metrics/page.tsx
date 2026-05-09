'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Users, 
  Users2, 
  Zap, 
  Calendar, 
  RefreshCw, 
  Clock,
  Terminal,
  MousePointer2
} from 'lucide-react';
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

  const metricsConfig = metrics ? [
    { label: 'Comandos Executados', value: metrics.executed_cmds, icon: Activity, color: '#bd93f9' },
    { label: 'Usuários Totais', value: metrics.users_total, icon: Users, color: '#8be9fd' },
    { label: 'Grupos Ativos', value: metrics.groups_total, icon: Users2, color: '#50fa7b' },
    { label: 'Eventos XP', value: metrics.xp_events_total, icon: Zap, color: '#ffb86c' },
    { 
      label: 'Iniciado em', 
      value: metrics.started_at ? new Date(metrics.started_at).toLocaleString() : 'Offline', 
      icon: Clock, 
      color: '#ff79c6' 
    },
    { 
      label: 'Próximo Reset XP', 
      value: new Date(metrics.xp_next_reset).toLocaleDateString(), 
      icon: Calendar, 
      color: '#ff5555' 
    },
  ] : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ paddingBottom: 40 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, background: 'linear-gradient(to right, #fff, #bd93f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Métricas do Sistema
          </h1>
          <p style={{ color: '#8be9fd', margin: '4px 0 0 0' }}>Acompanhe o desempenho das suas instâncias em tempo real</p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ 
              padding: '12px 16px', 
              borderRadius: '12px', 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Selecione uma sessão...</option>
            {sessions.map((session) => (
              <option key={session.session_name} value={session.session_name}>
                {session.session_name}
              </option>
            ))}
          </select>

          <button
            className="btn-primary"
            onClick={() => selected && loadMetrics(selected)}
            disabled={!selected || loading}
            style={{ height: '45px', padding: '0 20px' }}
          >
            <RefreshCw size={18} className={loading ? 'dot-pulse' : ''} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ padding: 16, color: '#ff5555', border: '1px solid rgba(255,85,85,0.2)', marginBottom: 24 }}>
          <Activity size={18} style={{ marginRight: 8 }} /> {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card" 
            style={{ padding: 40, textAlign: 'center', color: '#6272a4' }}
          >
            <MousePointer2 size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Selecione uma sessão acima para carregar as métricas de uso.</p>
          </motion.div>
        ) : metrics ? (
          <motion.div
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}
          >
            {metricsConfig.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card"
                style={{ padding: 24, position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ 
                  position: 'absolute', 
                  right: -10, 
                  top: -10, 
                  opacity: 0.05,
                  transform: 'rotate(-15deg)'
                }}>
                  <item.icon size={100} color={item.color} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{ 
                    padding: 12, 
                    background: `${item.color}15`, 
                    borderRadius: 12, 
                    color: item.color,
                    border: `1px solid ${item.color}30`
                  }}>
                    <item.icon size={24} />
                  </div>
                  <span style={{ color: '#6272a4', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {item.label}
                  </span>
                </div>

                <div style={{ fontSize: 32, fontWeight: 800, color: 'white' }}>
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </div>
              </motion.div>
            ))}

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: 24, color: '#6272a4', fontSize: 13 }}
            >
              <Terminal size={14} style={{ marginRight: 6, display: 'inline' }} />
              Última atualização em {new Date(metrics.generated_at).toLocaleString()}.
            </motion.div>
          </motion.div>
        ) : !loading && (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#6272a4' }}>
            Nenhuma métrica disponível para esta sessão.
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
