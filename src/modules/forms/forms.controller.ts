import { FastifyRequest, FastifyReply } from 'fastify';
import { FormsService } from './forms.service';
import '../../auth/types';

export class FormsController {
  private service: FormsService;

  constructor() {
    this.service = new FormsService();
  }

  /**
   * Create a new draft form
   * POST /admin/forms
   */
  async createDraft(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { formId, name, definition } = request.body as {
        formId: string;
        name: string;
        definition: any;
      };

      if (!formId || !name || !definition) {
        return reply.status(400).send({
          success: false,
          message: 'formId, name, and definition are required',
        });
      }

      const userId = request.user?.userId;
      const result = await this.service.createDraft(formId, name, definition, userId);

      if (result.errors && result.errors.length > 0) {
        return reply.status(400).send({
          success: false,
          message: 'Form validation failed',
          errors: result.errors,
        });
      }

      if (!result.form) {
        return reply.status(500).send({
          success: false,
          message: 'Failed to create form - no form returned',
        });
      }

      return reply.status(200).send({
        success: true,
        data: this.formatForm(result.form),
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to create draft',
      });
    }
  }

  /**
   * List forms by status
   * GET /admin/forms?status=draft|published|archived
   */
  async listForms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { status } = request.query as { status?: string };

      if (!status || !['draft', 'published', 'archived'].includes(status)) {
        return reply.status(400).send({
          success: false,
          message: 'Valid status query parameter is required (draft, published, or archived)',
        });
      }

      const forms = await this.service.listByStatus(status as 'draft' | 'published' | 'archived');

      return reply.status(200).send({
        success: true,
        data: forms.map(f => this.formatForm(f)),
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to list forms',
      });
    }
  }

  /**
   * Get form by ID
   * GET /admin/forms/:id
   */
  async getForm(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const form = await this.service.getById(id);

      if (!form) {
        return reply.status(404).send({
          success: false,
          message: 'Form not found',
        });
      }

      return reply.status(200).send({
        success: true,
        data: this.formatForm(form),
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to get form',
      });
    }
  }

  /**
   * Update draft form
   * PATCH /admin/forms/:id
   */
  async updateDraft(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { definition } = request.body as { definition: any };

      if (!definition) {
        return reply.status(400).send({
          success: false,
          message: 'definition is required',
        });
      }

      const userId = request.user?.userId || 'unknown';
      const result = await this.service.updateDraft(id, definition, userId);

      if (result.errors && result.errors.length > 0) {
        return reply.status(400).send({
          success: false,
          message: 'Form validation failed',
          errors: result.errors,
        });
      }

      return reply.status(200).send({
        success: true,
        data: this.formatForm(result.form!),
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to update draft',
      });
    }
  }

  /**
   * Publish form
   * POST /admin/forms/:id/publish
   */
  async publishForm(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      // Get the form to extract formId
      const form = await this.service.getById(id);
      if (!form) {
        return reply.status(404).send({
          success: false,
          message: 'Form not found',
        });
      }

      const userId = request.user?.userId;
      const published = await this.service.publish(form.formId, userId);

      return reply.status(200).send({
        success: true,
        data: this.formatForm(published),
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to publish form',
      });
    }
  }


  /**
   * Get latest published form by formId (for patients)
   * GET /forms/:formId
   */
  async getPublishedForm(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { formId } = request.params as { formId: string };

      const form = await this.service.getLatestPublished(formId);

      if (!form) {
        return reply.status(404).send({
          success: false,
          message: 'Published form not found',
        });
      }

      return reply.status(200).send({
        success: true,
        data: this.formatForm(form),
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to get form',
      });
    }
  }

  /**
   * Format form for response (camelCase)
   */
  private formatForm(form: any) {
    return {
      id: form._id.toString(),
      formId: form.formId,
      name: form.name,
      version: form.version,
      status: form.status,
      definition: form.definition,
      createdBy: form.createdBy,
      createdAt: form.createdAt,
      updatedBy: form.updatedBy,
      updatedAt: form.updatedAt,
      publishedAt: form.publishedAt,
    };
  }
}

