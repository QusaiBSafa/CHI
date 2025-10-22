import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { authPlugin } from './auth/auth.plugin';
import { errorPlugin } from './plugins/error';
import { loggerPlugin } from './plugins/logger';
import { usersRoutes } from './modules/users/users.routes';
import { formsRoutes } from './modules/forms/forms.routes';
import { submissionsRoutes } from './modules/submissions/submissions.routes';
import { env } from './config/env';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  // Register Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Clinical Health Intake (CHI) API',
        description: 'API documentation for CHI Backend Service',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'https://chi-qusai.vercel.app', // TODO make this configurable
          description: 'dev server',
        },
        {
          url: 'http://localhost:3000',
          description: 'Local server',
        }
      
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Authentication', description: 'User authentication endpoints' },
        { name: 'Admin - Forms', description: 'Admin form management endpoints' },
        { name: 'Patient - Forms', description: 'Patient form access endpoints' },
        { name: 'Admin - Submissions', description: 'Admin submission management endpoints' },
        { name: 'Patient - Submissions', description: 'Patient submission endpoints' },
        { name: 'Health', description: 'Health check endpoint' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
  });

  // Register plugins
  await app.register(cors, {
    origin: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
  });

  await app.register(loggerPlugin);
  await app.register(errorPlugin);
  await app.register(authPlugin);

  // Register routes
  await app.register(usersRoutes, { prefix: '/api/v1' });
  await app.register(formsRoutes, { prefix: '/api/v1' });
  await app.register(submissionsRoutes, { prefix: '/api/v1' });

  // Health check
  app.get('/health', {
    schema: {
      tags: ['Health'],
      description: 'Health check endpoint',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

