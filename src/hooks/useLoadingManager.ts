import { useState, useEffect } from 'react';
import { LoadingManager, LoadingOperation } from '../services/ui/LoadingManager';

export const useLoadingManager = () => {
    const [operations, setOperations] = useState<LoadingOperation[]>([]);
    const loadingManager = LoadingManager.getInstance();

    useEffect(() => {
        const unsubscribe = loadingManager.subscribe(setOperations);
        return () => unsubscribe();
    }, []);

    const startOperation = (
        id: string,
        description: string,
        priority?: number,
        estimatedDuration?: number
    ) => {
        loadingManager.startOperation(id, description, priority, estimatedDuration);
    };

    const endOperation = (id: string) => {
        loadingManager.endOperation(id);
    };

    const getProgress = (id: string) => {
        return loadingManager.getProgress(id);
    };

    const isLoading = operations.length > 0;
    const currentOperation = operations[0]; // Highest priority operation

    return {
        isLoading,
        operations,
        currentOperation,
        startOperation,
        endOperation,
        getProgress
    };
}; 