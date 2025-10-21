import { FastifyRequest, FastifyReply } from 'fastify';
import { SubmissionsService } from './submissions.service';
import { SubmissionValidator } from './submissions.validators';
import '../../auth/types';

export class SubmissionsController {
  private service: SubmissionsService;
  private validator: SubmissionValidator;

  constructor() {
    this.service = new SubmissionsService();
    this.validator = new SubmissionValidator();
  }

  /**
   * Save draft submission (no validation, for save and continue later)
   * POST /forms/:formId/draft-submission
   */
  async saveInProgressSubmission(
    request: FastifyRequest<{
      Params: { formId: string };
      Body: { data: Record<string, any> };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { formId } = request.params;
      const { data } = request.body;
      const submittedBy = request.user?.userId;

      if (!submittedBy) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication required'
        });
      }

      // Validate request data (Simple validation, no validation rules)
      const validation = this.validator.validateCreateSubmission({ formId, data, status: 'in-progress' });
      if (!validation.isValid) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid request data',
          errors: validation.errors
        });
      }

      const submission = await this.service.saveInProgressSubmission(formId, data, submittedBy);

      return reply.status(201).send({
        success: true,
        data: submission
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save in-progress submission'
      });
    }
  }

  /**
   * Submit answers (complete submission with validation)
   * POST /forms/:formId/submissions
   */
  async submitAnswers(
    request: FastifyRequest<{
      Params: { formId: string };
      Body: { data: Record<string, any> };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { formId } = request.params;
      const { data } = request.body;
      const submittedBy = request.user?.userId;

      if (!submittedBy) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication required'
        });
      }

      // Validate request data (Simple validation, no validation rules)
      const validation = this.validator.validateCreateSubmission({ formId, data, status: 'done' });
      if (!validation.isValid) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid request data',
          errors: validation.errors
        });
      }

      // Submit answers (complete submission with validation)
      const submission = await this.service.submitAnswers(formId, data, submittedBy);

      return reply.status(201).send({
        success: true,
        data: submission
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit answers'
      });
    }
  }

  /**
   * List user's submissions (works for both user and admin)
   * GET /submissions
   */
  async listUserSubmissions(
    request: FastifyRequest<{
      Querystring: {
        formId?: string;
        status?: 'in-progress' | 'done';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.userId;
      const userRole = request.user?.role;

      const filters = {
        formId: request.query.formId,
        status: request.query.status,
        submittedBy: userId // Patients can only see their own submissions
      };

      const submissions = await this.service.listSubmissions(filters, userId, userRole);

      return reply.send({
        success: true,
        data: submissions
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list submissions'
      });
    }
  }

  /**
   * Get user's submission by ID
   * GET /submissions/:id
   */
  async getUserSubmissionById(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const userId = request.user?.userId;
      const userRole = request.user?.role;

      const submission = await this.service.getSubmissionById(id, userId, userRole);

      return reply.send({
        success: true,
        data: submission
      });
    } catch (error) {
      return reply.status(404).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get submission'
      });
    }
  }

  /**
   * Update user's submission
   * PUT /submissions/:id
   */
  async updateUserSubmission(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { data?: Record<string, any>; status?: 'in-progress' | 'done' };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const updates = request.body;
      const userId = request.user?.userId;

      // Validate update data (Simple validation, no validation rules)
      const validation = this.validator.validateUpdateSubmission(updates);
      if (!validation.isValid) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid update data',
          errors: validation.errors
        });
      }

      const submission = await this.service.updateSubmission(id, updates, userId);

      return reply.send({
        success: true,
        data: submission
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update submission'
      });
    }
  }


  // ===== ADMIN ENDPOINTS =====

  /**
   * List all submissions (admin only)
   * GET /admin/submissions
   */
  async listAllSubmissions(
    request: FastifyRequest<{
      Querystring: {
        formId?: string;
        submittedBy?: string;
        status?: 'in-progress' | 'done';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user?.userId;
      const userRole = request.user?.role;

      if (!userId || userRole !== 'admin') {
        return reply.status(403).send({
          success: false,
          message: 'Admin access required'
        });
      }

      const filters = {
        formId: request.query.formId,
        submittedBy: request.query.submittedBy,
        status: request.query.status
      };

      const submissions = await this.service.listSubmissions(filters, userId, userRole);

      return reply.send({
        success: true,
        data: submissions
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list submissions'
      });
    }
  }

  /**
   * Get any submission by ID (admin only)
   * GET /admin/submissions/:id
   */
  async getSubmissionBySubmissionId(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const userId = request.user?.userId;
      const userRole = request.user?.role;

      if (!userId || userRole !== 'admin') {
        return reply.status(403).send({
          success: false,
          message: 'Admin access required'
        });
      }

      const submission = await this.service.getSubmissionById(id, userId, userRole);

      return reply.send({
        success: true,
        data: submission
      });
    } catch (error) {
      return reply.status(404).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get submission'
      });
    }
  }

  /**
   * Delete submission (works for both user and admin)
   * DELETE /submissions/:id (user) or DELETE /admin/submissions/:id (admin)
   */
  async deleteSubmission(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const userId = request.user?.userId;
      const userRole = request.user?.role;
      
      await this.service.deleteSubmission(id, userId, userRole);

      return reply.send({
        success: true,
        message: 'Submission deleted successfully'
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete submission'
      });
    }
  }
}
