import { FastifyInstance, FastifyRequest } from 'fastify';
import { SubmissionsController } from './submissions.controller';
import { requireAuth, requireAdmin } from '../../auth/rbac';

export async function submissionsRoutes(app: FastifyInstance) {
  const controller = new SubmissionsController();

  // ===== PATIENT ENDPOINTS =====

  // Submit form (handles both in-progress and done status)
  app.post('/forms/submissions', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Patient - Submissions'],
      description: 'Submit form (handles both in-progress and done status)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          formId: { type: 'string' },
          data: { type: 'object' },
          status: { type: 'string', enum: ['in-progress', 'done'] }
        },
        required: ['formId', 'data', 'status']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'array' }
          }
        }
      }
    }
  },
  async (request, reply) => {
    return controller.submitForm(request as FastifyRequest<{
      Body: { 
        formId: string;
        data: Record<string, any>;
        status: 'in-progress' | 'done';
      };
    }>, reply);
  }
);

  // List user's submissions
  app.get('/submissions', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Patient - Submissions'],
      description: 'List user\'s submissions',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          formId: { type: 'string' },
          status: { type: 'string', enum: ['in-progress', 'done'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  async (request, reply) => {
    return controller.listUserSubmissions(request as FastifyRequest<{
      Querystring: {
        formId?: string;
        status?: 'in-progress' | 'done';
      };
    }>, reply);
  }
);

  // ===== ADMIN ENDPOINTS =====

  // List all submissions (admin only)
  app.get('/admin/submissions', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      tags: ['Admin - Submissions'],
      description: 'List all submissions (admin only)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          formId: { type: 'string' },
          submittedBy: { type: 'string' },
          status: { type: 'string', enum: ['in-progress', 'done'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' }
          }
        },
        403: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  async (request, reply) => {
    return controller.listAllSubmissions(request as FastifyRequest<{
      Querystring: {
        formId?: string;
        submittedBy?: string;
        status?: 'in-progress' | 'done';
      };
    }>, reply);
  }
);
}