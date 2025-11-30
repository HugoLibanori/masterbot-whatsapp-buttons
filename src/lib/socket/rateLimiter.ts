const MIN_DELAY_MS = 200;

let queue: (() => Promise<any>)[] = [];
let running = false;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function runQueue() {
  if (running) return;
  running = true;

  while (queue.length > 0) {
    const task = queue.shift();

    try {
      await task!();
    } catch (err) {
      console.error('Erro em tarefa do rateLimiter:', err);
    }

    await sleep(MIN_DELAY_MS);
  }

  running = false;
}

export function schedule<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    runQueue();
  });
}
