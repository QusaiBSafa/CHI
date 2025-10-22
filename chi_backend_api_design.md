# 🏥 Clinical Health Intake (CHI) Backend Service Design (Node.js + TypeScript + TypeORM + MongoDB)

## Overview
This document outlines the complete backend design for the **Clinical Health Intake (CHI)** questionnaire system. It supports versioned form definitions, branching and cross-field validation, and separate APIs for admins and patients.

---


## 🧱 Architecture
- **Language:** Node.js (TypeScript)
- **Framework:** Fastify (schema-first, high performance)
- **Database:** MongoDB via TypeORM
- **Auth:** JWT (Roles: `admin`, `patient`)
- **Validation:** Zod for schema validation; custom engine for branching and cross-field rules
- **Deployment:** Docker + docker-compose

---

Why MongoDB: MongoDB offers flexible schema evolution and stores each form version as an independent document, ideal for dynamic and versioned form structures (in the current implmentation we are going to save 1 draft per form per version, in future we can easy improve this to save any change on the draft in different object)

Why Fastify: Fastify's design principles make it particularly advantageous when working with schemas and complex validations due to its built-in support for JSON Schema and its emphasis on performance.

The Clinical Health Intake (CHI) form system enables clinical teams to design, publish, and manage questionnaires dynamically without engineering deployments.

## 📁 Folder Structure
```
chi-service/
  src/
    app.ts
    server.ts
    config/
      env.ts
      data-source.ts
    auth/
      auth.plugin.ts
      rbac.ts
      types.ts
    modules/
      users/
        users.routes.ts
        users.controller.ts
        users.service.ts
        users.repository.ts
      forms/
        forms.routes.ts
        forms.controller.ts
        forms.service.ts
        forms.repository.ts
        forms.validators.ts
        forms.publish.ts
        dsl/
          schema.zod.ts
          branching.ts
          rules.ts
          expressions.ts
      submissions/
        submissions.routes.ts
        submissions.controller.ts
        submissions.service.ts
        submissions.repository.ts
        submissions.validators.ts
    plugins/
      error.ts
      logger.ts
    utils/
      ids.ts
      result.ts
      pagination.ts
  test/
  Dockerfile
  docker-compose.yml
  package.json
  tsconfig.json
  README.md
```
```

---

## 🧩 Data Models

### Form Entity
```ts
@Entity('forms')
export class Form {
  @ObjectIdColumn() _id!: ObjectId;
  @Column() formId!: string;          // logical id, e.g. "form_chi"
  @Column() name!: string;
  @Column() version!: number;
  @Column() status!: 'draft' | 'published' | 'archived';
  @Column() definition!: unknown;      // JSON DSL
  @Column() createdBy!: string;
  @Column() createdAt!: Date;
  @Column({ nullable: true }) publishedAt?: Date;
}
```

### Submission Entity
```ts
@Entity('submissions')
export class Submission {
  @ObjectIdColumn() _id!: ObjectId;
  @Column() formId!: string;
  @Column() formVersion!: number;
  @Column() submittedBy!: string;      // patient user id or 'anonymous'
  @Column() data!: Record<string, unknown>;
  @Column() createdAt!: Date;
  @Column() status!: 'in-progress' | 'done';
  @Column({ nullable: true }) updatedAt?: Date;

}
```

### User Entity
```ts
@Entity('users')
export class User {
  @ObjectIdColumn() _id!: ObjectId;
  @Column() email!: string;
  @Column() passwordHash!: string;
  @Column() role!: 'admin' | 'patient';
  @Column() createdAt!: Date;
}
```

---

## 📜 DSL Schema (Zod)
Supports **branching**, **cross-field rules**, **validation rules**,

```ts
const Branching = z.object({
  showIf: z.string().optional(),
  hideIf: z.string().optional(),
});

const ValidationRule = z.object({
  rule: z.enum(['required','requiredIf','min','max','regex','cross_field']),
  value: z.any().optional(),
  condition: z.string().optional(),
  message: z.string().min(1),
});

const Field = z.object({
  id: z.string(),
  type: z.enum(['text','textarea','number','date','singleSelect','multiselect', 'file', 'signature']), // singleSelect and multi select should have options in the field 
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  branching: Branching.optional(),
  validation: z.array(ValidationRule).optional(),
});

const Group = z.object({
  id: z.string(),
  title: z.string().optional(),
  repeatable: z.boolean().default(false),
  fields: z.array(Field),
});

