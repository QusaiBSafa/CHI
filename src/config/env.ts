export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/chi',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

export function validateEnv() {
  if (env.nodeEnv === 'production' && env.jwtSecret === 'change-me-in-production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  
  if (!env.mongoUrl) {
    throw new Error('MONGO_URL environment variable is required');
  }
}

