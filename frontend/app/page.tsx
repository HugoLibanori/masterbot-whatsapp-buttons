import React from 'react';
import HomeCta from '@/components/HomeCta';

export default function HomePage() {
  return (
    <section>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Alugue seu Bot de WhatsApp</h1>
      <p style={{ marginBottom: 24 }}>
        Crie sua sessão, conecte via QR Code e comece a usar recursos avançados no seu WhatsApp.
      </p>
      <HomeCta />
    </section>
  );
}
