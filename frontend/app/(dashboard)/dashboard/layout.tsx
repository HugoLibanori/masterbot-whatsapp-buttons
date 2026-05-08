import type { ReactNode } from 'react';
import DashboardNav from '@/components/DashboardNav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <DashboardNav />
      {children}
    </div>
  );
}
