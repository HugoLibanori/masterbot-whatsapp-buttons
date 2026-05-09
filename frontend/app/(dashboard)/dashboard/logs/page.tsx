'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  RefreshCw, 
  Search, 
  ChevronRight,
  AlertCircle,
  PlayCircle,
  Clock,
  Settings
} from 'lucide-react';
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
  const [autoScroll, setAutoScroll] = useState(true);
  const [realtime, setRealtime] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadSessions() {
    try {
      const res = await getJSON<{ ok: boolean; items: SessionItem[] }>('/api/sessions', true);
      setSessions(res.items || []);
    } catch (err: any) {
      if (String(err?.message).startsWith('Erro 401')) {
        router.push('/login');
        return;
      }
      setError('Falha ao listar sessões');
    }
  }

  async function loadLogs(name?: string) {
    if (loading && !realtime) return;
    try {
      const query = name ? `?session=${encodeURIComponent(name)}` : '';
      const res = await getJSON<{ ok: boolean; logs: SessionLog[] }>(`/api/logs${query}`, true);
      
      // Só atualiza se houver logs novos ou se for a primeira carga
      if (res.logs.length !== logs.length) {
        setLogs(res.logs || []);
      }
    } catch (err: any) {
      console.error(err);
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

  // Efeito para Polling (Real-time)
  useEffect(() => {
    let interval: any;
    if (realtime) {
      interval = setInterval(() => {
        loadLogs(selected);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [realtime, selected, logs.length]);

  // Efeito para Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return '#ff5555';
      case 'command': return '#50fa7b';
      case 'info': return '#8be9fd';
      default: return '#f8f8f2';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}
    >
      {/* Header com Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: 'linear-gradient(to right, #fff, #bd93f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: 12 }}>
            <TerminalIcon /> Console de Logs
          </h1>
          <p style={{ color: '#6272a4', margin: '4px 0 0 0' }}>Monitoramento em tempo real das instâncias</p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <label style={{ fontSize: 12, color: '#6272a4', fontWeight: 600 }}>SESSÃO:</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', outline: 'none' }}
            >
              <option value="">Todas as sessões</option>
              {sessions.map((s) => (
                <option key={s.session_name} value={s.session_name}>{s.session_name}</option>
              ))}
            </select>
          </div>

          <button className="btn-primary" onClick={() => loadLogs(selected)} disabled={loading} style={{ background: 'rgba(189, 147, 249, 0.1)', color: '#bd93f9', border: '1px solid rgba(189, 147, 249, 0.2)' }}>
            <RefreshCw size={16} className={loading ? 'dot-pulse' : ''} />
          </button>
          
          <button className="btn-primary" onClick={() => setConfirmOpen(true)} style={{ background: 'rgba(255,85,85,0.1)', color: '#ff5555', border: '1px solid rgba(255,85,85,0.2)' }}>
            <Trash2 size={16} /> Limpar
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="glass-card" style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
        {/* Terminal Header */}
        <div style={{ background: '#161b22', padding: '8px 16px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ fontSize: 11, color: '#6272a4', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={realtime} onChange={e => setRealtime(e.target.checked)} /> REAL-TIME
            </label>
            <label style={{ fontSize: 11, color: '#6272a4', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} /> AUTO-SCROLL
            </label>
          </div>
        </div>

        {/* Terminal Content */}
        <div 
          ref={scrollRef}
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '16px', 
            fontFamily: '"Fira Code", "Courier New", monospace', 
            fontSize: '13px', 
            lineHeight: '1.6',
            color: '#d1d5db'
          }}
        >
          {logs.length === 0 && !loading && (
            <div style={{ color: '#444c56', textAlign: 'center', marginTop: 40 }}>
              <TerminalIcon size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
              <p>Aguardando logs do sistema...</p>
            </div>
          )}

          {logs.map((log, idx) => (
            <div key={log.id} style={{ marginBottom: 4, display: 'flex', gap: 12 }}>
              <span style={{ color: '#444c56', whiteSpace: 'nowrap' }}>
                [{new Date(log.created_at).toLocaleTimeString('pt-BR')}]
              </span>
              <span style={{ color: '#bd93f9', fontWeight: 600, minWidth: 80 }}>
                {log.session_name.padEnd(8)}
              </span>
              <span style={{ color: getLevelColor(log.level), flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Limpar Histórico?"
        description={selected ? `Isso apagará permanentemente todos os logs da sessão "${selected}".` : 'Isso apagará todos os logs de todas as sessões.'}
        confirmText="Limpar Agora"
        onConfirm={async () => {
          setClearing(true);
          try {
            await postJSON('/api/logs/clear', { sessionName: selected || null }, true);
            setLogs([]);
            setConfirmOpen(false);
            toast.success('Logs limpos!');
          } catch (e) {
            toast.error('Erro ao limpar logs');
          } finally {
            setClearing(false);
          }
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </motion.div>
  );
}
