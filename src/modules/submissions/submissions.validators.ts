import { z } from 'zod';
import { ValidationError } from '../../utils/result';
import { Form } from '../forms/form.entity';
import { ValidationRulesEngine } from '../forms/dsl/rules';
import { BranchingEngine } from '../forms/dsl/branching';

// Submission data validation schema
export const SubmissionDataSchema = z.record(z.any());

// Create submission validation schema
export const CreateSubmissionSchema = z.object({
  formId: z.string().min(1, 'Form ID is required'),
  data: SubmissionDataSchema,
  status: z.enum(['in-progress', 'done']).default('in-progress'),
});

// Update submission validation schema
export const UpdateSubmissionSchema = z.object({
  data: SubmissionDataSchema.optional(),
  status: z.enum(['in-progress', 'done']).optional(),
});

// Query parameters validation
export const SubmissionQuerySchema = z.object({
  formId: z.string().optional(),
  status: z.enum(['in-progress', 'done']).optional(),
  submittedBy: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
});

export class SubmissionValidator {
  private validationEngine: ValidationRulesEngine;
  private branchingEngine: BranchingEngine;

  constructor() {
    this.validationEngine = new ValidationRulesEngine();
    this.branchingEngine = new BranchingEngine();
  }

  /**
   * Validate submission data against form definition
   */
  async validateSubmissionData(
    submissionData: Record<string, any>,
    form: Form
  ): Promise<{ isValid: boolean; errors: ValidationError[] }> {
    const errors: ValidationError[] = [];

    try {
      // Get all fields from the form definition using BranchingEngine
      const allFields = this.branchingEngine.getAllFields(form.definition);
      
      // Determine field visibility using branching logic
      const visibilityMap = this.branchingEngine.resolveVisibility(
        form.definition,
        submissionData
      );

      // Get submitted field IDs
      const submittedFieldIds = Object.keys(submissionData);
      
      // Get visible field IDs
      const visibleFieldIds = Array.from(visibilityMap.entries())
        .filter(([_, visible]) => visible)
        .map(([fieldId, _]) => fieldId);

      // 1. Check that submitted fields exist in visible fields
      for (const submittedFieldId of submittedFieldIds) {
        if (!visibleFieldIds.includes(submittedFieldId)) {
          errors.push({
            path: `field.${submittedFieldId}`,
            code: 'invalid_field',
            message: `Field '${submittedFieldId}' is not visible or does not exist in the form`
          });
        }
      }

      // 2. Check required fields in the form are submitted
      for (const fieldId of visibleFieldIds) {
        const field = allFields.find(f => f.id === fieldId);
        if (!field) continue;

        const fieldValue = submissionData[fieldId];
        
        // Check if field is required (has required validation rule)
        const isRequired = field.validation?.some(rule => rule.rule === 'required');
        
        if (isRequired && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
          errors.push({
            path: `field.${fieldId}`,
            code: 'required_field',
            message: `Field '${field.label || fieldId}' is required`
          });
        }
      }

      // 3. Check single select and multiple select values are part of the options
      for (const fieldId of visibleFieldIds) {
        const field = allFields.find(f => f.id === fieldId);
        if (!field) continue;

        const fieldValue = submissionData[fieldId];
        
        // Skip empty values (already handled by required check)
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          continue;
        }

        // Check select fields using ValidationRulesEngine methods
        if (field.type === 'singleSelect') {
          const selectError = this.validationEngine.validateSingleSelect(field, fieldValue);
          if (selectError) {
            errors.push({
              path: `field.${fieldId}`,
              code: selectError.code,
              message: selectError.message
            });
          }
        } else if (field.type === 'multiselect') {
          const multiselectError = this.validationEngine.validateMultiselect(field, fieldValue);
          if (multiselectError) {
            errors.push({
              path: `field.${fieldId}`,
              code: multiselectError.code,
              message: multiselectError.message
            });
          }
        }
      }

      // 4. Validate all visible fields against their validation rules
      for (const fieldId of visibleFieldIds) {
        const field = allFields.find(f => f.id === fieldId);
        if (!field) continue;

        const fieldValue = submissionData[fieldId];
        
        // Use ValidationRulesEngine to validate field
        const fieldErrors = this.validationEngine.validateField(
          field,
          fieldValue,
          submissionData
        );

        if (fieldErrors.length > 0) {
          errors.push(...fieldErrors.map(error => ({
            path: `field.${fieldId}`,
            code: error.code,
            message: error.message
          })));
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      errors.push({
        path: 'submission',
        code: 'validation_error',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return {
        isValid: false,
        errors
      };
    }
  }

  /**
   * Validate submission creation request
   */
  validateCreateSubmission(data: any): { isValid: boolean; errors: ValidationError[]; validatedData?: any } {
    try {
      const validatedData = CreateSubmissionSchema.parse(data);
      return {
        isValid: true,
        errors: [],
        validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            code: 'validation_error',
            message: err.message
          }))
        };
      }
      
      return {
        isValid: false,
        errors: [{
          path: 'submission',
          code: 'validation_error',
          message: 'Invalid submission data'
        }]
      };
    }
  }

  /**
   * Validate submission update request
   */
  validateUpdateSubmission(data: any): { isValid: boolean; errors: ValidationError[]; validatedData?: any } {
    try {
      const validatedData = UpdateSubmissionSchema.parse(data);
      return {
        isValid: true,
        errors: [],
        validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            code: 'validation_error',
            message: err.message
          }))
        };
      }
      
      return {
        isValid: false,
        errors: [{
          path: 'submission',
          code: 'validation_error',
          message: 'Invalid submission update data'
        }]
      };
    }
  }

  /**
   * Validate query parameters
   */
  validateQueryParams(query: any): { isValid: boolean; errors: ValidationError[]; validatedData?: any } {
    try {
      const validatedData = SubmissionQuerySchema.parse(query);
      return {
        errors: [],
        isValid: true,
        validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            code: 'validation_error',
            message: err.message
          }))
        };
      }
      
      return {
        isValid: false,
        errors: [{
          path: 'query',
          code: 'validation_error',
          message: 'Invalid query parameters'
        }]
      };
    }
  }

  /**
   * Check if submission can be updated (business rules)
   */
  canUpdateSubmission(submission: any, updates: any): { canUpdate: boolean; reason?: string } {
    // Cannot update completed submissions
    if (submission.status === 'done') {
      return {
        canUpdate: false,
        reason: 'Cannot modify data of completed submissions'
      };
    }

    return { canUpdate: true };
  }

  /**
   * Assumption that the user can delete in-progress submissions, 
   * Check if submission can be deleted
   */
  canDeleteSubmission(submission: any): { canDelete: boolean; reason?: string } {
    // Completed submissions might have business rules preventing deletion
    if (submission.status === 'done') {
      return {
        canDelete: false,
        reason: 'Cannot delete completed submissions'
      };
    }

    return { canDelete: true };
  }
}