const Section = z.object({
  id: z.string(),
  title: z.string(),
  fields: z.array(Field).default([]),
  groups: z.array(Group).default([]),
});

export const FormDSL = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number().int(),
  status: z.enum(['draft','published','archived']),
  sections: z.array(Section).min(1),
});
```
  

---

## ⚙️ API Endpoints

### 🔑 Auth
- JWT with `role` claim.
- Guards: `requireRole('admin')` and `requireRole('patient')`.

---

### 🧑‍💼 Admin APIs
| Method | Endpoint | Description |
|--------|-----------|--------------|
| `POST` | `/admin/forms` | Create draft form |
| `GET` | `/admin/forms` | List forms by status |
| `GET` | `/admin/forms/:id` | Get form by id |
| `PATCH` | `/admin/forms/:id` | Update draft definition |
| `POST` | `/admin/forms/:id/publish` | Publish form (auto-archives previous) |
| `POST` | `/admin/forms/:id/archive` | Archive published version |
| `POST` | `/admin/forms/:id/validate` | Dry-run validate sample submission |

**Multiple Drafts:** Not allowed only one Draft per `formId`. Only one version can be published per `formId` at a time
TODO - Support showing form history by returning all records of a from Id with updated at date, updated by, and differences between form defention

---

### 🧍 Patient APIs
| Method | Endpoint | Description |
|--------|-----------|--------------|
| `GET` | `/forms/:formId` | Get latest published version |
| `POST` | `/forms/:formId/draft-submission` | Save and continue later| for authenticated users, don't run validation rules at this stage
| `POST` | `/forms/:formId/submissions` | Submit answers |

**Anonymous submissions:** Supported if form is public.

---

## 🧮 Validation Flows

### Form Creation/Update Validation
1. **DSL validation:** via Zod schema.
2. **Field id uniqueness:** global uniqueness across form. // This point will make it easier to do references so if i am in section-a.group-b.field-x I can reference any field without the need to define the full path, but for better performance we still need to have the full path
3. **Branching:** validate expressions (no cycles, valid field refs).
4. **Validation rules:** ensure compatible rule types and data types.
5. **Cross-field:** ensure referenced fields exist.

Return all errors in structured array `{ path, code, message }`.

---

### Submission Validation

#### 1. Resolve visibility
- Evaluate `showIf` / `hideIf` expressions.
- Build dependency graph.
- Only validate **visible** fields.

#### 2. Validate visible fields

| Rule Key      | Description                 |
| ------------- | --------------------------- |
| `required`    | Field cannot be empty       |
| `requireIf`   | Conditionally required      |
| `min` / `max` | Numeric/date limits         |
| `regex`       | Must match a pattern        |
| `cross_field` | Relationship between fields |
| `message`     | Custom message per rule     |


#### 3. Cross-field rules
- Example rules:
  - `endDate > today()` with custom message
  - `end > start` with message

#### 4. Return validation result
```json
{
  "ok": false,
  "errors": [
    { "path": "field_age", "code": "min", "message": "Age cannot be negative." },
    { "path": "field_due_date", "code": "requiredIf", "message": "Due date required if pregnant." }
  ]
}
```

---

## 🧠 Branching and Cross-field Logic

| Concept | Purpose | Example |
|----------|----------|----------|
| **Branching** | Visibility control | Show `is_pregnant` if `gender == female` |
| **Cross-field rules** | Logical validation between fields | Ensure `end_date > start_date` |

---

## 🧰 Docker Setup

### `.env`
```
NODE_ENV=development
PORT=3000
MONGO_URL=mongodb://mongo:27017/chi
JWT_SECRET=change-me
```

### `Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node","dist/server.js"]
```

### `docker-compose.yml`
```yaml
version: '3.9'
services:
  api:
    build: .
    env_file: .env
    ports: ["3000:3000"]
    depends_on: [mongo]
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]
volumes:
  mongo_data:
```

### NPM Scripts
```json
{
  "scripts": {
    "dev": "ts-node-dev --transpile-only src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js"
  }
}
```

---

## 🧩 Edge Cases
- Hidden required fields → ignored.
- Multiselect fields → array validation.
- Repeatable groups validated per instance.
- Cross-section references validated.
- Concurrent publish → atomic operation.
- Partial submissions → supported via `correlationId`.

---

## ✅ Summary
This backend provides:
- Full CRUD & versioning for admin forms
- Draft → publish → archive lifecycle
- Dynamic branching and validation rules
- Cross-field and multiselect validation
- Public + private submissions
- Scalable MongoDB architecture

