'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Building2, 
  StickyNote, 
  Trash2, 
  Edit3, 
  X,
  CheckCircle2,
  Search,
  Plus,
  RefreshCw
} from 'lucide-react';
import { getBackendBaseURL, getJSON, postJSON } from '@/lib/backend';
import { useToast } from '@/components/ToastProvider';
import type { Customer } from '@/types/dashboard';
import ConfirmModal from '@/components/ConfirmModal';

const emptyForm = { name: '', email: '', phone: '', company: '', notes: '' };

export default function CustomersPage() {
  const router = useRouter();
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  function authHeaders(): HeadersInit {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await getJSON<{ ok: boolean; customers: Customer[] }>('/api/customers', true);
      setCustomers(res.customers || []);
    } catch (err: any) {
      if (String(err?.message).startsWith('Erro 401')) {
        router.push('/login');
        return;
      }
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }

  async function saveCustomer(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Informe o nome do cliente.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email || undefined,
      phone: form.phone || undefined,
      company: form.company || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editing) {
        await postJSON(`/api/customers/${editing.id}`, payload, true, 'PUT');
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await postJSON('/api/customers', payload, true);
        toast.success('Novo cliente cadastrado!');
      }
      setForm(emptyForm);
      setEditing(null);
      await loadCustomers();
    } catch (err: any) {
      toast.error('Erro ao salvar cliente');
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, background: 'linear-gradient(to right, #fff, #bd93f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users size={32} /> Clientes e Licenças
          </h1>
          <p style={{ color: '#6272a4', margin: '4px 0 0 0' }}>Gestão centralizada da sua base de usuários</p>
        </div>

        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6272a4' }} size={18} />
          <input 
            type="text" 
            placeholder="Buscar cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input"
            style={{ paddingLeft: 40, width: 280, borderRadius: 12 }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Coluna de Cadastro */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="glass-card"
          style={{ padding: 24, position: 'sticky', top: 24 }}
        >
          <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#bd93f9' }}>
            {editing ? <Edit3 size={20} /> : <UserPlus size={20} />}
            {editing ? 'Editar Cliente' : 'Novo Cliente'}
          </h3>
          
          <form onSubmit={saveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label><Users size={14} /> Nome Completo</label>
              <input
                className="glass-input"
                placeholder="Ex: João Silva"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label><Mail size={14} /> Email</label>
              <input
                className="glass-input"
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label><Phone size={14} /> WhatsApp / Telefone</label>
              <input
                className="glass-input"
                placeholder="5511999999999"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label><Building2 size={14} /> Empresa</label>
              <input
                className="glass-input"
                placeholder="Nome da empresa"
                value={form.company}
                onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label><StickyNote size={14} /> Notas Internas</label>
              <textarea
                className="glass-input"
                placeholder="Observações importantes..."
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                style={{ minHeight: 100, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn-pill" style={{ flex: 1, justifyContent: 'center' }}>
                {editing ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                {editing ? 'Atualizar' : 'Cadastrar'}
              </button>
              {editing && (
                <button 
                  type="button" 
                  className="btn-pill btn-pill--danger" 
                  onClick={() => { setEditing(null); setForm(emptyForm); }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Coluna da Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6272a4' }}>
                <RefreshCw className="dot-pulse" size={40} />
                <p>Carregando base de clientes...</p>
              </div>
            ) : filteredCustomers.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {filteredCustomers.map((customer, idx) => (
                  <motion.div
                    key={customer.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card"
                    style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden' }}
                  >
                    {/* Botão de Excluir Flutuante */}
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => {
                          setEditing(customer);
                          setForm({
                            name: customer.name || '',
                            email: customer.email || '',
                            phone: customer.phone || '',
                            company: customer.company || '',
                            notes: customer.notes || '',
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#6272a4', cursor: 'pointer', padding: 6, borderRadius: 8 }}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(customer)}
                        style={{ background: 'rgba(255,85,85,0.1)', border: 'none', color: '#ff5555', cursor: 'pointer', padding: 6, borderRadius: 8 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #bd93f9 0%, #8be9fd 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#282a36', fontWeight: 800 }}>
                        {customer.name[0].toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.name}</h4>
                        <span style={{ fontSize: 12, color: '#6272a4', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={12} /> {customer.company || 'Pessoa Física'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#bfc0d4' }}>
                      {customer.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Mail size={14} color="#bd93f9" /> {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Phone size={14} color="#50fa7b" /> {customer.phone}
                        </div>
                      )}
                    </div>

                    {customer.notes && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 12, color: '#6272a4', fontStyle: 'italic' }}>
                        "{customer.notes}"
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', padding: 60, color: '#6272a4' }}>
                <Users size={64} style={{ opacity: 0.1, marginBottom: 16 }} />
                <h3>Nenhum cliente encontrado</h3>
                <p>Cadastre um novo cliente na coluna ao lado.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Remover cliente?"
        description={deleteTarget ? `Tem certeza que deseja remover o cliente "${deleteTarget.name}"? Esta ação não pode ser desfeita.` : ''}
        confirmText={deleting ? 'Removendo...' : 'Remover cliente'}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            setDeleting(true);
            const res = await fetch(`${getBackendBaseURL()}/api/customers/${deleteTarget.id}`, {
              method: 'DELETE',
              headers: authHeaders(),
            });
            if (!res.ok) throw new Error();
            toast.info('Cliente removido.');
            setDeleteTarget(null);
            await loadCustomers();
          } catch (err) {
            toast.error('Erro ao remover cliente');
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <style jsx>{`
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-group label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6272a4;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>
    </div>
  );
}
