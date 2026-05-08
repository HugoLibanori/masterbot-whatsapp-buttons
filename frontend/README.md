# MasterBot Front-end (Next.js)

Este é o front-end (SaaS) para cadastro, checkout e painel do MasterBot.

## Requisitos

- Node 18+

## Configuração

1. Copie `.env.example` para `.env.local` e ajuste as variáveis:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_BACKEND_URL` deve apontar para o orquestrador (seu back-end atual).

2. Instale dependências:

```bash
npm install
```

3. Dev:

```bash
npm run dev
```

4. Build/Start:

```bash
npm run build
npm start
```

## Próximos passos

- Integrar autenticação (Auth.js/NextAuth)
- Checkout/billing (Stripe ou Mercado Pago)
- Painel: criar sessão, iniciar/parar, exibir QR Code e status (chamando o back-end)
- Webhooks de pagamento: `/api/webhooks/stripe` atualiza licenças e orquestra sessões
