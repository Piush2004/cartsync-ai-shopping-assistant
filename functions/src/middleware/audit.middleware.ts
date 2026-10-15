import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';

export const auditLogger = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const logEntry = {
      path: req.path,
      method: req.method,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip || 'unknown',
      uid: (req as any).user?.uid || 'anonymous',
      timestamp: new Date().toISOString()
    };
    
    // Asynchronously write to agentLogs
    try {
      await db.collection('agentLogs').add(logEntry);
    } catch (err) {
      console.error('Failed to write audit log', err);
    }
  });
  
  next();
};
