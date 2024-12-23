import { LoggingService } from '../loggingService';

export interface LoadingOperation {
    id: string;
    description: string;
    priority: number;
    startTime: number;
    estimatedDuration?: number;
}

export class LoadingManager {
    private static instance: LoadingManager;
    private readonly loggingService: LoggingService;
    private operations: Map<string, LoadingOperation>;
    private subscribers: Set<(operations: LoadingOperation[]) => void>;

    private constructor() {
        this.loggingService = LoggingService.getInstance();
        this.operations = new Map();
        this.subscribers = new Set();
    }

    public static getInstance(): LoadingManager {
        if (!LoadingManager.instance) {
            LoadingManager.instance = new LoadingManager();
        }
        return LoadingManager.instance;
    }

    public startOperation(
        id: string,
        description: string,
        priority: number = 1,
        estimatedDuration?: number
    ): void {
        this.operations.set(id, {
            id,
            description,
            priority,
            startTime: Date.now(),
            estimatedDuration
        });
        this.notifySubscribers();
        this.loggingService.log(`Started loading operation: ${description}`, { id, priority });
    }

    public endOperation(id: string): void {
        if (this.operations.has(id)) {
            const operation = this.operations.get(id)!;
            const duration = Date.now() - operation.startTime;
            this.operations.delete(id);
            this.notifySubscribers();
            this.loggingService.log(`Completed loading operation: ${operation.description}`, {
                id,
                duration
            });
        }
    }

    public getActiveOperations(): LoadingOperation[] {
        return Array.from(this.operations.values())
            .sort((a, b) => b.priority - a.priority);
    }

    public subscribe(callback: (operations: LoadingOperation[]) => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    public getProgress(id: string): number {
        const operation = this.operations.get(id);
        if (!operation || !operation.estimatedDuration) return 0;

        const elapsed = Date.now() - operation.startTime;
        return Math.min(elapsed / operation.estimatedDuration, 1);
    }

    private notifySubscribers(): void {
        const operations = this.getActiveOperations();
        this.subscribers.forEach(callback => callback(operations));
    }
} 