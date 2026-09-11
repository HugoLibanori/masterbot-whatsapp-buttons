import axios from 'axios';
import * as cheerio from 'cheerio';

export interface NoticiaItem {
  titulo: string;
  fonte: string;
  data: string;
  dataAmigavel: string;
  link: string;
}

export type TipoNoticia = 'dia' | 'semana' | 'mundo' | 'tech' | 'economia' | 'busca';

interface CacheEntry {
  timestamp: number;
  data: NoticiaItem[];
}

const newsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos de cache

function formatRelativeDate(pubDateStr: string): string {
  try {
    const pubDate = new Date(pubDateStr);
    if (isNaN(pubDate.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - pubDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    if (diffHours < 24 && pubDate.getDate() === now.getDate()) {
      const hora = pubDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      });
      return `Hoje às ${hora}`;
    }
    if (diffDays <= 1 || (diffHours < 36 && pubDate.getDate() === now.getDate() - 1)) {
      const hora = pubDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      });
      return `Ontem às ${hora}`;
    }
    return pubDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  } catch {
    return '';
  }
}

export async function getNoticias(
  tipo: TipoNoticia = 'dia',
  termoBusca?: string,
): Promise<{ tituloSecao: string; itens: NoticiaItem[] }> {
  const cacheKey = `${tipo}_${(termoBusca || '').trim().toLowerCase()}`;
  const cached = newsCache.get(cacheKey);

  let tituloSecao = '🗞️ *ÚLTIMAS NOTÍCIAS DO DIA*';
  if (tipo === 'semana') {
    tituloSecao = '📅 *DESTAQUES DA SEMANA*';
  } else if (tipo === 'mundo') {
    tituloSecao = '🌍 *NOTÍCIAS INTERNACIONAIS*';
  } else if (tipo === 'tech') {
    tituloSecao = '💻 *NOTÍCIAS DE TECNOLOGIA*';
  } else if (tipo === 'economia') {
    tituloSecao = '📈 *NOTÍCIAS DE ECONOMIA & MERCADO*';
  } else if (tipo === 'busca' && termoBusca) {
    tituloSecao = `🔍 *NOTÍCIAS SOBRE: "${termoBusca.toUpperCase()}"*`;
  }

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { tituloSecao, itens: cached.data };
  }

  let rssUrl = 'https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419';

  if (tipo === 'semana') {
    rssUrl = 'https://news.google.com/rss/search?q=Brasil+when:7d&hl=pt-BR&gl=BR&ceid=BR:pt-419';
  } else if (tipo === 'mundo') {
    rssUrl =
      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FuUnlHZ0pWVXlnQVAB?hl=pt-BR&gl=BR&ceid=BR%3Apt-419';
  } else if (tipo === 'tech') {
    rssUrl =
      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FuUnlHZ0pWVXlnQVAB?hl=pt-BR&gl=BR&ceid=BR%3Apt-419';
  } else if (tipo === 'economia') {
    rssUrl =
      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FuUnlHZ0pWVXlnQVAB?hl=pt-BR&gl=BR&ceid=BR%3Apt-419';
  } else if (tipo === 'busca' && termoBusca) {
    rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
      termoBusca,
    )}+when:7d&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  }

  try {
    const response = await axios.get(rssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 7000,
    });

    const $ = cheerio.load(response.data, { xml: true });
    const itens: NoticiaItem[] = [];

    $('item')
      .slice(0, 6)
      .each((_, el) => {
        const rawTitle = $(el).find('title').text().trim();
        const link = $(el).find('link').text().trim();
        const pubDate = $(el).find('pubDate').text().trim();
        const sourceText = $(el).find('source').text().trim();

        // O Google News geralmente separa o título e a fonte por ' - '
        const parts = rawTitle.split(' - ');
        const title = parts.length > 1 ? parts.slice(0, -1).join(' - ') : rawTitle;
        const fonte =
          sourceText || (parts.length > 1 ? parts[parts.length - 1] : 'Portal de Notícias');

        if (title) {
          itens.push({
            titulo: title.trim(),
            fonte: fonte.trim(),
            data: pubDate,
            dataAmigavel: formatRelativeDate(pubDate),
            link,
          });
        }
      });

    // Se por acaso o Google News não retornou itens e for do tipo 'dia', tenta o G1 como fallback
    if (itens.length === 0 && tipo === 'dia') {
      const g1Response = await axios.get('https://g1.globo.com/rss/g1/', {
        timeout: 5000,
      });
      const $g1 = cheerio.load(g1Response.data, { xml: true });
      $g1('item')
        .slice(0, 6)
        .each((_, el) => {
          const title = $g1(el).find('title').text().trim();
          const link = $g1(el).find('link').text().trim();
          const pubDate = $g1(el).find('pubDate').text().trim();

          if (title) {
            itens.push({
              titulo: title,
              fonte: 'G1',
              data: pubDate,
              dataAmigavel: formatRelativeDate(pubDate),
              link,
            });
          }
        });
    }

    if (itens.length > 0) {
      newsCache.set(cacheKey, {
        timestamp: Date.now(),
        data: itens,
      });
    }

    return { tituloSecao, itens };
  } catch (error: any) {
    console.error('Erro ao buscar notícias RSS:', error?.message || error);
    // Fallback de emergência caso a rota principal falhe: tenta o RSS do G1
    try {
      const g1Res = await axios.get('https://g1.globo.com/rss/g1/', { timeout: 5000 });
      const $g1 = cheerio.load(g1Res.data, { xml: true });
      const itens: NoticiaItem[] = [];
      $g1('item')
        .slice(0, 6)
        .each((_, el) => {
          const title = $g1(el).find('title').text().trim();
          const link = $g1(el).find('link').text().trim();
          const pubDate = $g1(el).find('pubDate').text().trim();

          if (title) {
            itens.push({
              titulo: title,
              fonte: 'G1',
              data: pubDate,
              dataAmigavel: formatRelativeDate(pubDate),
              link,
            });
          }
        });

      return { tituloSecao: '🗞️ *ÚLTIMAS NOTÍCIAS (G1)*', itens };
    } catch {
      return { tituloSecao, itens: [] };
    }
  }
}
