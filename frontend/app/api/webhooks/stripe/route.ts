import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Placeholder: integrar Stripe webhooks aqui
  // - Validar assinatura (stripe.webhooks.constructEvent)
  // - Tratar events: checkout.session.completed, invoice.payment_succeeded, customer.subscription.deleted etc.
  // - Atualizar licença no back-end e chamar orquestrador para provisionar/pausar sessão
  return NextResponse.json({ received: true });
}
