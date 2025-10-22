import { buildApp } from '../src/app';
import { AppDataSource } from '../src/config/data-source';

// Vercel serverless function entry point
export default async function handler(req: any, res: any) {
  try {
    // Initialize database connection FIRST
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection initialized');
    }
    
    const app = await buildApp();
    
    // Handle the request
    await app.ready();
    app.server.emit('request', req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}