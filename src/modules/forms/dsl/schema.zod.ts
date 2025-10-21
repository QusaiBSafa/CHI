import { z } from 'zod';

export const BranchingSchema = z.object({
  showIf: z.string().optional(),
  hideIf: z.string().optional(),
});

export const ValidationRuleSchema = z.object({
  rule: z.enum(['required', 'requiredIf', 'min', 'max', 'regex', 'cross_field']),
  value: z.any().optional(),
  condition: z.string().optional(),
  message: z.string().min(1),
});

export const FieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'textarea', 'number', 'date', 'singleSelect', 'multiselect', 'file', 'signature']),
  label: z.string().min(1),
  helpText: z.string().optional(),
  repeatable: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  branching: BranchingSchema.optional(),
  validation: z.array(ValidationRuleSchema).optional(),
});

export const GroupSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  repeatable: z.boolean().default(false),
  fields: z.array(FieldSchema).min(1),
});

export const SectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(FieldSchema).default([]),
  groups: z.array(GroupSchema).default([]),
});

// Form definition schema - only the form structure (sections)
export const FormDefinitionSchema = z.object({
  sections: z.array(SectionSchema).min(1),
});

// Legacy - kept for backward compatibility
export const FormDSLSchema = FormDefinitionSchema;

export type Branching = z.infer<typeof BranchingSchema>;
export type ValidationRule = z.infer<typeof ValidationRuleSchema>;
export type Field = z.infer<typeof FieldSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type FormDefinition = z.infer<typeof FormDefinitionSchema>;
export type FormDSL = FormDefinition; // Legacy alias

