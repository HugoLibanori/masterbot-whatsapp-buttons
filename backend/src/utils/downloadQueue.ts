interface QueueItem<T> {
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  onWaiting?: (position: number, serviceName: string) => void | Promise<void>;
  onStart?: (serviceName: string) => void | Promise<void>;
  wasQueued: boolean;
}

export class ServiceQueue {
  private name: string;
  private maxConcurrent: number;
  private runningCount: number = 0;
  private queue: QueueItem<any>[] = [];

  constructor(name: string, maxConcurrent: number = 2) {
    this.name = name;
    this.maxConcurrent = maxConcurrent;
  }

  public get running(): number {
    return this.runningCount;
  }

  public get waiting(): number {
    return this.queue.length;
  }

  public async enqueue<T>(
    task: () => Promise<T>,
    options?: {
      onWaiting?: (position: number, serviceName: string) => void | Promise<void>;
      onStart?: (serviceName: string) => void | Promise<void>;
      timeoutMs?: number;
    },
  ): Promise<T> {
    const timeoutMs = options?.timeoutMs ?? 240000; // 4 minutos padrão

    // Se temos slot livre disponível imediatamente
    if (this.runningCount < this.maxConcurrent) {
      this.runningCount++;
      try {
        return await this.runWithTimeout(task, timeoutMs);
      } finally {
        this.runningCount--;
        this.processNext(timeoutMs);
      }
    }

    // Caso contrário, entra na fila de espera
    return new Promise<T>((resolve, reject) => {
      const item: QueueItem<T> = {
        task,
        resolve,
        reject,
        onWaiting: options?.onWaiting,
        onStart: options?.onStart,
        wasQueued: true,
      };

      this.queue.push(item);
      const position = this.queue.length;

      if (options?.onWaiting) {
        Promise.resolve()
          .then(() => options.onWaiting!(position, this.name))
          .catch((err) => {
            console.error(`[Queue ${this.name}] Erro no callback onWaiting:`, err);
          });
      }
    });
  }

  private processNext(timeoutMs: number): void {
    if (this.runningCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const nextItem = this.queue.shift();
    if (!nextItem) return;

    this.runningCount++;

    (async () => {
      try {
        if (nextItem.onStart && nextItem.wasQueued) {
          try {
            await nextItem.onStart(this.name);
          } catch (err) {
            console.error(`[Queue ${this.name}] Erro no callback onStart:`, err);
          }
        }
        const result = await this.runWithTimeout(nextItem.task, timeoutMs);
        nextItem.resolve(result);
      } catch (err) {
        nextItem.reject(err);
      } finally {
        this.runningCount--;
        this.processNext(timeoutMs);
      }
    })();
  }

  private async runWithTimeout<T>(task: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error(`Tempo limite excedido (${Math.round(timeoutMs / 1000)}s) ao baixar a mídia.`));
        }
      }, timeoutMs);

      task()
        .then((res) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(res);
          }
        })
        .catch((err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(err);
          }
        });
    });
  }
}

export class DownloadQueueManager {
  private queues: Map<string, ServiceQueue> = new Map();
  private maxConcurrentPerService: number;

  constructor(maxConcurrentPerService: number = 2) {
    this.maxConcurrentPerService = maxConcurrentPerService;
  }

  public getQueue(serviceKey: string, displayName?: string): ServiceQueue {
    if (!this.queues.has(serviceKey)) {
      this.queues.set(
        serviceKey,
        new ServiceQueue(displayName || serviceKey, this.maxConcurrentPerService),
      );
    }
    return this.queues.get(serviceKey)!;
  }

  public enqueue<T>(
    serviceKey: string,
    serviceDisplayName: string,
    task: () => Promise<T>,
    options?: {
      onWaiting?: (position: number, serviceName: string) => void | Promise<void>;
      onStart?: (serviceName: string) => void | Promise<void>;
      timeoutMs?: number;
    },
  ): Promise<T> {
    const queue = this.getQueue(serviceKey, serviceDisplayName);
    return queue.enqueue(task, options);
  }
}

export const downloadQueue = new DownloadQueueManager(2);
