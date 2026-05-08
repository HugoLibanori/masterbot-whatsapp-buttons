'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard/sessions', label: 'Sessões' },
  { href: '/dashboard/metrics', label: 'Métricas' },
  { href: '/dashboard/logs', label: 'Logs' },
  { href: '/dashboard/customers', label: 'Clientes' },
  { href: '/dashboard/xp', label: 'XP' },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 24,
        borderBottom: '1px solid #2f3144',
        paddingBottom: 12,
      }}
    >
      {links.map((link) => {
        const active =
          pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid #2f3144',
              background: active ? '#bd93f9' : 'transparent',
              color: active ? '#0f111a' : '#f8f8f2',
              fontWeight: active ? 600 : 400,
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
