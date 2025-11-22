// Simple global rate limiter for socket operations
// Concurrency: 1, min delay between operations: 200ms

let lastPromise: Promise<any> = Promise.resolve();
let lastTime = 0;
const MIN_DELAY_MS = 200; // ~5 ops/second global

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function schedule<T>(fn: () => Promise<T>): Promise<T> {
  lastPromise = lastPromise.then(async () => {
    const now = Date.now();
    const elapsed = now - lastTime;
    if (elapsed < MIN_DELAY_MS) {
      await sleep(MIN_DELAY_MS - elapsed);
    }
    const result = await fn();
    lastTime = Date.now();
    return result;
  });
  return lastPromise as Promise<T>;
}

export function setMinDelay(ms: number) {
  // optional runtime tuning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (globalThis as any)._RATE_LIMITER_MIN_DELAY = ms;
}
