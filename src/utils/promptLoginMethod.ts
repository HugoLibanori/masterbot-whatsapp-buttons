import readline from 'readline';

export const promptLoginMethod = async (): Promise<1 | 2 | null> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (text: string) =>
    new Promise<string>((resolve) => rl.question(text, (ans) => resolve(ans.trim())));

  const answer = await question(
    'Como deseja se conectar?:\n1 - Código numérico\n2 - QR Code\nDigite o número correspondente: ',
  );
  rl.close();

  if (answer === '1') return 1;
  if (answer === '2') return 2;

  return null;
};
