import readline from 'readline';

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function ask(question: string): Promise<string> {
  const rl = createInterface();
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    }),
  );
}

export const promptLoginMethod = async (): Promise<1 | 2 | null> => {
  const answer = await ask(
    'Como deseja se conectar?:\n1 - Código numérico\n2 - QR Code\nDigite o número correspondente: ',
  );

  if (answer === '1') return 1;
  if (answer === '2') return 2;

  return null;
};

export const promptPairingPhone = async (): Promise<string | undefined> => {
  const answer = await ask('Digite o telefone (DDD + número) para gerar o código: ');
  const digits = answer.replace(/\D/g, '');
  if (!digits) {
    console.log('Telefone não informado. Pulando geração de código.');
    return undefined;
  }
  return digits;
};
