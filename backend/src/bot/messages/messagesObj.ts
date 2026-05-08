import { BotData } from '../../configs/configBot/BotData.js';

export function commandInfo() {
  const botInfo = BotData.get();
  const { prefix: prefixo, name: nome_bot } = botInfo || {};
  const comandos = {
    //COMANDOS INFO
    info: {
      menu: {
        descricao: '',
        guia: `🤖 *[Comando: menu]*\n🧠 Sintaxe: *\`${prefixo}menu\`*\n📡 Descrição: Exibe a central de comandos disponíveis.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_comum:
            '⟪ ⚡ M@ste® Bot System ⚡ ⟫\n⇉ USER INTERFACE ONLINE ⇇\n\n🧑‍💻 Olá, *{p1}*\n' +
            '🛰️ Tipo de Usuário : *{p2}*\n' +
            '🧾 Comandos feitos : *{p3}*\n',
          resposta_comum_grupo:
            '⟪ ⚡ M@ste® Bot System ⚡ ⟫\n⇉ USER INTERFACE ONLINE ⇇\n\n🧑‍💻 Olá, *{p1}*\n' +
            '🛰️ Tipo de Usuário : *{p2}*\n' +
            '🧾 Comandos feitos : *{p3}*\n' +
            '💥 Advertências : *{p4}/3*\n',
          resposta_limite_diario:
            '⟪ ⚡ M@ste® Bot System ⚡ ⟫\n⇉ USER INTERFACE ONLINE ⇇\n\n🧑‍💻 Olá, *{p1}*\n' +
            '⚠️ Limite diário : *{p2}/{p3}*\n' +
            '🛰️ Tipo de Usuário : *{p4}*\n' +
            '🧾 Comandos feitos : *{p5}*\n',
          resposta_limite_diario_grupo:
            '⟪ ⚡ M@ste® Bot System ⚡ ⟫\n⇉ USER INTERFACE ONLINE ⇇\n\n🧑‍💻 Olá, *{p1}*\n' +
            '⚠️ Limite diário : *{p2}/{p3}*\n' +
            '🛰️ Tipo de Usuário : *{p4}*\n' +
            '🧾 Comandos feitos : *{p5}*\n' +
            '💥 Advertências : *{p6}/3*\n',
        },
      },

      meusdados: {
        descricao: '',
        guia: `Ex: *${prefixo}meusdados* - Exibe seus dados gerais como comandos, mensagens, tipo de usuário, etc.\n`,
        msgs: {
          resposta_geral:
            '[🤖*SEUS DADOS DE USO*🤖]\n\n' +
            'Tipo de usuário : *{p1}*\n' +
            'Nome : *{p2}*\n' +
            'Total de comandos usados : *{p3}* comandos\n',
          resposta_limite_diario:
            'Comandos usados hoje : *{p1}/{p2}*\n' + 'Limite diário : *{p3}*\n',
          resposta_grupo: 'Mensagens neste grupo : *{p1}* mensagens\n',
        },
      },
    },
    //COMANDOS UTILIDADES
    utilidades: {
      brasileirao: {
        descricao: '',
        guia:
          `Ex: *${prefixo}brasileirao* - Exibe a tabela e a rodada atual do Brasileirão Serie A.\n` +
          `Ex: *${prefixo}brasileirao* B - Exibe a tabela e a rodada atual do Brasileirão Serie B.\n`,
        msgs: {
          erro_serie:
            '[❗] A série digitada não é suportada, atualmente são suportados apenas A e B.',
          resposta:
            '⚽ BRASILEIRÃO SERIE {p1} ⚽ \n\n' +
            'Tabela :\n' +
            '{p2}\n\n' +
            'Rodada Atual :\n\n' +
            '{p3}\n',
          tabela_item: '- {p1}° {p2} - P:{p3} J:{p4} V:{p5}\n',
          partida_item:
            '- Partida : {p1} x {p2} \n' +
            '- Data : {p3} \n' +
            '- Local : {p4} \n' +
            '- Resultado : {p5}\n\n',
        },
      },
      encurtar: {
        descricao: '',
        guia: `Ex: *${prefixo}encurtar* link - Encurta o link digitado.\n`,
        msgs: {
          resposta: '✂️ ENCURTADOR DE LINKS ✂️\n\n' + '*Link :* {p1}\n',
        },
      },
      upimg: {
        descricao: '',
        guia: `Ex: Envie/responda uma *imagem* com *${prefixo}upimg* - Faz upload da imagem e retorna o link.\n`,
        msgs: {
          resposta: '🖼️ UPLOAD DE IMAGEM 🖼️\n\n' + '*Link :* {p1}\n',
        },
      },
      master: {
        descricao: '',
        guia: `Ex: *${prefixo}master* texto - Recebe uma resposta do CHAT GPT de acordo com o texto.\n`,
        msgs: {
          resposta: '🤖 M@ste® Bot:\n\n' + '{p1}',
          sem_api:
            '[❗] A chave de acesso ao Chat GPT não foi configurada, utilize o comando *${prefixo}apis openai* para configurar.',
          sem_resposta: '[❗] Nenhuma resposta foi gerada pelo M@ste®.',
          on: '✅ OpenAi Ativado com sucesso.',
          off: '❌ OpenAi Desativado com sucesso.',
        },
      },
      criarimg: {
        descricao: '',
        guia: `Ex: *${prefixo}criarimg* texto - Criar uma imagem de acordo com o texto usando IA.\n`,
        msgs: {
          espera: '[AGUARDE] 📸 Sua imagem está sendo gerada pela IA, pode levar entre 20-40s.',
        },
      },
      tabela: {
        descricao: '',
        guia: `Ex: *${prefixo}tabela* - Exibe a tabela de letras para criação de nicks.\n`,
        msgs: {
          resposta: '🤖 Tabela de Nicks :\n\n' + '{p1}',
        },
      },
      rbg: {
        descricao: '',
        guia: `Ex: Envie/responda uma *imagem* com *${prefixo}rbg* - Retira o fundo da imagem.\n\n`,
        msgs: {
          invalido: '[❗] Este comando só funciona com IMAGENS.',
          espera: '[AGUARDE] 📸 O fundo da imagem está sendo removido.',
          sem_api_key: '[❗] A chave da API para remover fundo não está configurada.',
        },
      },

      voz: {
        descricao: '',
        guia:
          `🤖 *[Comando: menu]*\n🧠 Sintaxe: *\`${prefixo}voz pt texto\`*\n📡 Descrição: Envie um texto ou responde um texto e ele enviara um audiocom o texto narrado.\n> ⌬ Estabelecendo conexão com o servidor..\n\n` +
          `Idiomas suportados : \n` +
          `- 🇧🇷 Português (pt)\n` +
          `- 🇺🇸 Inglês (en)\n` +
          `- 🇯🇵 Japonês (jp)\n` +
          `- 🇮🇹 Italiano (it)\n` +
          `- 🇪🇸 Espanhol (es)\n` +
          `- 🇷🇺 Russo (ru)\n` +
          `- 🇰🇷 Coreano (ko)\n` +
          `- 🇸🇪 Sueco (sv)\n`,
        msgs: {
          texto_vazio: '[❗] Tu é idiota, cadê o texto do comando?',
          texto_longo: '[❗] Texto muito longo.',
          erro_audio: '[❗] Houve um erro na criação do áudio',
          nao_suportado:
            '[❗] Sem dados do idioma ou idioma não suportado. Atualmente suportamos :\n\n' +
            `- 🇧🇷 Português - ${prefixo}voz pt\n` +
            `- 🇺🇸 Inglês - ${prefixo}voz en\n` +
            `- 🇯🇵 Japonês - ${prefixo}voz ja\n` +
            `- 🇮🇹 Italiano - ${prefixo}voz it\n` +
            `- 🇪🇸 Espanhol - ${prefixo}voz es\n` +
            `- 🇷🇺 Russo - ${prefixo}voz ru\n` +
            `- 🇰🇷 Coreano - ${prefixo}voz ko\n` +
            `- 🇸🇪 Sueco - ${prefixo}voz sv\n`,
        },
      },
      letra: {
        descricao: '',
        guia: `Ex: *${prefixo}letra* nome-musica - Exibe a letra da música que você digitou.\n`,
        msgs: {
          resposta:
            '🎼 LETRA DE MÚSICA 🎼\n\n' + 'Música : *{p1}*\n' + 'Artista : *{p2}*\n\n' + '{p3}',
        },
      },
      noticias: {
        descricao: '',
        guia: `Ex: *${prefixo}noticias* - Exibe as notícias atuais.\n`,
        msgs: {
          resposta_titulo: '〘🗞️ ULTIMAS NOTÍCIAS 〙\n\n',
          resposta_itens:
            '➥ 📰 *{p1}* \n' + 'Publicado por *{p2}* há *{p3}*\n' + '*Link* : {p4}\n\n',
        },
      },
      rastreio: {
        descricao: '',
        guia: `Ex: *${prefixo}rastreio* PBXXXXXXXXXXX - Exibe o rastreio da encomenda dos correios que você digitou.\n`,
        msgs: {
          codigo_invalido: '[❗] Código de rastreio deve ter 13 digitos.',
          resposta_titulo: '📦📦*RASTREIO*📦📦\n\n',
          resposta_itens: 'Status : {p1}\n' + 'Data : {p2}\n' + 'Hora : {p3}\n' + '{p4}\n',
        },
      },
      calc: {
        descricao: '',
        guia:
          `Ex: *${prefixo}calc* 8x8 - Exibe o resultado do cálculo.\n\n` +
          `Ex: *${prefixo}calc* 1mm em 1km - Exibe o resultado do conversão de medidas.\n`,
        msgs: {
          resposta: '🧮 O resultado é *{p1}* ',
        },
      },
      pesquisa: {
        descricao: '',
        guia: `Ex: *${prefixo}pesquisa* tema - Faz uma pesquisa com o tema que você digitar.\n`,
        msgs: {
          resposta_titulo: '🔎 Resultados da pesquisa de : *{p1}*🔎\n\n',
          resposta_itens: '🔎 {p1}\n' + '*Link* : {p2}\n\n' + '*Descrição* : {p3}\n\n',
        },
      },
      moeda: {
        descricao: '',
        guia:
          `Ex: *${prefixo}moeda* real 20 - Converte 20 reais para outras moedas\n\n` +
          `Ex: *${prefixo}moeda* dolar 20 - Converte 20 dólares para outras moedas.\n\n` +
          `Ex: *${prefixo}moeda* euro 20 - Converte 20 euros para outras moedas.\n`,
        msgs: {
          resposta_completa: '💵 Conversão - *{p1} {p2}*\n' + '{p3}',
          resposta_item:
            '----------------------------\n' +
            '*Conversão* : {p1}\n' +
            '*Valor convertido* : *{p2}* {p3}\n' +
            '*Última atualização* : {p4}\n\n',
        },
      },
      clima: {
        descricao: '',
        guia: `Ex: *${prefixo}clima* Rio de Janeiro - Mostra o clima atual para o Rio de Janeiro.\n`,
        msgs: {
          erro: `[❌] - Não consegui encontrar o clima para: {p1}`,
          resposta: {
            clima_atual:
              `🌤️ *Clima em {p1}*\n\n` +
              `🌡️ Temperatura: {p2}°C\n` +
              `{p7} sensação: {p3}°C\n` +
              `💨 Vento: {p4} km/h\n` +
              `💧 Umidade: {p5}%\n` +
              `📌 Condição: {p6}`,
          },
        },
      },
      ddd: {
        descricao: '',
        guia:
          `Ex: *${prefixo}ddd* 21 - Exibe qual estado e região do DDD 21.\n\n` +
          `Ex: Responda com *${prefixo}ddd* - Exibe qual estado e região do membro respondido.\n`,
        msgs: {
          somente_br: '[❗] Esse comando só é aceito com números brasileiros.',
          resposta: '📱 Estado : *{p1}* / Região : *{p2}*',
        },
      },
      qualmusica: {
        descricao: '',
        guia:
          `Ex: Envie/responda um audio/video com *${prefixo}qualmusica* - Procura a música tocada no audio/video.\n\n` +
          `*Obs*: Este comando funciona apenas com *AUDIO/VIDEO*.\n`,
        msgs: {
          espera: '⏳ Em andamento, estou procurando sua música.',
          resposta:
            '💿 Reconhecimento de Música\n\n' +
            'Título: *{p1}*\n' +
            'Produtora: {p2}\n' +
            'Duração : *{p3}*\n' +
            'Lançamento: *{p4}*\n' +
            'Album: *{p5}*\n' +
            'Artistas: *{p6}*\n',
        },
      },
      pix: {
        descricao: '',
        guia: `Ex: *${prefixo}pix* - Envia a chave Pix para apoiar o criador do bot.\n`,
        msgs: {
          resposta: `💰 Olá *{p1}!*
Aqui está a *chave Pix* para apoiar o criador do bot 👇.\n\n*Importante:* Valores acima de R$2,00 reais usuário será *VIP*.\n\nAo enviar o *PIX* adicione o DDD + número na descrição do *PIX* ou envie para meu dono: @{p2}\n\nDigite ${prefixo}vantagens para saber as vantagens dos planos.`,
        },
      },
      vantagens: {
        descricao: '',
        guia: `Ex: *${prefixo}vantagens* - Mostra as vantagens do bot.\n`,
        msgs: {
          resposta: `
💎 *VANTAGENS PREMIUM & VIP* 💎

👤 *Usuário Comum*
- Acesso limitado aos comandos básicos.
- Sujeito a limite diário de uso.

💠 *Usuário Premium*
- Acesso liberado a quase todos os comandos.
- Limite diário muito maior.
- Prioridade de resposta do bot.
- Suporte básico via PV.

👑 *Usuário VIP*
- Acesso total a *todos os recursos* do bot.
- Sem limites de comandos.
- Respostas mais rápidas.
- Recursos beta e exclusivos.
- Suporte personalizado direto com o criador.

💬 Use: *${prefixo}pix* para apoiar e se tornar Premium/VIP. Valores para PREMIUM de R$5,00 até R$10,00, para VIP acima de R$10,00
    `,
        },
      },
      megasena: {
        descricao: '',
        guia:
          `🎲 Mega-Sena\n` +
          `Ex: *${prefixo}megasena* qtd [dezenas 6-15] [sorte N]\n` +
          `- Gera \`qtd\` jogos aleatórios, com opção de escolher de 6 a 15 dezenas por jogo.\n` +
          `- Use "sorte N" para marcar um número da sorte (1–60).\n\n` +
          `Exemplos:\n` +
          `- ${prefixo}megasena 5\n` +
          `- ${prefixo}megasena 3 8 sorte 13\n`,
        msgs: {},
      },
      lotofacil: {
        descricao: '',
        guia:
          `🎲 Lotofácil\n` +
          `Ex: *${prefixo}lotofacil* qtd [dezenas 15-20] [inicio N]\n` +
          `- Gera \`qtd\` jogos aleatórios, com opção de escolher de 15 a 20 dezenas por jogo.\n` +
          `- Use "inicio N" para marcar um número de inicio (1–10).\n\n` +
          `Exemplos:\n` +
          `- ${prefixo}lotofacil 2\n` +
          `- ${prefixo}lotofacil 3 18 inicio 7\n`,
        msgs: {},
      },
      quina: {
        descricao: '',
        guia:
          `🎲 Quina\n` +
          `Ex: *${prefixo}quina* qtd [dezenas 5-15] [sorte N]\n` +
          `- Gera \`qtd\` jogos aleatórios, com opção de escolher de 5 a 15 dezenas por jogo.\n` +
          `- Use "sorte N" para marcar um número da sorte (1–80).\n\n` +
          `Exemplos:\n` +
          `- ${prefixo}quina 4\n` +
          `- ${prefixo}quina 5 10 sorte 80\n`,
        msgs: {},
      },
      loterias: {
        descricao: '',
        guia:
          `🎰 Loterias disponíveis:\n\n` +
          `- ${prefixo}megasena qtd [dezenas 6-15] [sorte N]\n` +
          `- ${prefixo}lotofacil qtd [dezenas 15-20] [sorte N]\n` +
          `- ${prefixo}quina qtd [dezenas 5-15] [sorte N]\n\n` +
          `Use "sorte N" para destacar um número da sorte no jogo.`,
        msgs: {},
      },
      xp: {
        descricao: '',
        guia: `Ex: *${prefixo}xp* - Mostra seu XP total, XP dos últimos 30 dias e seu tier atual.\n`,
        msgs: {},
      },
      meuref: {
        descricao: '',
        guia: `Ex: *${prefixo}meuref* - Mostra seu código de convite para indicar amigos.\n`,
        msgs: {},
      },
      usaref: {
        descricao: '',
        guia: `Ex: *${prefixo}usaref* codigo - Usa um código de convite e dá XP ao convidador.\n\nObs: só funciona se você usar no grupo ofocial do bot.\n\nDigite: *${prefixo}grupooficial* para ver o link do grupo.`,
        msgs: {
          ja_ativado: 'Este número já ativou um código anteriormente.',
          sucesso: 'Código aplicado com sucesso! O convidador recebeu o XP.',
        },
      },
      topxp: {
        descricao: '',
        guia: `Ex: *${prefixo}topxp* [semanal|mensal|geral] [quantidade] - Mostra o ranking de XP no período e permite limitar o número de resultados.\nEx: *${prefixo}topxp* 5 - Mostra os 5 primeiros no ranking geral.\nEx: *${prefixo}topxp* mensal 10 - Mostra os 10 primeiros no ranking mensal.`,
        msgs: {},
      },
      cep: {
        descricao: '',
        guia: `Ex: *${prefixo}cep* 00000000 - Busca informações de um CEP.\n`,
        msgs: {
          erro_cep: 'Por favor, insira um CEP válido com 8 dígitos.\n\nEx: 12345678',
          erro_busca: `❌ Não foi possível encontrar informações para o CEP {p1}. Por favor, verifique se o CEP está correto e tente novamente.`,
          espera: '⏳ Em andamento, estou buscando as informações do CEP.',
        },
      },
    },
    //COMANDOS FIGURINHAS
    figurinhas: {
      s: {
        descricao: '',
        guia: `🤖 *[Comando: s]*\n🧠 Sintaxe: *\`${prefixo}s\`*\n📡 Descrição: Ex: Envie/responda uma *IMAGEM/VIDEO* com *${prefixo}s* - Transforma em sticker.\nEx: Envie/responda uma *VIDEO* com *${prefixo}s 1* - Transforma em sticker quadrado recortando o video.\nEx: Envie/responda uma *IMAGEM/VIDEO* com *${prefixo}s 2* - Transforma em sticker circular.\n> ⌬ Estabelecendo conexão com o servidor..\n`,
        msgs: {
          erro_video: '[❗] Envie um video/gif com no máximo 10 segundos.',
          espera: `⏳ Em andamento, seu sticker será enviado em breve.`,
        },
      },
      simg: {
        descricao: '',
        guia: `🤖 *[Comando: simg]*\n🧠 Sintaxe: *\`${prefixo}simg\`*\n📡 Descrição: Transforma sua figurinha estática em imagem.\n> ⌬ Estabelecendo conexão com o servidor...\n\n*Obs*: Este comando funciona apenas com *STICKERS NÃO ANIMADOS*.\n`,
        msgs: {
          erro_sticker: `[❗] Este comando é válido apenas para stickers.`,
        },
      },
      sgif: {
        descricao: '',
        guia: `🤖 *[Comando: sgif]*\n🧠 Sintaxe: *\`${prefixo}sgif\`*\n📡 Descrição: Transforma sua figurinha animada em gif.\n> ⌬ Estabelecendo conexão com o servidor...\n\n*Obs*: Este comando funciona apenas com *STICKERS ANIMADOS*.\n`,
        msgs: {
          erro_sticker: `[❗] Este comando é válido apenas para stickers.`,
        },
      },

      ssf: {
        descricao: '',
        guia: `🤖 *[Comando: ssf]*\n🧠 Sintaxe: *\`${prefixo}ssf\`*\n📡 Descrição: Envie/responda uma *IMAGEM* com *${prefixo}ssf* - Remove o fundo e transforma em sticker.\n> ⌬ Estabelecendo conexão com o servidor...\n\n*Obs*: Este comando funciona apenas com *IMAGENS*.\n`,
        msgs: {
          espera: `[AGUARDE] 📸 O fundo da imagem está sendo removido e o sticker será enviado em breve.`,
          erro_imagem: `[❗] Este comando é válido apenas para imagens.`,
          erro_remover: `[❗] Houve um erro no servidor para remover o fundo da imagem, tente mais tarde.`,
        },
      },

      emojimix: {
        descricao: '',
        guia: `🤖 *[Comando: emojimix]*\n🧠 Sintaxe: *\`${prefixo}emojimix 😀+💩\`*\n📡 Descrição: Junta dois emojis e transforma em sticker.\n> ⌬ Estabelecendo conexão com o servidor...\n\n*Obs*: Nem todos os emojis são compatíveis, tente diferentes combinações.\n`,
        msgs: {
          erro: '',
          espera: '⏳ Em andamento , estou transformando seus emojis em sticker.',
        },
      },

      emojimg: {
        descricao: '',
        guia: `🤖 *[Comando: emojimg]*\n🧠 Sintaxe: *\`${prefixo}emojimg 😀\`*\n📡 Descrição: Transforma um emoji em sticker.\n> ⌬ Estabelecendo conexão com o servidor...\n`,
        msgs: {
          erro: '',
          espera: '⏳ Em andamento , estou transformando seu emoji em sticker.',
        },
      },

      tps: {
        descricao: '',
        guia: `🤖 *[Comando: tps]*\n🧠 Sintaxe: *\`${prefixo}tps texto\`*\n📡 Descrição: Transforma o texto em sticker.\n> ⌬ Estabelecendo conexão com o servidor...\n`,
        msgs: {
          texto_longo: '[❗] Texto é muito longo, no máximo 30 caracteres.',
          espera: '⏳ Em andamento , estou transformando seu texto em sticker.',
        },
      },

      atps: {
        descricao: '',
        guia: `🤖 *[Comando: atps]*\n🧠 Sintaxe: *\`${prefixo}atps texto\`*\n📡 Descrição: Transforma o texto em *sticker animado*.\n> ⌬ Estabelecendo conexão com o servidor...\n`,
        msgs: {
          texto_longo: '[❗] Texto é muito longo, no máximo 30 caracteres.',
          espera: '⏳ Em andamento , estou transformando seu texto em sticker animado.',
        },
      },

      snome: {
        descricao: '',
        guia: `🤖 *[Comando: snome]*\n🧠 Sintaxe: *\`${prefixo}snome nomePack, autor\`*\n📡 Descrição: Responda um *STICKER* com esse comando para renomear o pack e o autor do sticker.\n> ⌬ Estabelecendo conexão com o servidor...\n`,
        msgs: {
          erro: '',
        },
      },

      smeme: {
        descricao: '',
        guia: `🤖 *[Comando: smeme]*\n🧠 Sintaxe: *\`${prefixo}smeme textoCima, textoBaixo\`*\n📡 Descrição: Envie/responda uma imagem/vídeo com esse comando e textos para gerar um sticker estilo meme.\n> ⌬ Estabelecendo conexão com o servidor...\n`,
        msgs: {
          espera: '⏳ Em andamento , estou transformando sua imagem/vídeo com texto em figurinha.',
          erro: '[❗] - Esse comando só funciona com imagens ou vídeos. Responda ou envie uma imagem/vídeo com o comando.',
        },
      },

      nomepack: {
        descricao: '',
        guia: `🤖 *[Comando: nomepack]*\n🧠 Sintaxe: *\`${prefixo}nomepack M@ster\`*\n📡 Descrição: Configura o nome do pack padrão dos stickers criados.\n> ⌬ Estabelecendo conexão com o servidor...\n`,
        msgs: {
          sucesso: '✅ Nome do pack alterado com sucesso.',
          texto_longo: '[❗] - Nome do pack muito longo, permitido até 50 caracteres.',
          erro: '',
        },
      },

      nomeautor: {
        descricao: '',
        guia: `🤖 *[Comando: nomeautor]*\n🧠 Sintaxe: *\`${prefixo}nomeautor M@ster\`*\n📡 Descrição: Configura o nome do autor padrão dos stickers criados.\n> ⌬ Estabelecendo conexão com o servidor...\n`,
        msgs: {
          sucesso: '✅ Nome do autor alterado com sucesso.',
          texto_longo: '[❗] - Nome do autor muito longo, permitido até 50 caracteres.',
          erro: '',
        },
      },
    },
    //COMANDOS DIVERSÃO
    diversao: {
      simi: {
        descricao: '',
        guia: `🤖 *[Comando: simi]*\n🧠 Sintaxe: *\`${prefixo}simi texto\`*\n📡 Descrição: Sua pergunta será respondida pela SimSimi.\n> ⌬ Estabelecendo conexão com o servidor...\n`,
        msgs: {
          resposta: `🐤 *SIMI* : \n\n` + `{p1}`,
          sem_api: `[❗] - Nenhuma chave de API foi fornecida para o comando *${prefixo}simi*, use o comando *${prefixo}apis* para adicionar uma chave de API.`,
        },
      },
      viadometro: {
        descricao: '',
        guia:
          `🤖 *[Comando: ${prefixo}viadometro]*\n🧠 Sintaxe: *\`${prefixo}viadometro <@membro>\`*\n📡 Descrição: Mede o nível de viadagem do membro mencionado.\n> ⌬ Calculando o nível de viadagem...\n\n` +
          `Ex: *${prefixo}viadometro* @membro - Mede o nível de viadagem do membro mencionado.\n\n` +
          `Ex: Responder com *${prefixo}viadometro* - Mede o nível de viadagem do membro respondido.\n`,
        msgs: {
          respostas: [
            ' 0%\n\n - ESSE É MACHO ',
            '██                 20% \n\n - HMMMMM, SE NÃO VIROU TA DANDO SETA 🌝',
            '████             40%\n\n - JÁ MAMOU O PRIMO',
            '██████         60%\n\n - EITA MAMOU O BONDE',
            '████████     80%\n\n - JÁ SENTOU EM ALGUEM',
            '██████████ 100%\n\n - BIXONA ALERTA VERMELHO CUIDADO COM SEUS ORGÃOS SEXUAIS',
          ],
          apenas_um: '[❗] Erro: Apenas um membro por vez deve ser mencionado.',
          resposta: '🧩 *VIADÔMETRO* - {p1}',
        },
      },
      roletarussa: {
        descricao: '',
        guia: `🤖 *[Comando: ${prefixo}roletarussa]*\n🧠 Sintaxe: *\`${prefixo}roletarussa\`*\n📡 Descrição: Bane aleatoriamente um membro do grupo. (admins)\n> ⌬ Girando o tambor da sorte...\n*Obs*: Comando apenas para administradores, pode banir qualquer um exceto o dono do grupo e o BOT.\n`,
        msgs: {
          sem_membros: '[❗] Não existe membros válidos para participarem da roleta.',
          espera: '🎲 Sorteando uma vítima 🎲',
          motivo: 'Selecionado pela roleta',
          resposta: '🔫 Você foi o escolhido @{p1}, até a próxima.',
        },
      },
      casal: {
        descricao: '',
        guia: `💘 *[Comando: ${prefixo}casal]*\n🧠 Sintaxe: *\`${prefixo}casal\`*\n📡 Descrição: Escolhe duas pessoas aleatórias do grupo para formar um casal romântico.\n> 💞 Amor está no ar...`,
        msgs: {
          minimo: '[❗] Este comando precisa de no mínimo 2 membros no grupo.',
          resposta: '👩‍❤️‍👨 Está rolando um clima entre @{p1} e @{p2}',
        },
      },

      tapa: {
        descricao: '',
        guia: `Ex: Responda ou @mencione um usuario com o comando *${prefixo}tapa* ele enviará um tapa em video.`,
        msgs: {
          resposta: 'Você acabou de dar um tapa na rabetona da(o) 😏 @{p1} 😈 safada(o)!',
          bot: '[❗] *ATENÇÃO* - O bot não pode ser tapado!',
          dono: '[❗] *ATENÇÃO* - O dono do bot não pode ser tapado! 😏',
        },
      },
      gadometro: {
        descricao: '',
        guia: `📟 *[Comando: ${prefixo}gadometro]*\n🧠 Sintaxe:\n- *\`${prefixo}gadometro @membro\`*\n- Responder com *\`${prefixo}gadometro\`*\n📡 Descrição: Mede o nível de gadisse do membro mencionado ou respondido.\n> 🧐 Será que é um gadinho ou um gadão?`,
        msgs: {
          respostas: [
            ' 0%\n\n - ESSE NÃO É GADO ',
            '🐃 20% \n\n - GADO APRENDIZ, TÁ NO CAMINHO ',
            '🐃🐃 40%\n\n - GADO INTERMEDIÁRIO, JÁ INVADE PV DE UMAS E PENSA EM PAGAR PACK DE PEZINHO',
            '🐃🐃🐃 60%\n\n - CUIDADO : GADO EXPERIENTE, INVADE PV E FALA LINDA EM TODAS FOTOS',
            '🐃🐃🐃🐃 80%\n\n - ALERTA : GADO MASTER, SÓ APARECE COM MULHER ON',
            '🐃🐃🐃🐃🐃 100%\n\n - PERIGO : GADO MEGA BLASTER ULTRA PAGA BOLETO DE MULHER QUE TEM NAMORADO',
          ],
          apenas_um: '[❗] Erro: Apenas um membro por vez deve ser mencionado.',
          resposta: '🧩 *GADÔMETRO* - {p1}',
        },
      },
      top5: {
        descricao: '',
        guia: `🤖 *[Comando: ${prefixo}top5]*\n🧠 Sintaxe:\n- *\`${prefixo}top5 tema\`*\n📡 Descrição: Exibe um ranking de 5 membros aleatórios com o tema escolhido.\n> 🏆 Ex: *${prefixo}top5 mais bonitos do grupo*`,
        msgs: {
          erro_membros: '[❗] O grupo deve ter no mínimo 5 membros para usar este comando.',
          resposta_titulo: '╔══✪〘🏆 TOP 5 {p1} 🏆 〙\n╠\n',
          resposta_itens: '╠➥ {p1} {p2}° Lugar @{p3}\n',
        },
      },
      par: {
        descricao: '',
        guia: `🤖 *[Comando: ${prefixo}par]*\n🧠 Sintaxe:\n- *\`${prefixo}par @membro1 @membro2\`*\n📡 Descrição: Mede o nível de compatibilidade entre os dois membros mencionados.`,
        msgs: {
          respostas: [
            ' *0%*\n - NÃO COMBINAM ',
            '❤️ *20%* \n - HMMM TALVEZ ',
            '❤️❤️ *40%*\n - PODE ROLAR ALGO SÉRIO',
            '❤️❤️❤️ *60%*\n - UIA ESSES DOIS TEM FUTURO',
            '❤️❤️❤️❤️ *80%*\n - ESSES DOIS TEM QUÍMICA, TALVEZ UM CASAMENTO EM BREVE',
            '❤️❤️❤️❤️❤️ *100%*\n - CASAL PERFEITO: PREPAREM-SE PARA VIVER ATÉ A VELHICE JUNTOS',
          ],
          resposta: '👩‍❤️‍👨 PAR - @{p1} & @{p2}\n\n{p3}',
        },
      },

      jogodavelha: {
        descricao: '',
        guia: `🤖 *[Comando: ${prefixo}jogodavelha]*\n🧠 Sintaxe:\n- *\`${prefixo}jogodavelha @adversário\`*\n🎮 Descrição: Inicia um jogo da velha com um usuário do grupo.`,
        msgs: {
          resposta: '🧩 *JOGO DA VELHA* - @{p1} vs @{p2}',
        },
      },
      lgbt: {
        descricao: '',
        guia: `🤖 *[Comando: ${prefixo}lgbt]*\n🧠 Sintaxe:\n- Responda ou envia uma imagem com o comando *\`${prefixo}lgbt\`*\n📡 Descrição: Pinta uma imagem com as cores do LGBT.\nobs: COMANDO FUNCIONA SOMENTE COM IMAGENS.`,
        msgs: {
          espera: '[AGUARDE] 🖼️ - Sua imagem esta sendo pintada!',
          no_img: '[❗] Esse comando funciona apenas com imagens.',
        },
      },
    },
    //COMANDOS DOWNLOADS
    downloads: {
      play: {
        descricao: '',
        guia: `🎵 *[Comando: ${prefixo}play]*\n🧠 Sintaxe:\n- *\`${prefixo}play nome da música\`*\n- *\`${prefixo}play link do YouTube\`*\n📥 Descrição: Faz download de uma música do YouTube e envia como áudio.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          espera:
            '[AGUARDE] 🎧 Sua música está sendo baixada e processada.\n\n' +
            'Titulo: *{p1}*\n' +
            'Duração: *{p2}*',
          limite: '[❗] A música deve ter menos de *15 minutos*',
          erro_live: '[❗] Houve um erro de download, o bot não aceita download de lives.',
        },
      },
      yt: {
        descricao: '',
        guia: `📹 *[Comando: ${prefixo}yt]*\n🧠 Sintaxe:\n- *\`${prefixo}yt título\`*\n📥 Descrição: Faz download de um vídeo do YouTube com o título digitado e envia.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          espera:
            '[AGUARDE] 🎥 Seu video está sendo baixado e processado.\n\n' +
            'Titulo: *{p1}*\n' +
            'Duração: *{p2}*',
          limite: '[❗] O video deve ter menos de *15 minutos*',
          erro_live: '[❗] Houve um erro de download, o bot não aceita download de lives.',
          erro_restrict:
            '[❗] Não consegui obter informações do seu link, provavelmemte ele tenha alguma restrição. Tente outro link ou tente novamente mais tarde.',
        },
      },
      fb: {
        descricao: '',
        guia: `📘 *[Comando: ${prefixo}fb]*\n🧠 Sintaxe:\n- *\`${prefixo}fb link\`*\n📥 Descrição: Faz download de um vídeo do Facebook pelo link digitado e envia.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          espera:
            '[AGUARDE] 🎬 Sua mídia está sendo baixada e processada.\n\n' +
            'Titulo: *{p1}*\n' +
            'Duração: *{p2}*',
          limite: '[❗] O video deve ter menos de *5 minutos*',
          erro_link: '[❗] Animal você tem que enviar um link do Facebook. 🤬',
        },
      },
      ig: {
        descricao: '',
        guia: `📷 *[Comando: ${prefixo}ig]*\n🧠 Sintaxe:\n- *\`${prefixo}ig link\`*\n- *\`${prefixo}ig link, 2\`*\n📥 Descrição: Faz download de uma foto ou vídeo do Instagram pelo link digitado. Caso haja múltiplas mídias, é possível escolher a segunda com o número 2.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          espera: '[AGUARDE] 🎬 Sua mídia está sendo baixada e processada.',
          erro_link: '[❗] Animal você tem que enviar um link do Instagram. 🤬',
          isStoties: '[❗] Seu link é um Stories, no momento não faço download de Stories.',
        },
      },
      tk: {
        descricao: '',
        guia: `📷 *[Comando: ${prefixo}tk]*\n🧠 Sintaxe:\n- *\`${prefixo}tk link\`*\n📥 Descrição: Faz download de um vídeo do Tiktok pelo link digitado.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          espera: '[AGUARDE] 🎬 Sua mídia está sendo baixada e processada.',
          erro_link: '[❗] Animal você tem que enviar um link do Tiktok. 🤬',
        },
      },
      img: {
        descricao: '',
        guia: `🖼️ *[Comando: ${prefixo}img]*\n🧠 Sintaxe:\n- *\`${prefixo}img tema\`*\n📥 Descrição: Envia uma imagem com o tema que você digitar.\n> ⌬ Estabelecendo conexão com o servidor...`,
        espera: '[AGUARDE] 🖼️ Suas imagens estão sendo processadas.',
        msgs: {
          erro_imagem: '[❗] Não foi possível obter nenhuma imagem, tente novamente.',
        },
      },
    },
    //COMANDOS GRUPO
    grupo: {
      status: {
        descricao: '',
        guia: `🛠️ *[Comando: ${prefixo}status]*\n🧠 Sintaxe:\n- *\`${prefixo}status\`*\n📥 Descrição: Exibe as configurações atuais do grupo.\n> ⌬ Coletando informações do grupo...`,
        msgs: {
          resposta_titulo: '[ 🤖 STATUS DOS GRUPOS 🤖 ]\n\n',
          resposta_variavel: {
            bemvindo: {
              on: 'Recurso Boas Vindas : ✅\n',
              off: 'Recurso Boas Vindas : ❌\n',
            },
            mutar: {
              on: 'Recurso Mutar : ✅\n',
              off: 'Recurso Mutar : ❌\n',
            },
            autosticker: {
              on: 'Recurso Auto-Sticker : ✅\n',
              off: 'Recurso Auto-Sticker : ❌\n',
            },
            antilink: {
              on: 'Recurso Anti-Link : ✅\n' + '{p1}',
              off: 'Recurso Anti-Link : ❌\n',
              filtros: {
                instagram: '- *Instagram* ✅ - Liberado.\n',
                facebook: '- *Facebook*  ✅ - Liberado.\n',
                youtube: '- *Youtube*   ✅ - Liberado.\n',
                tiktok: '- *Tiktok*   ✅ - Liberado.\n',
              },
            },
            antiporno: {
              on:
                'Recurso Anti-Porno : ✅\n' + '- *Horário liberado:*\n- Incio: {p1}\n- Fim: {p2}\n',
              off: 'Recurso Anti-Porno : ❌\n',
            },
            antifake: {
              on: 'Recurso Anti-Fake : ✅\n' + '- *Liberados* : {p1}\n',
              off: 'Recurso Anti-Fake : ❌\n',
            },
            antiflood: {
              on: 'Recurso Anti-Flood : ✅\n' + '- Máx: *{p1}* msgs / *{p2}* s \n',
              off: 'Recurso Anti-Flood : ❌\n',
            },
            contador: {
              on: 'Recurso Contador : ✅\n' + '- {p1}\n',
              off: 'Recurso Contador : ❌\n',
            },
            openai: {
              on: 'Recurso OpenAi : ✅\n',
              off: 'Recurso OpenAi : ❌\n',
            },
            bloqueiocmds: {
              on: 'Bloqueio de comandos : ✅\n' + `{p1}\n`,
              off: 'Bloqueio de comandos : ❌\n',
            },
            listanegra: 'Lista Negra : *{p1}*\n',
          },
        },
      },
      fotogrupo: {
        descricao: '',
        guia: `🖼️ *[Comando: ${prefixo}fotogrupo]*\n🧠 Sintaxe:\n- Envie ou responda uma *imagem* com *\`${prefixo}fotogrupo\`*\n📥 Descrição: Altera a foto do grupo.\n> ⌬ Atualizando imagem do grupo...`,
        msgs: {
          sucesso: '🤖✅ A foto do GRUPO foi alterada com sucesso.',
        },
      },
      regras: {
        descricao: '',
        guia: `📜 *[Comando: ${prefixo}regras]*\n🧠 Sintaxe:\n- *\`${prefixo}regras\`*\n📥 Descrição: Exibe a descrição/regras do grupo.\n> ⌬ Buscando informações do grupo...`,
        msgs: {
          sem_descrição: '[❗] O grupo ainda não tem uma descrição.',
        },
      },
      addlista: {
        descricao: '',
        guia: `🚫 *[Comando: ${prefixo}addlista]*\n🧠 Sintaxe:\n- *\`${prefixo}addlista\`* (Responda alguém ou marque alguém)\n- *\`${prefixo}addlista +55xxxxxxxxxx\`* (Digite um número para adicionar à lista negra e banir)\n📥 Descrição: Adiciona o número da pessoa a lista negra e a bane do grupo.\n> ⌬ Processando...`,
        msgs: {
          sucesso:
            '✅ O número desse usuário foi adicionado á lista negra e será banido do grupo caso ainda esteja aqui.',
          bot_erro: '[❗] Calma, você não pode adicionar o BOT a lista negra.',
          admin_erro: '[❗] Calma, você não pode adicionar um ADMINISTRADOR a lista negra.',
          ja_listado: '[❗] Este usuário já está na lista negra.',
        },
      },
      remlista: {
        descricao: '',
        guia: `🚫 *[Comando: ${prefixo}remlista]*\n🧠 Sintaxe:\n- *\`${prefixo}remlista +55xxxxxxxxxx\`* (Digite o número para remover da lista negra)\n📥 Descrição: Remove o número digitado da lista negra do grupo.\n> ⌬ Processando...`,
        msgs: {
          sucesso: '✅ O número desse usuário foi removido da lista negra.',
          nao_listado: '[❗] Este usuário não está na lista negra.',
        },
      },
      listanegra: {
        descricao: '',
        guia: `🚫 *[Comando: ${prefixo}listanegra]*\n🧠 Sintaxe:\n- *\`${prefixo}listanegra\`* (Exibe a lista negra do grupo)\n📥 Descrição: Exibe todos os números que estão na lista negra do grupo.\n> ⌬ Recuperando dados...`,
        msgs: {
          motivo: 'Banido por estar na LISTA NEGRA',
          lista_vazia: '🤖 Não existe usuários na lista negra deste grupo.',
          resposta_titulo: '╔══✪〘❌ Lista Negra 〙✪══\n╠\n',
          resposta_itens: '╠➥ +{p1}\n',
        },
      },
      add: {
        descricao: '',
        guia: `📱 *[Comando: ${prefixo}add]*\n🧠 Sintaxe:\n- *\`${prefixo}add 5512xxxxxxxxx\`*\n- ${prefixo}add 5512xxxxxxxxx, 5512xxxxxxxxx*\n📥 Descrição: Adiciona o número com o código do país ao grupo.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          add_erro:
            '[❗] O número +{p1} não pode ser adicionado. Provavelmente está com privacidade ativada, já está no grupo ou o grupo não aceita mais membros.',
          numero_invalido:
            '[❗] Houve um erro em adicionar o número {p1}, verifique se o número existe ou tente tirar o 9.',
        },
      },
      ban: {
        descricao: '',
        guia: `🚫 *[Comando: ${prefixo}ban]*\n🧠 Sintaxe:\n- *\`${prefixo}ban @membro\`*\n- *Responda alguém com ${prefixo}ban*\n📥 Descrição: Bane um membro marcando ou respondendo ele.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          banir_admin: '[❗] O bot não pode banir um administrador',
          motivo: 'Banimento manual',
          banir_erro:
            '[❗] Não foi possível banir este membro, provavelmente ele já saiu do grupo.',
        },
      },
      promover: {
        descricao: '',
        guia: `🌟 *[Comando: ${prefixo}promover]*\n🧠 Sintaxe:\n- *\`${prefixo}promover @membro\`*\n- *Responda alguém com ${prefixo}promover*\n📥 Descrição: Promove um membro a *ADMINISTRADOR* marcando ou respondendo ele.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          erro_bot: '[❗] O BOT não pode ser promovido por ele mesmo.',
          sucesso_usuario: '➥ @{p1} virou *ADMINISTRADOR*.\n',
          erro_usuario: '➥ @{p1} já é um *ADMINISTRADOR*.\n',
          resposta: '[👤 PROMOVER MEMBROS 👤]\n\n' + '{p1}',
        },
      },
      rebaixar: {
        descricao: '',
        guia: `🔽 *[Comando: ${prefixo}rebaixar]*\n🧠 Sintaxe:\n- *\`${prefixo}rebaixar @admin\`*\n- *Responda alguém com ${prefixo}rebaixar*\n📥 Descrição: Rebaixa um administrador a *MEMBRO* marcando ou respondendo ele.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          erro_bot: '[❗] O BOT não pode ser rebaixado por ele mesmo.',
          sucesso_usuario: '➥ @{p1} virou *MEMBRO*.\n',
          erro_usuario: '➥ @{p1} já é um *MEMBRO*.\n',
          resposta: '[👤 REBAIXAR MEMBROS 👤]\n\n' + '{p1}',
        },
      },
      mt: {
        descricao: '',
        guia: `⚡ *[Comando: ${prefixo}mt]*\n🧠 Sintaxe:\n- *\`${prefixo}mt\`*\n- *${prefixo}mt mensagem*\`n📥 Descrição: Marca todos os *MEMBROS/ADMIN* do grupo, podendo incluir uma mensagem.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta: '〘 🤖 Marquei os *{p1}* membros/admins 〙\n',
          resposta_motivo: '〘 🤖 Marquei os *{p1}* membros/admins 〙\n\n' + 'Mensagem: *{p2}*\n',
        },
      },
      mm: {
        descricao: '',
        guia: `⚡ *[Comando: ${prefixo}mm]*\n🧠 Sintaxe:\n- *\`${prefixo}mm\`*\n- *${prefixo}mm mensagem*\`n📥 Descrição: Marca todos os *MEMBROS* do grupo, podendo incluir uma mensagem.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta: '〘 🤖 Marquei os *{p1}* membros 〙\n',
          resposta_motivo: '〘 🤖 Marquei os *{p1}* membros 〙\n\n' + 'Mensagem: *{p2}*\n',
          sem_membros: '[❗] Não existem membros comuns para serem marcados.\n',
        },
      },
      hidetag: {
        descricao: '',
        guia: `⚡ *[Comando: ${prefixo}hidetag]*\n🧠 Sintaxe:\n- *\`${prefixo}hidetag\`*\n- *${prefixo}hidetag* - Respondendo ou enviando uma IMAGEM ou um VIDEO ou uma FIGURINHA.\n📥 Descrição: Marca todos os *MEMBROS/ADMIN* do grupo, podendo incluir uma IMAGEM/VIDEO/STICKER na mensagem.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {},
      },
      rt: {
        descricao: '',
        guia: `Ex: Responda uma mensagem com *${prefixo}rt* - Retransmite a mensagem e marca todos os membros do grupo.\n`,
        msgs: {},
      },
      adms: {
        descricao: '',
        guia: `👑 *[Comando: ${prefixo}adms]*\n🧠 Sintaxe:\n- *\`${prefixo}adms\`*\n- Responder com *${prefixo}adms*\n📥 Descrição: Marca os *ADMINISTRADORES* do grupo ou os *ADMINISTRADORES* na mensagem respondida.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_titulo: '〘 🤖 Marquei os *{p1}* admins 〙\n\n',
          mensagem: 'Mensagem: *{p1}* \n\n',
          resposta_itens: '➸ @{p1}\n',
        },
      },
      enquete: {
        descricao: '',
        guia: `Ex: *${prefixo}enquete* tema,opcao1,opcao2,opcao3 - Cria uma enquete com um tema e as opções de voto.\n`,
        msgs: {
          min_opcao: '[❗] A enquete precisa de no mínimo 2 opçôes',
          aberta: '✅ A enquete foi aberta com sucesso',
        },
      },
      dono: {
        descricao: '',
        guia: `🤖 *[Comando: ${prefixo}dono]*\n🧠 Sintaxe:\n- *\`${prefixo}dono\`*\n📥 Descrição: Exibe e marca o dono do grupo.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta: '🤖 O Dono do grupo é : @{p1}',
          sem_dono: '🤖 O Dono do grupo teve o número banido ou cancelado.',
        },
      },
      mutar: {
        descricao: '',
        guia: `🔇 *[Comando: ${prefixo}mutar]*\n🧠 Sintaxe:\n- *\`${prefixo}mutar\`*\n📥 Descrição: Liga/desliga a execução de comandos dos membros.\n> ⌬ Desativando comandos...`,
        msgs: {
          ligado: '✅ O recurso de MUTAR GRUPO foi ativado com sucesso',
          desligado: '✅ O recurso de MUTAR GRUPO foi desativado com sucesso',
        },
      },
      link: {
        descricao: '',
        guia: `🔗 *[Comando: ${prefixo}link]*\n🧠 Sintaxe:\n- *\`${prefixo}link\`*\n📥 Descrição: Exibe o link do grupo.\n> ⌬ Recuperando link...`,
        msgs: {
          resposta: '〘 Grupo : *{p1}* 〙\n\n' + '- Link : {p2}',
        },
      },
      rlink: {
        descricao: '',
        guia: `🔄 *[Comando: ${prefixo}rlink]*\n🧠 Sintaxe:\n- *\`${prefixo}rlink\`*\n📥 Descrição: Redefine o link do grupo.\n> ⌬ Gerando novo link...`,
        msgs: {
          erro: '[❗] Houve um erro na redefinição de link',
          sucesso: '✅ Link foi redefinido com sucesso',
        },
      },
      restrito: {
        descricao: '',
        guia: `🔒 *[Comando: ${prefixo}restrito]*\n🧠 Sintaxe:\n- *\`${prefixo}restrito\`*\n📥 Descrição: Abre ou restringe o grupo para *ADMINISTRADORES*.\n> ⌬ Modificando configurações...`,
        msgs: {},
      },
      alink: {
        descricao: '',
        guia:
          `🛑 *[Comando: ${prefixo}alink]*\n🧠 Sintaxe:\n- *\`${prefixo}alink\`*\n📥 Descrição: Liga/desliga o antilink e apaga a mensagem de quem postar qualquer tipo de link.\n\n` +
          `🔗 Ex: *\${prefixo}alink* youtube instagram facebook - Liga o antilink com os links de youtube, instagram e facebook permitidos.\n> ⌬ Atualizando configurações...`,
        msgs: {
          motivo: 'Banido pelo ANTI-LINK',
          detectou:
            '🤖 Ei @{p1}, o ANTI-LINK está ativado e um possível link foi detectado na sua mensagem, ela foi apagada por segurança.',
          ligado: '✅ O recurso de ANTI-LINK foi ativado com sucesso',
          desligado: '✅ O recurso de ANTI-LINK foi desativado com sucesso',
          advertido:
            '[❗] @{p1} Você foi advertido pelo ANTI-LINK, tome cuidado ou será expulso.\n' +
            'Advertências : {p2}/3',
        },
      },
      aporno: {
        descricao: '',
        guia: `🚫 *[Comando: ${prefixo}aporno]*\n🧠 Sintaxe:\n- *\`${prefixo}aporno 00h00, 06h00\`*\n📥 Descrição: Liga/desliga o antiporno e apaga a mensagem de quem postar qualquer tipo de conteúdo +18.\nEx: envie ou não os horário, caso você envie será adicionado um horário liberado, caso não será bloqueado diariamente.\n> ⌬ Atualizando configurações...`,
        msgs: {
          motivo: 'Banido pelo ANTI-PORNO',
          detectou:
            '🤖 Ei @{p1}, o ANTI-PORNO está ativado e uma possível imagem +18 foi detectado na sua mensagem, ela foi apagada por segurança.',
          ligado: '✅ O recurso de ANTI-PORNO foi ativado com sucesso',
          desligado: '✅ O recurso de ANTI-PORNO foi desativado com sucesso',
          advertido:
            '[❗] @{p1} Você foi advertido pelo ANTI-PORNO, tome cuidado ou será expulso.\n' +
            'Advertências : {p2}/3',
          sem_api: 'ANTI-PORNO ativado mas sua apikey da GOOGLE não está configurada',
        },
      },
      autosticker: {
        descricao: '',
        guia: `🔄 *[Comando: ${prefixo}autosticker]*\n🧠 Sintaxe:\n- *\`${prefixo}autosticker\`*\n📥 Descrição: Liga/desliga a criação automática de stickers sem precisar de comandos.\n> ⌬ Atualizando configurações...`,
        msgs: {
          ligado: '✅ O recurso de AUTO-STICKER foi ativado com sucesso',
          desligado: '✅ O recurso de AUTO-STICKER foi desativado com sucesso',
        },
      },
      bv: {
        descricao: '',
        guia:
          `👋 *[Comando: ${prefixo}bv]*\n🧠 Sintaxe:\n- *\`${prefixo}bv\`* - Liga/desliga a mensagem de bem-vindo para novos membros.\n\n` +
          `✉️ *\${prefixo}bv* mensagem - Liga a mensagem de bem-vindo com uma mensagem da sua escolha.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          ligado: '✅ O recurso de boas vindas foi ativado com sucesso',
          desligado: '✅ O recurso de boas vindas foi desativado com sucesso',
          mensagem:
            '👋 Olá, @{p1}\n' +
            'Seja bem vindo(a) ao grupo *{p2}*\n\n' +
            '{p3}' +
            'Digite ' +
            `*\`${prefixo}menu\`*` +
            ' para ver os comandos, ou aperte o botão abaixo. ',
        },
      },
      afake: {
        descricao: '',
        guia:
          `🚫 *[Comando: ${prefixo}afake]*\n🧠 Sintaxe:\n- *\`${prefixo}afake\`* - Liga/desliga o anti-fake em grupos.\n\n` +
          `🌍 *\`${prefixo}afake\`* DDI - Configura o anti-fake para que todos números com o DDI exterior sejam banidos, exceto o que você escolheu.\n` +
          `🌐 *\`${prefixo}afake\`* DDI1 DDI2 DDI3 - Configura o anti-fake para que todos números com DDI exterior sejam banidos, exceto os que você escolheu.\n\n` +
          `⚠️ *Obs*: A ativação do anti-fake bane pessoas com DDI do exterior (que não sejam 55 - Brasil).\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          motivo: 'Banido pelo ANTI-FAKE',
          ligado: '✅ O recurso de ANTI-FAKE foi ativado com sucesso',
          desligado: '✅ O recurso de ANTI-FAKE foi desativado com sucesso',
        },
      },
      openai: {
        descricao: '',
        guia: `🚫 *[Comando: ${prefixo}openai]*\n🧠 Sintaxe:\n- *\`${prefixo}openai\`* - Liga/desliga o OPENAI em grupos.\n\n`,
        msgs: {
          ligado: '✅ O recurso de OPENAI foi ativado com sucesso',
          desligado: '✅ O recurso de OPENAI foi desativado com sucesso',
          offline: '[❗] O recurso de OPENAI offline no momento, tente novamente mais tarde.',
        },
      },
      aflood: {
        descricao: '',
        guia:
          `🚫 *[Comando: ${prefixo}aflood]*\n🧠 Sintaxe:\n- *\`${prefixo}aflood\`* - Liga/desliga o anti-flood.\n\n` +
          `⏱️ *${prefixo}aflood* 5 15 - Limita o número de mensagens para 5 a cada 15 segundos.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          max: '[❗] Escolha um valor entre 5-20 mensagens para o anti-flood.',
          intervalo: '[❗] Escolha um valor entre 10-60 segundos para o intervalo do anti-flood.',
          motivo: 'Banido pelo ANTI-FLOOD',
          ligado:
            '✅ O recurso de ANTI-FLOOD foi ativado para *{p1}* mensagens a cada *{p2}* segundos.',
          desligado: '✅ O recurso de ANTI-FLOOD foi desativado com sucesso',
          advertido:
            '[❗] @{p1} Você foi advertido pelo ANTI-FLOOD, tome cuidado ou será expulso.\n' +
            'Advertências : {p2}/3',
        },
      },
      apg: {
        descricao: '',
        guia:
          `🗑️ *[Comando: ${prefixo}apg]*\n🧠 Sintaxe:\n- Responder com *\`${prefixo}apg\`* - Apaga a mensagem que foi respondida com esse comando.\n\n` +
          `⚠️ *Obs*: O bot precisa ser administrador.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {},
      },
      bantodos: {
        descricao: '',
        guia:
          `🚫 *[Comando: ${prefixo}bantodos]*\n🧠 Sintaxe:\n- *\`${prefixo}bantodos\`* - Bane todos os membros do grupo.\n\n` +
          `⚠️ *Obs*: Apenas o dono do grupo pode usar este comando.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: '🤖✅ Todos banidos com sucesso.',
        },
      },
      topativos: {
        descricao: '',
        guia:
          `🏆 *[Comando: ${prefixo}topativos]*\n🧠 Sintaxe:\n- *\`${prefixo}topativos\`* 10 - Marca os 10 membros com mais mensagens do grupo.\n\n` +
          `⚠️ *Obs*: Este comando só funciona com o *\`${prefixo}contador\`* ativado.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          erro_qtd: '[❗] A quantidade de pessoas não é um número válido.',
          limite_qtd: '[❗] A quantidade de pessoas deve ser entre 1 e 50',
          erro_contador: '[❗] Este comando só funciona quando o contador está ativado.',
          resposta_titulo: '╔══✪〘🏆 TOP {p1} ATIVOS 🏆 〙\n╠\n',
          resposta_itens: '╠➥ {p1} {p2}° Lugar @{p3} - *{p4}* Msgs\n',
        },
      },
      contador: {
        descricao: '',
        guia: `🔢 *[Comando: ${prefixo}contador]*\n🧠 Sintaxe:\n- *\`${prefixo}contador\`* - Liga/desliga a contagem de mensagens no grupo.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          ligado: '✅ O recurso de CONTADOR foi ligado com sucesso',
          desligado: '✅ O recurso de CONTADOR foi desligado com sucesso',
        },
      },
      atividade: {
        descricao: '',
        guia: `📊 *[Comando: ${prefixo}atividade]*\n🧠 Sintaxe:\n- *\`${prefixo}atividade\`* @membro - Mostra a atividade do membro mencionado.\n\n- Responder com *${prefixo}atividade* - Mostra a atividade do membro que você respondeu.\n\n⚠️ *Obs*: Este comando só funciona com o *${prefixo}contador* ativado.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          erro_contador: '[❗] Este comando só funciona quando o contador está ativado.',
          fora_grupo: '[❗] Não é possível ver a atividade de quem não está no grupo.',
          resposta:
            '🤖 *Atividade do usuário* 🤖\n\n' +
            '📱 *Total de mensagens* : {p1}\n' +
            '═════════════════\n' +
            '🔤 Textos enviados : {p2}\n' +
            '📸 Imagens enviadas : {p3}\n' +
            '🎥 Videos enviados : {p4}\n' +
            '🖼️ Figurinhas enviadas : {p5}\n' +
            '🎧 Aúdios enviados : {p6}\n' +
            '🧩 Outros : {p7}\n',
        },
      },
      imarcar: {
        descricao: '',
        guia: `🔢 *[Comando: ${prefixo}imarcar]*\n🧠 Sintaxe:\n- *\`${prefixo}imarcar\`* 5 - Marca todos os membros com menos de 5 mensagens.\n\n⚠️ *Obs*: Este comando só funciona com o *${prefixo}contador* ativado.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          erro_qtd: '[❗] A quantidade mínima de mensagens não é um número válido.',
          limite_qtd: '[❗] A quantidade mínima de mensagens deve ser entre [1-50]',
          erro_contador: '[❗] Este comando só funciona quando o contador está ativado.',
          sem_inativo: '✅ Não existe membros inativos neste grupo.',
          resposta_titulo:
            '╔══✪〘🤖 Marcando todos que tem menos de {p1} mensagens〙\n\n' +
            '👤 *Membros inativos* : {p2}\n',
          resposta_itens: '╠➥ @{p1} - *{p2}* Msgs\n',
        },
      },
      ibanir: {
        descricao: '',
        guia: `🚫 *[Comando: ${prefixo}ibanir]*\n🧠 Sintaxe:\n- *\`${prefixo}ibanir\`* 10 - Bane todos os membros com menos de 10 mensagens.\n\n⚠️ *Obs*: Este comando só funciona com o *${prefixo}contador* ativado.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          erro_qtd: '[❗] A quantidade mínima de mensagens não é um número válido.',
          limite_qtd: '[❗] A quantidade mínima de mensagens deve ser entre 1 e 50',
          erro_contador: '[❗] Este comando só funciona quando o contador está ativado.',
          sucesso: '🤖✅ {p1} Membros com menos de {p2} mensagens foram banidos.',
          sem_inativo: '✅ Não existem membros inativos válidos para serem banidos.',
        },
      },
      bcmd: {
        descricao: '',
        guia: `🔒 *[Comando: ${prefixo}bcmd]*\n🧠 Sintaxe:\n- *\`${prefixo}bcmd\`* ${prefixo}s ${prefixo}sgif ${prefixo}play - Bloqueia no grupo os comandos ${prefixo}s, ${prefixo}sgif e ${prefixo}play (você pode escolher os comandos conforme sua necessidade).\n\n⚠️ *Obs*: Você não pode bloquear comandos de administrador.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_titulo: '[🤖 *Bloquear comandos* 🤖]\n\n',
          resposta_variavel: {
            ja_bloqueado: '- Comando *{p1}* já está bloqueado.\n',
            bloqueado_sucesso: '- Comando *{p1}* bloqueado com sucesso.\n',
            erro: '- Comando *{p1}* não pode ser bloqueado.\n',
            nao_existe: '- Comando *{p1}* não existe.\n',
            enviado_erro:
              '- Você enviou o comando *{p1}* sem o prefixo, ou com o prefixo errado.\n',
          },
          resposta_cmd_bloqueado:
            '[❗] O comando *{p1}* está temporariamente bloqueado neste grupo pelo administrador.',
        },
      },
      dcmd: {
        descricao: '',
        guia: `🔓 *[Comando: ${prefixo}dcmd]*\n🧠 Sintaxe:\n- *\`${prefixo}dcmd\`* ${prefixo}s ${prefixo}sgif ${prefixo}play - Desbloqueia no grupo os comandos ${prefixo}s, ${prefixo}sgif e ${prefixo}play.\n\n⚠️ *Obs*: Verifique os comandos que estão bloqueados com *${prefixo}status*.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_titulo: '[🤖 *Desbloquear Comandos* 🤖]\n\n',
          resposta_variavel: {
            desbloqueado_sucesso: '- Comando *{p1}* foi desbloqueado.\n',
            ja_desbloqueado: '- Comando *{p1}* já esta desbloqueado ou nunca foi bloqueado.\n',
          },
        },
      },
      revelar: {
        descricao: '',
        guia: `Ex: Responder mensagem única com *\`${prefixo}revelar\`* - Revela e reenvia o conteúdo da mensagem única como uma mensagem normal.\n`,
        msgs: {},
      },
      advertir: {
        descricao: '',
        guia: `⚠️ *[Comando: advertir]*\n🧠 Sintaxe: Responda a um usuário com *\`${prefixo}advertir\`*\n📩 Descrição: Envia uma advertência ao usuário respondido.\n> ⌬ Estabelecendo conexão com o servidor...`,
        admin: `Não posso advertir um *ADMINISTRADOR* do grupo.`,
        msgs: {
          erro_advertir: '[❗] O BOT não pode ser advertido por ele mesmo.',
        },
      },
      radvertencias: {
        descricao: '',
        guia: `🔄 *[Comando: radvertências]*\n🧠 Sintaxe: Responda a um usuário com *\`${prefixo}radvertências\`*\n📩 Descrição: Reseta as advertências do usuário respondido.\n> ⌬ Estabelecendo conexão com o servidor...`,
        reset: `Usuário @{p1} teve suas *ADVERTÊNCIAS* resetadas.\n` + `Advertências: {p2}/3`,
        admin: `Não posso resetar advertências de um *ADMINISTRADOR* do grupo.`,
        msgs: {
          erro_Radvertencias: '[❗] O BOT não pode ser advertido por ele mesmo.',
        },
      },
      permissao: {
        descricao:
          'Seu grupo não tem permissão para meu funcionamento. Gostaria de mais informações?\n' +
          'entre em contato com meu dono.\n\n' +
          'Dono: https://wa.me/{p1}',
        descricao_expirado:
          'Seu grupo expirou a data de validade para meu funcionamento. Gostaria de mais informações?\n' +
          'entre em contato com meu dono.\n\n' +
          'Dono: https://wa.me/{p1}',
        grupo_comum:
          '[❗] - Você não está no meu grupo oficial, para que eu possa funcionar com você entre no meu grupo.\n\n' +
          'Link do grupo: {p1}\n\n' +
          'Ou se você quiser me adicionar ao seu grupo entre em contato com meu dono.\n\n' +
          'Dono: https://wa.me/{p2}\n\n' +
          'Me siga no Facebook: {p3}',
        guia: '',
        msgs: {},
      },

      fixar: {
        descricao: '',
        guia: `📌 *[Comando: fixar]*\n🧠 Sintaxe: *\`${prefixo}fixar\`*\n📩 Descrição: Fixa a mensagem respondida no grupo.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          dias_validos: '[❗] Por favor envie um número válido!',
          sucesso: '✅ Mensagem fixada com sucesso.',
        },
      },
      desfixar: {
        descricao: '',
        guia: `📌 *[Comando: desfixar]*\n🧠 Sintaxe: *\`${prefixo}desfixar\`*\n📩 Descrição: Desfixa a mensagem respondida no grupo.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          dias_validos: '[❗] Por favor envie um número válido!',
          sucesso: '✅ Mensagem desfixada com sucesso.',
        },
      },
    },
    //COMANDOS ADMIN
    admin: {
      sair: {
        descricao: '',
        guia: `🚪 *[Comando: ${prefixo}sair]*\n🧠 Sintaxe:\n- *\`${prefixo}sair\`* - Faz o bot sair do grupo atual.\n- *\`${prefixo}sair\`* 1 - Faz o bot sair do grupo selecionado.\n\n📡 Descrição: Encerra a participação do bot em um ou mais grupos.\n⚠️ *Obs*: Para ver o número dos grupos é necessário checar no comando *${prefixo}grupos*\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_admin: '🤖✅ O bot saiu com sucesso do grupo escolhido.',
          nao_encontrado: `[❗] Não foi possível sair deste grupo, o grupo não foi encontrado ou o número é inválido. Cheque o comando correto em *${prefixo}grupos*`,
        },
      },
      pvliberado: {
        descricao: '',
        guia: `📥 *[Comando: ${prefixo}pvliberado]*\n🧠 Sintaxe:\n- *\`${prefixo}pvliberado\`* - Liga/desliga os comandos em mensagens privadas.\n\n📡 Descrição: Ativa ou desativa o uso de comandos pelo bot em mensagens privadas.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          desativado: '✅ Os comandos em MENSAGENS PRIVADAS foram desativados com sucesso.',
          ativado: '✅ Os comandos em MENSAGENS PRIVADAS foram ativados com sucesso.',
        },
      },
      bcmdglobal: {
        descricao: '',
        guia: `🌐 *[Comando: ${prefixo}bcmdglobal]*\n🧠 Sintaxe:\n- *\`${prefixo}bcmdglobal\`* ${prefixo}s ${prefixo}sgif ${prefixo}play - Bloqueia os comandos ${prefixo}s, ${prefixo}sgif e ${prefixo}play (você pode escolher os comandos conforme sua necessidade).\n\n⚠️ *Obs*: Você não pode bloquear comandos de administrador.\n\n📡 Descrição: Bloqueia comandos globalmente para impedir seu uso em todos os grupos e mensagens privadas.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_titulo: '[🤖 *Bloquear comandos - Global* 🤖]\n\n',
          resposta_variavel: {
            ja_bloqueado: '- Comando *{p1}* já está bloqueado.\n',
            bloqueado_sucesso: '- Comando *{p1}* bloqueado com sucesso.\n',
            erro: '- Comando *{p1}* não pode ser bloqueado.\n',
            nao_existe: '- Comando *{p1}* não existe.\n',
            enviado_erro:
              '- Você enviou o comando *{p1}* sem o prefixo, ou com o prefixo errado.\n',
          },
          resposta_cmd_bloqueado:
            '[❗] O comando *{p1}* está indisponível no momento por ordem do administrador, tente novamente mais tarde.',
        },
      },
      dcmdglobal: {
        descricao: '',
        guia: `🌐 *[Comando: ${prefixo}dcmdglobal]*\n🧠 Sintaxe:\n- *\`${prefixo}dcmdglobal\`* ${prefixo}s ${prefixo}sgif ${prefixo}play - Desbloqueia os comandos ${prefixo}s, ${prefixo}sgif e ${prefixo}play.\n\nℹ️ *Obs*: Verifique os comandos que estão bloqueados com *${prefixo}infocompleta*.\n\n📡 Descrição: Desbloqueia comandos globalmente, permitindo que sejam usados novamente em todos os grupos e mensagens privadas.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_titulo: '[🤖 *Desbloquear Comandos - Global* 🤖]\n\n',
          resposta_variavel: {
            desbloqueado_sucesso: '- Comando *{p1}* foi desbloqueado.\n',
            ja_desbloqueado: '- Comando *{p1}* já esta desbloqueado ou nunca foi bloqueado.\n',
            enviado_erro:
              '- Você enviou o comando *{p1}* sem o prefixo, ou com o prefixo errado.\n',
          },
        },
      },
      sairgrupos: {
        descricao: '',
        guia: `🚪 *[Comando: ${prefixo}sairgrupos]*\n🧠 Sintaxe:\n- *\`${prefixo}sairgrupos\`* - Sai de todos os grupos.\n\n📡 Descrição: Faz o bot sair de todos os grupos em que está atualmente.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta: '🤖✅ Saí de todos os grupos com sucesso, total de grupos : {p1}',
        },
      },
      infobot: {
        descricao: '',
        guia: `🤖 *[Comando: ${prefixo}infobot]*\n🧠 Sintaxe:\n- *\`${prefixo}infobot\`* - Exibe as informações completas do bot, inclusive as configurações atuais.\n\n📡 Descrição: Mostra detalhes sobre o funcionamento e as configurações atuais do bot.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_superior:
            '*Administrador do Bot* : {p1}\n' +
            '*Nome do bot* : {p2}\n' +
            '*Online desde* : {p3}\n' +
            '-------------------\n',
          resposta_variavel: {
            limite_diario: {
              on: '*Limite diário* : ✅\n' + '- Reseta em : *{p1}*\n' + '-------------------\n',
              off: '*Limite diário* : ❌\n' + '-------------------\n',
            },
            autosticker: {
              on: '*Auto-Sticker privado* : ✅\n' + '-------------------\n',
              off: '*Auto-Sticker privado* : ❌\n' + '-------------------\n',
            },
            xp: {
              on: '*Sistema de XP* : ✅\n' + '- Reinicia em : *{p1}*\n' + '-------------------\n',
              off: '*Sistema de XP* : ❌\n' + '-------------------\n',
            },
            autorevelar: {
              on: '*Auto-Revelar* : ✅\n' + '-------------------\n',
              off: '*Auto-Revelar* : ❌\n' + '-------------------\n',
            },
            pvliberado: {
              on: '*PV Liberado* : ✅\n' + '-------------------\n',
              off: '*PV Liberado* : ❌\n' + '-------------------\n',
            },
            taxa_comandos: {
              on:
                '*Taxa comandos/minuto* : ✅\n' +
                '- *{p1}* Cmds/minuto por usuário\n' +
                '- Bloqueio : *{p2}* s\n' +
                '-------------------\n',
              off: '*Taxa comandos/minuto* : ❌\n' + '-------------------\n',
            },
            bloqueiocmds: {
              on:
                '*Bloqueio de comandos* : ✅\n' +
                '- Bloqueados: *{p1}*\n' +
                '-------------------\n',
              off: '*Bloqueio de comandos* : ❌\n' + '-------------------\n',
            },
          },
          resposta_inferior:
            '*Pessoas bloqueadas* : *{p1}* pessoas\n' +
            '*Comandos executados* : *{p2}*\n' +
            '*Contato do Administrador* : wa.me/{p3}\n',
        },
      },
      entrargrupo: {
        descricao: '',
        guia: `🌐 *[Comando: ${prefixo}entrargrupo]*\n🧠 Sintaxe:\n- *\`${prefixo}entrargrupo\`* link - Entra em um grupo por link de convite.\n\n📡 Descrição: Permite que o bot entre em um grupo através de um link de convite.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          link_invalido: '[❗] Isso não é um link válido 👊🤬',
          entrar_erro:
            '[❗] Houve um erro para entrar nesse grupo, verifique se o link está correto.',
          pendente:
            '🤖 Não foi possivel entrar neste momento, o grupo provavelmente está com modo para administrador aceitar solicitação.',
          entrar_sucesso: '🤖✅ Entendido, entrarei em breve no grupo.',
        },
      },
      bcgrupos: {
        descricao: '',
        guia: `🌐 *[Comando: ${prefixo}bcgrupos]*\n🧠 Sintaxe:\n- *\`${prefixo}bcgrupos\`* mensagem - Envia uma mensagem para todos os *GRUPOS*.\n\n📡 Descrição: Permite enviar uma mensagem para todos os grupos em que o bot está presente.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          anuncio: `[🤖${nome_bot}® - Mensagem para os grupos]\n\n` + '{p1}',
          espera:
            '⏳ Em andamento , estou enviando sua mensagem para {p1} grupos.\n\n' +
            'Tempo estimado : *{p2}* segundos',
          bc_sucesso: '🤖✅ Anúncio feito com sucesso.',
        },
      },
      bcusers: {
        descricao: '',
        guia: `🌐 *[Comando: ${prefixo}bcusers]*\n🧠 Sintaxe:\n- *\`${prefixo}bcusers\`* mensagem - Envia uma mensagem para todos os *USUÁRIOS*.\n\n📡 Descrição: Permite enviar uma mensagem para todos os usuário que teve contato com o bot.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          anuncio: `[🤖${nome_bot}® - Mensagem para os Contatos]\n\n` + '{p1}',
          espera:
            '⏳ Em andamento , estou enviando sua mensagem para {p1} contato(s).\n\nAguarde...',
          bc_sucesso: '🤖✅ Anúncio feito com sucesso.',
        },
      },
      fotobot: {
        descricao: '',
        guia: `🖼️ *[Comando: ${prefixo}fotobot]*\n🧠 Sintaxe:\n- Envie/responda uma *imagem* com *\`${prefixo}fotobot\`* - Altera a foto do BOT.\n\n📡 Descrição: Permite alterar a foto do bot com a imagem enviada ou respondida.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: '🤖✅ A foto do BOT foi alterada com sucesso.',
        },
      },
      nomebot: {
        descricao: '',
        guia: `📝 *[Comando: ${prefixo}nomebot]*\n🧠 Sintaxe:\n- *\`${prefixo}nomebot\`* Teste123 - Muda o nome do *BOT* para *Teste123* e atualiza os menus com o novo nome.\n\n📡 Descrição: Altera o nome do bot e atualiza os menus com o novo nome configurado.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: '✅ O nome do bot foi alterado com sucesso.',
        },
      },
      nomesticker: {
        descricao: '',
        guia: `📝 *[Comando: ${prefixo}nomesticker]*\n🧠 Sintaxe:\n- *\`${prefixo}nomesticker\`* Teste123 - Muda o nome do *PACOTE DE STICKERS* para *Teste123* e atualiza os novos stickers com o novo nome.\n\n📡 Descrição: Altera o nome do pacote de stickers e aplica o novo nome nos stickers do pacote.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: '✅ O nome do pacote de figurinhas foi alterado com sucesso.',
        },
      },
      nomeadm: {
        descricao: '',
        guia: `📝 *[Comando: ${prefixo}nomeadm]*\n🧠 Sintaxe:\n- *\`${prefixo}nomeadm\`* Teste123 - Muda o nome do *ADMINISTRADOR* para *Teste123* e atualiza os menus com o novo nome.\n\n📡 Descrição: Altera o nome do administrador e aplica o novo nome nos menus relacionados.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: '✅ O nome do administrador foi alterado com sucesso.',
        },
      },
      prefixo: {
        descricao: '',
        guia: `🔧 *[Comando: ${prefixo}prefixo]*\n🧠 Sintaxe:\n- *\`${prefixo}prefixo\`* # - Muda o prefixo dos *COMANDOS* para *#* e atualiza os menus e comandos com o novo prefixo.\n\n📡 Descrição: Altera o prefixo dos comandos e aplica a mudança em todas as referências.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: '✅ O prefixo dos comandos foi alterado com sucesso.\n\nPrefixo novo: *{p1}*',
        },
      },
      autostickerpv: {
        descricao: '',
        guia: `⚙️ *[Comando: ${prefixo}autostickerpv]*\n🧠 Sintaxe:\n- *\`${prefixo}autostickerpv\`* - Liga/desliga a criação automática de stickers sem precisar de comandos no privado.\n\n📡 Descrição: Permite a criação automática de stickers a partir de imagens enviadas no privado, sem a necessidade de comandos adicionais.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          desativado: '✅ O AUTO-STICKER em mensagens privadas foi desativado com sucesso',
          ativado: '✅ O AUTO-STICKER em mensagens privadas foi ativado com sucesso',
        },
      },
      autorevelar: {
        descricao: '',
        guia: `Ex: *${prefixo}autorevelar* - Liga/desliga o envio automático a revelação de mensagens de visualização única para o PV.\n`,
        msgs: {
          ativado: '✅ O AUTO-REVELAR em mensagens de visualização única foi ativado com sucesso',
          desativado:
            '✅ O AUTO-REVELAR em mensagens de visualização única foi desativado com sucesso',
          restransmissao:
            '[🕵️ *Revelar mensagens* 🕵️]\n\n' +
            '✉️ Nova mensagem detectada :\n' +
            `Nome : *{p1}*\n` +
            `Numero : *{p2}*\n` +
            'Grupo : *{p3}*\n' +
            'Tipo de mensagem : *{p4}*\n',
        },
      },
      listarblock: {
        descricao: '',
        guia: `🚫 *[Comando: ${prefixo}listarblock]*\n🧠 Sintaxe:\n- *\`${prefixo}listarblock\`* - Exibe a lista de usuários bloqueados pelo bot.\n\n📡 Descrição: Mostra todos os usuários que foram bloqueados pelo bot, permitindo a visualização de quem está impedido de interagir com o bot.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_titulo: '🤖 Esse é o total de pessoas bloqueadas \nTotal : {p1}\n',
          lista_vazia: '[❗] O bot não tem pessoas bloqueadas.',
          resposta_itens: '➸ +{p1}\n',
        },
      },
      bloquear: {
        descricao: '',
        guia:
          `🚫 *[Comando: ${prefixo}bloquear]*\n🧠 Sintaxe:\n- *\`${prefixo}bloquear\` @membro* - Para o bot bloquear o membro mencionado.\n\n` +
          `- *\`${prefixo}bloquear\` +55 (xx) xxxxx-xxxx* - Para o bot bloquear o número digitado.\n\n` +
          `- Responder alguém com *\`${prefixo}bloquear\`* - Para o bot bloquear o membro que você respondeu.\n\n` +
          `📡 Descrição: Utiliza este comando para bloquear um usuário específico ou número de telefone, impedindo que interaja com o bot.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          erro_dono: '[❗] O Usuário +{p1} é dono do BOT, não foi possivel bloquear.',
          ja_bloqueado: '[❗] O Usuário +{p1} já está *bloqueado*.',
          sucesso: '✅ O Usuário +{p1} foi *bloqueado* com sucesso',
        },
      },
      usuarios: {
        descricao: '',
        guia:
          `👥 *[Comando: ${prefixo}usuarios]*\n🧠 Sintaxe:\n- *\`${prefixo}usuarios\` comum* - Mostra todos os usuários do tipo *COMUM*.\n\n` +
          `📡 Descrição: Exibe a lista de usuários classificados conforme o tipo que você especificou.\n\n` +
          `⚠️ *Obs*: Use o *\`${prefixo}tipos\`* para ver os tipos disponíveis de usuários.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          nao_encontrado:
            '[❗] Não existem usuários com esse tipo ou você digitou um tipo inválido, confira os tipos disponíveis em ' +
            `*${prefixo}tipos*`,
          resposta: {
            titulo: '👥  USUÁRIOS - {p1} ({p2})\n\n',
            item: '-> {p1} +{p2} - {p3} cmds\n',
          },
        },
      },
      novotipo: {
        descricao: '',
        guia:
          `🆕 *[Comando: ${prefixo}novotipo]*\n🧠 Sintaxe:\n- *\`${prefixo}novotipo\` teste, 🤖 Teste, 50* - Cria um novo tipo de usuário com nome *teste*, com título (exibição em menus) *🤖 Teste* e com o máximo de *50* comandos diários.\n\n` +
          `📡 Descrição: Cria um novo tipo de usuário com a configuração especificada para uso nos menus e comandos diários.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          erro_comandos:
            '[❗] Houve um erro ao criar um novo tipo, a quantidade de comandos diários tem que ser um número e no mínimo 10.',
          sucesso_criacao:
            '✅ Um novo tipo de usuário foi criado com sucesso.\n' +
            '- Tipo : {p1}\n' +
            '- Titulo : {p2}\n' +
            '- Comandos diários : {p3}\n',
          erro_criacao: `[❗] Houve um erro ao criar um novo tipo, verifique se esse tipo já existe em *${prefixo}tipos*`,
        },
      },
      deltipo: {
        descricao: '',
        guia:
          `❌ *[Comando: ${prefixo}deltipo]*\n🧠 Sintaxe:\n- *\`${prefixo}deltipo\`* vip - Deleta o tipo de usuário *VIP* e move todos os usuários desse tipo para *COMUM*.\n\n` +
          `📡 Descrição: Exclui o tipo de usuário especificado e transfere seus membros para o tipo padrão *COMUM*.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso_remocao:
            '✅ O tipo *{p1}* foi deletado com sucesso e os usuários desse tipo foram movidos para *COMUM*.',
          erro_remocao: `[❗] Houve um erro ao deletar este tipo, verifique se esse tipo existe em *${prefixo}tipos* e se não é do tipo *comum* ou *dono* (que não podem ser deletados).`,
        },
      },
      tipotitulo: {
        descricao: '',
        guia:
          `✏️ *[Comando: ${prefixo}tipotitulo]*\n🧠 Sintaxe:\n- *\`${prefixo}tipotitulo\`* vip, 🔥VIP Teste - Muda o título de exibição do tipo de usuário *VIP* para *🔥 VIP Teste*.\n\n` +
          `📡 Descrição: Altera o título de exibição de um tipo de usuário, facilitando sua identificação nos menus.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: '✅ O tipo *{p1}* teve o título de exibição alterado para *{p2}* com sucesso.',
          erro: `[❗] Houve um erro ao alterar o titulo deste tipo, verifique se esse tipo existe em *${prefixo}tipos*.`,
        },
      },
      limpartipo: {
        descricao: '',
        guia:
          `🧹 *[Comando: ${prefixo}limpartipo]*\n🧠 Sintaxe:\n- *\`${prefixo}limpartipo\`* premium - Transforma todos os usuários do tipo *PREMIUM* em *COMUM*.\n\n` +
          `📡 Descrição: Transforma todos os usuários de um tipo específico para outro tipo, ajudando a manter os tipos atualizados.\n` +
          `⚠️ *Obs*: Use o *${prefixo}tipos* para ver os tipos disponíveis de usuários.\n> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          erro:
            '[❗] O tipo de usuário que você inseriu é inválido, verifique os tipos disponíveis em ' +
            `*${prefixo}tipos*`,
          sucesso: '✅Todos os usuários do tipo *{p1}* foram convertidos para *COMUM*',
        },
      },
      limitediario: {
        descricao: '',
        guia:
          `🕒 *[Comando: ${prefixo}limitediario]*\n🧠 Sintaxe:\n- *\`${prefixo}limitediario\`* - Ativa/desativa o limite diário de comandos.\n\n` +
          `📡 Descrição: Ativa ou desativa o limite de comandos que um usuário pode executar por dia.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          qtd_invalida: '[❗] A quantidade de comandos por dia está inválida',
          ativado: '✅ O Limite diário de comandos foi ativado com sucesso',
          desativado: '✅ O Limite diário de comandos foi desativado com sucesso',
          resposta_excedeu_limite:
            '[❗] {p1} -> Você ultrapassou seu limite diário de comandos por dia.\n\n' +
            'Entre em contato com o dono para ver sua situação:\n\nDono: @{p2}',
        },
      },
      taxacomandos: {
        descricao: '',
        guia:
          `⚖️ *[Comando: ${prefixo}taxacomandos]*\n🧠 Sintaxe:\n- *\`${prefixo}taxacomandos\`* 5 60 - Ativa a taxa limite de comandos para 5 comandos a cada minuto por usuário, caso o usuário ultrapasse, ele fica 60 segundos impossibilitado de fazer comandos.\n\n` +
          `📡 Descrição: Define um limite de comandos por usuário em um intervalo de tempo. Caso ultrapasse, o usuário ficará impossibilitado de usar os comandos por um tempo determinado.\n` +
          `⚠️ *Obs*: Digite *${prefixo}taxacomandos* novamente para desativar a taxa limite de comandos.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          qtd_invalida: '[❗] A quantidade máxima de mensagens por minuto está inválida',
          tempo_invalido: '[❗] O tempo de bloqueio de mensagens está inválido',
          ativado: '✅ O Limitador de comandos por minuto foi ativado com sucesso',
          desativado: '✅ O Limitador de comandos por minuto foi desativado com sucesso',
          resposta_usuario_limitado:
            '[❗] Você está impossibilitado de mandar comandos por *{p1}* segundos, pega leve cara.',
        },
      },
      desbloquear: {
        descricao: '',
        guia:
          `🔓 *[Comando: ${prefixo}desbloquear]*\n🧠 Sintaxe:\n- *\`${prefixo}desbloquear\`* @membro - Para o bot desbloquear o membro mencionado.\n\n` +
          `- *\`${prefixo}desbloquear\`* +55 (xx) xxxxx-xxxx - Para o bot desbloquear o número digitado.\n\n` +
          `- *Responda alguém com \`${prefixo}desbloquear\`* - Para o bot desbloquear o membro que você respondeu.\n\n` +
          `📡 Descrição: Desbloqueia um membro ou número previamente bloqueado pelo bot.\n` +
          `⚠️ *Obs*: Verifique a lista de bloqueados com *${prefixo}listarblock*.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          ja_desbloqueado: '[❗] O Usuário +{p1} já está *desbloqueado*.',
          sucesso: '✅ O Usuário +{p1} foi *desbloqueado* com sucesso',
        },
      },
      admin: {
        descricao: '',
        guia:
          `⚙️ *[Comando: ${prefixo}admin]*\n🧠 Sintaxe: *\`${prefixo}admin\`*\n\n` +
          `📡 Descrição: Exibe o menu de administração do bot, onde você pode gerenciar as configurações e funcionalidades do bot.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {},
      },
      tipocomandos: {
        descricao: '',
        guia:
          `🔧 *[Comando: ${prefixo}tipocomandos]*\n🧠 Sintaxe:\n- *\`${prefixo}tipocomandos\`* comum 70 - Altera o limite diário de comandos do usuário *COMUM* para 70/dia.\n\n` +
          `⚠️ *Obs*: O comando de *${prefixo}limitediario* deve estar ativado.\n` +
          `⚠️ *Obs²*: Verifique os tipos disponíveis de usuários em *${prefixo}tipos*.\n` +
          `⚠️ *Obs³*: Para ficar sem limite de comandos digite -1 no campo de limite.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          invalido: '[❗] O número para definir o limite de comandos é inválido',
          tipo_invalido:
            '[❗] O tipo de usuário que você inseriu é inválido, verifique os tipos disponíveis em ' +
            `*${prefixo}tipos*`,
          erro_limite_diario:
            '[❗] Este comando só pode ser usado com o ' + `*${prefixo}limitediario*` + ' ativado.',
          sucesso:
            '✅ O limite diário dos usuários do tipo *{p1}* foi definido para *{p2}* comandos/dia ',
        },
      },
      usuariotipo: {
        descricao: '',
        guia:
          `🛠️ *[Comando: ${prefixo}usuariotipo]*\n🧠 Sintaxe:\n- *\`${prefixo}usuariotipo\`* comum @usuario - Altera o tipo do usuário mencionado para *COMUM*.\n\n` +
          `- *\`${prefixo}usuariotipo\`* premium @usuario - Altera o tipo do usuário mencionado para *PREMIUM*.\n\n` +
          `- *\`${prefixo}usuariotipo\`* vip 55219xxxxxxxx - Altera o tipo do usuário do número para *VIP*.\n\n` +
          `📡 Descrição: Altera o tipo de usuário de acordo com o especificado.\n` +
          `⚠️ *Obs*: Use o *${prefixo}tipos* para ver os tipos disponíveis de usuários.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          tipo_dono: '[❗] Não é possivel alterar cargo do dono',
          tipo_invalido: `[❗] O tipo de usuário que você inseriu é inválido, verifique se o tipo existe em *${prefixo}tipos* e se não é do tipo *dono*`,
          nao_registrado: '[❗] Este usuário ainda não está registrado',
          sucesso: '✅ O tipo desse usuário foi definido para {p1}',
        },
      },
      grupos: {
        descricao: '',
        guia:
          `📊 *[Comando: ${prefixo}grupos]*\n🧠 Sintaxe: *\`${prefixo}grupos\`*\n📡 Descrição: Mostra os grupos atuais que o bot está e suas informações.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_titulo: '🤖 GRUPOS ATUAIS ({p1})\n',
          resposta_itens:
            '----------------------------\n' +
            '*N° Grupo* : {p1}\n' +
            '*Nome* : {p2}\n' +
            '*Participantes* : {p3}\n' +
            '*Admins* : {p4}\n' +
            '*Bot é admin?* {p5}\n' +
            `*Link*: {p6}\n`,
        },
      },
      linkgrupo: {
        descricao: '',
        guia:
          `🔗 *[Comando: ${prefixo}linkgrupo]*\n🧠 Sintaxe:\n- *\`${prefixo}linkgrupo\` 1* - Exibe o link do grupo selecionado.\n\n` +
          `📡 Descrição: Exibe o link do grupo especificado pelo número.\n` +
          `⚠️ *Obs*: Para ver o número dos grupos, é necessário checar no comando *${prefixo}grupos*\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta: `🤖✅ O link para este grupo atualmente é : {p1}`,
          nao_admin:
            '[❗] Não foi possível obter o link desse grupo, o bot não é administrador deste grupo.',
          nao_encontrado: `[❗] Não foi possível obter o link desse grupo, o grupo não foi encontrado ou o número é inválido. Cheque o comando correto em *${prefixo}grupos*`,
        },
      },
      tipos: {
        descricao: '',
        guia:
          `👥 *[Comando: ${prefixo}tipos]*\n🧠 Sintaxe:\n- *\`${prefixo}tipos\`* - Exibe os tipos de usuários disponíveis e quantos comandos estão configurados por dia.\n\n` +
          `📡 Descrição: Mostra os tipos de usuários configurados e seus respectivos limites diários de comandos.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta: {
            titulo: '👥 Tipos de usuários ({p1}) :\n\n',
            item: 'Tipo : {p1}\n' + 'Titulo : {p2}\n' + 'Comandos diários : {p3}\n\n',
          },
        },
      },
      rtodos: {
        descricao: '',
        guia:
          `🔄 *[Comando: ${prefixo}rtodos]*\n🧠 Sintaxe:\n- *\`${prefixo}rtodos\`* - Reseta os comandos diários de todos os usuários.\n\n` +
          `📡 Descrição: Reseta o limite de comandos diários de todos os usuários registrados, permitindo que eles possam usar os comandos novamente.\n` +
          `⚠️ *Obs*: O comando de *${prefixo}limitediario* deve estar ativado.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: '✅ Os comandos diários de todos os usuários foram resetados',
          erro_limite_diario:
            '[❗] Este comando só pode ser usado com o ' + `*${prefixo}limitediario*` + ' ativado.',
        },
      },
      r: {
        descricao: '',
        guia:
          `🔄 *[Comando: ${prefixo}r]*\n🧠 Sintaxe:\n- *\`${prefixo}r\`* @usuario - Reseta os comandos diários de um usuário mencionado.\n\n` +
          `- *\`${prefixo}r\`* 55219xxxxxxxx - Reseta os comandos diários do usuário com esse número.\n\n` +
          `📡 Descrição: Reseta o limite de comandos diários de um usuário específico, permitindo que ele possa usar os comandos novamente.\n` +
          `⚠️ *Obs*: O comando de *${prefixo}limitediario* deve estar ativado.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: '✅ Os comandos diários desse usuário foram resetados',
          nao_registrado: '[❗] Este usuário ainda não está registrado',
          erro_limite_diario: `[❗] Este comando só pode ser usado com o *${prefixo}limitediario* ativado.`,
        },
      },
      verdados: {
        descricao: '',
        guia:
          `🔍 *[Comando: ${prefixo}verdados]*\n🧠 Sintaxe:\n- *\`${prefixo}verdados\`* @usuario - Mostra os dados gerais do usuário mencionado.\n\n` +
          `- *\`${prefixo}verdados\`* 55219xxxxxxxx - Mostra os dados gerais do usuário com esse número.\n\n` +
          `📡 Descrição: Exibe as informações gerais do usuário, como seu tipo, comandos diários e outras configurações relevantes.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          nao_registrado: '[❗] Este usuário ainda não está registrado',
          resposta_superior:
            '[🤖*VER DADOS DE USO*🤖]\n\n' +
            'Nome : *{p1}*\n' +
            'Tipo de usuário : *{p2}*\n' +
            'Número : *{p3}*\n',
          resposta_variavel: {
            limite_diario: {
              on: 'Comandos usados hoje : *{p1}/{p2}*\n' + 'Limite diário : *{p3}*\n',
              off: '',
            },
          },
          resposta_inferior: 'Total de comandos usados : *{p1}* comandos\n',
        },
      },
      desligar: {
        descricao: '',
        guia: `Ex: *${prefixo}desligar* - Desliga o bot.\n`,
        msgs: {
          sucesso: '🤖✅ Entendido, o BOT será desligado',
        },
      },
      ping: {
        descricao: '',
        guia: `Ex: *${prefixo}ping* - Exibe as informações do sistema do BOT e o tempo de resposta dele.\n`,
        msgs: {
          resposta:
            '🖥️ INFORMAÇÃO GERAL 🖥️\n\n' +
            '*OS*: {p1}\n' +
            '*CPU*: {p2}\n' +
            '*RAM*: {p3}GB/{p4}GB\n' +
            '*Resposta*: {p5}s\n' +
            '*Usuários cadastrados*: {p6}\n' +
            '*Grupos cadastrados*: {p7}\n' +
            '*Online desde*: {p8}',
        },
      },
      devtest: {
        descricao: 'Testes',
        guia: 'Testes',
        msgs: {},
      },

      limparcomandos: {
        descricao: '',
        guia:
          `🧹 *[Comando: ${prefixo}limparcomandos]*\n🧠 Sintaxe:\n- *\`${prefixo}limparcomandos\`* - Limpa os comandos de todos os usuários.\n\n` +
          `📡 Descrição: Limpa os comandos registrados de todos os usuários, resetando suas contagens de comandos disponíveis.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: `✅ Comandos resetados com sucesso.`,
        },
      },
      oficialgrupo: {
        descricao: '',
        guia:
          `🏅 *[Comando: ${prefixo}oficialgrupo]*\n🧠 Sintaxe:\n- *\`${prefixo}oficialgrupo\`* link(PV do bot) - Use esse comando em um grupo e adicione o grupo como oficial do bot, ou use no PV do bot seguido de um link de grupo e será adicionado.\n\n` +
          `📡 Descrição: Torna o grupo selecionado como oficial do bot, permitindo a configuração de comandos específicos para grupos oficiais.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: `✅ Grupo adicionado com sucesso.`,
          erro: `[❗] Erro ao adicionar o grupo, provalvelmente o grupo esta com privacidade ativada.`,
        },
      },
      statusapis: {
        descricao: '',
        guia:
          `📊 *[Comando: ${prefixo}statusapis]*\n🧠 Sintaxe:\n- *\`${prefixo}statusapis\`* - Exibe API's configuradas.\n\n` +
          `📡 Descrição: Mostra a lista de API's configuradas.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          resposta_titulo: "[ 🤖 API's CONFIGURADAS🤖 ]\n\n",
          resposta_variavel: {
            configurada: 'API: *{p1}*\n' + 'Configurada: *{p2}*\n\n',
            sem_api: '[❗] Nenhuma API configurada.',
            on: '✅ API {p1} configurada com sucesso.',
            off: '❌ API {p1} não esta configurada.',
          },
          resposta_rodape: `Obs: Para configurar uma API, use o comando *\`${prefixo}apis rapidAPI linkApiKey\`*. coloque o nome exatamente como mostrado.`,
        },
      },
      amigosecreto: {
        descricao: '',
        guia: `Ex: Faz o amigo secreto de todos os membros do grupo com *\`${prefixo}amigosecreto\`*`,
        msgs: {
          participantes: '[❗] Participantes insuficientes.',
          amigosorteado: 'Você tirou @{p1} como seu amigo secreto! 🎉',
          sucesso: '✅ Amigo secreto feito com sucesso.',
          espera: '⏳ Aguarde estou enviando as mensagnes.',
        },
      },
      criargrupo: {
        descricao: '',
        guia: `*${prefixo}criargrupo nomegrupo* - Cria um grupo com o nome escolhido.`,
        msgs: {
          sucesso: '✅ Grupo criado com sucesso.',
          erro: '[❗] Erro ao criar o grupo.',
        },
      },
      apis: {
        descricao: '',
        guia:
          `🔑 *[Comando: ${prefixo}apis]*\n🧠 Sintaxe:\n- *\`${prefixo}apis nomeapikey apikey\`* - Adiciona apikeys.\n\n` +
          `📡 Descrição: Permite adicionar uma chave API (apikey) com o nome especificado.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          sucesso: '✅ Apikey adicionada com sucesso.',
          sem_api: '[❗] OPENAI ativado, mas sua Apikey da OPENAI não está configurada.',
          nome_api: `[❗] API NOME: *{p1}* não existe, de um *\`${prefixo}statusapis\`* para ver os nomes das API's`,
        },
      },
      xp: {
        descricao: '',
        guia:
          `🌟 *[Comando: ${prefixo}xp]*\n🧠 Sintaxe:\n- *\`${prefixo}xp\`* on - Ativa o sistema de XP.\n\n` +
          `- *\`${prefixo}xp\`* off - Desativa o sistema de XP.\n\n` +
          `📡 Descrição: Ativa ou desativa o sistema de experiência (XP) para os usuários do bot.\n` +
          `> ⌬ Estabelecendo conexão com o servidor...`,
        msgs: {
          ativado: '✅ O sistema de XP foi ativado com sucesso',
          desativado: '✅ O sistema de XP foi desativado com sucesso',
        },
      },
    },
    //OUTROS
    outros: {
      inicializando: 'Inicializando o BOT na versão v{p1}...',
      dados_bot: '✓ Obteve dados do BOT',
      servidor_iniciado: '✓ Servidor iniciado!',
      grupos_carregados: '✓ Todos os grupos foram carregados e atualizados.',
      dono_cadastrado: `✅ Seu número foi cadastrado como DONO, agora você pode utilizar os comandos de ${prefixo}admin`,
      cabecalho_guia: `☢️ :: MODO DE OPERAÇÃO ::\n\n`,
      usuario_novo:
        '[ 🤖 Boas Vindas ao {p1} 🤖]\n\n' +
        `👋 Olá {p2}, vi que você é um usuário novo para abrir o menu de comandos digite *${prefixo}menu*`,
      entrada_grupo:
        '🎮 BOT ATIVADO em *{p1}*!\n' +
        '🤘 Pronto pra rodar comandos, zoar e ajudar.\n' +
        '🚀 Digite *' +
        prefixo +
        'menu*  ou aperte o botão abaixo para começar essa missão.\n' +
        '💡 Dica: eu aprendo com vocês. Cuidado 😏',
      cmd_erro:
        '[❗] Olha, parece que você usou o comando *{p1}* incorretamente. Se você não sabe como utilizá-lo. Quer aprender a como usar?\n\n Digite :\n  - Ex: *{p2} guia* para ver o guia do comando.',
      erro_comando_codigo:
        '[❗] Houve um erro no comando *{p1}*, relate ao administrador ou tente novamente mais tarde.',
      erro_api: '[❗] Houve um erro no comando *{p1}*.\n\n' + 'Motivo: *{p2}*\n',
      resposta_ban:
        '🤖✅ Entendido, @{p1} será banido.\n\n' + 'Motivo : {p2}\n' + 'Quem baniu : @{p3}',
      fila_comando:
        '⏳ O bot está atendendo muitas pessoas ao mesmo tempo, tenha paciência!\n\n' +
        'Atualmente existem *{p1}* comandos na fila de espera.',
      visualizacao_unica:
        '[❗] Por privacidade do grupo não foi possivel usar o seu comando em uma mensagem de visualização única. Este recurso só está disponível em mensagens privadas.',
      desconectado: {
        comando: 'A conexão com o WhatsApp foi encerrada pelo comando do Administrador.',
        desconect: 'Sua conexão com o WhatsApp foi desconectada.',
        falha_grave: 'A conexão com o WhatsApp foi encerrada devido a uma falha grave no código.',
        deslogado: 'A sua sessão com o WhatsApp foi deslogada, leia o código QR novamente.',
        reiniciar: 'A sua conexão com o WhatsApp precisa ser reiniciada, tentando reconectar...',
        conexao: 'A sua conexão com o WhatsApp foi encerrada!\n\nMotivo : {p1} - {p2}',
      },
      permissao: {
        grupo: '[❗] Este comando só pode ser usado em grupos',
        bot_admin: '[❗] Permita que o BOT tenha permissões administrativas.',
        banir_admin: '[❗] O Bot não tem permissão para banir um administrador',
        apenas_admin: '[❗] Apenas administradores podem usar este comando.',
        apenas_dono_bot: '[❗] Apenas o dono do BOT pode usar este comando',
        apenas_dono_bot_vip: '[❗] Apenas o dono do BOT ou usuários VIP podem usar este comando',
        apenas_dono_grupo: '[❗] Apenas o dono do GRUPO pode usar este comando.',
        pv_Bot: '[❌] Este comando só é permitido no *PV* do bot',
        donogrupo_donobot: '[❗] Apenas o dono do GRUPO ou o dono do BOT pode usar este comando.',
      },
    },
  };
  return comandos;
}
