import { Request, Response, NextFunction } from 'express';
import { PrometheusMetrics } from '../../noteables/archive/monitoring/PrometheusMetrics';

export const metricsMiddleware = () => {
    const metrics = PrometheusMetrics.getInstance();

    return async (req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();
        const path = req.path;

        // Add response interceptor to track response status
        const originalSend = res.send;
        res.send = function(body) {
            const responseTime = Date.now() - startTime;
            const status = res.statusCode.toString();

            // Record metrics
            metrics.incrementApiCalls(path, status);
            metrics.observeProcessingDuration(path, responseTime / 1000);

            if (status.startsWith('5')) {
                metrics.incrementErrors('http', status);
            }

            return originalSend.call(this, body);
        };

        next();
    };
};

// Metrics endpoint handler
export const metricsHandler = async (_req: Request, res: Response) => {
    try {
        const metrics = PrometheusMetrics.getInstance();
        const metricsData = await metrics.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metricsData);
    } catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).send('Error generating metrics');
    }
}; 