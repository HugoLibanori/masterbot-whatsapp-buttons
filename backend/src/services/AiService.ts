import { GoogleGenerativeAI } from '@google/generative-ai';
import { Bot } from '../interfaces/index.js';
import { BotData } from '../configs/configBot/BotData.js';

export const getGeminiApiKey = (dataBot?: Partial<Bot>): string => {
  const currentBotData = dataBot || BotData.get() || {};
  const botKey =
    currentBotData?.apis?.gemini?.api_key ||
    currentBotData?.apis?.google?.api_key ||
    '';
  return (
    (botKey && botKey.startsWith('AIza') ? botKey : '') ||
    botKey ||
    process.env.GEMINI_API_KEY ||
    ''
  );
};

export class AiService {
  private static getClient(dataBot?: Partial<Bot>): GoogleGenerativeAI {
    const key = getGeminiApiKey(dataBot);
    if (!key) {
      throw new Error('Chave de API do Gemini não configurada.');
    }
    return new GoogleGenerativeAI(key);
  }

  /**
   * Transcreve um buffer de áudio (áudio do WhatsApp/PTT, MP3, OGG, M4A) para texto.
   */
  public static async transcribeAudio(
    audioBuffer: Buffer,
    mimeType = 'audio/ogg',
    dataBot?: Partial<Bot>,
  ): Promise<string> {
    const genAI = this.getClient(dataBot);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    // Normaliza mimetype para os formatos aceitos pelo Gemini
    let cleanMime = (mimeType || 'audio/ogg').split(';')[0].trim().toLowerCase();
    if (cleanMime === 'audio/opus') cleanMime = 'audio/ogg';
    if (!cleanMime.startsWith('audio/')) cleanMime = 'audio/ogg';

    const prompt =
      'Transcreva o áudio a seguir com máxima precisão. Escreva o texto falado exatamente como foi dito, mantendo pontuação adequada e no idioma em que foi falado (geralmente português brasileiro). Retorne EXCLUSIVAMENTE o texto transcrito, sem introduções, sem aspas, sem saudações e sem comentários adicionais.';

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: cleanMime,
          data: audioBuffer.toString('base64'),
        },
      },
      prompt,
    ]);

    const text = result.response?.text()?.trim();
    if (!text) {
      throw new Error('Não foi possível identificar falas audíveis no áudio.');
    }

    return text;
  }

  /**
   * Processa uma pergunta / instrução com IA, suportando texto, citação e visão de imagens.
   */
  public static async askAi(
    prompt: string,
    options?: {
      imageBuffer?: Buffer;
      imageMimeType?: string;
      quotedText?: string;
      systemInstruction?: string;
      dataBot?: Partial<Bot>;
    },
  ): Promise<string> {
    const genAI = this.getClient(options?.dataBot);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        options?.systemInstruction ||
        'Você é uma inteligência artificial prestativa, inteligente, direta e bem-humorada integrada a um bot de WhatsApp. Responda sempre em português do Brasil com formatação elegante em Markdown do WhatsApp (*negrito*, _itálico_, listas). Seja claro e conciso.',
    });

    const parts: any[] = [];

    // Se houver imagem anexada ou citada
    if (options?.imageBuffer && Buffer.isBuffer(options.imageBuffer)) {
      let mime = (options.imageMimeType || 'image/jpeg').split(';')[0].trim().toLowerCase();
      if (!mime.startsWith('image/')) mime = 'image/jpeg';
      parts.push({
        inlineData: {
          mimeType: mime,
          data: options.imageBuffer.toString('base64'),
        },
      });
    }

    // Se houver texto citado como contexto
    if (options?.quotedText) {
      parts.push(`[Texto citado da mensagem anterior: "${options.quotedText}"]\n`);
    }

    // Pergunta principal
    parts.push(prompt || 'Analise o conteúdo acima e explique em detalhes.');

    const result = await model.generateContent(parts);
    const responseText = result.response?.text()?.trim();

    if (!responseText) {
      return '🤖 Desculpe, não consegui formular uma resposta para essa pergunta.';
    }

    return responseText;
  }
}
