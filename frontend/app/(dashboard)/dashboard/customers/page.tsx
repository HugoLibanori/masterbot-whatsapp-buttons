'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  function authHeaders(): HeadersInit {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await getJSON<{ ok: boolean; customers: Customer[] }>('/api/customers', true);
      setCustomers(res.customers || []);
    } catch (err: any) {
      const msg = err?.message || '';
      if (String(msg).startsWith('Erro 401')) {
        router.push('/login');
        return;
      }
      toast.error(msg || 'Erro ao carregar clientes');
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
        toast.success('Cliente atualizado.');
      } else {
        await postJSON('/api/customers', payload, true);
        toast.success('Cliente cadastrado.');
      }
      setForm(emptyForm);
      setEditing(null);
      await loadCustomers();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar cliente');
    }
  }

  function requestDelete(customer: Customer) {
    setDeleteTarget(customer);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div>
      <h1>Clientes e licenças</h1>
      <form onSubmit={saveCustomer} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          placeholder="Telefone"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />
        <input
          placeholder="Empresa"
          value={form.company}
          onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
        />
        <textarea
          placeholder="Notas"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          style={{
            minHeight: 80,
            background: '#282a36',
            color: '#f8f8f2',
            border: '1px solid #2f3144',
            borderRadius: 6,
            padding: 8,
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit">{editing ? 'Atualizar cliente' : 'Adicionar cliente'}</button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <section style={{ marginTop: 24 }}>
        <h2>Lista de clientes</h2>
        {loading && <p style={{ color: '#bfc0d4' }}>Carregando...</p>}
        {!loading && !customers.length && (
          <p style={{ color: '#bfc0d4' }}>Nenhum cliente cadastrado ainda.</p>
        )}
        {customers.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Nome</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Contato</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Empresa</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #2f3144' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>
                    {customer.email && <div>{customer.email}</div>}
                    {customer.phone && <div>{customer.phone}</div>}
                  </td>
                  <td>{customer.company || '—'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(customer);
                        setForm({
                          name: customer.name || '',
                          email: customer.email || '',
                          phone: customer.phone || '',
                          company: customer.company || '',
                          notes: customer.notes || '',
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(customer)}
                      style={{ background: '#8b1d1d' }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <ConfirmModal
        open={!!deleteTarget}
        title="Remover cliente?"
        description={
          deleteTarget
            ? `Tem certeza que deseja remover o cliente "${deleteTarget.name}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmText={deleting ? 'Removendo...' : 'Remover cliente'}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            setDeleting(true);
            const res = await fetch(`${getBackendBaseURL()}/api/customers/${deleteTarget.id}`, {
              method: 'DELETE',
              headers: authHeaders(),
            });
            if (!res.ok) throw new Error(await res.text());

            toast.info('Cliente removido.');
            setDeleteTarget(null);
            await loadCustomers();
          } catch (err: any) {
            toast.error(err?.message || 'Erro ao remover cliente');
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
