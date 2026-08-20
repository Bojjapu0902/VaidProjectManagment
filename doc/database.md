# Database

> Part of the AI Agent Development Standards (v1.1). Split from the master document into `/docs/`. This file is the project-level source of truth for collections, schemas, relationships, indexes and validation rules.

---

## database.md

Read before building data-driven pages. Source of truth for the project's actual data model:

```text
Collections/schemas
Fields and types
Relationships
Indexes
Validation rules
Data ownership and access patterns
```

---

# Database Rules

MongoDB must be used for structured application data.

Examples:

```text
users
roles
permissions
projects
products
orders
messages
notifications
settings
file metadata
audit logs
```

Do NOT store large binary images, videos, PDFs, ZIP files, or other documents directly inside MongoDB unless there is a specific architectural reason.

Instead store file metadata:

```javascript
{
  fileName: "floor-plan.pdf",
  originalName: "Floor Plan.pdf",
  storageProvider: "cloudflare-r2",
  storageKey: "projects/123/documents/floor-plan.pdf",
  mimeType: "application/pdf",
  size: 2456789,
  uploadedBy: "user123",
  uploadedAt: "2026-08-19T10:00:00Z"
}
```

---


# Database Design

Before creating collections, identify:

```text
Entities
Relationships
Indexes
Access patterns
Data ownership
Data retention
```

Example:

```text
User
 |
 +---- Projects
 |
 +---- Documents
 |
 +---- Notifications
```

Use indexes for frequently queried fields.

Do not create indexes blindly.

Consider:

- Search fields
- Foreign/reference IDs
- Sorting fields
- Unique fields
- Created/updated timestamps

---


# Database Before Data-Driven Frontend

Before building complex data-driven pages, define:

```text
Collections
Schemas
Relationships
Indexes
Validation
CRUD operations
Authentication ownership
Permissions
```

Do not invent frontend fields that are not part of the approved data model/API contract.

---

## Official References

- MongoDB Atlas: https://www.mongodb.com/atlas
- MongoDB Documentation: https://www.mongodb.com/docs/
