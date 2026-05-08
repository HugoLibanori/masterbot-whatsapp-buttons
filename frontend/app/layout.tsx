export const metadata = {
  title: 'MasterBot SaaS',
  description: 'Alugue seu bot de WhatsApp como serviço',
};

import './globals.css';

import NavAuth from '@/components/NavAuth';
import ToastProvider from '@/components/ToastProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header
              style={{
                padding: '1rem 2rem',
                borderBottom: '1px solid #2f2f40',
                background: '#161622',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <a href="/" style={{ fontWeight: 700, color: '#bd93f9', fontSize: 20 }}>
                MasterBot
              </a>
              <NavAuth />
            </header>
            <main
              style={{
                flex: 1,
                maxWidth: 960,
                margin: '0 auto',
                width: '100%',
                padding: '2rem',
              }}
            >
              {children}
            </main>
            <footer
              style={{
                padding: '1rem',
                borderTop: '1px solid #2f2f40',
                textAlign: 'center',
                background: '#161622',
                color: '#bfc0d4',
              }}
            >
              © {new Date().getFullYear()} MasterBot
            </footer>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
