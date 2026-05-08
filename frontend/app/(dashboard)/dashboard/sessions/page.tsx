'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      setError(undefined);
      toast.success('Sessão criada com sucesso');
      await loadSessions();
      await refreshStatus();
    } catch (e: any) {
      const msg = e?.message || 'Erro ao criar sessão';
      setError(msg);
      toast.error(msg);
    }
  }

  async function startSession() {
    try {
      await postJSON(`/api/sessions/${encodeURIComponent(sessionName)}/start`, {}, true);
      setError(undefined);
      toast.success('Sessão iniciada (aguarde o QR)');
      await refreshStatus();
      await loadSessions();
    } catch (e: any) {
      const msg = e?.message || 'Erro ao iniciar sessão';
      setError(msg);
      toast.error(msg);
    }
  }

  async function startSessionWithCode() {
    if (!sessionName) {
      toast.error('Informe o nome da sessão.');
      return;
    }
    const digits = codePhone.replace(/\D/g, '');
    if (!digits) {
      toast.error('Informe o telefone com DDD para gerar o código.');
      return;
    }
    setStartingCode(true);
    try {
      await postJSON(
        `/api/sessions/${encodeURIComponent(sessionName)}/start`,
        { loginMethod: 'code', phoneNumber: digits },
        true,
      );
      setError(undefined);
      toast.success('Código gerado. Digite-o no WhatsApp para parear.');
      setCodeModalOpen(false);
      setCodePhone('');
      await refreshStatus();
      await loadSessions();
    } catch (e: any) {
      const msg = e?.message || 'Erro ao gerar código';
      setError(msg);
      toast.error(msg);
    } finally {
      setStartingCode(false);
    }
  }

  async function stopSession() {
    try {
      await postJSON(`/api/sessions/${encodeURIComponent(sessionName)}/stop`, {}, true);
      setError(undefined);
      toast.info('Sessão parada');
      await refreshStatus();
      await loadSessions();
    } catch (e: any) {
      const msg = e?.message || 'Erro ao parar sessão';
      setError(msg);
      toast.error(msg);
    }
  }

  async function logoutSession() {
    try {
      await postJSON(`/api/sessions/${encodeURIComponent(sessionName)}/logout`, {}, true);
      setError(undefined);
      toast.info('Credenciais apagadas; faça o pareamento novamente');
      await refreshStatus();
      await loadSessions();
    } catch (e: any) {
      const msg = e?.message || 'Erro ao deslogar sessão';
      setError(msg);
      toast.error(msg);
    }
  }

  async function extendLicense() {
    if (!extendTarget) return;
    if (extendTarget === OWNER_SESSION) {
      toast.info('A sessão principal não possui validade.');
      setExtendTarget(null);
      return;
    }
    const daysNumber = Number(extendDays);
    if (!Number.isFinite(daysNumber) || daysNumber <= 0) {
      toast.error('Informe uma quantidade válida de dias.');
      return;
    }
    setExtending(true);
    try {
      await postJSON(
        `/api/sessions/${encodeURIComponent(extendTarget)}/extend`,
        { days: daysNumber },
        true,
      );
      toast.success(`Foram adicionados ${daysNumber} dias à sessão.`);
      await loadSessions();
      if (sessionName === extendTarget) {
        await refreshStatus();
      }
      setExtendTarget(null);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao adicionar dias');
    } finally {
      setExtending(false);
    }
  }

  async function assignCustomer() {
    if (!assignTarget) return;
    try {
      await postJSON(
        `/api/sessions/${encodeURIComponent(assignTarget)}/customer`,
        { customerId: assignCustomerId || null },
        true,
      );
      toast.success('Cliente associado à sessão.');
      setAssignTarget(null);
      setAssignCustomerId('');
      await loadSessions();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao associar cliente');
    }
  }

  async function refreshStatus() {
    if (!sessionName) return;
    try {
      const res = await getJSON<{ ok: boolean; info?: any }>(
        `/api/sessions/${encodeURIComponent(sessionName)}/status`,
        true,
      );
      setStatus(res.info);
      const qrRes = await getJSON<{
        ok: boolean;
        qr?: string | null;
        pairing_code?: string | null;
      }>(`/api/sessions/${encodeURIComponent(sessionName)}/qr`, true);
      setQr(qrRes.qr || undefined);
      setPairingCode(qrRes.pairing_code || undefined);
    } catch (e: any) {
      const msg = e?.message || '';
      if (String(msg).startsWith('Erro 404')) {
        setStatus(null);
        setQr(undefined);
        setPairingCode(undefined);
        return;
      }
      setError(msg || 'Erro ao buscar status');
      toast.error(msg || 'Erro ao buscar status');
    }
  }

  function authHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    if (sessionName && sessionExists) {
      refreshStatus();
    }
  }, [sessionName, list]);

  useEffect(() => {
    setQr(undefined);
    setPairingCode(undefined);
  }, [sessionName]);

  useEffect(() => {
    loadSessions();
    loadCustomers();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      loadSessions();
      if (sessionName && sessionExists) {
        refreshStatus();
      }
    }, 2000);

    return () => clearInterval(id);
  }, [sessionName, list]);

  return (
    <div>
      <h1>Gerenciar sessões</h1>
      <div style={{ display: 'grid', gap: 12, maxWidth: 840 }}>
        <input
          placeholder="Nome da sessão"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={createSession} disabled={!sessionName}>
            Criar sessão
          </button>
          <button onClick={startSession} disabled={!sessionName}>
            Iniciar (QR)
          </button>
          <button
            onClick={() => {
              if (!sessionName) return;
              setCodeModalOpen(true);
            }}
            disabled={!sessionName || startingCode}
          >
            Iniciar (código)
          </button>
          <button onClick={stopSession} disabled={!sessionName}>
            Parar
          </button>
          <button onClick={logoutSession} disabled={!sessionName}>
            Logout (apagar credenciais)
          </button>
          <button onClick={refreshStatus} disabled={!sessionName}>
            Atualizar status
          </button>
          <span style={{ flex: 1 }} />
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/login');
            }}
          >
            Sair
          </button>
        </div>
        {error && (
          <div
            style={{
              background: '#2f3144',
              border: '1px solid #ef4444',
              color: '#fed7d7',
              padding: '12px 16px',
              borderRadius: 8,
            }}
          >
            Ocorreu um erro ao processar a requisição. Verifique os logs do bot para mais detalhes.
          </div>
        )}

        <section>
          <h2>Suas sessões</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Sessão</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Plano</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Licença</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Cliente</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Runtime</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Conectado</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Ações</th>
              </tr>
            </thead>
            <tbody style={{ marginTop: '8px' }}>
              {list.map((s) => (
                <tr key={s.session_name}>
                  <td>{s.session_name}</td>
                  <td>{s.plan}</td>
                  <td>
                    {s.expires_at
                      ? `${s.status} até ${new Date(s.expires_at).toLocaleDateString()}`
                      : 'Sem validade'}
                  </td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{s.customer?.name ?? 'Sem cliente'}</span>
                      {s.customer?.company && (
                        <small style={{ color: '#8be9fd' }}>{s.customer.company}</small>
                      )}
                    </div>
                  </td>
                  <td>{s.runtime?.status || '—'}</td>
                  <td>{s.connected ? 'Sim' : 'Não'}</td>
                  <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      aria-label="Associar cliente"
                      title="Associar cliente"
                      onClick={() => {
                        setAssignTarget(s.session_name);
                        setAssignCustomerId(s.customer?.id?.toString() ?? '');
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid #e5e7eb',
                        padding: 6,
                        borderRadius: 8,
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0" />
                        <path d="M12 14c-4.33 0-8 2.17-8 5v1h10.26" />
                        <path d="m18 19 2 2 4-4" />
                      </svg>
                    </button>
                    <button
                      aria-label="Gerenciar"
                      title="Gerenciar"
                      onClick={() => setSessionName(s.session_name)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #e5e7eb',
                        padding: 6,
                        borderRadius: 8,
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 3.6a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09c0 .66.38 1.26 1 1.51a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.42.42-.54 1.04-.33 1.58.21.55.73.94 1.33.98H22a2 2 0 1 1 0 4h-.09c-.66 0-1.26.38-1.51 1Z" />
                      </svg>
                    </button>
                    <button
                      aria-label="Apagar"
                      title="Apagar"
                      onClick={() => setToDelete(s.session_name)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #e5e7eb',
                        padding: 6,
                        borderRadius: 8,
                        color: '#991b1b',
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                    {s.session_name !== OWNER_SESSION && (
                      <button
                        onClick={() => {
                          setExtendTarget(s.session_name);
                          setExtendDays('30');
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #e5e7eb',
                          padding: 6,
                          borderRadius: 8,
                          color: '#00ff33ff',
                        }}
                      >
                        + Dias
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {extendTarget && (
          <section
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 16,
              maxWidth: 420,
              display: 'grid',
              gap: 8,
            }}
          >
            <h3>Adicionar dias à sessão</h3>
            <p style={{ margin: 0 }}>
              Sessão: <strong>{extendTarget}</strong>
            </p>
            <input
              type="number"
              min={1}
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              placeholder="Quantidade de dias"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={extendLicense} disabled={extending}>
                {extending ? 'Aplicando...' : 'Adicionar dias'}
              </button>
              <button onClick={() => setExtendTarget(null)}>Cancelar</button>
            </div>
          </section>
        )}

        {assignTarget && (
          <section
            style={{
              border: '1px solid #2f3144',
              borderRadius: 12,
              padding: 16,
              display: 'grid',
              gap: 8,
              background: '#1b1c2d',
            }}
          >
            <h3>Associar cliente à sessão {assignTarget}</h3>
            <select
              value={assignCustomerId}
              onChange={(e) => setAssignCustomerId(e.target.value)}
              style={{ padding: 8, borderRadius: 6, border: '1px solid #2f3144' }}
            >
              <option value="">Nenhum</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={assignCustomer}>Salvar</button>
              <button
                onClick={() => {
                  setAssignTarget(null);
                  setAssignCustomerId('');
                }}
                style={{ background: '#3a3c4f' }}
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        <section>
          <h2>Status selecionado</h2>
          {sessionName && (
            <div
              style={{
                marginTop: 12,
                border: '1px solid #2f3144',
                borderRadius: 12,
                padding: 16,
                background: '#1b1c2d',
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ minWidth: 160 }}>
                  <p style={{ margin: 0, color: '#bfc0d4', fontSize: 14 }}>Sessão</p>
                  <strong style={{ fontSize: 18 }}>{sessionName}</strong>
                </div>
                <div style={{ minWidth: 160 }}>
                  <p style={{ margin: 0, color: '#bfc0d4', fontSize: 14 }}>Status</p>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: status?.status === 'open' ? '#4ade8024' : '#f8717124',
                      border: `1px solid ${status?.status === 'open' ? '#4ade80' : '#f87171'}`,
                      color: status?.status === 'open' ? '#4ade80' : '#f87171',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: status?.status === 'open' ? '#4ade80' : '#f87171',
                      }}
                    />
                    {status?.status ?? '—'}
                  </span>
                </div>
                <div style={{ minWidth: 200 }}>
                  <p style={{ margin: 0, color: '#bfc0d4', fontSize: 14 }}>Atualizado em</p>
                  <strong style={{ fontSize: 16 }}>
                    {status?.updatedAt ? new Date(status.updatedAt).toLocaleString() : '—'}
                  </strong>
                </div>
              </div>
              {status && (
                <details>
                  <summary style={{ cursor: 'pointer', color: '#8be9fd', fontWeight: 600 }}>
                    Ver JSON completo
                  </summary>
                  <pre
                    style={{ marginTop: 12, background: '#12121c', padding: 16, borderRadius: 8 }}
                  >
                    {JSON.stringify(status, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
          {(pairingCode || (qr && status?.status !== 'open')) && (
            <div style={{ display: 'grid', gap: 16 }}>
              {pairingCode && status?.status !== 'open' && (
                <div
                  style={{
                    border: '1px solid #2f3144',
                    borderRadius: 12,
                    padding: 16,
                    background: '#131328',
                  }}
                >
                  <p style={{ marginTop: 0, color: '#cbd5f5' }}>Conectar usando código:</p>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      letterSpacing: 4,
                      textAlign: 'center',
                      background: '#05050f',
                      borderRadius: 10,
                      padding: '12px 16px',
                      border: '1px dashed #8be9fd',
                    }}
                  >
                    {pairingCode}
                  </div>
                  <p style={{ marginBottom: 0, marginTop: 12, fontSize: 13, color: '#8be9fd' }}>
                    Abra o WhatsApp &gt; ⋮ &gt; Aparelhos conectados &gt; Conectar usando código.
                    Informe o telefone solicitado e insira o código acima.
                  </p>
                </div>
              )}
              {qr && status?.status !== 'open' && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <p>Escaneie o QR no WhatsApp:</p>
                  <QrImage text={qr} size={256} />
                  <details>
                    <summary>Mostrar string do QR</summary>
                    <pre style={{ background: '#1b1c2d', padding: 12, overflow: 'auto' }}>{qr}</pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        open={!!toDelete}
        title="Apagar base de dados da sessão?"
        description={`Isso removerá o schema da sessão "${toDelete || ''}" e a licença associada. Esta ação não pode ser desfeita.`}
        confirmText={deleting ? 'Apagando...' : 'Apagar'}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            setDeleting(true);
            const url = `/api/sessions/${encodeURIComponent(toDelete)}`;
            const token = localStorage.getItem('token');
            const res = await fetch(`${getBackendBaseURL()}${url}`, {
              method: 'DELETE',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
            toast.success('Banco da sessão apagado com sucesso');
            await loadSessions();
            if (sessionName === toDelete) {
              setSessionName('');
              setStatus(null);
              setQr(undefined);
            }
            setToDelete(null);
          } catch (err: any) {
            toast.error(err?.message || 'Falha ao apagar sessão');
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setToDelete(null)}
      />
      <ConfirmModal
        open={codeModalOpen}
        title="Conectar usando código"
        description="Informe o telefone com DDD cadastrado na conta do WhatsApp que receberá o código."
        confirmText={startingCode ? 'Gerando...' : 'Gerar código'}
        onConfirm={startSessionWithCode}
        onCancel={() => {
          if (startingCode) return;
          setCodeModalOpen(false);
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            autoFocus
            placeholder="Ex.: 11987654321"
            value={codePhone}
            onChange={(e) => setCodePhone(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #2f3144' }}
          />
          <small style={{ color: '#94a3b8' }}>
            O código expira em poucos minutos após ser exibido no painel.
          </small>
        </div>
      </ConfirmModal>
    </div>
  );
}
