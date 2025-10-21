import { FormDSL, Field, Section, Group } from './schema.zod';
import { ExpressionEvaluator } from './expressions';

export interface FieldVisibility {
  fieldId: string;
  visible: boolean;
}

export class BranchingEngine {
  private evaluator: ExpressionEvaluator;

  constructor() {
    this.evaluator = new ExpressionEvaluator();
  }

  /**
   * Resolve visibility for all fields in a form based on submission data
   */
  resolveVisibility(form: FormDSL, data: Record<string, any>): Map<string, boolean> {
    const visibility = new Map<string, boolean>();
    
    // Get all fields
    const allFields = this.getAllFields(form);
    
    // Evaluate visibility for each field
    for (const field of allFields) {
      visibility.set(field.id, this.isFieldVisible(field, data, visibility));
    }
    
    return visibility;
  }

  /**
   * Determine if a single field is visible based on branching rules
   */
  private isFieldVisible(
    field: Field,
    data: Record<string, any>,
    resolvedVisibility: Map<string, boolean>
  ): boolean {
    // If no branching rules, field is visible by default
    if (!field.branching) {
      return true;
    }

    let visible = true;

    // Evaluate showIf condition
    if (field.branching.showIf) {
      visible = this.evaluator.evaluate(field.branching.showIf, data);
    }

    // Evaluate hideIf condition
    if (field.branching.hideIf) {
      const shouldHide = this.evaluator.evaluate(field.branching.hideIf, data);
      if (shouldHide) {
        visible = false;
      }
    }

    return visible;
  }

  /**
   * Get all fields from the form (flattened)
   */
  public getAllFields(form: FormDSL): Field[] {
    const fields: Field[] = [];

    for (const section of form.sections) {
      // Direct fields in section
      fields.push(...section.fields);

      // Fields in groups
      for (const group of section.groups) {
        fields.push(...group.fields);
      }
    }

    return fields;
  }

  /**
   * Build dependency graph for fields (which fields depend on which)
   */
  buildDependencyGraph(form: FormDSL): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();
    const allFields = this.getAllFields(form);

    for (const field of allFields) {
      const deps: string[] = [];

      // Extract dependencies from showIf
      if (field.branching?.showIf) {
        const refs = this.evaluator.extractFieldReferences(field.branching.showIf);
        deps.push(...refs);
      }

      // Extract dependencies from hideIf
      if (field.branching?.hideIf) {
        const refs = this.evaluator.extractFieldReferences(field.branching.hideIf);
        deps.push(...refs);
      }

      // Extract dependencies from validation rules
      if (field.validation) {
        for (const rule of field.validation) {
          if (rule.condition) {
            const refs = this.evaluator.extractFieldReferences(rule.condition);
            // Exclude self-references (a field validating its own value is not a dependency)
            const filteredRefs = refs.filter(ref => ref !== field.id);
            deps.push(...filteredRefs);
          }
        }
      }

      dependencies.set(field.id, [...new Set(deps)]);
    }

    return dependencies;
  }

  /**
   * Detect circular dependencies in branching logic
   * This is to prevent cases like if field A depends on field B and field B depends on field A.
   */
  detectCircularDependencies(form: FormDSL): string[][] {
    const graph = this.buildDependencyGraph(form);
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (fieldId: string, path: string[]): void => {
      visited.add(fieldId);
      recursionStack.add(fieldId);
      path.push(fieldId);

      const dependencies = graph.get(fieldId) || [];

      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          detectCycle(dep, [...path]);
        } else if (recursionStack.has(dep)) {
          // Cycle detected
          const cycleStart = path.indexOf(dep);
          cycles.push([...path.slice(cycleStart), dep]);
        }
      }

      recursionStack.delete(fieldId);
    };

    for (const fieldId of graph.keys()) {
      if (!visited.has(fieldId)) {
        detectCycle(fieldId, []);
      }
    }

    return cycles;
  }

  /**
   * Get evaluation order for fields (topological sort)
   * This for dependency chain 
   * Evaluation order is important because we don't need to evalute is_pregnant which is hidden by default if gender is not female,
   *  so firs we need to check gender is female then we evaluate the is pregnant.
   */
  getEvaluationOrder(form: FormDSL): string[] {
    const graph = this.buildDependencyGraph(form);
    const allFields = this.getAllFields(form);
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (fieldId: string): void => {
      if (visited.has(fieldId)) return;
      visited.add(fieldId);

      const dependencies = graph.get(fieldId) || [];
      for (const dep of dependencies) {
        visit(dep);
      }

      order.push(fieldId);
    };

    for (const field of allFields) {
      visit(field.id);
    }

    return order;
  }

  /**
   * Validate field references in branching expressions
   * Here we just check if field reference exists
   * TODO what if the field reference is not visibile
   */
  validateFieldReferences(form: FormDSL): Array<{ fieldId: string; invalidRef: string; expression: string }> {
    const errors: Array<{ fieldId: string; invalidRef: string; expression: string }> = [];
    const allFields = this.getAllFields(form);
    const allFieldIds = new Set(allFields.map(f => f.id));

    for (const field of allFields) {
      // Check showIf
      if (field.branching?.showIf) {
        const refs = this.evaluator.extractFieldReferences(field.branching.showIf);
        for (const ref of refs) {
          if (!allFieldIds.has(ref)) {
            errors.push({
              fieldId: field.id,
              invalidRef: ref,
              expression: field.branching.showIf,
            });
          }
        }
      }

      // Check hideIf
      if (field.branching?.hideIf) {
        const refs = this.evaluator.extractFieldReferences(field.branching.hideIf);
        for (const ref of refs) {
          if (!allFieldIds.has(ref)) {
            errors.push({
              fieldId: field.id,
              invalidRef: ref,
              expression: field.branching.hideIf,
            });
          }
        }
      }
    }

    return errors;
  }
}

