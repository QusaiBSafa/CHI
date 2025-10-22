# 🧪 API Testing Examples - Clinical Health Intake (CHI)

This document provides comprehensive examples for testing the CHI API endpoints, including form creation, submission success cases, and failure scenarios.

---

## 📋 Table of Contents

1. [Simplified Submission API](#simplified-submission-api)
2. [Form Creation Examples](#form-creation-examples)
3. [Submission Success Cases](#submission-success-cases)
4. [Submission Failure Cases](#submission-failure-cases)
5. [Complete API Testing Flow](#complete-api-testing-flow)

---

## 🎯 Simplified Submission API

The CHI API now uses a **single unified submission endpoint** that handles both draft and completed submissions:

### **Single Endpoint:**
```
POST /api/v1/forms/submissions
```

### **Request Body:**
```json
{
  "formId": "form_simple",
  "data": { /* form field data */ },
  "status": "in-progress" | "done"
}
```

### **Smart Logic:**
- **First submission**: Creates new submission with specified status
- **Subsequent submissions**: Updates existing in-progress submission
- **Status transitions**: 
  - `in-progress` → `in-progress`: Updates data
  - `in-progress` → `done`: Validates and completes submission
  - `done` → `done`: Creates new completed submission

### **Key Benefits:**
✅ **One API endpoint** for all submission operations  
✅ **Automatic in-progress management** (one per user per form)  
✅ **Seamless status transitions** (draft → complete)  
✅ **Simplified client integration**  

---

## 🏗️ Form Creation Examples

### Example 1: Simple Patient Form

```bash
POST /api/v1/admin/forms
Authorization: Bearer <admin-token>
Content-Type: application/json

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
            "label": "Full Name",
            "validation": [
              {
                "rule": "required",
                "message": "Name is required"
              }
            ]
          },
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
                "message": "Age must be positive"
              },
              {
                "rule": "max",
                "value": 120,
                "message": "Age must be realistic"
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
                "message": "Gender is required"
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

### Example 2: Complex Health Assessment Form

```bash
POST /api/v1/admin/forms
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "formId": "form_health_assessment",
  "name": "Comprehensive Health Assessment",
  "definition": {
    "sections": [
      {
        "id": "section_personal",
        "title": "Personal Information",
        "fields": [
          {
            "id": "field_name",
            "type": "text",
            "label": "Full Name",
            "validation": [
              {
                "rule": "required",
                "message": "Name is required"
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
                "value": "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$",
                "message": "Invalid email format"
              }
            ]
          },
          {
            "id": "field_phone",
            "type": "text",
            "label": "Phone Number",
            "validation": [
              {
                "rule": "regex",
                "value": "^\\+?[1-9]\\d{1,14}$",
                "message": "Invalid phone number format"
              }
            ]
          }
        ],
        "groups": []
      },
      {
        "id": "section_health",
        "title": "Health Information",
        "fields": [
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
                "message": "Age must be positive"
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
                "message": "Gender is required"
              }
            ]
          },
          {
            "id": "field_pregnant",
            "type": "singleSelect",
            "label": "Are you currently pregnant?",
            "options": ["Yes", "No", "Not Sure"],
            "branching": {
              "showIf": "field_gender == 'Female'"
            },
            "validation": [
              {
                "rule": "requiredIf",
                "condition": "field_gender == 'Female'",
                "message": "Pregnancy status is required for females"
              }
            ]
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
                "rule": "min",
                "value": "today()",
                "message": "Due date must be in the future"
              }
            ]
          },
          {
            "id": "field_conditions",
            "type": "multiselect",
            "label": "Chronic Conditions",
            "options": [
              "Diabetes",
              "Hypertension",
              "Heart Disease",
              "Asthma",
              "COPD",
              "Cancer",
              "Arthritis",
              "Depression",
              "Anxiety",
              "Other"
            ]
          },
          {
            "id": "field_medications",
            "type": "textarea",
            "label": "Current Medications",
            "helpText": "Please list all medications you are currently taking"
          }
        ],
        "groups": []
      },
      {
        "id": "section_lifestyle",
        "title": "Lifestyle Information",
        "fields": [
          {
            "id": "field_smoker",
            "type": "singleSelect",
            "label": "Do you smoke?",
            "options": ["Yes", "No", "Former Smoker"],
            "validation": [
              {
                "rule": "required",
                "message": "Smoking status is required"
              }
            ]
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
                "message": "Please specify cigarettes per day"
              },
              {
                "rule": "min",
                "value": 1,
                "message": "Must be at least 1"
              },
              {
                "rule": "max",
                "value": 100,
                "message": "Please enter a realistic number"
              }
            ]
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
        ],
        "groups": []
      }
    ]
  }
}
```

---

## ✅ Submission Success Cases

### Success Case 1: Complete Simple Form Submission

```bash
POST /api/v1/forms/submissions
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "formId": "form_simple",
  "data": {
    "field_name": "John Doe",
    "field_age": 35,
    "field_gender": "Male"
  },
  "status": "done"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "68f7768a9acd25b31b5cb72b",
    "formId": "form_simple",
    "formVersion": 1,
    "submittedBy": "68f774e149bd5bf7fdb51158",
    "data": {
      "field_name": "John Doe",
      "field_age": 35,
      "field_gender": "Male"
    },
    "status": "done",
    "createdAt": "2025-10-21T12:03:22.590Z",
    "updatedAt": "2025-10-21T12:03:22.590Z"
  }
}
```

### Success Case 2: Complete Complex Form Submission

```bash
POST /api/v1/forms/submissions
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "formId": "form_health_assessment",
  "data": {
    "field_name": "Jane Smith",
    "field_email": "jane.smith@example.com",
    "field_phone": "+1234567890",
    "field_age": 28,
    "field_gender": "Female",
    "field_pregnant": "No",
    "field_conditions": ["Asthma", "Depression"],
    "field_medications": "Inhaler (albuterol), Zoloft 50mg daily",
    "field_smoker": "No",
    "field_exercise": "Yes"
  },
  "status": "done"
}
```

### Success Case 3: Draft Submission (Save and Continue Later)

```bash
POST /api/v1/forms/submissions
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "formId": "form_health_assessment",
  "data": {
    "field_name": "Bob Johnson",
    "field_email": "bob.johnson@example.com",
    "field_age": 45,
    "field_gender": "Male"
    // Note: Missing required fields - this is OK for draft
  },
  "status": "in-progress"
}
```

### Success Case 4: Pregnant Female Submission

```bash
POST /api/v1/forms/submissions
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "formId": "form_health_assessment",
  "data": {
    "field_name": "Sarah Wilson",
    "field_email": "sarah.wilson@example.com",
    "field_phone": "+1987654321",
    "field_age": 32,
    "field_gender": "Female",
    "field_pregnant": "Yes",
    "field_due_date": "2025-06-15",
    "field_conditions": [],
    "field_medications": "Prenatal vitamins",
    "field_smoker": "No",
    "field_exercise": "Yes"
  },
  "status": "done"
}
```

---

## ❌ Submission Failure Cases

### Failure Case 1: Missing Required Fields

```bash
POST /api/v1/forms/submissions
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "formId": "form_simple",
  "data": {
    "field_name": "John Doe"
    // Missing required fields: field_age, field_gender
  },
  "status": "done"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Submission validation failed: Field 'Age' is required, Field 'Gender' is required"
}
```

### Failure Case 2: Invalid Field Values

```bash
POST /api/v1/forms/submissions
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "formId": "form_simple",
  "data": {
    "field_name": "John Doe",
    "field_age": -5,
    "field_gender": "InvalidGender"
  },
  "status": "done"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Submission validation failed: Age must be positive, Field 'field_gender' value 'InvalidGender' is not a valid option. Valid options: Male, Female, Other"
}
```

### Failure Case 3: Branching Logic Violation

```bash
POST /api/v1/forms/submissions
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "formId": "form_health_assessment",
  "data": {
    "field_name": "Jane Smith",
    "field_email": "jane@example.com",
    "field_age": 30,
    "field_gender": "Male",
    "field_pregnant": "Yes",  // Invalid: Male cannot be pregnant
    "field_due_date": "2025-06-15"
  },
  "status": "done"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Submission validation failed: Field 'field_pregnant' is not visible or does not exist in the form"
}
```

### Failure Case 4: Invalid Email Format

```bash
POST /api/v1/forms/submissions
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "formId": "form_health_assessment",
  "data": {
    "field_name": "John Doe",
    "field_email": "invalid-email-format",
    "field_age": 25,
    "field_gender": "Male"
  },
  "status": "done"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Submission validation failed: Invalid email format"
}
```

### Failure Case 5: Invalid Phone Number

```bash
POST /api/v1/forms/submissions
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "formId": "form_health_assessment",
  "data": {
    "field_name": "John Doe",
    "field_email": "john@example.com",
    "field_phone": "not-a-phone-number",
    "field_age": 25,
    "field_gender": "Male"
  },
  "status": "done"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Submission validation failed: Invalid phone number format"
}
```

### Failure Case 6: Invalid Multiselect Values

```bash
POST /api/v1/forms/submissions
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "formId": "form_health_assessment",
  "data": {
    "field_name": "John Doe",
    "field_email": "john@example.com",
    "field_age": 25,
    "field_gender": "Male",
    "field_conditions": ["InvalidCondition", "AnotherInvalid"]
  },
  "status": "done"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Submission validation failed: Field 'field_conditions' contains invalid options: InvalidCondition, AnotherInvalid. Valid options: Diabetes, Hypertension, Heart Disease, Asthma, COPD, Cancer, Arthritis, Depression, Anxiety, Other"
}
```

---

## 🔄 Complete API Testing Flow

### Step 1: Create Forms
```bash
# Create simple form
POST /api/v1/admin/forms
Authorization: Bearer <admin-token>
# Use Example 1 form definition

