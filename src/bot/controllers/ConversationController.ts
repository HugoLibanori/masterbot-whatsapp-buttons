import OpenAI from 'openai';

import Conversation from '../../database/models/Conversation.js';
import { Bot } from '../../interfaces/index.js';

export class ConversationController {
  async conversationOpenAI(userId: string, mensagem: string, dataBot: Partial<Bot>) {
    const openai = new OpenAI({ apiKey: dataBot?.apis?.openai.api_key });

    const historico = await Conversation.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    const historicoOrdenado = historico.reverse();

    const historicoClone = JSON.parse(
      JSON.stringify(
        historicoOrdenado.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ),
    );

    const messages = [
      {
        role: 'system',
        content: `Você é o M@ste® Bot, o lendário administrador do grupo de figurinhas "Brasil Sticker Community".
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
      },
      ...historicoClone,
      { role: 'user', content: mensagem },
    ];

    const response = await openai.responses.create({
      model: 'gpt-5',
      input: messages,
      reasoning: { effort: 'minimal' },
      max_output_tokens: 600,
      text: { verbosity: 'low' },
    });

    const resposta = response.output_text?.trim() || '🤖 Buguei aqui, repete aí rapidinho kkk';

    await Conversation.create({ user_id: userId, role: 'user', content: mensagem });
    await Conversation.create({ user_id: userId, role: 'assistant', content: resposta });

    return resposta;
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
