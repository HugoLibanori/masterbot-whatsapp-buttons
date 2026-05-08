import { GoogleGenerativeAI } from '@google/generative-ai';

import Conversation from '../../database/models/Conversation.js';
import { Bot } from '../../interfaces/index.js';

export class ConversationController {
  async conversationOpenAI(userId: string, mensagem: string, dataBot: Partial<Bot>) {
    // Mantendo o mesmo caminho da API Key solicitado
    const genAI = new GoogleGenerativeAI(dataBot?.apis?.openai.api_key || '');

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite', // Versão estável e rápida
      systemInstruction: `Você é o M@ste® Bot, o lendário administrador do grupo de figurinhas "Brasil Sticker Community".
Sua missão é entreter, zuar e conversar com os membros de forma divertida, inteligente e sempre com um toque de sarcasmo.
Fale SEMPRE em português do Brasil, com o estilo de um amigo zoeiro — pode usar gírias, memes e até palavrões leves (tipo “porra”, “caramba”, “cacete”) quando fizer sentido, mas nunca de forma ofensiva ou agressiva.

Regras do seu estilo:
- Seja engraçado, sarcástico e debochado na medida certa.
- Seja criativo e espontâneo, como se fosse um humano inteligente e espirituoso.
- Dê respostas curtas (2 ou 3 frases no máximo), mas pode se soltar mais (até 10–20 linhas) se o assunto for interessante ou merecer uma explicação foda.
- Use emojis, interjeições e humor contextual (tipo “kkkk”, “pqp”, “🤡”, “🧠”, “🔥”).
- Sempre demonstre inteligência e presença — você entende memes, cultura pop, internet e tretas de grupo.
- Pode provocar o usuário de leve, mas nunca humilhar ou ser maldoso.

Exemplo de atitude:
Se alguém pedir algo besta, você pode responder tipo:
  “Mano... tu tá de sacanagem, né? 😂”
Se for uma pergunta séria, responda com sabedoria e ironia:
  “Claro, é só fazer o oposto do que o governo faria. 🧠”

Em resumo: você é um bot zoeiro, sarcástico e esperto, que fala igual um BR engraçado e dá respostas afiadíssimas.`,
    });

    const historico = await Conversation.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    const historicoOrdenado = historico.reverse();

    // 1. Mapeia para o formato do Gemini
    let formattedHistory = historicoOrdenado.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // 2. CORREÇÃO: O histórico DEVE começar com 'user'
    while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
      formattedHistory.shift();
    }

    // 3. CORREÇÃO ADICIONAL: Garantir que as roles sejam alternadas (user, model, user, model)
    // Se houver dois 'user' seguidos no DB, o Gemini daria erro. Isso evita:
    const finalHistory = formattedHistory.filter((msg, index, array) => {
      if (index === 0) return true;
      return msg.role !== array[index - 1].role;
    });

    const chat = model.startChat({
      history: finalHistory,
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.5,
        topP: 0.5,
        topK: 40,
      },
    });

    try {
      const result = await chat.sendMessage(mensagem);
      const response = await result.response;
      const resposta = response.text()?.trim() || '🤖 Buguei aqui, repete aí rapidinho kkk';

      // Salva no banco mantendo as roles originais que seu sistema usa
      await Conversation.create({ user_id: userId, role: 'user', content: mensagem });
      await Conversation.create({ user_id: userId, role: 'assistant', content: resposta });

      return resposta;
    } catch (error: any) {
      console.error('Erro Gemini:', error);

      // Se o erro for de segurança (conteúdo bloqueado), o Gemini retorna vazio
      if (error.message?.includes('SAFETY')) {
        return 'Cê tá falando umas parada muito doida, o sistema me travou aqui! 🤣';
      }

      return '🤖 Ih, deu erro aqui no meu processador... tenta de novo! kkk';
    }
  }

  async resetConvertsation(): Promise<boolean> {
    try {
      await Conversation.destroy({
        where: {},
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
