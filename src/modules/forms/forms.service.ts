import { FormsRepository } from './forms.repository';
import { FormsValidator } from './forms.validators';
import { Form } from './form.entity';
import { FormDSL } from './dsl/schema.zod';
import { ValidationError } from '../../utils/result';

export class FormsService {
  private repository: FormsRepository;
  private validator: FormsValidator;

  constructor() {
    this.repository = new FormsRepository();
    this.validator = new FormsValidator();
  }

  /**
   * Create a new draft form
   */
  async createDraft(
    formId: string,
    name: string,
    definition: any,
    createdBy: string
  ): Promise<{ form?: Form; errors?: ValidationError[] }> {

     // Check if there's already a draft for this formId
    // TODO should we go with this solution or archieve the old draft if they exist?
    const existingDraft = await this.repository.findLatestDraft(formId);
    if (existingDraft) {
      throw new Error(`A draft already exists for form ID: ${formId}, version: ${existingDraft.version}, DB ID: ${existingDraft._id.toString()}. Please update the existing draft or publish it first.`);
    }

    // Validate definition
    const validationErrors = this.validator.validateFormDefinition(definition);
    if (validationErrors.length > 0) {
      return { errors: validationErrors };
    }

    // Determine version number
    const allVersions = await this.repository.findByFormId(formId);
    const latestVersion = allVersions.length > 0 ? Math.max(...allVersions.map(v => v.version)) : 0;
    const newVersion = latestVersion + 1;

    // Create draft
    const form = await this.repository.create({
      formId,
      name,
      version: newVersion,
      status: 'draft',
      definition,
      createdBy,
      createdAt: new Date(),
    });

    return { form };
  }

  /**
   * Update an existing draft
   */
  async updateDraft(
    id: string,
    definition: any,
    updatedBy: string
  ): Promise<{ form?: Form; errors?: ValidationError[] }> {
    // Get existing form
    const existingForm = await this.repository.findById(id);
    if (!existingForm) {
      throw new Error('Form not found');
    }

    // Only drafts can be updated
    if (existingForm.status !== 'draft') {
      throw new Error('Only draft forms can be updated');
    }

    // Validate definition
    const validationErrors = this.validator.validateFormDefinition(definition);
    if (validationErrors.length > 0) {
      return { errors: validationErrors };
    }

    // Update draft
    const form = await this.repository.update(id, {
      definition,
      updatedAt: new Date(),
      updatedBy,
    });

    if (!form) {
      throw new Error('Failed to update form');
    }

    return { form };
  }

  /**
   * Get form by MongoDB _id
   */
  async getById(id: string): Promise<Form | null> {
    return await this.repository.findById(id);
  }

  /**
   * Get latest published version of a form
   */
  async getLatestPublished(formId: string): Promise<Form | null> {
    return await this.repository.findLatestPublished(formId);
  }

  /**
   * Get latest draft version of a form
   */
  async getLatestDraft(formId: string): Promise<Form | null> {
    return await this.repository.findLatestDraft(formId);
  }

  /**
   * List forms by status
   */
  async listByStatus(status: 'draft' | 'published' | 'archived'): Promise<Form[]> {
    return await this.repository.findByStatus(status);
  }

  /**
   * Get all versions of a form
   */
  async getAllVersions(formId: string): Promise<Form[]> {
    return await this.repository.findByFormId(formId);
  }

  /**
   * Publish a draft form
   * - Changes draft status to published
   * - Sets publishedAt timestamp
   * - Archives the previous published version (if exists)
   */
  async publish(formId: string, publishedBy: string): Promise<Form> {
    // We garantee that there is only one draft for a formId, we have check in createDraft method
    const draft = await this.repository.findDraftByFormId(formId);
    
    if (!draft) {
      throw new Error(`No draft found for form ID: ${formId}`);
    }

    if (draft.status !== 'draft') {
      throw new Error('Form is not in draft status');
    }

    // Archive the current published version (if exists)
    const currentPublished = await this.repository.findLatestPublished(formId);
    
    if (currentPublished) {
      await this.archive(formId);
    }

    // Publish the draft
    const published = await this.repository.update(draft._id.toString(), {
      status: 'published',
      publishedAt: new Date(),
    });

    if (!published) {
      throw new Error('Failed to publish form');
    }

    return published;
  }

  /**
   * Archive a published form
   */
  async archive(formId: string): Promise<Form> {
    const published = await this.repository.findLatestPublished(formId);
    
    if (!published) {
      throw new Error(`No published version found for form ID: ${formId}`);
    }

    const archived = await this.repository.update(published._id.toString(), {
      status: 'archived',
    });

    if (!archived) {
      throw new Error('Failed to archive form');
    }

    return archived;
  }

  /**
   * Get publishing history for a form
   */
  async getPublishingHistory(formId: string): Promise<Form[]> {
    const allVersions = await this.repository.findByFormId(formId);
    
    // Return only published and archived versions (not drafts)
    return allVersions.filter(v => v.status === 'published' || v.status === 'archived');
  }

  /**
   * Validate form definition
   */
  validateDefinition(definition: any): ValidationError[] {
    return this.validator.validateFormDefinition(definition);
  }

  /**
   * Validate a sample submission against a form (dry-run)
   */
  async validateSampleSubmission(
    formId: string,
    sampleData: Record<string, any>
  ): Promise<ValidationError[]> {
    // Get latest draft or published version
    let form = await this.repository.findLatestDraft(formId);
    if (!form) {
      form = await this.repository.findLatestPublished(formId);
    }

    if (!form) {
      throw new Error(`Form not found: ${formId}`);
    }

    // Import submission validators (we'll create this later)
    // For now, return empty array as placeholder
    // TODO: Implement actual submission validation
    return [];
  }

  /**
   * Delete a draft form
   * Assumption here is that we don't need to delete the form if it is published or archived, we just need to delete the draft.
   */
  async deleteDraft(id: string): Promise<boolean> {
    const form = await this.repository.findById(id);
    
    if (!form) {
      throw new Error('Form not found');
    }

    if (form.status !== 'draft') {
      throw new Error('Only draft forms can be deleted');
    }

    return await this.repository.delete(id);
  }
}

