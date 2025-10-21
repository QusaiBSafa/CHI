import { SubmissionsRepository } from './submissions.repository';
import { SubmissionValidator } from './submissions.validators';
import { FormsRepository } from '../forms/forms.repository';
import { Submission } from './submission.entity';

export class SubmissionsService {
  private repository: SubmissionsRepository;
  private validator: SubmissionValidator;
  private formsRepository: FormsRepository;

  constructor() {
    this.repository = new SubmissionsRepository();
    this.validator = new SubmissionValidator();
    this.formsRepository = new FormsRepository();
  }

  /**
   * Create a new submission (draft or completed)
   */
  async createSubmission(
    formId: string,
    data: Record<string, any>,
    submittedBy: string,
    status: 'in-progress' | 'done' = 'in-progress'
  ): Promise<Submission> {
    // Get the latest published form
    const form = await this.formsRepository.findLatestPublished(formId);
    if (!form) {
      throw new Error(`Form '${formId}' not found or not published`);
    }

    // If status is 'done', validate the submission data
    if (status === 'done') {
      const validationResult = await this.validator.validateSubmissionData(data, form);
      if (!validationResult.isValid) {
        throw new Error(`Submission validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }
    }

    // Create the submission
    const submission = await this.repository.create({
      formId,
      formVersion: form.version,
      submittedBy,
      data,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return submission;
  }

  /**
   * Save draft submission (no validation, for save and continue later)
   */
  async saveInProgressSubmission(
    formId: string,
    data: Record<string, any>,
    submittedBy: string
  ): Promise<Submission> {
    // Check if there's already an in-progress submission for this form and user
    const existingDraft = await this.repository.findInProgressByFormIdAndUser(formId, submittedBy);

    if (existingDraft) {
      // Update existing draft
      return await this.updateSubmission(
        existingDraft._id.toString(),
        { data },
        submittedBy
      );
    }

    // Create new draft (status = 'in-progress', no validation)
    return await this.createSubmission(formId, data, submittedBy, 'in-progress');
  }

  /**
   * Submit answers (complete submission with validation)
   */
  async submitAnswers(
    formId: string,
    data: Record<string, any>,
    submittedBy: string
  ): Promise<Submission> {
    // Create completed submission (status = 'done', with validation)
    return await this.createSubmission(formId, data, submittedBy, 'done');
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(id: string, userId: string, userRole: string): Promise<Submission> {
    const submission = await this.repository.findById(id);

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Check authorization: patients can only view their own submissions
    if (userRole === 'patient' && submission.submittedBy !== userId) {
      throw new Error('You do not have permission to view this submission');
    }

    return submission;
  }

  /**
   * List submissions with filters
   */
  async listSubmissions(
    filters: {
      formId?: string;
      submittedBy?: string;
      status?: 'in-progress' | 'done';
    },
    userId: string,
    userRole: string
  ): Promise<Submission[]> {
    let submissions: Submission[];

    // Patients can only see their own submissions
    if (userRole === 'patient') {
      filters.submittedBy = userId;
    }

    // Apply filters
    if (filters.formId && filters.submittedBy) {
      submissions = await this.repository.findByFormIdAndUser(filters.formId, filters.submittedBy);
    } else if (filters.formId) {
      submissions = await this.repository.findByFormId(filters.formId);
    } else if (filters.submittedBy) {
      submissions = await this.repository.findByUser(filters.submittedBy);
    } else if (filters.status) {
      submissions = await this.repository.findByStatus(filters.status);
    } else {
      // Admin can list all submissions
      if (userRole === 'admin') {
        submissions = await this.repository.getAllSubmissions();
      } else {
        submissions = await this.repository.findByUser(userId);
      }
    }

    // Filter by status if provided
    if (filters.status) {
      submissions = submissions.filter(s => s.status === filters.status);
    }

    return submissions;
  }

  /**
   * Update submission
   */
  async updateSubmission(
    id: string,
    updates: { data?: Record<string, any>; status?: 'in-progress' | 'done' },
    userId: string
  ): Promise<Submission> {
    const submission = await this.repository.findById(id);

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Check if user owns this submission
    if (submission.submittedBy !== userId) {
      throw new Error('You do not have permission to update this submission');
    }

    // Check if update is allowed(if the submission is completed, it cannot be updated)
    const canUpdate = this.validator.canUpdateSubmission(submission, updates);
    if (!canUpdate.canUpdate) {
      throw new Error(canUpdate.reason || 'Cannot update submission');
    }

    // If changing status to 'done', validate the data
    if (updates.status === 'done') {
      const dataToValidate = updates.data || submission.data;
      const form = await this.formsRepository.findLatestPublished(submission.formId);
      
      if (!form) {
        throw new Error('Form not found');
      }

      const validationResult = await this.validator.validateSubmissionData(dataToValidate, form);
      if (!validationResult.isValid) {
        throw new Error(`Submission validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }
    }

    // Update the submission
    const updated = await this.repository.update(id, updates);

    if (!updated) {
      throw new Error('Failed to update submission');
    }

    return updated;
  }

  /**
   * Assumption that the user can delete in-progress submissions, 
   * Delete submission
   */
  async deleteSubmission(id: string, userId: string, userRole: string): Promise<void> {
    const submission = await this.repository.findById(id);

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Check authorization
    if (userRole === 'patient' && submission.submittedBy !== userId) {
      throw new Error('You do not have permission to delete this submission');
    }

    // Check if deletion is allowed
    // TODO I think we shouldn't allowed admin to delte submissions or may be support soft delte
    const canDelete = this.validator.canDeleteSubmission(submission);
    if (!canDelete.canDelete) {
      throw new Error(canDelete.reason);
    }

    // Delete the submission
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error('Failed to delete submission');
    }
  }

  /**
   * Get user's draft submission for a specific form
   */
  async getUserInProgressSubmission(formId: string, userId: string): Promise<Submission | null> {
    const draft = await this.repository.findInProgressByFormIdAndUser(formId, userId);
    return draft;
  }

  /**
   * Get user's completed submissions for a specific form
   */
  async getUserCompletedSubmissions(formId: string, userId: string): Promise<Submission[]> {
    const submissions = await this.repository.findCompletedByFormIdAndUser(formId, userId);
    return submissions;
  }
}

