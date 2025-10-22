# 🏥 Clinical Health Intake (CHI) Form Service — schema Design (MongoDB Version, Updated, JSON Format)

## 1. Overview

The Clinical Health Intake (CHI) form system enables clinical teams to design, publish, and manage questionnaires dynamically without engineering deployments.

Each form is defined in a versioned **JSON DSL** and rendered by any client (web or mobile). The backend handles:

* Storage and versioning in MongoDB
* Retrieval of latest published forms
* Submission validation
* Conditional branching (`showIf`, `hideIf`)
* Custom validation rules with error messages

---

## 2. Objectives

* ✅ Empower non-technical users to modify labels, options, and logic
* ✅ Versioned workflow (`draft → published → archived`)
* ✅ Support branching and cross-field validations

---

## 3. MongoDB Model

### `forms` Collection

Each form version is stored as a separate document:

```json
{
  "_id": "6729a1234f5d8",
  "form_id": "form_chi",
  "name": "Clinical Health Intake",
  "version": 3,
  "status": "published",
  "definition": { },
  "created_by": "admin_001",
  "created_at": "2025-10-20T12:00:00Z"
}
```

Retrieve latest published form:

```js
db.forms.findOne({ form_id: "form_chi", status: "published" }, { sort: { version: -1 } })
```

### `submissions` Collection

```json
{
  "_id": "6729b3334e2a",
  "form_id": "form_chi",
  "form_version": 3,
  "submitted_by": "patient_123",
  "data": { "field_name": "John Doe", "field_age": 42 },
  "status": "done",
  "created_at": "2025-10-20T13:00:00Z"
}
```

---

## 4. Schema Overview

```json
{
  "id": "form_chi_v3",
  "name": "Clinical Health Intake",
  "version": 3,
  "status": "draft",
  "sections": [
    {
      "id": "section_personal_info",
      "title": "Personal Information",
      "fields": [],
      "groups": []
    }
  ]
}
```

---

## 5. Sections

Sections organize related questions. They may include fields or groups.

| Field         | Type   | Description            |
| ------------- | ------ | ---------------------- |
| `id`          | string | Unique section ID      |
| `title`       | string | Section name           |
| `description` | string | Description            |
| `fields`      | array  | Direct list of fields  |
| `groups`      | array  | Optional nested groups |

---

## 6. Groups (Optional)

Groups cluster related fields. Useful for repeatable entries or shared branching.

| Field        | Type    | Description              |
| ------------ | ------- | ------------------------ |
| `id`         | string  | Group ID                 |
| `title`      | string  | Display title            |
| `repeatable` | boolean | Repeatable set of fields |
| `fields`     | array   | Fields in this group     |

---

## 7. Fields

| Field            | Type    | Description                      |
| ---------------- | ------- | -------------------------------- |
| `id`             | string  | Unique field ID                  |
| `type`           | string  | Input type                       |
| `label`          | string  | Display label                    |
| `help_text`      | string  | Helper note                      |
| `repeatable`     | boolean | Repeatable as array of values    |
| `options`        | array   | Radio/MultiSelect options        |
| `branching`      | object  | Branching logic - showIf, hideIf |
| `validation`     | array   | Multiple validation rules        |

---

## 8. Branching

Branching logic defines dynamic flow based on responses.

| Key      | Type   | Description                    |
| -------- | ------ | ------------------------------ |
| `showIf` | string | Show element if condition true |
| `hideIf` | string | Hide element if condition true |

Branching can exist at **field**, and could be improved later to be on section or group level.

### Example

```json
[
  {
    "id": "field_smoke",
    "type": "radio",
    "label": "Do you smoke?",
    "options": ["Yes", "No"]
  },
  {
    "id": "field_cigarettes",
    "type": "number",
    "label": "Cigarettes per day",
    "branching": {
      "showIf": "field_smoke = true"
    }
  }
]
```

For complex workflows, adding branching at group/section level helps hide entire sections or groups based on context — e.g., hide “Pregnancy” section for male patients.

---

## 9. Validation

Validations can include multiple rules per field, each with a custom error message.

| Rule Key      | Description                 |
| ------------- | --------------------------- |
| `required`    | Field cannot be empty       |
| `requireIf`   | Conditionally required      |
| `min` / `max` | Numeric/date limits         |
| `regex`       | Must match a pattern        |
| `cross_field` | Relationship between fields |
| `message`     | Custom message per rule     |

### ✅ Examples

#### Multiple validations

```json
{
  "id": "field_age",
  "type": "number",
  "label": "Age",
  "validation": [
    { "rule": "required", "message": "Age is required." },
    { "rule": "min", "value": 0, "message": "Age cannot be negative." },
    { "rule": "max", "value": 120, "message": "Please enter a valid age under 120." }
  ]
}
```

#### Conditional required with message

```json
{
  "id": "field_due_date",
  "type": "date",
  "label": "Expected Due Date",
  "validation": [
    { "rule": "requiredIf", "condition": "field_pregnant = true", "message": "Due date is required if pregnant." }
  ]
}
```

#### Multiple cross-field rules

```json
{
  "id": "field_end_date",
  "type": "date",
  "label": "End Date",
  "validation": [
    { "rule": "cross_field", "condition": "field_end_date > today()", "message": "End date must be after today." },
    { "rule": "cross_field", "condition": "field_end_date > field_start_date", "message": "End date must be after start date." }
  ]
}
```

---



## 11. Versioning

| Status      | Editable | Used for Submissions |
| ----------- | -------- | -------------------- |
| `draft`     | ✅        | ❌                    |
| `published` | ❌        | ✅                    |
| `archived`  | ❌        | ❌                    |

Each published version creates a new document. Clients always retrieve the latest published version:

```js
db.forms.findOne({ form_id: "form_chi", status: "published" }, { sort: { version: -1 } })
```

---
## 12. Field Types

| Type          | Data Type       | Description / Example                |
| ------------- | --------------- | ------------------------------------ |
| `text`        | string          | Free text answer                     |
| `textarea`    | string          | Longer text answer                   |
| `number`      | number          | Numeric input (e.g. age)             |
| `date`        | date            | Date picker                          |
| `boolean`     | boolean         | Yes/No (checkbox or toggle)          |
| `singleSelect`      | string          | Dropdown (single-choice)             |
| `multiselect` | array           | Dropdown (multi-choice)              |
| `file`        | string          | File upload (returns file ID or URL) |
| `signature`   | string (base64) | Digital signature                    |



## 13. Summary

* MongoDB allows flexible schema evolution.
* Each version is tracked independently.
* Branching via `showIf`/`hideIf` for fields, groups, and sections.
* Validation supports multiple rules, each with custom messages.
* Cross-field validation enables interdependent checks.
* System ensures integrity and auditability for clinical use.
