import { CacheManager } from '../cache/CacheManager';
import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';

export interface GPTTask {
  id: string;
  content: string;
  priority: number;
  timeout: number;
  retryCount?: number;
}

export interface GPTResult {
  taskId: string;
  result: any;
  error?: Error;
  processingTime: number;
  task?: GPTTask;
  retryCount?: number;
}

export interface PoolStatus {
  activeWorkers: number;
  queueSize: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
}

export class GPTWorkerPool extends EventEmitter {
  private static instance: GPTWorkerPool;
  private workers: Worker[] = [];
  private taskQueue: GPTTask[] = [];
  private activeWorkers: Set<Worker> = new Set();
  private metrics = {
    completedTasks: 0,
    failedTasks: 0,
    totalProcessingTime: 0
  };

  private readonly maxWorkers: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly cacheManager: CacheManager;

  private constructor(config: {
    maxWorkers?: number;
    maxRetries?: number;
    retryDelay?: number;
  } = {}) {
    super();
    this.maxWorkers = config.maxWorkers || 4;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.cacheManager = CacheManager.getInstance();

    this.initializeWorkers();
  }

  public static getInstance(config?: {
    maxWorkers?: number;
    maxRetries?: number;
    retryDelay?: number;
  }): GPTWorkerPool {
    if (!GPTWorkerPool.instance) {
      GPTWorkerPool.instance = new GPTWorkerPool(config);
    }
    return GPTWorkerPool.instance;
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker(): void {
    const worker = new Worker(new URL('./gptWorker.ts', import.meta.url));
    
    worker.on('message', (result: GPTResult) => {
      this.handleWorkerResult(worker, result);
    });

    worker.on('error', (error: Error) => {
      this.handleWorkerError(worker, error);
    });

    this.workers.push(worker);
  }

  public async submit(task: GPTTask): Promise<GPTResult> {
    // Check cache first
    const cachedResult = await this.cacheManager.get<GPTResult>(`gpt_result:${task.id}`);
    if (cachedResult) {
      return cachedResult;
    }

    return new Promise((resolve, reject) => {
      const enhancedTask = {
        ...task,
        retryCount: 0
      };

      this.taskQueue.push(enhancedTask);
      
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out after ${task.timeout}ms`));
        this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);
      }, task.timeout);

      this.once(`task:${task.id}`, (result: GPTResult) => {
        clearTimeout(timeout);
        if (result.error) {
          reject(result.error);
        } else {
          resolve(result);
        }
      });

      this.processNextTask();
    });
  }

  private async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0 || this.activeWorkers.size >= this.maxWorkers) {
      return;
    }

    const availableWorker = this.workers.find(w => !this.activeWorkers.has(w));
    if (!availableWorker) {
      return;
    }

    // Sort tasks by priority
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    const task = this.taskQueue.shift();
    if (!task) {
      return;
    }

    this.activeWorkers.add(availableWorker);

    try {
      availableWorker.postMessage(task);
    } catch (error) {
      this.handleWorkerError(availableWorker, error as Error);
    }
  }

  private async handleWorkerResult(worker: Worker, result: GPTResult): Promise<void> {
    this.activeWorkers.delete(worker);
    
    if (result.error && result.retryCount !== undefined && result.retryCount < this.maxRetries && result.task) {
      // Retry the task
      const retryDelayMs = this.retryDelay * Math.pow(2, result.retryCount || 0);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      this.taskQueue.unshift({
        ...result.task,
        retryCount: result.retryCount + 1
      });
    } else {
      // Cache successful results
      if (!result.error) {
        await this.cacheManager.set(`gpt_result:${result.taskId}`, result);
        this.metrics.completedTasks++;
        this.metrics.totalProcessingTime += result.processingTime;
      } else {
        this.metrics.failedTasks++;
      }

      this.emit(`task:${result.taskId}`, result);
    }

    this.processNextTask();
  }

  private handleWorkerError(worker: Worker, error: Error): void {
    console.error('Worker error:', error);
    this.activeWorkers.delete(worker);
    
    // Replace the failed worker
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      worker.terminate();
      this.workers.splice(index, 1);
      this.createWorker();
    }

    this.processNextTask();
  }

  public getStatus(): PoolStatus {
    return {
      activeWorkers: this.activeWorkers.size,
      queueSize: this.taskQueue.length,
      completedTasks: this.metrics.completedTasks,
      failedTasks: this.metrics.failedTasks,
      averageProcessingTime: this.metrics.completedTasks > 0
        ? this.metrics.totalProcessingTime / this.metrics.completedTasks
        : 0
    };
  }

  public scaleWorkers(count: number): void {
    const currentCount = this.workers.length;
    if (count > currentCount) {
      // Scale up
      for (let i = 0; i < count - currentCount; i++) {
        this.createWorker();
      }
    } else if (count < currentCount) {
      // Scale down
      const workersToRemove = this.workers.slice(count);
      this.workers = this.workers.slice(0, count);
      workersToRemove.forEach(worker => {
        worker.terminate();
        this.activeWorkers.delete(worker);
      });
    }
  }

  public async shutdown(): Promise<void> {
    // Wait for active tasks to complete
    while (this.activeWorkers.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Terminate all workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.activeWorkers.clear();
    this.taskQueue = [];
  }
} 