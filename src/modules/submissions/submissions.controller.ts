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
   * Submit form (handles both in-progress and done status)
   * POST /forms/submissions
   */
  async submitForm(
    request: FastifyRequest<{
      Body: { 
        formId: string;
        data: Record<string, any>;
        status: 'in-progress' | 'done';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { formId, data, status } = request.body;
      const submittedBy = request.user?.userId;

      if (!submittedBy) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication required'
        });
      }

      // Validate request data
      const validation = this.validator.validateCreateSubmission({ formId, data, status });
      if (!validation.isValid) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid request data',
          errors: validation.errors
        });
      }

      // Check if there's already an in-progress submission for this form and user
      const existingInProgress = await this.service.getUserInProgressSubmission(formId, submittedBy);

      let submission;
      if (existingInProgress) {
        // Update existing in-progress submission
        submission = await this.service.updateSubmission(
          existingInProgress._id.toString(),
          { data, status },
          submittedBy
        );
      } else {
        // Create new submission
        submission = await this.service.createSubmission(formId, data, submittedBy, status);
      }

      return reply.status(201).send({
        success: true,
        data: submission
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit form'
      });
    }
  }

  /**
   * List user's submissions
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
}