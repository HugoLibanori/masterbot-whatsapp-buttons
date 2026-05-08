import readline from 'readline';

export function promptSessionName(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('🟢 Digite o NOME da sessão que deseja iniciar: ', (answer) => {
      rl.close();
      const session = answer.trim();

      if (!session) {
        console.log('❌ Nome da sessão inválido.');
        return resolve(promptSessionName());
      }

      resolve(session);
    });
  });
}
