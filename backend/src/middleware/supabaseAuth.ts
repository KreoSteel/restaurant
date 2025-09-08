import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        [key: string]: any;
      };
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.PUBLISH_KEY!;

export const authenticateSupabaseToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        error: 'Access denied', 
        details: 'No authorization header provided' 
      });
      return;
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"
    
    if (!token) {
      res.status(401).json({ 
        error: 'Access denied', 
        details: 'No token provided' 
      });
      return;
    }

    // Verify token with Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ 
        error: 'Invalid token', 
        details: 'Token verification failed' 
      });
      return;
    }

    // Attach user information to request object
    req.user = {
      userId: user.id,
      email: user.email!,
      ...user
    };

    next();
  } catch (error: any) {
    console.error('Supabase token verification error:', error);
    res.status(401).json({ 
      error: 'Authentication failed', 
      details: 'Unable to verify token' 
    });
  }
};
