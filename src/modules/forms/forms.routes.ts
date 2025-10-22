import { FastifyInstance } from 'fastify';
import { FormsController } from './forms.controller';
import { requireAdmin, requireAuth } from '../../auth/rbac';

export async function formsRoutes(app: FastifyInstance) {
  const controller = new FormsController();

  // Create draft form
  app.post('/admin/forms', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Admin - Forms'],
      description: 'Create a new draft form',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['formId', 'name', 'definition'],
        properties: {
          formId: { type: 'string', description: 'Unique form identifier (e.g., "form_chi")' },
          name: { type: 'string', description: 'Form name' },
          definition: { type: 'object', description: 'Form definition (DSL JSON)' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'array' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return controller.createDraft(request, reply);
  });

  // List forms by status
  app.get('/admin/forms', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Admin - Forms'],
      description: 'List forms by status',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { 
            type: 'string', 
            enum: ['draft', 'published', 'archived'],
            description: 'Filter by form status'
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return controller.listForms(request, reply);
  });

  // Get form by ID
  app.get('/admin/forms/:id', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Admin - Forms'],
      description: 'Get form by MongoDB ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Form MongoDB ID' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return controller.getForm(request, reply);
  });

  // Update draft form
  app.patch('/admin/forms/:id', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Admin - Forms'],
      description: 'Update draft form definition',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Form MongoDB ID' },
        },
      },
      body: {
        type: 'object',
        required: ['definition'],
        properties: {
          definition: { type: 'object', description: 'Updated form definition (DSL JSON)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'array' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return controller.updateDraft(request, reply);
  });

  // Publish form
  app.post('/admin/forms/:id/publish', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Admin - Forms'],
      description: 'Publish a draft form (auto-archives previous published version)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Form MongoDB ID' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
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
    return controller.publishForm(request, reply);
  });

  // Get latest published form (for patients)
  app.get('/forms/:formId', {
    preHandler: requireAuth,
    schema: {
      tags: ['Patient - Forms'],
      description: 'Get latest published version of a form',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          formId: { type: 'string', description: 'Form ID (e.g., "form_chi")' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return controller.getPublishedForm(request, reply);
  });
}

