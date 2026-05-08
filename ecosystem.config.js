module.exports = {
  apps: [
    {
      name: "bot",
      cwd: "./backend",
      // Aponte para o arquivo JS que realmente inicia o servidor
      script: "dist/app.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
    {
      name: "frontend",
      cwd: "./frontend",
      // Aponte diretamente para o binário do next
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
