import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
    return;
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};
