'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  text?: string;
  size?: number;
}

export default function QrImage({ text, size = 256 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function gen() {
      if (!text) {
        setDataUrl(null);
        return;
      }
      try {
        const url = await QRCode.toDataURL(text, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: size,
        });
        if (active) {
          setDataUrl(url);
          setError(null);
        }
      } catch (e: any) {
        if (active) {
          setError(e?.message || 'Falha ao gerar QR');
          setDataUrl(null);
        }
      }
    }
    gen();
    return () => {
      active = false;
    };
  }, [text, size]);

  if (!text) return null;
  if (error) return <div style={{ color: 'crimson' }}>{error}</div>;
  if (!dataUrl) return <div>Gerando QR...</div>;

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', border: '1px solid #e5e7eb' }}
    />
  );
}
