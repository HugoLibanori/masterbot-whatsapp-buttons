'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Settings2, 
  Calendar, 
  Users, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Save, 
  Star,
  Crown,
  Medal,
  Clock,
  LayoutGrid,
  Search
} from 'lucide-react';
import { getJSON, postJSON } from '@/lib/backend';
import { useToast } from '@/components/ToastProvider';
import type { SessionItem, XPLeaderboardEntry, XPPeriod } from '@/types/dashboard';
import type { XPConfig } from '@/types/xp';
import ConfirmModal from '@/components/ConfirmModal';

export const dynamic = 'force-dynamic';

const periodOptions: { value: XPPeriod; label: string; icon: any }[] = [
  { value: 'semanal', label: 'Semanal', icon: Calendar },
  { value: 'mensal', label: 'Mensal', icon: Clock },
  { value: 'geral', label: 'Geral', icon: LayoutGrid },
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
  const [xpResetTarget, setXpResetTarget] = useState<string | null>(null);
  const [resettingXp, setResettingXp] = useState(false);
  const [xpConfig, setXpConfig] = useState<XPConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', minTotal: 0, maintainLast30: 0 });

  const loadSessions = useCallback(async () => {
    try {
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
      if (String(err?.message).startsWith('Erro 401')) {
        router.push('/login');
        return;
      }
      setError('Falha ao listar sessões');
    }
  }, [router, selected]);

  const fetchLeaderboard = useCallback(
    async (targetSession: string | null, targetPeriod: XPPeriod) => {
      if (!targetSession) {
        setLeaderboard([]);
        return;
      }
      setLoading(true);
      setError(null);
      const parsedLimit = parseInt(limit) || 10;
      try {
        const timestamp = Date.now();
        const qs = new URLSearchParams({
          period: targetPeriod,
          limit: parsedLimit.toString(),
          t: timestamp.toString(),
        });
        const res = await getJSON<{
          ok: boolean;
          leaderboard: XPLeaderboardEntry[];
          next_reset?: string;
        }>(
          `/api/sessions/${encodeURIComponent(targetSession)}/xp/leaderboard?${qs.toString()}`,
          true,
        );
        setLeaderboard(res.leaderboard || []);
        setNextReset(res.next_reset || null);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar ranking');
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  const loadXpConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const timestamp = Date.now();
      const res = await getJSON<{ ok: boolean; config: XPConfig }>(
        `/api/xp/config?t=${timestamp}`,
        true,
      );
      setXpConfig(res.config);
    } catch (err: any) {
      setConfigError('Erro ao carregar configurações');
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadXpConfig();
  }, [loadSessions, loadXpConfig]);

  useEffect(() => {
    if (selected) {
      fetchLeaderboard(selected, period);
    }
  }, [selected, period, fetchLeaderboard]);

  const handleInsertTier = useCallback(async () => {
    if (!form.name || !xpConfig) return;
    const updatedConfig = {
      ...xpConfig,
      tiers: [...xpConfig.tiers, { ...form }],
    };
    setConfigSaving(true);
    try {
      const res = await postJSON<{ ok: boolean; config: XPConfig }>('/api/xp/config', updatedConfig, true);
      setXpConfig(res.config);
      toast.success(`Tipo "${form.name}" adicionado!`);
      setForm({ name: '', minTotal: 0, maintainLast30: 0 });
    } catch (err) {
      toast.error('Erro ao adicionar tipo');
    } finally {
      setConfigSaving(false);
    }
  }, [form, xpConfig, toast]);

  const handleDeleteTiers = useCallback(async (indexToDelete: number) => {
    const tierName = xpConfig?.tiers[indexToDelete]?.name;
    try {
      await postJSON('/api/xp/config', { nameTier: tierName }, true, 'DELETE');
      toast.info(`Tipo "${tierName}" removido.`);
      loadXpConfig();
    } catch (err) {
      toast.error('Erro ao excluir o tipo.');
    }
  }, [xpConfig?.tiers, toast, loadXpConfig]);

  const updateTierValue = (index: number, field: string, value: number) => {
    if (!xpConfig) return;
    const newTiers = [...xpConfig.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setXpConfig({ ...xpConfig, tiers: newTiers });
  };

  const getRankBadge = (position: number) => {
    if (position === 1) return <Crown color="#ffd700" size={20} />;
    if (position === 2) return <Medal color="#c0c0c0" size={20} />;
    if (position === 3) return <Medal color="#cd7f32" size={20} />;
    return <span style={{ color: '#6272a4', fontWeight: 700 }}>#{position}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, background: 'linear-gradient(to right, #fff, #ff79c6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Trophy size={32} /> Ranking & Gamificação
          </h1>
          <p style={{ color: '#6272a4', margin: '4px 0 0 0' }}>Monitore o engajamento e gerencie níveis de acesso</p>
        </div>

        <div style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={period === opt.value ? 'btn-pill' : 'btn-pill btn-pill--ghost'}
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              <opt.icon size={14} /> {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
        {/* Main Content: Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#6272a4', fontWeight: 700 }}>Sessão Ativa</span>
                  <select 
                    value={selected} 
                    onChange={(e) => setSelected(e.target.value)}
                    className="glass-input"
                    style={{ minWidth: 200, padding: '8px 12px' }}
                  >
                    <option value="">Selecione...</option>
                    {sessions.map(s => <option key={s.session_name} value={s.session_name}>{s.session_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#6272a4', fontWeight: 700 }}>Top Limite</span>
                  <input 
                    type="number" 
                    value={limit} 
                    onChange={(e) => setLimit(e.target.value)}
                    className="glass-input"
                    style={{ width: 80, padding: '8px 12px' }}
                  />
                </div>
              </div>
              <button 
                className="btn-pill" 
                onClick={() => fetchLeaderboard(selected, period)}
                disabled={!selected || loading}
              >
                {loading ? <RotateCcw className="dot-pulse" size={18} /> : <Search size={18} />}
                Atualizar
              </button>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Zap className="dot-pulse" size={48} color="#ff79c6" />
                  <p style={{ color: '#6272a4', marginTop: 16 }}>Calculando métricas de XP...</p>
                </motion.div>
              ) : leaderboard.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {leaderboard.map((entry, idx) => (
                    <motion.div
                      key={entry.user_id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '60px 1fr 120px', 
                        alignItems: 'center',
                        padding: '12px 20px',
                        background: idx < 3 ? 'rgba(255,255,255,0.05)' : 'transparent',
                        borderRadius: 12,
                        border: idx < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {getRankBadge(entry.position)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: idx < 3 ? '#fff' : '#f8f8f2' }}>
                          {entry.name || entry.user_id.split('@')[0]}
                        </span>
                        <span style={{ fontSize: 12, color: '#6272a4' }}>@{entry.user_id.split('@')[0]}</span>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 800, color: '#ff79c6', fontSize: 18 }}>
                        {entry.total.toLocaleString()} <span style={{ fontSize: 10, opacity: 0.5 }}>XP</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: 20 }}>
                  <Users size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                  <p style={{ color: '#6272a4' }}>Nenhum dado encontrado para esta sessão.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Reset Card */}
          <div className="glass-card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(255,85,85,0.1) 0%, transparent 100%)', border: '1px solid rgba(255,85,85,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,85,85,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5555' }}>
                  <RotateCcw size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#fff' }}>Reset do Ciclo</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#ffb86c' }}>
                    Próximo reset automático: <span style={{ fontWeight: 700 }}>{nextReset ? new Date(nextReset).toLocaleDateString() : '—'}</span>
                  </p>
                </div>
              </div>
              <button className="btn-pill btn-pill--danger" onClick={() => setXpResetTarget(selected)} disabled={!selected}>
                Resetar Agora
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar: Config Tiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="#50fa7b" /> Níveis (Tiers)
              </h3>
              <button 
                className="btn-pill btn-pill--compact" 
                onClick={() => postJSON('/api/xp/config', xpConfig, true).then(() => toast.success('Salvo!'))}
                disabled={!xpConfig || configSaving}
              >
                <Save size={16} /> Salvar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {xpConfig?.tiers.map((tier, idx) => (
                <motion.div 
                  key={idx}
                  className="glass-card" 
                  style={{ padding: 16, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: 12, letterSpacing: 1, color: '#bd93f9' }}>{tier.name}</span>
                    <button onClick={() => handleDeleteTiers(idx)} style={{ background: 'transparent', border: 'none', color: '#ff5555', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#6272a4' }}>XP TOTAL MÍNIMO</span>
                      <input 
                        type="number" 
                        value={tier.minTotal} 
                        onChange={(e) => updateTierValue(idx, 'minTotal', parseInt(e.target.value) || 0)}
                        className="glass-input" 
                        style={{ fontSize: 13, padding: '6px 10px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#6272a4' }}>MANTER (30 DIAS)</span>
                      <input 
                        type="number" 
                        value={tier.maintainLast30} 
                        onChange={(e) => updateTierValue(idx, 'maintainLast30', parseInt(e.target.value) || 0)}
                        className="glass-input" 
                        style={{ fontSize: 13, padding: '6px 10px' }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}

              <div style={{ marginTop: 8, padding: 16, border: '1px dashed rgba(189, 147, 249, 0.3)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#bd93f9' }}>+ NOVO NÍVEL</span>
                <input 
                  placeholder="Nome do Nível" 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="glass-input" 
                  style={{ fontSize: 12 }}
                />
                <button onClick={handleInsertTier} className="btn-pill btn-pill--ghost" style={{ width: '100%', justifyContent: 'center' }}>
                  <Plus size={14} /> Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Tips/Info */}
          <div className="glass-card" style={{ padding: 20, borderLeft: '4px solid #50fa7b' }}>
            <h5 style={{ margin: 0, color: '#50fa7b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={14} /> Dica do Master
            </h5>
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#6272a4', lineHeight: 1.5 }}>
              O XP é acumulado conforme a interação dos usuários nos grupos. Níveis mais altos podem ser usados para liberar comandos VIP exclusivos.
            </p>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!xpResetTarget}
        title="Resetar XP da sessão?"
        description={`Isso irá remover todo o XP acumulado da sessão "${xpResetTarget}". Esta ação não pode ser desfeita.`}
        confirmText={resettingXp ? 'Resetando...' : 'Zerar XP agora'}
        onConfirm={async () => {
          if (!xpResetTarget) return;
          try {
            setResettingXp(true);
            await postJSON(`/api/sessions/${encodeURIComponent(xpResetTarget)}/xp/reset`, {}, true);
            toast.success('XP zerado com sucesso.');
            fetchLeaderboard(xpResetTarget, period);
            setXpResetTarget(null);
          } catch (err) {
            toast.error('Erro ao resetar XP');
          } finally {
            setResettingXp(false);
          }
        }}
        onCancel={() => setXpResetTarget(null)}
      />
    </div>
  );
}
