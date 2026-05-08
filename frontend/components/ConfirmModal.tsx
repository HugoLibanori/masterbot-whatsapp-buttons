'use client';

import React from 'react';

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  open,
  title = 'Confirmação',
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  children,
}: Props) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 10000,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          background: '#1e1e2e',
          borderRadius: 10,
          padding: 16,
          width: 'min(92vw, 420px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 8 }}>{title}</h3>
        {description && (
          <p style={{ marginTop: 0, marginBottom: 16, color: '#ffffffff' }}>{description}</p>
        )}
        {children && <div style={{ marginBottom: 16 }}>{children}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #083c0aff',
              background: '#15e326ff',
              color: '#ffffffff',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #5f0606ff',
              background: '#b91010ff',
              color: 'white',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
