<h1 align="center">M@ste® Bot - Automatizando Grupos de WhatsApp!</h1>

<p align="center">
  O Masterbot é uma solução completa para gerenciamento de grupos de WhatsApp, com sistema de figurinhas, downloads, utilidades e um painel de administração robusto.
</p>

---

## ✅ Requisitos do Sistema

- **Node.js**: v20.x ou superior (LTS recomendado).
- **MySQL**: v8.0+ para banco de dados.
- **FFmpeg**: Necessário para conversão de áudio e vídeo (stickers).
- **Git**: Para clonagem e versionamento.
- **PM2**: Recomendado para rodar em produção (VPS).

---

## 🧩 Instalação Passo a Passo

### 1. Clonar o Repositório
```bash
git clone https://github.com/HugoLibanori/masterbot-whatsapp-buttons.git
cd masterbot-whatsapp-buttons
```

### 2. Instalar Dependências
Você deve instalar as dependências em todas as pastas:
```bash
# Na raiz
npm install

# No Backend
cd backend && npm install

# No Frontend
cd ../frontend && npm install
```

### 3. Configurar o Ambiente (.env)
O bot usa dois arquivos `.env`. Use os modelos fornecidos:

**Backend (`backend/.env`):**
```bash
cp backend/.env.example backend/.env
# Edite com seus dados de MySQL e chaves de API
```

**Frontend (`frontend/.env`):**
```bash
cp frontend/.env.example frontend/.env
# Edite com as URLs do seu servidor
```

### 4. Preparar o Banco de Dados
Certifique-se de que o MySQL está rodando e o banco de dados definido no `.env` foi criado. Depois, rode as migrações:
```bash
cd backend
npx sequelize db:migrate
```

### 5. Sistema de Licença (Importante para Venda)
Para o bot funcionar, ele precisa de uma licença ativa.
- A sessão definida em `OWNER_SESSION_NAME` no `.env` tem acesso livre.
- Para gerar licenças para clientes:
```bash
cd backend
npm run license:gen nome_da_sessao
```
*Copie a chave gerada e insira no campo `validation_key` da tabela `bot_licenses` do cliente.*

---

## 🚀 Executando o Bot

### Modo Desenvolvimento
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Modo Produção (VPS)
```bash
# Gerar o build (converter TS para JS)
npm run build

# Iniciar com PM2 (Recomendado)
pm2 start ecosystem.config.js
```

---

## 📚 Principais Comandos

### 🖼️ Figurinhass
- `!s` - Imagem/Vídeo para figurinha.
- `!ssf` - Figurinha sem fundo (Remove.bg).
- `!tps` - Texto para figurinha.

### 📥 Downloads
- `!play` - Baixar música (YouTube).
- `!yt` - Baixar vídeo (YouTube).
- `!ig` - Baixar do Instagram.

### 👨‍👩‍👧‍👦 Gestão de Grupos
- `!alink` - Ativar/Desativar anti-link.
- `!listanegra` - Gestão de usuários banidos.
- `!mt` - Marcar todos os membros.

### 👑 Administração do Bot (Apenas Dono)
- `!nomebot` - Altera nome do bot.
- `!infobot` - Status completo do sistema.
- `!bcgrupos` - Broadcast para todos os grupos.

---

## 🛠️ Tecnologias Utilizadas
- **Baileys**: Conexão estável com o protocolo WhatsApp.
- **Next.js**: Painel web moderno e rápido.
- **Sequelize**: ORM para manipulação de banco de dados MySQL.
- **Sharp/FFmpeg**: Processamento de mídias e stickers.

---

## 🙏 Agradecimentos e Créditos
- [Baileys](https://github.com/WhiskeySockets/Baileys) - Biblioteca core.
- **Comunidade Masterbot** - Pelo feedback e melhorias constantes.

---
<p align="center">Dúvidas? Consulte o arquivo <code>GUIA_VPS_INSTALL.md</code> para mais detalhes sobre VPS.</p>