# Create complex form
POST /api/v1/admin/forms
Authorization: Bearer <admin-token>
# Use Example 2 form definition
```

### Step 2: Publish Forms
```bash
# Publish simple form
POST /api/v1/admin/forms/form_simple/publish
Authorization: Bearer <admin-token>

# Publish complex form
POST /api/v1/admin/forms/form_health_assessment/publish
Authorization: Bearer <admin-token>
```

### Step 3: Test Patient Submissions
```bash
# Test successful submissions
POST /api/v1/forms/submissions
# Use success case examples above

# Test failure cases
# Use all failure examples above
```

### Step 4: Test Admin Operations
```bash
# List all submissions
GET /api/v1/admin/submissions
Authorization: Bearer <admin-token>

# List user's submissions
GET /api/v1/submissions
Authorization: Bearer <patient-token>
```

---

## 🧪 Testing Checklist

### ✅ Form Management
- [ ] Create draft form
- [ ] Update draft form
- [ ] Publish form
- [ ] Archive form
- [ ] List forms by status
- [ ] Get form by ID

### ✅ Submission Management
- [ ] Submit complete form (success)
- [ ] Save draft submission (in-progress)
- [ ] Update existing in-progress submission
- [ ] List user submissions
- [ ] List all submissions (admin)

### ✅ Validation Testing
- [ ] Required field validation
- [ ] Field type validation
- [ ] Range validation (min/max)
- [ ] Regex validation
- [ ] Select option validation
- [ ] Branching logic validation
- [ ] Cross-field validation

### ✅ Error Handling
- [ ] Authentication errors
- [ ] Authorization errors
- [ ] Validation errors
- [ ] Not found errors
- [ ] Business rule violations

---

## 📝 Notes

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Admin endpoints require admin role
3. **Validation**: Complete submissions validate all rules, drafts don't
4. **Branching**: Fields are shown/hidden based on other field values
5. **Error Messages**: Detailed validation errors help users fix issues

This comprehensive testing suite covers all major functionality and edge cases of the CHI API system.
