/**
 * Expression evaluation engine for branching and validation conditions
 * Supports: field_id = value, field_id != value, field_id > value, etc.
 * Examples:
 *   - "field_smoke == 'Yes'"
 *   - "field_age > 18"
 *   - "field_end_date > field_start_date"
 *   - "field_pregnant == true"
 */

export class ExpressionEvaluator {
  /**
   * Evaluate a condition expression against submission data
   * @param expression - The condition string (e.g., "field_age > 18")
   * @param data - The submission data
   * @returns boolean result of the evaluation
   */
  evaluate(expression: string, data: Record<string, any>): boolean {
    try {
      // Handle special functions
      expression = this.replaceSpecialFunctions(expression);

      // Parse the expression
      const parsed = this.parseExpression(expression);
      if (!parsed) return false;

      const { left, operator, right } = parsed;

      // Get left value (field value)
      const leftValue = this.getValue(left, data);

      // Get right value (could be field or literal)
      const rightValue = this.getValue(right, data);

      // Evaluate based on operator
      return this.evaluateOperator(leftValue, operator, rightValue);
    } catch (error) {
      console.error('Expression evaluation error:', error);
      return false;
    }
  }

  /**
   * Replace special functions with actual values
   */
  private replaceSpecialFunctions(expression: string): string {
    // Replace today() with current date
    if (expression.includes('today()')) {
      const today = new Date().toISOString().split('T')[0];
      expression = expression.replace(/today\(\)/g, `'${today}'`);
    }

    // TODO Add more special functions here (now(), currentYear(), etc.)

    return expression;
  }

  /**
   * Parse expression into left, operator, right
   */
  private parseExpression(expression: string): { left: string; operator: string; right: string } | null {
    // Remove extra spaces
    expression = expression.trim();

    // Support operators: ==, !=, >, <, >=, <=, =
    const operatorRegex = /(==|!=|>=|<=|>|<|=)/;
    const match = expression.match(operatorRegex);

    if (!match) return null;

    const operator = match[0];
    const parts = expression.split(operator);

    if (parts.length !== 2) return null;

    return {
      left: parts[0].trim(),
      operator,
      right: parts[1].trim(),
    };
  }

  /**
   * Get value from data or parse as literal
   */
  private getValue(value: string, data: Record<string, any>): any {
    // Check if it's a field reference
    if (data.hasOwnProperty(value)) {
      return data[value];
    }

    // Parse as literal
    return this.parseLiteral(value);
  }

  /**
   * Parse literal values (strings, numbers, booleans)
   */
  private parseLiteral(value: string): any {
    // String literal (enclosed in quotes)
    if ((value.startsWith("'") && value.endsWith("'")) || 
        (value.startsWith('"') && value.endsWith('"'))) {
      return value.slice(1, -1);
    }

    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Number
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    // Return as string if nothing else matches
    return value;
  }

  /**
   * Evaluate operator between two values
   */
  private evaluateOperator(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case '==':
      case '=':
        return left == right;
      
      case '!=':
        return left != right;
      
      case '>':
        return this.compareValues(left, right) > 0;
      
      case '<':
        return this.compareValues(left, right) < 0;
      
      case '>=':
        return this.compareValues(left, right) >= 0;
      
      case '<=':
        return this.compareValues(left, right) <= 0;
      
      default:
        return false;
    }
  }

  /**
   * Compare values (handles numbers, dates, strings)
   */
  private compareValues(left: any, right: any): number {
    // Try numeric comparison
    if (!isNaN(left) && !isNaN(right)) {
      return Number(left) - Number(right);
    }

    // Try date comparison
    const leftDate = new Date(left);
    const rightDate = new Date(right);
    if (!isNaN(leftDate.getTime()) && !isNaN(rightDate.getTime())) {
      return leftDate.getTime() - rightDate.getTime();
    }

    // String comparison
    return String(left).localeCompare(String(right));
  }

  /**
   * Extract all field references from an expression
   */
  extractFieldReferences(expression: string): string[] {
    const fields: string[] = [];
    
    // Remove string literals first (anything in single or double quotes)
    // This prevents treating option values like 'Female', 'Yes', 'No' as field references
    let cleanedExpression = expression.replace(/'[^']*'/g, '');  // Remove single-quoted strings
    cleanedExpression = cleanedExpression.replace(/"[^"]*"/g, '');  // Remove double-quoted strings
    
    // Remove special functions
    cleanedExpression = cleanedExpression.replace(/today\(\)/g, '');
    
    // Match field IDs (assuming they start with field_ or are alphanumeric)
    const fieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const matches = cleanedExpression.matchAll(fieldPattern);
    
    for (const match of matches) {
      const field = match[1];
      // Exclude operators and literals
      if (!['true', 'false', 'and', 'or', 'not'].includes(field.toLowerCase())) {
        fields.push(field);
      }
    }
    
    return [...new Set(fields)]; // Remove duplicates
  }
}

