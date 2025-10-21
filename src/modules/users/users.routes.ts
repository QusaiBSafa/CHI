import { FastifyInstance } from 'fastify';
import { UsersController } from './users.controller';

export async function usersRoutes(app: FastifyInstance) {
  const controller = new UsersController();

  // Auth routes
  app.post('/auth/register', {
    schema: {
      tags: ['Authentication'],
      description: 'Register a new user with patient role',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'User email address' },
          password: { type: 'string', minLength: 6, description: 'User password (min 6 characters)' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string', enum: ['admin', 'patient'] },
                    createdAt: { type: 'string' },
                  },
                },
                token: { type: 'string', description: 'JWT token' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return controller.register(request, reply);
  });

  app.post('/auth/login', {
    schema: {
      tags: ['Authentication'],
      description: 'Login with email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'User email address' },
          password: { type: 'string', description: 'User password' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string', enum: ['admin', 'patient'] },
                    createdAt: { type: 'string' },
                  },
                },
                token: { type: 'string', description: 'JWT token' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return controller.login(request, reply);
  });
}

