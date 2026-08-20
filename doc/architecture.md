# Architecture

> Part of the AI Agent Development Standards (v1.1). Split from the master document into `/docs/`. This file is the project-level source of truth for system architecture, service boundaries, file storage strategy and third-party integrations.

---

## architecture.md

Read before backend/API and database setup. Source of truth for:

```text
The project's actual system architecture diagram (Application, Database, File Storage, Hosting, Authentication)
Service boundaries and data flow
Third-party integrations in use
Key architectural decisions and the trade-offs behind them
```

---

# Mandatory Architecture Principle

Always separate:

```text
Application
Database
File Storage
Hosting
Authentication
```

Do not tightly couple all services together.

Recommended architecture:

```text
                    WEB / MOBILE APP
                           |
                           v
                  React / React Native
                           |
                           v
                     Node.js API
                       Express
                           |
             +-------------+-------------+
             |                           |
             v                           v
       MongoDB Atlas              Object Storage
          Database              Cloudflare R2
             |                 
             |                           |
             v                           v
       Application Data             Files/Media
```

---


# File Storage Rules

    ## 5.1 Never use server local storage as permanent file storage

    Do NOT depend on:

    ```text
    /uploads
    /public/uploads
    /tmp/uploads
    ```

    for production file persistence.

    Hosting platforms may use ephemeral filesystems.

    Use:

    ```text
    Cloudflare R2
    Cloudinary
    Supabase Storage
    ```

    instead.

    ## 5.2 File upload flow

    The standard upload flow should be:

    ```text
    User
    |
    v
    Frontend
    |
    v
    Backend/API
    |
    +---- Validate file
    |
    +---- Validate authorization
    |
    +---- Validate MIME/type/size
    |
    v
    Object Storage
    |
    v
    Return storage URL/key
    |
    v
    MongoDB stores metadata
    ```

    For large or high-volume uploads, prefer secure direct-to-storage uploads using signed URLs where appropriate.

    ## 5.3 File naming

    Do not use raw user filenames as storage keys.

    Prefer:

    ```text
    projects/{projectId}/images/{uniqueId}.webp
    projects/{projectId}/documents/{uniqueId}.pdf
    users/{userId}/avatar/{uniqueId}.jpg
    ```

    Generate unique identifiers to avoid collisions.

---


# Image Management

For image-heavy applications, use Cloudinary or another image optimization service.

Images should be optimized before delivery.

Preferred formats:

```text
AVIF
WebP
JPEG
PNG
```

Use the appropriate format based on image requirements.

Implement:

- Resize
- Compression
- Responsive images
- Lazy loading
- Thumbnail generation
- CDN delivery
- Appropriate quality settings

Never unnecessarily send a 5–20 MB original image to a mobile client.

---


# AI Agent Rules for File Storage

Whenever a feature requires image/file upload, the AI agent must ask:

```text
1. What file types are required?
2. What is the maximum file size?
3. Is the file public or private?
4. Which storage provider is configured?
5. Does the file require image/video optimization?
6. Who can upload the file?
7. Who can view/download the file?
8. Is deletion required?
9. Is versioning required?
10. Is a signed URL required?
```

The agent must not automatically store uploaded files on the application server.

---


# Recommended Storage Decision

Use this decision process:

```text
Need general files?
        |
       YES
        |
        v
Cloudflare R2
```

```text
Need advanced image/video processing?
        |
       YES
        |
        v
Cloudinary
```

```text
Need database + auth + storage as one platform?
        |
       YES
        |
        v
Supabase
```

---


# Important Rule

The AI agent must NEVER make architectural decisions that create unnecessary vendor lock-in, security risks, or difficult migrations.

Prefer modular services:

```text
Frontend
   ↓
API
   ↓
Database

API
   ↓
Storage
```

The application should be designed so that the storage provider can be replaced later with minimal changes.

For example:

```text
StorageService
      |
      +---- Cloudflare R2
      |
      +---- Cloudinary
      |
      +---- Supabase Storage
```

The frontend should not need to know the internal storage provider.

---


# File Storage Before File Upload UI

For image/document/video uploads, establish storage before implementing the final upload workflow:

```text
File requirements
    ↓
Storage provider
    ↓
Bucket/folder strategy
    ↓
Security/access rules
    ↓
Upload service/API
    ↓
MongoDB metadata
    ↓
Frontend upload UI
```

Define allowed types, maximum size, public/private access, storage path, naming, optimization, deletion behavior, authorization, and signed URL requirements.

---

## Official References

- Cloudflare R2: https://developers.cloudflare.com/r2/
- Cloudinary: https://cloudinary.com/
- Cloudinary Documentation: https://cloudinary.com/documentation/

