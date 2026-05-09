'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, 
  Play, 
  Code, 
  Square, 
  LogOut, 
  RefreshCw, 
  UserPlus, 
  Settings, 
  Trash2, 
  Calendar,
  Smartphone,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { getBackendBaseURL, getJSON, postJSON } from '@/lib/backend';
import QrImage from '@/components/QrImage';
import { useToast } from '@/components/ToastProvider';
import ConfirmModal from '@/components/ConfirmModal';
import type { Customer, SessionItem } from '@/types/dashboard';

const OWNER_SESSION = process.env.NEXT_PUBLIC_OWNER_SESSION_NAME ?? 'BD_BOT';

export default function SessionsPage() {
  const [sessionName, setSessionName] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [qr, setQr] = useState<string | undefined>();
  const [pairingCode, setPairingCode] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [list, setList] = useState<SessionItem[]>([]);
  const router = useRouter();
  const toast = useToast();
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [extendTarget, setExtendTarget] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState('30');
  const [extending, setExtending] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState<string>('');
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codePhone, setCodePhone] = useState('');
  const [startingCode, setStartingCode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const sessionExists = list.some((s) => s.session_name === sessionName);

  async function loadSessions() {
    try {
      const res = await getJSON<{ ok: boolean; items: SessionItem[] }>('/api/sessions', true);
      setList(res.items || []);
    } catch (e: any) {
      const msg = e?.message || '';
      if (String(msg).startsWith('Erro 401')) {
        router.push('/login');
        return;
      }
      setError(msg || 'Erro ao listar sessões');
    }
  }

  async function loadCustomers() {
    try {
      const res = await getJSON<{ ok: boolean; customers: Customer[] }>('/api/customers', true);
      setCustomers(res.customers || []);
    } catch (e: any) {
      console.error(e);
    }
  }

  async function createSession() {
    try {
      await postJSON('/api/sessions', { sessionName }, true);
      toast.success('Sessão criada com sucesso');
      await loadSessions();
      setSessionName('');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar sessão');
    }
  }

  async function startSession(name: string) {
    try {
      await postJSON(`/api/sessions/${encodeURIComponent(name)}/start`, {}, true);
      toast.success('Iniciando... Aguarde o QR Code');
      setSessionName(name);
      await refreshStatus(name);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao iniciar');
    }
  }

  async function stopSession(name: string) {
    try {
      await postJSON(`/api/sessions/${encodeURIComponent(name)}/stop`, {}, true);
      toast.info('Sessão parada');
      await loadSessions();
      if (sessionName === name) await refreshStatus(name);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao parar');
    }
  }

  async function logoutSession(name: string) {
    try {
      await postJSON(`/api/sessions/${encodeURIComponent(name)}/logout`, {}, true);
      toast.info('Sessão deslogada');
      await loadSessions();
      if (sessionName === name) await refreshStatus(name);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao deslogar');
    }
  }

  async function refreshStatus(name?: string) {
    const target = name || sessionName;
    if (!target) return;
    try {
      const res = await getJSON<{ ok: boolean; info?: any }>(
        `/api/sessions/${encodeURIComponent(target)}/status`,
        true,
      );
      setStatus(res.info);
      const qrRes = await getJSON<{
        ok: boolean;
        qr?: string | null;
        pairing_code?: string | null;
      }>(`/api/sessions/${encodeURIComponent(target)}/qr`, true);
      setQr(qrRes.qr || undefined);
      setPairingCode(qrRes.pairing_code || undefined);
    } catch (e: any) {
      if (!String(e?.message).includes('404')) {
        toast.error('Erro ao buscar status');
      }
    }
  }

  useEffect(() => {
    loadSessions();
    loadCustomers();
    const id = setInterval(() => {
      loadSessions();
      if (sessionName) refreshStatus();
    }, 5000);
    return () => clearInterval(id);
  }, [sessionName]);

  const filteredList = list.filter(s => 
    s.session_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 40 }}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, background: 'linear-gradient(to right, #fff, #bd93f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Controle de Sessões
          </h1>
          <p style={{ color: '#8be9fd', margin: '4px 0 0 0' }}>Gerencie suas conexões do WhatsApp em tempo real</p>
        </div>
        
        <button className="btn-primary" onClick={() => router.push('/login')} style={{ background: 'rgba(255,85,85,0.1)', color: '#ff5555', border: '1px solid rgba(255,85,85,0.2)' }}>
          <LogOut size={18} /> Sair do Painel
        </button>
      </motion.div>

      {/* Barra de Ações Rápidas */}
      <section className="glass-card" style={{ padding: 24, marginBottom: 32, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6272a4' }} />
          <input 
            placeholder="Nova sessão ou buscar..." 
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            style={{ width: '100%', paddingLeft: 40, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={createSession} disabled={!sessionName || sessionExists}>
            <PlusCircle size={18} /> Criar Nova
          </button>
          {sessionExists && (
            <button className="btn-primary" onClick={() => startSession(sessionName)} style={{ background: '#50fa7b22', color: '#50fa7b' }}>
              <Play size={18} /> Iniciar Selecionada
            </button>
          )}
        </div>
      </section>

      {/* Grid de Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
        <AnimatePresence>
          {filteredList.map((s) => (
            <motion.div
              key={s.session_name}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card"
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}
            >
              {/* Header do Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ padding: 10, background: 'rgba(189, 147, 249, 0.1)', borderRadius: 12, color: '#bd93f9' }}>
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{s.session_name}</h3>
                    <span className={`badge ${s.connected ? 'badge-online' : 'badge-offline'}`}>
                      <div className={s.connected ? 'dot-pulse' : ''} style={{ background: s.connected ? '#50fa7b' : '#ff5555' }} />
                      {s.connected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 6 }}>
                   <button 
                    onClick={() => setSessionName(s.session_name)}
                    className="btn-pill btn-pill--compact"
                    style={{ padding: 8, background: 'rgba(255,255,255,0.05)', minWidth: 0 }}
                    title="Ver Status"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button 
                    onClick={() => setToDelete(s.session_name)}
                    className="btn-pill btn-pill--compact"
                    style={{ padding: 8, background: 'rgba(255,85,85,0.1)', color: '#ff5555', minWidth: 0 }}
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#6272a4', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Cliente</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{s.customer?.name ?? '—'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#6272a4', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Plano</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{s.plan.toUpperCase()}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ fontSize: 11, color: '#6272a4', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Validade Licença</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <Calendar size={14} color="#bd93f9" />
                    {s.expires_at ? new Date(s.expires_at).toLocaleDateString() : 'Vitalícia'}
                  </div>
                </div>
              </div>

              {/* Ações do Card */}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                {!s.connected ? (
                  <>
                    <button className="btn-primary" onClick={() => startSession(s.session_name)} style={{ flex: 1, padding: '8px' }}>
                      <Play size={16} /> QR Code
                    </button>
                    <button className="btn-primary" onClick={() => { setSessionName(s.session_name); setCodeModalOpen(true); }} style={{ flex: 1, padding: '8px', background: 'rgba(139, 233, 253, 0.1)', color: '#8be9fd' }}>
                      <Code size={16} /> Código
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-primary" onClick={() => stopSession(s.session_name)} style={{ flex: 1, padding: '8px', background: 'rgba(255, 184, 108, 0.1)', color: '#ffb86c' }}>
                      <Square size={16} /> Parar
                    </button>
                    <button className="btn-primary" onClick={() => logoutSession(s.session_name)} style={{ flex: 1, padding: '8px', background: 'rgba(255, 85, 85, 0.1)', color: '#ff5555' }}>
                      <LogOut size={16} /> Sair
                    </button>
                  </>
                )}
              </div>

              {/* Botões de Gestão Adicional */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => { setAssignTarget(s.session_name); setAssignCustomerId(s.customer?.id?.toString() ?? ''); }}
                  style={{ flex: 1, fontSize: 12, padding: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <UserPlus size={14} /> Cliente
                </button>
                {s.session_name !== OWNER_SESSION && (
                  <button 
                    onClick={() => { setExtendTarget(s.session_name); setExtendDays('30'); }}
                    style={{ flex: 1, fontSize: 12, padding: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <Clock size={14} /> + Dias
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Área de QR Code (Aparece se houver QR gerado) */}
      <AnimatePresence>
        {(pairingCode || (qr && status?.status !== 'open')) && sessionName && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-card"
            style={{ marginTop: 40, padding: 32, textAlign: 'center', border: '2px solid #bd93f9' }}
          >
            <h2 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <RefreshCw className={startingCode ? 'dot-pulse' : ''} /> Conectando: {sessionName}
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
              {qr && (
                <div style={{ padding: 20, background: 'white', borderRadius: 20, boxShadow: '0 0 30px rgba(189, 147, 249, 0.3)' }}>
                  <QrImage text={qr} size={256} />
                </div>
              )}
              
              {pairingCode && (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                  <p style={{ fontSize: 14, color: '#6272a4' }}>Use este código no WhatsApp:</p>
                  <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 8, color: '#bd93f9', background: 'rgba(0,0,0,0.3)', padding: '20px 40px', borderRadius: 16, border: '2px dashed #bd93f9' }}>
                    {pairingCode}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              className="btn-primary" 
              onClick={() => { setQr(undefined); setPairingCode(undefined); }}
              style={{ marginTop: 24, background: '#3a3c4f' }}
            >
              Fechar Visualização
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modais de Confirmação */}
      <ConfirmModal
        open={!!toDelete}
        title="Excluir Sessão?"
        description={`Esta ação apagará permanentemente a sessão "${toDelete}" e todos os seus dados vinculados. Deseja continuar?`}
        confirmText={deleting ? 'Excluindo...' : 'Sim, Excluir'}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            setDeleting(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getBackendBaseURL()}/api/sessions/${encodeURIComponent(toDelete)}`, {
              method: 'DELETE',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Falha ao excluir');
            toast.success('Sessão excluída');
            await loadSessions();
            setToDelete(null);
          } catch (err) {
            toast.error('Erro ao excluir sessão');
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmModal
        open={!!extendTarget}
        title="Estender Licença"
        confirmText={extending ? 'Aplicando...' : 'Confirmar'}
        onConfirm={async () => {
          if (!extendTarget) return;
          setExtending(true);
          try {
            await postJSON(`/api/sessions/${encodeURIComponent(extendTarget)}/extend`, { days: Number(extendDays) }, true);
            toast.success('Dias adicionados com sucesso!');
            await loadSessions();
            setExtendTarget(null);
          } catch (e) {
            toast.error('Erro ao estender licença');
          } finally {
            setExtending(false);
          }
        }}
        onCancel={() => setExtendTarget(null)}
      >
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <p style={{ margin: 0 }}>Adicionar dias para: <strong>{extendTarget}</strong></p>
          <input 
            type="number" 
            value={extendDays} 
            onChange={(e) => setExtendDays(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }}
          />
        </div>
      </ConfirmModal>

      {/* Modal de Associação de Cliente */}
      {assignTarget && (
        <ConfirmModal
          open={!!assignTarget}
          title="Vincular Cliente"
          onConfirm={async () => {
            try {
              await postJSON(`/api/sessions/${encodeURIComponent(assignTarget)}/customer`, { customerId: assignCustomerId || null }, true);
              toast.success('Cliente vinculado!');
              setAssignTarget(null);
              await loadSessions();
            } catch (err) {
              toast.error('Erro ao vincular cliente');
            }
          }}
          onCancel={() => setAssignTarget(null)}
        >
          <select
            value={assignCustomerId}
            onChange={(e) => setAssignCustomerId(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 8, background: '#282a36', color: 'white', border: '1px solid #44475a', marginTop: 12 }}
          >
            <option value="">Nenhum Cliente</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </ConfirmModal>
      )}

      {/* Modal de Código de Pareamento */}
      <ConfirmModal
        open={codeModalOpen}
        title="Gerar Código de Pareamento"
        confirmText={startingCode ? 'Gerando...' : 'Gerar Código'}
        onConfirm={async () => {
          const digits = codePhone.replace(/\D/g, '');
          if (!digits) return toast.error('Informe o telefone');
          setStartingCode(true);
          try {
            await postJSON(`/api/sessions/${encodeURIComponent(sessionName)}/start`, { loginMethod: 'code', phoneNumber: digits }, true);
            toast.success('Código gerado!');
            setCodeModalOpen(false);
            setCodePhone('');
          } catch (e) {
            toast.error('Erro ao gerar código');
          } finally {
            setStartingCode(false);
          }
        }}
        onCancel={() => setCodeModalOpen(false)}
      >
        <input 
          placeholder="Telefone (ex: 11987654321)"
          value={codePhone}
          onChange={(e) => setCodePhone(e.target.value)}
          style={{ width: '100%', marginTop: 12, background: 'rgba(0,0,0,0.2)' }}
        />
      </ConfirmModal>
    </div>
  );
}
