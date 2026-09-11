import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  ResultadoBrasileirao,
  TimeBrasileirao,
  RodadaBrasileirao,
  PartidaBrasileirao,
} from '../interfaces/index.js';

interface CachedData {
  data: ResultadoBrasileirao;
  timestamp: number;
}

const cacheA: { current: CachedData | null } = { current: null };
const cacheB: { current: CachedData | null } = { current: null };
const cacheChampions: { current: CachedData | null } = { current: null };
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos de cache em memória

let cachedChampionshipIdA = '1456';
let cachedChampionshipIdB = '1461';
let cachedChampionshipIdChampions = '1465';
let lastChampionshipCheck = 0;
let lastChampionsCheck = 0;

export const getChampionsLeagueId = async (): Promise<string> => {
  const now = Date.now();
  if (now - lastChampionsCheck < 12 * 3600 * 1000) {
    return cachedChampionshipIdChampions;
  }
  try {
    const resp = await axios.get(
      'https://www.terra.com.br/esportes/futebol/internacional/liga-dos-campeoes/tabela/',
      {
        timeout: 5000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    );
    const match = resp.data.match(/idChampionship=(\d+)/);
    if (match && match[1]) {
      cachedChampionshipIdChampions = match[1];
      lastChampionsCheck = now;
      return match[1];
    }
  } catch (err) {
    console.warn('Erro ao obter idChampionship dinâmico da Champions League:', err);
  }
  return cachedChampionshipIdChampions;
};

export const getChampionshipId = async (serie: 'A' | 'B' = 'A'): Promise<string> => {
  const now = Date.now();
  if (now - lastChampionshipCheck < 12 * 3600 * 1000) {
    return serie === 'B' ? cachedChampionshipIdB : cachedChampionshipIdA;
  }
  try {
    const slug = serie === 'B' ? 'brasileiro-serie-b' : 'brasileiro-serie-a';
    const resp = await axios.get(`https://www.terra.com.br/esportes/futebol/${slug}/tabela/`, {
      timeout: 5000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const match = resp.data.match(/idChampionship=(\d+)/);
    if (match && match[1]) {
      if (serie === 'B') cachedChampionshipIdB = match[1];
      else cachedChampionshipIdA = match[1];
      lastChampionshipCheck = now;
      return match[1];
    }
  } catch (err) {
    console.warn('Erro ao obter idChampionship dinâmico do Terra:', err);
  }
  return serie === 'B' ? cachedChampionshipIdB : cachedChampionshipIdA;
};

const parseDataTable = (html: string): TimeBrasileirao[] => {
  const $ = cheerio.load(html);
  const times: TimeBrasileirao[] = [];

  $('table > tbody > tr').each((_, el) => {
    const $time = $(el);
    const dadosTime: TimeBrasileirao = {
      nome: $time.find('.team-name > a').attr('title') || $time.find('.team-name').text().trim() || '',
      escudo: $time.find('.shield > a > img').attr('src') || $time.find('.shield img').attr('src') || '',
      posicao: $time.find('.position').text().trim(),
      pontos: $time.find('.points').text().trim(),
      jogos: $time.find('td[title="Jogos"]').text().trim(),
      vitorias: $time.find('td[title="Vitórias"]').text().trim(),
      empates: $time.find('td[title="Empates"]').text().trim(),
      derrotas: $time.find('td[title="Derrotas"]').text().trim(),
      gols_pro: $time.find('td[title="Gols Pró"]').text().trim(),
      gols_contra: $time.find('td[title="Gols Contra"]').text().trim(),
      saldo_gols: $time.find('td[title="Saldo de Gols"]').text().trim(),
      aproveitamento: ($time.find('td[title="Aproveitamento"]').text().trim() || '') + '%',
    };
    if (dadosTime.nome) {
      times.push(dadosTime);
    }
  });

  return times;
};

const parseDataRounds = (html: string): RodadaBrasileirao[] => {
  const $ = cheerio.load(html);
  const rodadas: RodadaBrasileirao[] = [];

  $('ul.rounds > li').each((_, el) => {
    const $rodada = $(el);
    const dateAttr = $rodada.find('br.date-round').attr('data-date')?.split(' ')[0] || '';
    const [ano, mes, dia] = dateAttr.split('-');
    const isCurrent = $rodada.hasClass('round') && !$rodada.hasClass('hide');

    const dadosRodada: RodadaBrasileirao = {
      rodada: $rodada.find('h3').text().trim(),
      inicio: dia && mes && ano ? `${dia}/${mes}/${ano}` : '',
      rodada_atual: isCurrent,
      partidas: [],
    };

    $rodada.find('li.match').each((_, mEl) => {
      const $partida = $(mEl);
      const times = $partida.find('meta[itemprop="name"]').attr('content') || '';
      const [time_casa, time_fora] = times.split('x').map((t) => t.trim());

      const gols_casa_raw = $partida.find('.goals.home').text().trim();
      const gols_fora_raw = $partida.find('.goals.away').text().trim();
      const gols_casa = gols_casa_raw !== '' ? gols_casa_raw : null;
      const gols_fora = gols_fora_raw !== '' ? gols_fora_raw : null;
      const placar = gols_casa !== null && gols_fora !== null ? `${gols_casa} x ${gols_fora}` : null;

      const isLive =
        $partida.hasClass('live') ||
        $partida.find('.live').length > 0 ||
        $partida.text().toLowerCase().includes('ao vivo');

      const partida: PartidaBrasileirao = {
        partida: times,
        data: $partida.find('div.details > strong.date-manager').text().trim(),
        local: $partida.find('div.details > span.stadium').text().trim(),
        time_casa: time_casa || '',
        time_fora: time_fora || '',
        gols_casa,
        gols_fora,
        resultado_texto: placar ? `${time_casa} ${placar} ${time_fora}` : `${time_casa} x ${time_fora}`,
        status: isLive ? 'live' : placar ? 'finished' : 'scheduled',
      } as any;

      dadosRodada.partidas.push(partida);
    });

    rodadas.push(dadosRodada);
  });

  return rodadas;
};

export const getBrasileirao = async (
  rodadas = true,
  serie: 'A' | 'B' = 'A',
  forceRefresh = false,
): Promise<ResultadoBrasileirao> => {
  const cacheHolder = serie === 'B' ? cacheB : cacheA;
  const now = Date.now();

  if (!forceRefresh && cacheHolder.current && now - cacheHolder.current.timestamp < CACHE_TTL_MS) {
    return cacheHolder.current.data;
  }

  const championshipId = await getChampionshipId(serie);
  const URL_TABELA = `https://p1.trrsf.com/api/musa-soccer/ms-standings-light?idChampionship=${championshipId}&idPhase=&language=pt-BR&country=BR&nav=N&timezone=BR`;
  const URL_RODADAS = `https://p1.trrsf.com/api/musa-soccer/ms-standings-games-light?idChampionship=${championshipId}&idPhase=&language=pt-BR&country=BR&nav=N&timezone=BR`;

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  const [resTabela, resRodadas] = await Promise.all([
    axios.get(URL_TABELA, { headers, timeout: 7000 }),
    rodadas ? axios.get(URL_RODADAS, { headers, timeout: 7000 }) : Promise.resolve(null),
  ]);

  const resultado: ResultadoBrasileirao = {
    tabela: parseDataTable(resTabela.data),
    rodadas: resRodadas ? parseDataRounds(resRodadas.data) : [],
  };

  cacheHolder.current = {
    data: resultado,
    timestamp: now,
  };

  return resultado;
};

export const getChampionsLeague = async (
  rodadas = true,
  forceRefresh = false,
): Promise<ResultadoBrasileirao> => {
  const now = Date.now();
  if (!forceRefresh && cacheChampions.current && now - cacheChampions.current.timestamp < CACHE_TTL_MS) {
    return cacheChampions.current.data;
  }

  const championshipId = await getChampionsLeagueId();
  const URL_TABELA = `https://p1.trrsf.com/api/musa-soccer/ms-standings-light?idChampionship=${championshipId}&idPhase=&language=pt-BR&country=BR&nav=N&timezone=BR`;
  const URL_RODADAS = `https://p1.trrsf.com/api/musa-soccer/ms-standings-games-light?idChampionship=${championshipId}&idPhase=&language=pt-BR&country=BR&nav=N&timezone=BR`;

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  const [resTabela, resRodadas] = await Promise.all([
    axios.get(URL_TABELA, { headers, timeout: 7000 }),
    rodadas ? axios.get(URL_RODADAS, { headers, timeout: 7000 }) : Promise.resolve(null),
  ]);

  const resultado: ResultadoBrasileirao = {
    tabela: parseDataTable(resTabela.data),
    rodadas: resRodadas ? parseDataRounds(resRodadas.data) : [],
  };

  cacheChampions.current = {
    data: resultado,
    timestamp: now,
  };

  return resultado;
};

// ==========================================
// FORMATAÇÃO E HELPERS PARA UX
// ==========================================

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const findClub = (
  tabela: TimeBrasileirao[],
  search: string,
): TimeBrasileirao | null => {
  const cleanSearch = normalizeText(search);
  if (!cleanSearch) return null;

  return (
    tabela.find((t) => normalizeText(t.nome) === cleanSearch) ||
    tabela.find((t) => normalizeText(t.nome).includes(cleanSearch)) ||
    null
  );
};

export const findClubMatch = (
  rodadas: RodadaBrasileirao[] | undefined,
  clubName: string,
): { partida: PartidaBrasileirao; rodada: string } | null => {
  if (!rodadas || !rodadas.length) return null;
  const cleanName = normalizeText(clubName);

  const rodadaAtual = rodadas.find((r) => r.rodada_atual) || rodadas[rodadas.length - 1];
  if (rodadaAtual) {
    const partida = rodadaAtual.partidas.find(
      (p) => normalizeText(p.time_casa).includes(cleanName) || normalizeText(p.time_fora).includes(cleanName),
    );
    if (partida) {
      return { partida, rodada: rodadaAtual.rodada };
    }
  }

  for (const r of rodadas) {
    const partida = r.partidas.find(
      (p) => normalizeText(p.time_casa).includes(cleanName) || normalizeText(p.time_fora).includes(cleanName),
    );
    if (partida) {
      return { partida, rodada: r.rodada };
    }
  }

  return null;
};

const formatPartida = (partida: PartidaBrasileirao): string => {
  const temPlacar =
    partida.gols_casa !== null &&
    partida.gols_fora !== null &&
    partida.gols_casa !== undefined &&
    partida.gols_fora !== undefined;

  const isLive = (partida as any).status === 'live';
  const statusBadge = isLive ? '🔴 *[AO VIVO]* ' : '';
  const placarFormatado = temPlacar
    ? `${partida.gols_casa} x ${partida.gols_fora}`
    : 'A disputar';

  return (
    `⚔️ ${statusBadge}*${partida.time_casa}* x *${partida.time_fora}*\n` +
    `📅 ${partida.data}${partida.local ? ` • ${partida.local}` : ''}\n` +
    `📊 Placar: *${placarFormatado}*\n\n`
  );
};

export const formatResumo = (resultado: ResultadoBrasileirao, serie: 'A' | 'B'): string => {
  const { tabela, rodadas } = resultado;
  const rodada = rodadas?.find((r) => r.rodada_atual) || rodadas?.[rodadas.length - 1];

  const g4 = tabela.slice(0, 4);
  const z4 = tabela.slice(16, 20);

  let textoG4 = '';
  g4.forEach((t) => {
    textoG4 += `🟢 ${t.posicao}° *${t.nome}* - *${t.pontos}* pts (${t.jogos}J | ${t.vitorias}V | SG: ${t.saldo_gols})\n`;
  });

  let textoZ4 = '';
  z4.forEach((t) => {
    textoZ4 += `🔴 ${t.posicao}° *${t.nome}* - *${t.pontos}* pts (${t.jogos}J | ${t.vitorias}V | SG: ${t.saldo_gols})\n`;
  });

  let textoPartidas = '';
  if (rodada?.partidas?.length) {
    rodada.partidas.forEach((p) => {
      textoPartidas += formatPartida(p);
    });
  } else {
    textoPartidas = '_Sem jogos disponíveis para exibição._\n';
  }

  return (
    `⚽ *BRASILEIRÃO SÉRIE ${serie}* ⚽\n\n` +
    `🏆 *G4 / Libertadores:*\n${textoG4}\n` +
    `⚠️ *Z4 / Rebaixamento:*\n${textoZ4}\n` +
    `📌 *${rodada?.rodada || 'Rodada Atual'}:*\n\n` +
    `${textoPartidas}` +
    `💡 _Dica: Digite \`!brasileirao tabela\` para a tabela completa ou \`!brasileirao <time>\` (ex: !brasileirao flamengo)_`
  ).trim();
};

export const formatTabelaCompleta = (resultado: ResultadoBrasileirao, serie: 'A' | 'B'): string => {
  const { tabela } = resultado;
  let textoTabela = '';

  tabela.forEach((t) => {
    const pos = parseInt(t.posicao, 10);
    const emoji = pos <= 4 ? '🟢' : pos <= 6 ? '🔵' : pos <= 12 ? '⚪' : pos <= 16 ? '⚫' : '🔴';
    textoTabela += `${emoji} ${t.posicao}° *${t.nome}*\n   └ P: *${t.pontos}* | J: ${t.jogos} | V: ${t.vitorias} | E: ${t.empates} | D: ${t.derrotas} | SG: ${t.saldo_gols}\n`;
  });

  return (
    `📊 *TABELA COMPLETA - BRASILEIRÃO SÉRIE ${serie}*\n\n` +
    `🟢 G4 (Libertadores) | 🔵 Pré-Libertadores\n` +
    `⚪ Sul-Americana | ⚫ Neutro | 🔴 Rebaixamento\n\n` +
    `${textoTabela}\n` +
    `💡 _Para ver jogos da rodada: \`!brasileirao jogos\`_`
  ).trim();
};

export const formatJogos = (resultado: ResultadoBrasileirao, serie: 'A' | 'B'): string => {
  const { rodadas } = resultado;
  const rodada = rodadas?.find((r) => r.rodada_atual) || rodadas?.[rodadas.length - 1];

  let textoPartidas = '';
  if (rodada?.partidas?.length) {
    rodada.partidas.forEach((p) => {
      textoPartidas += formatPartida(p);
    });
  } else {
    textoPartidas = '_Sem jogos disponíveis para exibição._\n';
  }

  return (
    `⚽ *JOGOS DO BRASILEIRÃO SÉRIE ${serie}*\n` +
    `📌 *${rodada?.rodada || 'Rodada Atual'}* ${rodada?.inicio ? `(Início: ${rodada.inicio})` : ''}\n\n` +
    `${textoPartidas}`.trim()
  );
};

export const formatClube = (
  clube: TimeBrasileirao,
  matchInfo: { partida: PartidaBrasileirao; rodada: string } | null,
  serie: 'A' | 'B',
): string => {
  const pos = parseInt(clube.posicao, 10);
  const statusEmoji = pos <= 4 ? '🟢' : pos <= 16 ? '⚫' : '🔴';

  let textoJogo = '_Nenhum confronto localizado na rodada atual._';
  if (matchInfo) {
    textoJogo =
      `📌 *${matchInfo.rodada}:*\n` +
      formatPartida(matchInfo.partida).trim();
  }

  return (
    `🛡️ *${clube.nome.toUpperCase()}* (Série ${serie})\n\n` +
    `📍 Posição: ${statusEmoji} *${clube.posicao}º lugar*\n` +
    `🎯 Pontos: *${clube.pontos}* pts\n` +
    `📈 Aproveitamento: *${clube.aproveitamento}*\n\n` +
    `📊 *Estatísticas:*\n` +
    `• Jogos: *${clube.jogos}*\n` +
    `• Vitórias: *${clube.vitorias}*\n` +
    `• Empates: *${clube.empates}*\n` +
    `• Derrotas: *${clube.derrotas}*\n` +
    `• Gols Pró: *${clube.gols_pro}*\n` +
    `• Gols Contra: *${clube.gols_contra}*\n` +
    `• Saldo de Gols: *${clube.saldo_gols}*\n\n` +
    `⚔️ *Próximo / Confronto da Rodada:*\n` +
    `${textoJogo}`
  ).trim();
};

export const formatResumoChampions = (resultado: ResultadoBrasileirao): string => {
  const { tabela, rodadas } = resultado;
  const rodada = rodadas?.find((r) => r.rodada_atual) || rodadas?.[rodadas.length - 1];

  const top8 = tabela.slice(0, 8);
  const playoffs = tabela.slice(8, 24);

  let textoTop8 = '';
  top8.forEach((t) => {
    textoTop8 += `🟢 ${t.posicao}º *${t.nome}* - *${t.pontos}* pts (${t.jogos}J | ${t.vitorias}V | SG: ${t.saldo_gols})\n`;
  });

  let textoPlayoffs = '';
  playoffs.slice(0, 8).forEach((t) => {
    textoPlayoffs += `🟡 ${t.posicao}º *${t.nome}* - *${t.pontos}* pts (${t.jogos}J | SG: ${t.saldo_gols})\n`;
  });
  textoPlayoffs += `   _... e mais 8 clubes na zona de repescagem (9º ao 24º)_\n`;

  let textoPartidas = '';
  if (rodada?.partidas?.length) {
    rodada.partidas.slice(0, 8).forEach((p) => {
      textoPartidas += formatPartida(p);
    });
    if (rodada.partidas.length > 8) {
      textoPartidas += `_... e mais ${rodada.partidas.length - 8} confrontos da rodada. Digite \`!champions jogos\` para ver todos._\n`;
    }
  } else {
    textoPartidas = '_Sem jogos disponíveis para exibição no momento._\n';
  }

  return (
    `🏆 *UEFA CHAMPIONS LEAGUE* 🏆\n\n` +
    `⭐ *Top 8 (Vaga Direta nas Oitavas):*\n${textoTop8}\n` +
    `⚡ *Playoffs / Repescagem (9º ao 24º):*\n${textoPlayoffs}\n` +
    `📌 *${rodada?.rodada || 'Rodada Atual'}:*\n\n` +
    `${textoPartidas}\n` +
    `💡 _Dica: Digite \`!champions tabela\` para a tabela de 36 clubes ou \`!champions <time>\` (ex: !champions real madrid)_`
  ).trim();
};

export const formatTabelaChampions = (resultado: ResultadoBrasileirao): string => {
  const { tabela } = resultado;
  let textoTabela = '';

  tabela.forEach((t) => {
    const pos = parseInt(t.posicao, 10);
    const emoji = pos <= 8 ? '🟢' : pos <= 24 ? '🟡' : '🔴';
    textoTabela += `${emoji} ${t.posicao}º *${t.nome}*\n   └ P: *${t.pontos}* | J: ${t.jogos} | V: ${t.vitorias} | E: ${t.empates} | D: ${t.derrotas} | SG: ${t.saldo_gols}\n`;
  });

  return (
    `📊 *TABELA COMPLETA - UEFA CHAMPIONS LEAGUE*\n\n` +
    `🟢 1º ao 8º: Oitavas de Final Direta\n` +
    `🟡 9º ao 24º: Playoffs (Repescagem)\n` +
    `🔴 25º ao 36º: Eliminados\n\n` +
    `${textoTabela}\n` +
    `💡 _Para ver os jogos: \`!champions jogos\`_`
  ).trim();
};

export const formatJogosChampions = (resultado: ResultadoBrasileirao): string => {
  const { rodadas } = resultado;
  const rodada = rodadas?.find((r) => r.rodada_atual) || rodadas?.[rodadas.length - 1];

  let textoPartidas = '';
  if (rodada?.partidas?.length) {
    rodada.partidas.forEach((p) => {
      textoPartidas += formatPartida(p);
    });
  } else {
    textoPartidas = '_Sem jogos disponíveis para exibição no momento._\n';
  }

  return (
    `🏆 *JOGOS DA UEFA CHAMPIONS LEAGUE*\n` +
    `📌 *${rodada?.rodada || 'Rodada Atual'}* ${rodada?.inicio ? `(Início: ${rodada.inicio})` : ''}\n\n` +
    `${textoPartidas}`.trim()
  );
};

export const formatClubeChampions = (
  clube: TimeBrasileirao,
  matchInfo: { partida: PartidaBrasileirao; rodada: string } | null,
): string => {
  const pos = parseInt(clube.posicao, 10);
  const statusEmoji = pos <= 8 ? '🟢' : pos <= 24 ? '🟡' : '🔴';
  const zonaTexto =
    pos <= 8
      ? 'Zona de Oitavas Diretas (Top 8)'
      : pos <= 24
        ? 'Zona de Playoffs / Repescagem'
        : 'Zona de Eliminação';

  let textoJogo = '_Nenhum confronto localizado na rodada atual._';
  if (matchInfo) {
    textoJogo =
      `📌 *${matchInfo.rodada}:*\n` +
      formatPartida(matchInfo.partida).trim();
  }

  return (
    `🛡️ *${clube.nome.toUpperCase()}* (Champions League)\n\n` +
    `📍 Posição: ${statusEmoji} *${clube.posicao}º lugar* (${zonaTexto})\n` +
    `🎯 Pontos: *${clube.pontos}* pts\n` +
    `📈 Aproveitamento: *${clube.aproveitamento}*\n\n` +
    `📊 *Estatísticas:*\n` +
    `• Jogos: *${clube.jogos}*\n` +
    `• Vitórias: *${clube.vitorias}*\n` +
    `• Empates: *${clube.empates}*\n` +
    `• Derrotas: *${clube.derrotas}*\n` +
    `• Gols Pró: *${clube.gols_pro}*\n` +
    `• Gols Contra: *${clube.gols_contra}*\n` +
    `• Saldo de Gols: *${clube.saldo_gols}*\n\n` +
    `⚔️ *Próximo / Confronto da Rodada:*\n` +
    `${textoJogo}`
  ).trim();
};
