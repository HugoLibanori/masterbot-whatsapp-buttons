# Guia de Instalação VPS - Masterbot

Este guia detalha os passos para instalar e rodar o Masterbot em uma VPS Ubuntu (recomendado 22.04 ou 24.04).

## 1. Atualização do Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Instalação do Node.js (v20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 3. Instalação do MySQL
```bash
sudo apt install mysql-server -y
```
Após instalar, configure a senha do root:
```bash
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'SUA_SENHA_FORTE';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Clonar e Instalar Dependências
```bash
git clone https://github.com/HugoLibanori/masterbot-whatsapp-buttons.git
cd masterbot-whatsapp-buttons
npm install
cd backend && npm install
cd ../frontend && npm install
```

## 5. Configurar o Ambiente (.env)
Copie os exemplos e preencha com seus dados reais:
```bash
cd ../backend
cp .env.example .env
nano .env # Edite com os dados do banco e APIs

cd ../frontend
cp .env.example .env
nano .env # Edite as URLs
```

## 6. Build e Inicialização
```bash
# Voltar para a raiz
cd ..
npm run build

# Instalar e rodar o PM2
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 7. Acesso Externo
- O painel estará disponível na porta definida no frontend (ex: 3000).
- O backend estará na porta 4000.
- Recomenda-se usar **Nginx** como Proxy Reverso para usar domínio e SSL (HTTPS).
