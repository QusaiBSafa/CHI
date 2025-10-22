import { FormDSL, FormDSLSchema, Field } from './dsl/schema.zod';
import { BranchingEngine } from './dsl/branching';
import { ValidationRulesEngine } from './dsl/rules';
import { ValidationError } from '../../utils/result';

export class FormsValidator {
  private branchingEngine: BranchingEngine;
  private rulesEngine: ValidationRulesEngine;

  constructor() {
    this.branchingEngine = new BranchingEngine();
    this.rulesEngine = new ValidationRulesEngine();
  }

  /**
   * Validate form definition (called when creating or updating forms)
   */
  validateFormDefinition(definition: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // 1. Validate against Zod schema
    const zodErrors = this.validateZodSchema(definition);
    errors.push(...zodErrors);

    // If Zod validation fails, don't proceed with other validations
    if (zodErrors.length > 0) {
      return errors;
    }

    const formDSL = definition as FormDSL;

    // 2. Validate field ID uniqueness
    const uniquenessErrors = this.validateFieldIdUniqueness(formDSL);
    errors.push(...uniquenessErrors);

    // 3. Validate select/multiselect fields have options
    const optionsErrors = this.validateFieldOptions(formDSL);
    errors.push(...optionsErrors);

    // 4. Validate branching expressions
    const branchingErrors = this.validateBranching(formDSL);
    errors.push(...branchingErrors);

    // 5. Validate validation rules
    const validationErrors = this.validateValidationRules(formDSL);
    errors.push(...validationErrors);

    // 6. Detect circular dependencies
    const circularErrors = this.detectCircularDependencies(formDSL);
    errors.push(...circularErrors);

    return errors;
  }

  /**
   * Validate against Zod schema
   */
  private validateZodSchema(definition: any): ValidationError[] {
    const result = FormDSLSchema.safeParse(definition);

    if (result.success) {
      return [];
    }

    return result.error.errors.map(err => ({
      path: err.path.join('.'),
      code: err.code,
      message: err.message,
    }));
  }

  /**
   * Validate field ID uniqueness across entire form
   */
  private validateFieldIdUniqueness(form: FormDSL): ValidationError[] {
    const errors: ValidationError[] = [];
    const fieldIds = new Set<string>();
    const duplicates = new Set<string>();

    const allFields = this.getAllFields(form);

    for (const field of allFields) {
      if (fieldIds.has(field.id)) {
        duplicates.add(field.id);
      } else {
        fieldIds.add(field.id);
      }
    }

    for (const duplicate of duplicates) {
      errors.push({
        path: `field.${duplicate}`,
        code: 'duplicate_field_id',
        message: `Field ID '${duplicate}' is used multiple times. Field IDs must be unique across the entire form.`,
      });
    }

    return errors;
  }

  /**
   * Validate that select/multiselect fields have options
   */
  private validateFieldOptions(form: FormDSL): ValidationError[] {
    const errors: ValidationError[] = [];
    const allFields = this.getAllFields(form);

    for (const field of allFields) {
      if ((field.type === 'singleSelect' || field.type === 'multiselect')) {
        if (!field.options || field.options.length === 0) {
          errors.push({
            path: `field.${field.id}`,
            code: 'missing_options',
            message: `Field '${field.id}' of type '${field.type}' must have options defined.`,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate branching expressions and field references
   */
  private validateBranching(form: FormDSL): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Validate field references
    const refErrors = this.branchingEngine.validateFieldReferences(form);
    
    for (const refError of refErrors) {
      errors.push({
        path: `field.${refError.fieldId}.branching`,
        code: 'invalid_field_reference',
        message: `Field '${refError.fieldId}' references non-existent field '${refError.invalidRef}' in expression: ${refError.expression}`,
      });
    }

    return errors;
  }

  /**
   * Validate validation rules
   */
  private validateValidationRules(form: FormDSL): ValidationError[] {
    const errors: ValidationError[] = [];
    const allFields = this.getAllFields(form);
    const allFieldIds = new Set(allFields.map(f => f.id));

    for (const field of allFields) {
      // Validate field references in validation rules
      const refErrors = this.rulesEngine.validateRuleReferences(field, allFieldIds);
      errors.push(...refErrors);

      // Validate rule compatibility with field type
      if (field.validation) {
        for (const rule of field.validation) {
          const compatError = this.validateRuleCompatibility(field, rule.rule);
          if (compatError) {
            errors.push(compatError);
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate that validation rules are compatible with field types
   * So here if field is number and we add validation rule for min 
   */
  private validateRuleCompatibility(field: Field, ruleType: string): ValidationError | null {
    const incompatibilities: Record<string, string[]> = {
      min: ['number', 'date'],
      max: ['number', 'date'],
      regex: ['text', 'textarea'],
    };

    if (incompatibilities[ruleType]) {
      const allowedTypes = incompatibilities[ruleType];
      if (!allowedTypes.includes(field.type)) {
        return {
          path: `field.${field.id}.validation`,
          code: 'incompatible_rule',
          message: `Validation rule '${ruleType}' cannot be used with field type '${field.type}'. Allowed types: ${allowedTypes.join(', ')}`,
        };
      }
    }

    return null;
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(form: FormDSL): ValidationError[] {
    const errors: ValidationError[] = [];
    const cycles = this.branchingEngine.detectCircularDependencies(form);

    for (const cycle of cycles) {
      errors.push({
        path: 'form.branching',
        code: 'circular_dependency',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
      });
    }

    return errors;
  }

  /**
   * Get all fields from form (helper)
   */
  private getAllFields(form: FormDSL): Field[] {
    const fields: Field[] = [];

    for (const section of form.sections) {
      fields.push(...section.fields);
      for (const group of section.groups) {
        fields.push(...group.fields);
      }
    }

    return fields;
  }
}

