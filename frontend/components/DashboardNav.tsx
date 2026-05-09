'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  BarChart3, 
  Terminal, 
  Users, 
  Trophy 
} from 'lucide-react';

const links = [
  { href: '/dashboard/sessions', label: 'Sessões', icon: LayoutGrid },
  { href: '/dashboard/metrics', label: 'Métricas', icon: BarChart3 },
  { href: '/dashboard/logs', label: 'Logs', icon: Terminal },
  { href: '/dashboard/customers', label: 'Clientes', icon: Users },
  { href: '/dashboard/xp', label: 'XP', icon: Trophy },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 32,
        padding: '8px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '16px',
        width: 'fit-content'
      }}
    >
      {links.map((link) => {
        const active =
          pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
        const Icon = link.icon;
        
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              position: 'relative',
              color: active ? '#fff' : '#6272a4',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 14,
              transition: 'all 0.3s ease'
            }}
          >
            {active && (
              <motion.div
                layoutId="nav-active"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #6272a4, #bd93f9)',
                  borderRadius: '12px',
                  zIndex: -1,
                  boxShadow: '0 4px 15px rgba(189, 147, 249, 0.3)'
                }}
              />
            )}
            <Icon size={18} style={{ opacity: active ? 1 : 0.7 }} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
