# API Specification

> Part of the AI Agent Development Standards (v1.1). Split from the master document into `/docs/`. This file is the project-level source of truth for the project's actual API contract — endpoints, requests, responses, errors and pagination.

---

## 38.4 api-specification.md

Read before frontend ↔ backend integration, and updated whenever an endpoint changes. Source of truth for the project's actual API contract:

```text
HTTP method
Endpoint
Authentication requirement
Request parameters/body
Response structure
Error structure
Pagination
Authorization rules
```

The frontend must never be integrated against an endpoint that isn't documented here first.

---

# 43. API Contract Before Integration

Document important API endpoints before frontend integration:

```text
HTTP method
Endpoint
Authentication
Request parameters
Request body
Response structure
Error structure
Pagination
Authorization
```

The frontend must communicate with the backend API. It must never connect directly to MongoDB using database credentials.

---

# 15. Error Handling

Use consistent API responses.

Example success:

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {}
}
```

Example error:

```json
{
  "success": false,
  "message": "Unable to create project",
  "error": "VALIDATION_ERROR"
}
```

Never expose sensitive server errors to users.

Log detailed technical errors on the server.

---


# 21. API Performance

Use pagination for large datasets.

Example:

```text
?page=1&limit=20
```

Return useful metadata:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13
  }
}
```

Avoid unnecessary database queries.

Use projection/select fields when appropriate.

---
