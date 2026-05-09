'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  children,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
            }}
          />

          {/* Modal Content */}
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            pointerEvents: 'none'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: 480,
                padding: 32,
                display: 'grid',
                gap: 20,
                pointerEvents: 'auto',
                border: '1px solid rgba(189, 147, 249, 0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>{title}</h2>
                <button 
                  onClick={onCancel}
                  style={{ background: 'transparent', border: 'none', color: '#6272a4', padding: 4 }}
                >
                  <X size={24} />
                </button>
              </div>

              <div>
                <p style={{ margin: 0, color: '#bfc0d4', lineHeight: 1.6 }}>{description}</p>
                {children && <div style={{ marginTop: 20 }}>{children}</div>}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button 
                  className="btn-primary" 
                  onClick={onConfirm} 
                  style={{ flex: 1, padding: '12px' }}
                >
                  {confirmText}
                </button>
                <button 
                  onClick={onCancel} 
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#6272a4'
                  }}
                >
                  {cancelText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
