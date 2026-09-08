import { ISocket } from '../types/MyTypes/index.js';
import * as types from '../types/BaileysTypes/index.js';

export const sendWelcomeSalesMessage = async (
  sock: ISocket,
  id_chat: string,
  pushName?: string | null,
  prefix: string = '!',
  ownerNumber?: string,
  botName: string = 'MasterBot',
  quotedMessage?: types.MyWAMessage,
): Promise<void> => {
  const saudacao = pushName ? `Olá, *${pushName}*!` : 'Olá!';
  const contatoDono = ownerNumber ? `wa.me/${ownerNumber.replace(/\D/g, '')}` : 'com o desenvolvedor';

  const textoVenda = `
👋 ${saudacao} Seja muito bem-vindo(a)! 🤖✨

Eu sou o *${botName}*, o bot mais completo e inteligente do WhatsApp! Estou pronto para turbinar suas conversas e automatizar seus grupos.

💼 *DESEJA UTILIZAR O BOT OU ADICIONAR AO SEU GRUPO?*
Temos planos exclusivos e super acessíveis para você aproveitar 100% sem limites:

📱 *PLANO INDIVIDUAL (PRIVADO / PV)*
• Acesso liberado a todos os comandos direto no meu PV
• Downloads ilimitados (YouTube, TikTok, Instagram, Facebook)
• Músicas completas em áudio com o comando *${prefix}play*
• Criador de figurinhas estáticas e animadas, I.A. e utilitários
💵 *Valor: Apenas R$ 10,00 / mês*

👥 *PLANO PARA GRUPO COMPLETO*
• Liberação total do bot para *TODOS* os membros do grupo usarem
• Sem limite diário de comandos para o grupo
• Jogos interativos em grupo (*${prefix}quiz*, *${prefix}forca*, etc.)
• Lembretes automáticos com marcação de todos (*${prefix}lembrete*)
• Gestão do grupo, anti-link, boas-vindas automáticas e diversão
💵 *Valor: Apenas R$ 30,00 / mês por grupo*

---
⚡ *Como ativar seu plano ou tirar dúvidas?*
Fale diretamente com o meu dono (${contatoDono}) ou escolha uma das opções abaixo!
`.trim();

  const options: types.MyButtons = {
    text: textoVenda,
    footer: 'Escolha uma opção rápida abaixo:',
    buttons: [
      {
        buttonId: `${prefix}menu`,
        buttonText: { displayText: '📋 Ver Comandos' },
      },
      {
        buttonId: `${prefix}dono`,
        buttonText: { displayText: '👤 Falar com o Dono' },
      },
      {
        buttonId: `${prefix}pix`,
        buttonText: { displayText: '💳 Ver Chave PIX' },
      },
    ],
  };

  try {
    const res = await sock.sendButtons(id_chat, options);
    if (!res) {
      await sock.sendText(id_chat, textoVenda);
    }
  } catch (err) {
    console.error('Erro ao enviar mensagem de boas-vindas com botões, tentando texto simples:', err);
    try {
      await sock.sendText(id_chat, textoVenda);
    } catch (e) {
      console.error('Erro ao enviar texto simples de boas-vindas:', e);
    }
  }
};
