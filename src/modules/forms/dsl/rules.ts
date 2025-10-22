import { Field, ValidationRule } from './schema.zod';
import { ExpressionEvaluator } from './expressions';
import { ValidationError } from '../../../utils/result';

export class ValidationRulesEngine {
  private evaluator: ExpressionEvaluator;

  constructor() {
    this.evaluator = new ExpressionEvaluator();
  }

  /**
   * Validate a field value against its validation rules
   */
  validateField(
    field: Field,
    value: any,
    allData: Record<string, any>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!field.validation || field.validation.length === 0) {
      return errors;
    }

    for (const rule of field.validation) {
      const error = this.validateRule(field, value, rule, allData);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * Validate a single rule
   */
  private validateRule(
    field: Field,
    value: any,
    rule: ValidationRule,
    allData: Record<string, any>
  ): ValidationError | null {
    switch (rule.rule) {
      case 'required':
        return this.validateRequired(field, value, rule);

      case 'requiredIf':
        return this.validateRequiredIf(field, value, rule, allData);

      case 'min':
        return this.validateMin(field, value, rule);

      case 'max':
        return this.validateMax(field, value, rule);

      case 'regex':
        return this.validateRegex(field, value, rule);

      case 'cross_field':
        return this.validateCrossField(field, value, rule, allData);

      default:
        return null;
    }
  }

  /**
   * Validate required rule
   */
  private validateRequired(field: Field, value: any, rule: ValidationRule): ValidationError | null {
    if (this.isEmpty(value)) {
      return {
        path: field.id,
        code: 'required',
        message: rule.message,
      };
    }
    return null;
  }

  /**
   * Validate requiredIf rule (conditionally required)
   */
  private validateRequiredIf(
    field: Field,
    value: any,
    rule: ValidationRule,
    allData: Record<string, any>
  ): ValidationError | null {
    if (!rule.condition) {
      return null;
    }

    const conditionMet = this.evaluator.evaluate(rule.condition, allData);

    if (conditionMet && this.isEmpty(value)) {
      return {
        path: field.id,
        code: 'requiredIf',
        message: rule.message,
      };
    }

    return null;
  }

  /**
   * Validate min rule (for numbers and dates)
   */
  private validateMin(field: Field, value: any, rule: ValidationRule): ValidationError | null {
    if (this.isEmpty(value)) {
      return null; // Skip if empty (use required rule for that)
    }

    if (field.type === 'number') {
      const numValue = Number(value);
      const minValue = Number(rule.value);

      if (isNaN(numValue) || numValue < minValue) {
        return {
          path: field.id,
          code: 'min',
          message: rule.message,
        };
      }
    }

    if (field.type === 'date') {
      const dateValue = new Date(value);
      const minDate = new Date(rule.value);

      if (dateValue < minDate) {
        return {
          path: field.id,
          code: 'min',
          message: rule.message,
        };
      }
    }

    return null;
  }

  /**
   * Validate max rule (for numbers and dates)
   */
  private validateMax(field: Field, value: any, rule: ValidationRule): ValidationError | null {
    if (this.isEmpty(value)) {
      return null;
    }

    if (field.type === 'number') {
      const numValue = Number(value);
      const maxValue = Number(rule.value);

      if (isNaN(numValue) || numValue > maxValue) {
        return {
          path: field.id,
          code: 'max',
          message: rule.message,
        };
      }
    }

    if (field.type === 'date') {
      const dateValue = new Date(value);
      const maxDate = new Date(rule.value);

      if (dateValue > maxDate) {
        return {
          path: field.id,
          code: 'max',
          message: rule.message,
        };
      }
    }

    return null;
  }

  /**
   * Validate regex rule
   */
  private validateRegex(field: Field, value: any, rule: ValidationRule): ValidationError | null {
    if (this.isEmpty(value)) {
      return null;
    }

    if (!rule.value) {
      return null;
    }

    try {
      const regex = new RegExp(rule.value);
      if (!regex.test(String(value))) {
        return {
          path: field.id,
          code: 'regex',
          message: rule.message,
        };
      }
    } catch (error) {
      console.error('Invalid regex pattern:', rule.value);
      return null;
    }

    return null;
  }

  /**
   * Validate cross-field rule
   */
  private validateCrossField(
    field: Field,
    value: any,
    rule: ValidationRule,
    allData: Record<string, any>
  ): ValidationError | null {
    if (!rule.condition) {
      return null;
    }

    const conditionMet = this.evaluator.evaluate(rule.condition, allData);

    if (!conditionMet) {
      return {
        path: field.id,
        code: 'cross_field',
        message: rule.message,
      };
    }

    return null;
  }

  /**
   * Validate multiselect field (array of options)
   */
  validateMultiselect(field: Field, value: any): ValidationError | null {
    if (field.type !== 'multiselect') {
      return null;
    }

    // Check if value is an array
    if (!Array.isArray(value)) {
      return {
        path: field.id,
        code: 'invalid_type',
        message: 'Multiselect field must be an array',
      };
    }

    // Check if all values are in options
    if (field.options) {
      for (const item of value) {
        if (!field.options.includes(item)) {
          return {
            path: field.id,
            code: 'invalid_option',
            message: `Invalid option: ${item}`,
          };
        }
      }
    }

    return null;
  }

  /**
   * Validate singleSelect field
   */
  validateSingleSelect(field: Field, value: any): ValidationError | null {
    if (field.type !== 'singleSelect') {
      return null;
    }

    if (this.isEmpty(value)) {
      return null;
    }

    // Check if value is in options
    if (field.options && !field.options.includes(value)) {
      return {
        path: field.id,
        code: 'invalid_option',
        message: `Invalid option: ${value}`,
      };
    }

    return null;
  }

  /**
   * Check if value is empty
   */
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string' && value.trim() === '') {
      return true;
    }

    if (Array.isArray(value) && value.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Validate field references in validation rules
   */
  validateRuleReferences(field: Field, allFieldIds: Set<string>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!field.validation) {
      return errors;
    }

    for (const rule of field.validation) {
      if (rule.condition) {
        const refs = this.evaluator.extractFieldReferences(rule.condition);
        for (const ref of refs) {
          if (!allFieldIds.has(ref)) {
            errors.push({
              path: field.id,
              code: 'invalid_reference',
              message: `Validation rule references non-existent field: ${ref}`,
            });
          }
        }
      }
    }

    return errors;
  }
}

