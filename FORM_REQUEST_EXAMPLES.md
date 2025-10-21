# 📋 Form Request Examples - Clinical Health Intake (CHI)

This document provides comprehensive examples for creating and updating forms in the CHI system.

## 🔑 Important: Form Structure

**Request Structure:**
```json
{
  "formId": "form_chi",           // Logical form ID (top-level)
  "name": "Form Name",            // Form name (top-level)
  "definition": {                 // Form structure (sections only)
    "sections": [...]
  }
}
```

**Notes:**
- `formId`, `name` are provided in the request body (top-level)
- `version` and `status` are managed automatically by the backend
- `definition` contains ONLY the form structure (sections, fields, groups)
- Do NOT include `id`, `name`, `version`, or `status` inside `definition`

---

## 📚 Table of Contents

1. [Basic Form Structure](#basic-form-structure)
2. [All Field Types](#all-field-types)
3. [Groups & Repeatable Groups](#groups--repeatable-groups)
4. [Branching Logic](#branching-logic)
5. [Validation Rules](#validation-rules)
6. [Complete Real-World Examples](#complete-real-world-examples)

---

## Basic Form Structure

### Minimal Form Example

```json
POST /api/v1/admin/forms
Authorization: Bearer <admin-token>

{
  "formId": "form_simple",
  "name": "Simple Patient Form",
  "definition": {
    "sections": [
      {
        "id": "section_basic",
        "title": "Basic Information",
        "fields": [
          {
            "id": "field_name",
            "type": "text",
            "label": "Full Name"
          },
          {
            "id": "field_age",
            "type": "number",
            "label": "Age"
          }
        ],
        "groups": []
      }
    ]
  }
}
```

**Note:** `formId`, `name` are top-level fields in the request. `version` and `status` are managed by the backend. The `definition` only contains the form structure (`sections`).

---

## All Field Types

### Complete Field Types Example

```json
{
  "formId": "form_all_fields",
  "name": "All Field Types Demo",
  "definition": {
    "sections": [
      {
        "id": "section_field_types",
        "title": "Field Types Demonstration",
        "fields": [
          {
            "id": "field_text",
            "type": "text",
            "label": "Text Field",
            "helpText": "Single line text input"
          },
          {
            "id": "field_textarea",
            "type": "textarea",
            "label": "Textarea Field",
            "helpText": "Multi-line text input"
          },
          {
            "id": "field_number",
            "type": "number",
            "label": "Number Field",
            "helpText": "Numeric input only"
          },
          {
            "id": "field_date",
            "type": "date",
            "label": "Date Field",
            "helpText": "Date picker"
          },
          {
            "id": "field_single_select",
            "type": "singleSelect",
            "label": "Single Select",
            "helpText": "Choose one option",
            "options": ["Option A", "Option B", "Option C"]
          },
          {
            "id": "field_multi_select",
            "type": "multiselect",
            "label": "Multi Select",
            "helpText": "Choose multiple options",
            "options": ["Item 1", "Item 2", "Item 3", "Item 4"]
          },
          {
            "id": "field_file",
            "type": "file",
            "label": "File Upload",
            "helpText": "Upload a document"
          },
          {
            "id": "field_signature",
            "type": "signature",
            "label": "Digital Signature",
            "helpText": "Sign here"
          }
        ],
        "groups": []
      }
    ]
  }
}
```

---

## Groups & Repeatable Groups

### Standard Group

```json
{
  "formId": "form_with_groups",
  "name": "Form with Groups",
  "definition": {
    "sections": [
      {
        "id": "section_contact",
        "title": "Contact Information",
        "fields": [],
        "groups": [
          {
            "id": "group_address",
            "title": "Address",
            "repeatable": false,
            "fields": [
              {
                "id": "field_street",
                "type": "text",
                "label": "Street Address"
              },
              {
                "id": "field_city",
                "type": "text",
                "label": "City"
              },
              {
                "id": "field_zip",
                "type": "text",
                "label": "ZIP Code"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Repeatable Group

```json
{
  "id": "section_emergency",
  "title": "Emergency Contacts",
  "fields": [],
  "groups": [
    {
      "id": "group_emergency_contact",
      "title": "Emergency Contact",
      "repeatable": true,
      "fields": [
        {
          "id": "field_contact_name",
          "type": "text",
          "label": "Contact Name"
        },
        {
          "id": "field_contact_relationship",
          "type": "singleSelect",
          "label": "Relationship",
          "options": ["Spouse", "Parent", "Sibling", "Friend", "Other"]
        },
        {
          "id": "field_contact_phone",
          "type": "text",
          "label": "Phone Number"
        }
      ]
    }
  ]
}
```

---

## Branching Logic

### Show If Example

```json
{
  "id": "section_medical",
  "title": "Medical History",
  "fields": [
    {
      "id": "field_gender",
      "type": "singleSelect",
      "label": "Gender",
      "options": ["Male", "Female", "Other"]
    },
    {
      "id": "field_pregnant",
      "type": "singleSelect",
      "label": "Are you currently pregnant?",
      "options": ["Yes", "No"],
      "branching": {
        "showIf": "field_gender == 'Female'"
      }
    },
    {
      "id": "field_due_date",
      "type": "date",
      "label": "Expected Due Date",
      "branching": {
        "showIf": "field_pregnant == 'Yes'"
      }
    },
    {
      "id": "field_weeks_pregnant",
      "type": "number",
      "label": "Weeks Pregnant",
      "branching": {
        "showIf": "field_pregnant == 'Yes'"
      }
    }
  ],
  "groups": []
}
```

### Hide If Example

```json
{
  "fields": [
    {
      "id": "field_smoker",
      "type": "singleSelect",
      "label": "Do you smoke?",
      "options": ["Yes", "No"]
    },
    {
      "id": "field_exercise",
      "type": "singleSelect",
      "label": "Do you exercise regularly?",
      "options": ["Yes", "No"],
      "branching": {
        "hideIf": "field_smoker == 'Yes'"
      },
      "helpText": "This question is hidden for smokers"
    }
  ]
}
```

### Complex Branching

```json
{
  "fields": [
    {
      "id": "field_age",
      "type": "number",
      "label": "Age"
    },
    {
      "id": "field_has_insurance",
      "type": "singleSelect",
      "label": "Do you have health insurance?",
      "options": ["Yes", "No"]
    },
    {
      "id": "field_insurance_provider",
      "type": "text",
      "label": "Insurance Provider",
      "branching": {
        "showIf": "field_has_insurance == 'Yes'"
      }
    },
    {
      "id": "field_medicare_eligible",
      "type": "singleSelect",
      "label": "Are you Medicare eligible?",
      "options": ["Yes", "No"],
      "branching": {
        "showIf": "field_age >= 65"
      }
    }
  ]
}
```

---

## Validation Rules

### Required Validation

```json
{
  "id": "field_full_name",
  "type": "text",
  "label": "Full Name",
  "validation": [
    {
      "rule": "required",
      "message": "Full name is required"
    }
  ]
}
```

### Required If Validation

```json
{
  "id": "field_due_date",
  "type": "date",
  "label": "Expected Due Date",
  "branching": {
    "showIf": "field_pregnant == 'Yes'"
  },
  "validation": [
    {
      "rule": "requiredIf",
      "condition": "field_pregnant == 'Yes'",
      "message": "Due date is required if pregnant"
    }
  ]
}
```

### Min/Max Validation (Numbers)

```json
{
  "id": "field_age",
  "type": "number",
  "label": "Age",
  "validation": [
    {
      "rule": "required",
      "message": "Age is required"
    },
    {
      "rule": "min",
      "value": 0,
      "message": "Age cannot be negative"
    },
    {
      "rule": "max",
      "value": 120,
      "message": "Please enter a valid age under 120"
    }
  ]
}
```

### Min/Max Validation (Dates)

```json
{
  "id": "field_appointment_date",
  "type": "date",
  "label": "Preferred Appointment Date",
  "validation": [
    {
      "rule": "required",
      "message": "Appointment date is required"
    },
    {
      "rule": "cross_field",
      "condition": "field_appointment_date > today()",
      "message": "Appointment date must be in the future"
    }
  ]
}
```

### Regex Validation

```json
{
  "id": "field_phone",
  "type": "text",
  "label": "Phone Number",
  "validation": [
    {
      "rule": "required",
      "message": "Phone number is required"
    },
    {
      "rule": "regex",
      "value": "^\\d{3}-\\d{3}-\\d{4}$",
      "message": "Phone must be in format: 555-123-4567"
    }
  ]
}
```

```json
{
  "id": "field_email",
  "type": "text",
  "label": "Email Address",
  "validation": [
    {
      "rule": "regex",
      "value": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "message": "Please enter a valid email address"
    }
  ]
}
```

### Cross-Field Validation

```json
{
  "fields": [
    {
      "id": "field_treatment_start",
      "type": "date",
      "label": "Treatment Start Date"
    },
    {
      "id": "field_treatment_end",
      "type": "date",
      "label": "Treatment End Date",
      "validation": [
        {
          "rule": "cross_field",
          "condition": "field_treatment_end > field_treatment_start",
          "message": "End date must be after start date"
        }
      ]
    }
  ]
}
```

### Multiple Validation Rules

```json
{
  "id": "field_blood_pressure_systolic",
  "type": "number",
  "label": "Systolic Blood Pressure",
  "validation": [
    {
      "rule": "required",
      "message": "Systolic blood pressure is required"
    },
    {
      "rule": "min",
      "value": 60,
      "message": "Systolic BP must be at least 60"
    },
    {
      "rule": "max",
      "value": 250,
      "message": "Systolic BP must not exceed 250"
    }
  ]
}
```

---

## Complete Real-World Examples

### Example 1: Clinical Health Intake Form

```json
POST /api/v1/admin/forms
Authorization: Bearer <admin-token>

{
  "formId": "form_chi",
  "name": "Clinical Health Intake",
  "definition": {
    "sections": [
      {
        "id": "section_personal",
        "title": "Personal Information",
        "description": "Basic demographic information",
        "fields": [
          {
            "id": "field_first_name",
            "type": "text",
            "label": "First Name",
            "validation": [
              {
                "rule": "required",
                "message": "First name is required"
              }
            ]
          },
          {
            "id": "field_last_name",
            "type": "text",
            "label": "Last Name",
            "validation": [
              {
                "rule": "required",
                "message": "Last name is required"
              }
            ]
          },
          {
            "id": "field_dob",
            "type": "date",
            "label": "Date of Birth",
            "validation": [
              {
                "rule": "required",
                "message": "Date of birth is required"
              }
            ]
          },
          {
            "id": "field_gender",
            "type": "singleSelect",
            "label": "Gender",
            "options": ["Male", "Female", "Other"],
            "validation": [
              {
                "rule": "required",
                "message": "Please select your gender"
              }
            ]
          },
          {
            "id": "field_email",
            "type": "text",
            "label": "Email Address",
            "validation": [
              {
                "rule": "required",
                "message": "Email is required"
              },
              {
                "rule": "regex",
                "value": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                "message": "Please enter a valid email"
              }
            ]
          },
          {
            "id": "field_phone",
            "type": "text",
            "label": "Phone Number",
            "validation": [
              {
                "rule": "required",
                "message": "Phone number is required"
              },
              {
                "rule": "regex",
                "value": "^\\d{3}-\\d{3}-\\d{4}$",
                "message": "Format: 555-123-4567"
              }
            ]
          }
        ],
        "groups": []
      },
      {
        "id": "section_medical_history",
        "title": "Medical History",
        "fields": [
          {
            "id": "field_chronic_conditions",
            "type": "multiselect",
            "label": "Chronic Conditions",
            "helpText": "Select all that apply",
            "options": [
              "Diabetes",
              "Hypertension",
              "Heart Disease",
              "Asthma",
              "COPD",
              "Cancer",
              "Arthritis",
              "None"
            ]
          },
          {
            "id": "field_current_medications",
            "type": "textarea",
            "label": "Current Medications",
            "helpText": "List all medications you are currently taking"
          },
          {
            "id": "field_allergies",
            "type": "textarea",
            "label": "Known Allergies",
            "helpText": "Include drug, food, and environmental allergies"
          },
          {
            "id": "field_smoker",
            "type": "singleSelect",
            "label": "Do you smoke?",
            "options": ["Yes", "No", "Former Smoker"]
          },
          {
            "id": "field_cigarettes_per_day",
            "type": "number",
            "label": "Cigarettes per day",
            "branching": {
              "showIf": "field_smoker == 'Yes'"
            },
            "validation": [
              {
                "rule": "requiredIf",
                "condition": "field_smoker == 'Yes'",
                "message": "Please specify number of cigarettes per day"
              },
              {
                "rule": "min",
                "value": 1,
                "message": "Must be at least 1"
              }
            ]
          },
          {
            "id": "field_years_smoked",
            "type": "number",
            "label": "Years smoked",
            "branching": {
              "showIf": "field_smoker == 'Yes'"
            },
            "validation": [
              {
                "rule": "min",
                "value": 0,
                "message": "Cannot be negative"
              }
            ]
          }
        ],
        "groups": []
      },
      {
        "id": "section_womens_health",
        "title": "Women's Health",
        "description": "For female patients only",
        "fields": [
          {
            "id": "field_pregnant",
            "type": "singleSelect",
            "label": "Are you currently pregnant?",
            "options": ["Yes", "No", "Not Sure"],
            "branching": {
              "showIf": "field_gender == 'Female'"
            }
          },
          {
            "id": "field_due_date",
            "type": "date",
            "label": "Expected Due Date",
            "branching": {
              "showIf": "field_pregnant == 'Yes'"
            },
            "validation": [
              {
                "rule": "requiredIf",
                "condition": "field_pregnant == 'Yes'",
                "message": "Due date is required if pregnant"
              },
              {
                "rule": "cross_field",
                "condition": "field_due_date > today()",
                "message": "Due date must be in the future"
              }
            ]
          },
          {
            "id": "field_weeks_pregnant",
            "type": "number",
            "label": "Weeks Pregnant",
            "branching": {
              "showIf": "field_pregnant == 'Yes'"
            },
            "validation": [
              {
                "rule": "min",
                "value": 1,
                "message": "Must be at least 1 week"
              },
              {
                "rule": "max",
                "value": 42,
                "message": "Must not exceed 42 weeks"
              }
            ]
          },
          {
            "id": "field_prenatal_care",
            "type": "singleSelect",
            "label": "Are you receiving prenatal care?",
            "options": ["Yes", "No"],
            "branching": {
                "showIf": "field_pregnant == 'Yes'"
            }
          }
        ],
        "groups": []
      },
      {
        "id": "section_vitals",
        "title": "Vital Signs",
        "fields": [
          {
            "id": "field_height",
            "type": "number",
            "label": "Height (cm)",
            "validation": [
              {
                "rule": "required",
                "message": "Height is required"
              },
              {
                "rule": "min",
                "value": 50,
                "message": "Height must be at least 50 cm"
              },
              {
                "rule": "max",
                "value": 250,
                "message": "Height must not exceed 250 cm"
              }
            ]
          },
          {
            "id": "field_weight",
            "type": "number",
            "label": "Weight (kg)",
            "validation": [
              {
                "rule": "required",
                "message": "Weight is required"
              },
              {
                "rule": "min",
                "value": 2,
                "message": "Weight must be at least 2 kg"
              },
              {
                "rule": "max",
                "value": 300,
                "message": "Weight must not exceed 300 kg"
              }
            ]
          },
          {
            "id": "field_bp_systolic",
            "type": "number",
            "label": "Blood Pressure - Systolic",
            "validation": [
              {
                "rule": "min",
                "value": 60,
                "message": "Systolic BP must be at least 60"
              },
              {
                "rule": "max",
                "value": 250,
                "message": "Systolic BP must not exceed 250"
              }
            ]
          },
          {
            "id": "field_bp_diastolic",
            "type": "number",
            "label": "Blood Pressure - Diastolic",
            "validation": [
              {
                "rule": "min",
                "value": 40,
                "message": "Diastolic BP must be at least 40"
              },
              {
                "rule": "max",
                "value": 150,
                "message": "Diastolic BP must not exceed 150"
              }
            ]
          }
        ],
        "groups": []
      },
      {
        "id": "section_emergency_contacts",
        "title": "Emergency Contacts",
        "fields": [],
        "groups": [
          {
            "id": "group_emergency_contact",
            "title": "Emergency Contact",
            "repeatable": true,
            "fields": [
              {
                "id": "field_ec_name",
                "type": "text",
                "label": "Contact Name",
                "validation": [
                  {
                    "rule": "required",
                    "message": "Contact name is required"
                  }
                ]
              },
              {
                "id": "field_ec_relationship",
                "type": "singleSelect",
                "label": "Relationship",
                "options": ["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"],
                "validation": [
                  {
                    "rule": "required",
                    "message": "Relationship is required"
                  }
                ]
              },
              {
                "id": "field_ec_phone",
                "type": "text",
                "label": "Phone Number",
                "validation": [
                  {
                    "rule": "required",
                    "message": "Phone number is required"
                  },
                  {
                    "rule": "regex",
                    "value": "^\\d{3}-\\d{3}-\\d{4}$",
                    "message": "Format: 555-123-4567"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "id": "section_insurance",
        "title": "Insurance Information",
        "fields": [
          {
            "id": "field_has_insurance",
            "type": "singleSelect",
            "label": "Do you have health insurance?",
            "options": ["Yes", "No"]
          },
          {
            "id": "field_insurance_provider",
            "type": "text",
            "label": "Insurance Provider",
            "branching": {
              "showIf": "field_has_insurance == 'Yes'"
            },
            "validation": [
              {
                "rule": "requiredIf",
                "condition": "field_has_insurance == 'Yes'",
                "message": "Provider name is required"
              }
            ]
          },
          {
            "id": "field_policy_number",
            "type": "text",
            "label": "Policy Number",
            "branching": {
              "showIf": "field_has_insurance == 'Yes'"
            },
            "validation": [
              {
                "rule": "requiredIf",
                "condition": "field_has_insurance == 'Yes'",
                "message": "Policy number is required"
              }
            ]
          },
          {
            "id": "field_insurance_card",
            "type": "file",
            "label": "Upload Insurance Card",
            "helpText": "Please upload front and back of your insurance card",
            "branching": {
              "showIf": "field_has_insurance == 'Yes'"
            }
          }
        ],
        "groups": []
      },
      {
        "id": "section_consent",
        "title": "Consent and Signature",
        "fields": [
          {
            "id": "field_consent_treatment",
            "type": "singleSelect",
            "label": "I consent to medical treatment",
            "options": ["Yes", "No"],
            "validation": [
              {
                "rule": "required",
                "message": "Consent is required"
              }
            ]
          },
          {
            "id": "field_patient_signature",
            "type": "signature",
            "label": "Patient Signature",
            "validation": [
              {
                "rule": "required",
                "message": "Signature is required"
              }
            ]
          },
          {
            "id": "field_signature_date",
            "type": "date",
            "label": "Date",
            "validation": [
              {
                "rule": "required",
                "message": "Date is required"
              }
            ]
          }
        ],
        "groups": []
      }
    ]
  }
}
```

### Example 2: Update Form Definition

```json
PATCH /api/v1/admin/forms/67a4b1234f5d8
Authorization: Bearer <admin-token>

{
  "definition": {
    "sections": [
      {
        "id": "section_personal",
        "title": "Personal Information - Updated",
        "description": "Updated demographic information",
        "fields": [
          {
            "id": "field_first_name",
            "type": "text",
            "label": "First Name",
            "validation": [
              {
                "rule": "required",
                "message": "First name is required"
              }
            ]
          },
          {
            "id": "field_middle_name",
            "type": "text",
            "label": "Middle Name (Optional)"
          },
          {
            "id": "field_last_name",
            "type": "text",
            "label": "Last Name",
            "validation": [
              {
                "rule": "required",
                "message": "Last name is required"
              }
            ]
          }
        ],
        "groups": []
      }
    ]
  }
}
```

### Example 3: Publish Form

```json
POST /api/v1/admin/forms/67a4b1234f5d8/publish
Authorization: Bearer <admin-token>

// No body required
```

### Example 4: Validate Sample Submission

```json
POST /api/v1/admin/forms/67a4b1234f5d8/validate
Authorization: Bearer <admin-token>

{
  "sampleData": {
    "field_first_name": "John",
    "field_last_name": "Doe",
    "field_dob": "1985-06-15",
    "field_gender": "Male",
    "field_email": "john.doe@example.com",
    "field_phone": "555-123-4567",
    "field_smoker": "Yes",
    "field_cigarettes_per_day": 10,
    "field_years_smoked": 5,
    "field_height": 180,
    "field_weight": 80,
    "field_bp_systolic": 120,
    "field_bp_diastolic": 80,
    "field_has_insurance": "Yes",
    "field_insurance_provider": "Blue Cross",
    "field_policy_number": "BC123456789",
    "field_consent_treatment": "Yes",
    "field_signature_date": "2025-10-21"
  }
}
```

---

## Field ID Naming Conventions

- Use lowercase with underscores: `field_first_name`
- Be descriptive: `field_emergency_contact_phone` not `field_ec_ph`
- Prefix with `field_`: `field_age`
- For grouped fields, include context: `field_ec_name` (emergency contact name)

---

## Best Practices

1. **Always validate required fields** - Add validation rules for mandatory fields
2. **Use helpText** - Provide clear instructions for complex fields
3. **Test branching logic** - Ensure showIf/hideIf conditions work as expected
4. **Validate cross-field dependencies** - Test that dependent fields work correctly
5. **Use appropriate field types** - Choose the right input type for the data
6. **Keep field IDs unique** - Never reuse field IDs within a form
7. **Group related fields** - Use groups to organize complex sections
8. **Test repeatable groups** - Ensure they work with multiple instances

---

## Common Validation Patterns

### Email Validation
```
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$
```

### Phone Number (US Format)
```
^\\d{3}-\\d{3}-\\d{4}$
```

### ZIP Code (US)
```
^\\d{5}(-\\d{4})?$
```

### Social Security Number
```
^\\d{3}-\\d{2}-\\d{4}$
```

---

## Error Responses

### Validation Errors

```json
{
  "success": false,
  "message": "Form validation failed",
  "errors": [
    {
      "path": "field.field_age.validation",
      "code": "incompatible_rule",
      "message": "Validation rule 'regex' cannot be used with field type 'number'. Allowed types: text, textarea"
    },
    {
      "path": "field.field_duplicate",
      "code": "duplicate_field_id",
      "message": "Field ID 'field_duplicate' is used multiple times. Field IDs must be unique across the entire form."
    }
  ]
}
```

---

## Need Help?

- Review the API Design document: `chi_backend_api_design.md`
- Review the Schema documentation: `cdI_schema_documentation.md`
- Check Swagger UI: http://localhost:3000/docs

