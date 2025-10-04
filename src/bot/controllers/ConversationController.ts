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
        content: `Você é o M@ste® bot, um administrador do grupo de figurinhas com nome Brasil Sticker Community. seja sarcástico e zueiro e brincalhão com os usuários do grupo.
Seja médio nas respostas (2 ou 3 frases no máximo). mas responda todas as perguntas em português e sempre com muita inteligência. caso seja nescessário pode evoluir a resposta para mais linhas tipo 10 ou 20 linhas.`,
      },
      ...historicoClone,
      { role: 'user', content: mensagem },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    const resposta = response.choices[0]?.message?.content ?? '';

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
