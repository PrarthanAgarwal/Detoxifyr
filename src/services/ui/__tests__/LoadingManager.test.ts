import { LoadingManager } from '../LoadingManager';

jest.mock('../../loggingService');

describe('LoadingManager', () => {
    let loadingManager: LoadingManager;
    let mockCallback: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        loadingManager = LoadingManager.getInstance();
        mockCallback = jest.fn();
    });

    it('should manage loading operations correctly', () => {
        const operationId = 'test-operation';
        loadingManager.startOperation(operationId, 'Test Operation');
        
        const operations = loadingManager.getActiveOperations();
        expect(operations).toHaveLength(1);
        expect(operations[0].id).toBe(operationId);
        expect(operations[0].description).toBe('Test Operation');

        loadingManager.endOperation(operationId);
        expect(loadingManager.getActiveOperations()).toHaveLength(0);
    });

    it('should notify subscribers of changes', () => {
        const unsubscribe = loadingManager.subscribe(mockCallback);
        
        loadingManager.startOperation('test', 'Test');
        expect(mockCallback).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: 'test' })
        ]));

        loadingManager.endOperation('test');
        expect(mockCallback).toHaveBeenCalledWith([]);

        unsubscribe();
    });

    it('should calculate progress correctly', () => {
        jest.useFakeTimers();
        const operationId = 'test-progress';
        const estimatedDuration = 1000;

        loadingManager.startOperation(operationId, 'Test Progress', 1, estimatedDuration);
        
        jest.advanceTimersByTime(500);
        expect(loadingManager.getProgress(operationId)).toBe(0.5);

        jest.advanceTimersByTime(500);
        expect(loadingManager.getProgress(operationId)).toBe(1);

        jest.useRealTimers();
    });

    it('should sort operations by priority', () => {
        loadingManager.startOperation('low', 'Low Priority', 1);
        loadingManager.startOperation('high', 'High Priority', 2);

        const operations = loadingManager.getActiveOperations();
        expect(operations[0].id).toBe('high');
        expect(operations[1].id).toBe('low');
    });

    it('should handle multiple operations concurrently', () => {
        loadingManager.startOperation('op1', 'Operation 1');
        loadingManager.startOperation('op2', 'Operation 2');
        loadingManager.startOperation('op3', 'Operation 3');

        expect(loadingManager.getActiveOperations()).toHaveLength(3);

        loadingManager.endOperation('op2');
        const operations = loadingManager.getActiveOperations();
        expect(operations).toHaveLength(2);
        expect(operations.map(op => op.id)).not.toContain('op2');
    });
}); 