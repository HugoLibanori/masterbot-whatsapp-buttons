'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Código */}
        <h1 className="text-[96px] font-extrabold tracking-tight text-[#bd93f9] drop-shadow">
          404
        </h1>

        {/* Texto */}
        <p className="mt-4 text-lg text-[#f8f8f2]/80">
          A página que você tentou acessar não existe ou foi removida.
        </p>

        {/* Separador */}
        <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-[#44475a] to-transparent" />

        {/* Ação */}
        <div className="mt-8 flex justify-center">
          <Link href="/login" className="btn-pill">
            Voltar para o login
          </Link>
        </div>

        {/* Hint */}
        <p className="mt-6 text-sm text-[#6272a4]">
          Se você acha que isso é um erro, verifique a URL ou tente novamente.
        </p>
      </div>
    </div>
  );
}
