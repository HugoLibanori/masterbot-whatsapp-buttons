'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getJSON, postJSON } from '@/lib/backend';
import { useToast } from '@/components/ToastProvider';
import type { SessionItem, XPLeaderboardEntry, XPPeriod } from '@/types/dashboard';
import type { XPConfig } from '@/types/xp';
import ConfirmModal from '@/components/ConfirmModal';

// Força o Next.js a não criar cache estático dessa página no servidor
export const dynamic = 'force-dynamic';

const periodOptions: { value: XPPeriod; label: string }[] = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'geral', label: 'Geral' },
];

export default function XPDashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selected, setSelected] = useState('');
  const [period, setPeriod] = useState<XPPeriod>('mensal');
  const [limit, setLimit] = useState('10');
  const [leaderboard, setLeaderboard] = useState<XPLeaderboardEntry[]>([]);
  const [nextReset, setNextReset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [xpResetTarget, setXpResetTarget] = useState<string | null>(null);
  const [resettingXp, setResettingXp] = useState(false);
  const [xpConfig, setXpConfig] = useState<XPConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', minTotal: 0, maintainLast30: 0 });

  const loadSessions = useCallback(async () => {
    try {
      // 🚀 TRUQUE ANTI-CACHE: Adiciona ?t=agora na URL
      const timestamp = Date.now();
      const res = await getJSON<{ ok: boolean; items: SessionItem[] }>(
        `/api/sessions?t=${timestamp}`,
        true,
      );
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
  }, [router, selected]);

  const parseLimit = useCallback((): number => {
    const parsed = Number.parseInt(limit, 10);
    if (!Number.isFinite(parsed)) return 15;
    return Math.min(100, Math.max(1, parsed));
  }, [limit]);

  const fetchLeaderboard = useCallback(
    async (targetSession: string | null, targetPeriod: XPPeriod) => {
      if (!targetSession) {
        setLeaderboard([]);
        return;
      }
      setLoading(true);
      setError(null);
      const safeLimit = parseLimit();
      try {
        const timestamp = Date.now();
        const qs = new URLSearchParams({
          period: targetPeriod,
          limit: safeLimit.toString(),
          t: timestamp.toString(), // 🚀 ANTI-CACHE
        });
        const res = await getJSON<{
          ok: boolean;
          leaderboard: XPLeaderboardEntry[];
          next_reset?: string;
        }>(
          `/api/sessions/${encodeURIComponent(targetSession as string)}/xp/leaderboard?${qs.toString()}`,
          true,
        );
        setLeaderboard(res.leaderboard || []);
        setNextReset(res.next_reset || null);
      } catch (err: any) {
        const msg = err?.message || 'Erro ao carregar ranking';
        setError(msg);
        if (String(msg).startsWith('Erro 401')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    },
    [parseLimit, router],
  );

  const loadXpConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      // 🚀 O GRANDE SEGREDO: Força a API a não usar versão velha
      const timestamp = Date.now();
      const res = await getJSON<{ ok: boolean; config: XPConfig }>(
        `/api/xp/config?t=${timestamp}`,
        true,
      );
      setXpConfig(res.config);
    } catch (err: any) {
      const msg = err?.message || 'Erro ao carregar configuração de XP';
      setConfigError(msg);
      if (String(msg).startsWith('Erro 401')) {
        router.push('/login');
      }
    } finally {
      setConfigLoading(false);
    }
  }, [router]);

  function updateTierValue(index: number, field: 'minTotal' | 'maintainLast30', value: number) {
    setXpConfig((prev) => {
      if (!prev) return prev;
      const tiers = prev.tiers.map((tier, idx) =>
        idx === index ? { ...tier, [field]: Math.max(0, value) } : tier,
      );
      return { ...prev, tiers };
    });
  }

  const saveXpConfig = useCallback(async () => {
    if (!xpConfig) return;
    setConfigSaving(true);
    try {
      const res = await postJSON<{ ok: boolean; config: XPConfig }>(
        '/api/xp/config',
        xpConfig,
        true,
      );
      setXpConfig(res.config);
      toast.success('Regras de XP atualizadas.');
      // Recarrega imediatamente para confirmar
      loadXpConfig();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar regras.');
    } finally {
      setConfigSaving(false);
    }
  }, [xpConfig, toast, loadXpConfig]);

  async function handleReset() {
    if (!selected) {
      toast.error('Selecione uma sessão antes de resetar o XP.');
      return;
    }
    setXpResetTarget(selected);
  }

  const handleFormChange = useCallback((field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleInsertTier = useCallback(async () => {
    if (!form.name) {
      toast.error('Informe o nome do tipo antes de inserir.');
      return;
    }

    if (!xpConfig) {
      toast.error('A configuração de XP ainda não foi carregada.');
      return;
    }

    const newTier = {
      name: form.name,
      minTotal: Number(form.minTotal) || 0,
      maintainLast30: Number(form.maintainLast30) || 0,
    };

    const updatedConfig = {
      ...xpConfig,
      tiers: [...xpConfig.tiers, newTier],
    };

    setConfigSaving(true);
    try {
      const res = await postJSON<{ ok: boolean; config: XPConfig }>(
        '/api/xp/config',
        updatedConfig,
        true,
      );
      setXpConfig(res.config);
      toast.success(`Tipo "${form.name}" foi inserido e salvo.`);
      setForm({ name: '', minTotal: 0, maintainLast30: 0 });
      loadXpConfig(); // Recarrega para ter certeza
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar o novo tipo.');
    } finally {
      setConfigSaving(false);
    }
  }, [form, toast, xpConfig, loadXpConfig]);

  const handleDeleteTiers = useCallback(
    async (indexToDelete: number) => {
      const tierName = xpConfig?.tiers[indexToDelete]?.name;

      // Atualização otimista na tela
      setXpConfig((prev) => {
        if (!prev) return prev;
        const tiers = prev.tiers.filter((_, index) => index !== indexToDelete);
        return { ...prev, tiers };
      });

      if (tierName) {
        toast.success(`Tipo "${tierName}" excluído.`);
      }
      try {
        await postJSON('/api/xp/config', { nameTier: tierName }, true, 'DELETE');
        loadXpConfig(); // Confirmação final
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao excluir o tipo.');
        loadXpConfig(); // Se falhar, traz de volta
      }
    },
    [toast, xpConfig?.tiers, loadXpConfig],
  );

  useEffect(() => {
    loadSessions();
    loadXpConfig();
  }, [loadSessions, loadXpConfig]);

  useEffect(() => {
    if (selected) {
      fetchLeaderboard(selected, period);
    }
  }, [selected, period, fetchLeaderboard]);

  return (
    <div>
      <h1>Ranking de XP</h1>
      <p style={{ color: '#bfc0d4', marginTop: 4 }}>
        Consulte o desempenho mensal, semanal ou geral de cada sessão e, se necessário, force um
        reset manual.
      </p>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginTop: 24,
          alignItems: 'flex-end',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Sessão</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #2f3144', minWidth: 220 }}
          >
            <option value="">Selecione...</option>
            {sessions.map((session) => (
              <option key={session.session_name} value={session.session_name}>
                {session.session_name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Período</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: '1px solid #2f3144',
                  background: period === opt.value ? '#8be9fd' : 'transparent',
                  color: period === opt.value ? '#0f111a' : '#f8f8f2',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Limite</span>
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: '1px solid #2f3144',
              width: 120,
            }}
          />
        </label>

        <button
          className="btn-pill btn-pill--compact"
          onClick={() => fetchLeaderboard(selected, period)}
          disabled={!selected || loading}
        >
          {loading ? 'Atualizando...' : 'Atualizar ranking'}
        </button>
      </section>

      {error && <p style={{ color: 'crimson', marginTop: 16 }}>{error}</p>}
      {!selected && <p style={{ color: '#bfc0d4', marginTop: 16 }}>Selecione uma sessão.</p>}

      {selected && (
        <>
          <section
            style={{
              marginTop: 24,
              border: '1px solid #2f3144',
              borderRadius: 12,
              padding: 16,
              background: '#1b1c2d',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#bfc0d4' }}>
                  Reset automático previsto em{' '}
                  {nextReset ? new Date(nextReset).toLocaleString() : '—'}
                </p>
                <small style={{ color: '#8be9fd' }}>
                  O reset automático ocorre na virada do mês. Use o botão abaixo apenas em último
                  caso.
                </small>
              </div>
              <button
                className="btn-pill btn-pill--danger"
                onClick={handleReset}
                disabled={!selected || resetting}
              >
                {resetting ? 'Reiniciando...' : 'Resetar XP agora'}
              </button>
            </div>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ marginBottom: 12 }}>
              TOP XP — {periodOptions.find((opt) => opt.value === period)?.label}
            </h2>
            {leaderboard.length ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>
                      Posição
                    </th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>
                      Usuário
                    </th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>XP</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => {
                    const mention = entry.user_id?.replace('@s.whatsapp.net', '');
                    return (
                      <tr key={entry.user_id}>
                        <td style={{ padding: '8px 0' }}>#{entry.position}</td>
                        <td style={{ padding: '8px 0' }}>
                          <div style={{ fontWeight: 600 }}>
                            {entry.name || mention || entry.user_id}
                          </div>
                          <small style={{ color: '#8be9fd' }}>{mention}</small>
                        </td>
                        <td style={{ padding: '8px 0' }}>{entry.total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              !loading && (
                <p style={{ color: '#bfc0d4' }}>
                  Nenhum evento de XP encontrado para este período.
                </p>
              )
            )}
          </section>
        </>
      )}

      <section
        style={{
          marginTop: 32,
          border: '1px solid #2f3144',
          borderRadius: 12,
          padding: 16,
          background: '#101123',
          display: 'grid',
          gap: 16,
        }}
      >
        <div
          style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Configurar TIPOS</h2>
            <p style={{ color: '#bfc0d4', marginTop: 4 }}>
              Ajuste os requisitos mínimos para cada nível. As alterações valem para todo o sistema.
            </p>
          </div>
          <button
            className="btn-pill"
            onClick={() => saveXpConfig()}
            disabled={!xpConfig || configSaving}
          >
            {configSaving ? 'Salvando...' : 'Salvar regras'}
          </button>
        </div>
        {configError && <p style={{ color: '#ff6b6b' }}>{configError}</p>}
        {configLoading && <p style={{ color: '#bfc0d4' }}>Carregando configuração...</p>}
        {xpConfig && (
          <div style={{ display: 'grid', gap: 12 }}>
            {xpConfig.tiers.map((tier, index) => (
              <div
                key={`${tier.name}-${index}`}
                style={{
                  border: '1px solid #2f3144',
                  borderRadius: 12,
                  padding: 12,
                  background: '#0f0f1a',
                  display: 'grid',
                  gap: 8,
                }}
              >
                <strong style={{ textTransform: 'uppercase', fontSize: 15 }}>{tier.name}</strong>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <label style={{ flex: 1, minWidth: 180 }}>
                    <span style={{ color: '#bfc0d4', fontSize: 13 }}>XP total mínimo</span>
                    <input
                      type="number"
                      min={0}
                      value={tier.minTotal}
                      onChange={(e) =>
                        updateTierValue(index, 'minTotal', Number(e.target.value) || 0)
                      }
                      style={{
                        width: '100%',
                        padding: 10,
                        borderRadius: 8,
                        border: '1px solid #2f3144',
                        marginTop: 4,
                      }}
                    />
                  </label>
                  <label style={{ flex: 1, minWidth: 180 }}>
                    <span style={{ color: '#bfc0d4', fontSize: 13 }}>XP nos últimos 30 dias</span>
                    <input
                      type="number"
                      min={0}
                      value={tier.maintainLast30}
                      onChange={(e) =>
                        updateTierValue(index, 'maintainLast30', Number(e.target.value) || 0)
                      }
                      style={{
                        width: '100%',
                        padding: 10,
                        borderRadius: 8,
                        border: '1px solid #2f3144',
                        marginTop: 4,
                      }}
                    />
                  </label>
                  <button
                    onClick={() => handleDeleteTiers(index)}
                    style={{
                      fontSize: '13px',
                      marginTop: '20px',
                      background: '#7c1212ff',
                      borderColor: '#3e0909ff',
                      boxShadow: '0 6px 18px rgba(129, 50, 37, 0.46)',
                      borderRadius: '50px',
                      cursor: 'pointer',
                      padding: '8px 16px',
                      color: 'white',
                      border: '1px solid transparent',
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <input
              placeholder="Nome do novo tipo"
              value={form.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              style={{
                padding: 10,
                borderRadius: 8,
                border: '1px solid #2f3144',
                flex: 1,
              }}
            />

            <input
              type="number"
              min={0}
              placeholder="XP Mínimo"
              value={form.minTotal}
              onChange={(e) => handleFormChange('minTotal', e.target.value)}
              style={{
                padding: 10,
                borderRadius: 8,
                border: '1px solid #2f3144',
                width: 140,
              }}
            />

            <input
              type="number"
              min={0}
              placeholder="XP 30d"
              value={form.maintainLast30}
              onChange={(e) => handleFormChange('maintainLast30', e.target.value)}
              style={{
                padding: 10,
                borderRadius: 8,
                border: '1px solid #2f3144',
                width: 140,
              }}
            />
            <button className="btn-pill" onClick={handleInsertTier}>
              Inserir TIPO
            </button>
          </div>
        </div>
      </section>

      <ConfirmModal
        open={!!xpResetTarget}
        title="Resetar XP da sessão?"
        description={`Isso irá remover todo o XP acumulado da sessão "${xpResetTarget}". Esta ação não pode ser desfeita.`}
        confirmText={resettingXp ? 'Resetando...' : 'Resetar XP'}
        onConfirm={async () => {
          if (!xpResetTarget) return;
          try {
            setResettingXp(true);
            await postJSON(`/api/sessions/${encodeURIComponent(xpResetTarget)}/xp/reset`, {}, true);
            toast.success('XP reiniciado para esta sessão.');
            await fetchLeaderboard(xpResetTarget, period);
            setXpResetTarget(null);
          } catch (err: any) {
            toast.error(err?.message || 'Erro ao resetar XP');
          } finally {
            setResettingXp(false);
          }
        }}
        onCancel={() => setXpResetTarget(null)}
      />
    </div>
  );
}
