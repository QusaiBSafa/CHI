import { FastifyInstance, FastifyRequest } from 'fastify';
import { SubmissionsController } from './submissions.controller';
import { requireAuth, requireAdmin } from '../../auth/rbac';

export async function submissionsRoutes(app: FastifyInstance) {
  const controller = new SubmissionsController();

  // ===== PATIENT ENDPOINTS =====

  // Save draft submission (no validation, for save and continue later)
  app.post('/forms/:formId/inprogress-submission', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Patient - Submissions'],
      description: 'Save draft submission (no validation, for save and continue later)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          formId: { type: 'string' }
        },
        required: ['formId']
      },
      body: {
        type: 'object',
        properties: {
          data: { type: 'object' }
        },
        required: ['data']
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
    return controller.saveInProgressSubmission(request as FastifyRequest<{
      Params: { formId: string };
      Body: { data: Record<string, any> };
    }>, reply);
  }
);
  

  // Submit answers (complete submission with validation)
  app.post('/forms/:formId/submissions', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Patient - Submissions'],
      description: 'Submit answers (complete submission with validation)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          formId: { type: 'string' }
        },
        required: ['formId']
      },
      body: {
        type: 'object',
        properties: {
          data: { type: 'object' }
        },
        required: ['data']
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
    return controller.submitAnswers(request as FastifyRequest<{
      Params: { formId: string };
      Body: { data: Record<string, any> };
    }>, reply);
  }
);

  // List user's submissions (works for both user and admin)
  app.get('/submissions', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Patient - Submissions'],
      description: 'List user\'s submissions (works for both user and admin)',
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

  // Get user's submission by ID
  app.get('/submissions/:id', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Patient - Submissions'],
      description: 'Get user\'s submission by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        404: {
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
    return controller.getUserSubmissionById(request as FastifyRequest<{
      Params: { id: string };
    }>, reply);
  }
);

  // Update user's submission
  app.put('/submissions/:id', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Patient - Submissions'],
      description: 'Update user\'s submission',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          data: { type: 'object' },
          status: { type: 'string', enum: ['in-progress', 'done'] }
        }
      },
      response: {
        200: {
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
    return controller.updateUserSubmission(request as FastifyRequest<{
      Params: { id: string };
      Body: { data?: Record<string, any>; status?: 'in-progress' | 'done' };
    }>, reply);
  }
);

  // Delete submission (works for both user and admin)
  app.delete('/submissions/:id', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Patient - Submissions'],
      description: 'Delete submission (works for both user and admin)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
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
    return controller.deleteSubmission(request as FastifyRequest<{
      Params: { id: string };
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

  // Get any submission by ID (admin only)
  app.get('/admin/submissions/:id', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      tags: ['Admin - Submissions'],
      description: 'Get any submission by ID (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        403: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
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
    return controller.getSubmissionBySubmissionId(request as FastifyRequest<{
      Params: { id: string };
    }>, reply);
  }
);

  // Delete any submission (admin only)
  app.delete('/admin/submissions/:id', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      tags: ['Admin - Submissions'],
      description: 'Delete any submission (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        403: {
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
    return controller.deleteSubmission(request as FastifyRequest<{
      Params: { id: string };
    }>, reply);
  }
);
}
