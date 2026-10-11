# DataVault — Entity Relationship (ER) Diagram

This diagram reflects the database schema implemented in MySQL for the **DataVault** platform.

```mermaid
erDiagram
    USERS ||--o{ VAULT_RECORDS : "owns"
    USERS ||--o{ DOCUMENTS : "owns"
    USERS ||--o{ ACCESS_REQUESTS : "receives (owner)"
    USERS ||--o{ ACCESS_REQUESTS : "initiates (requester)"
    USERS ||--o{ ACCESS_PERMISSIONS : "owns (owner)"
    USERS ||--o{ ACCESS_PERMISSIONS : "granted (requester)"
    ACCESS_REQUESTS ||--o| ACCESS_PERMISSIONS : "generates upon approval"
    USERS ||--o{ REVOKED_TOKENS : "invalidates on logout"

    USERS {
        bigint id PK
        varchar full_name
        varchar email UK
        varchar password "BCrypt Hash"
        varchar role "USER | ORGANIZATION | ADMIN"
        varchar account_status "ACTIVE | SUSPENDED"
        boolean emergency_lock_active "Kill-switch flag"
        varchar organization_name "Nullable"
        datetime created_at
        datetime updated_at
    }

    VAULT_RECORDS {
        bigint id PK
        bigint owner_id FK
        varchar title
        varchar data_category "IDENTITY | FINANCIAL | MEDICAL | EMPLOYMENT | OTHER"
        varchar encrypted_data "AES-256-GCM Base64 Ciphertext"
        varchar encryption_iv "12-byte Base64 GCM IV"
        varchar description
        datetime created_at
        datetime updated_at
    }

    DOCUMENTS {
        bigint id PK
        bigint owner_id FK
        varchar title
        varchar data_category
        varchar original_file_name
        varchar storage_file_name UK "UUID on secure disk"
        varchar content_type
        bigint file_size
        varchar file_path "Private server path"
        datetime created_at
        datetime updated_at
    }

    ACCESS_REQUESTS {
        bigint id PK
        bigint requester_id FK "Organization"
        bigint owner_id FK "Personal User"
        varchar data_categories "IDENTITY,MEDICAL or ALL"
        varchar purpose "Mandatory legal/business justification"
        int duration_hours "Time limit in hours"
        varchar status "PENDING | APPROVED | DENIED | CANCELLED"
        varchar decision_notes
        datetime created_at
        datetime decided_at
    }

    ACCESS_PERMISSIONS {
        bigint id PK
        bigint request_id FK
        bigint requester_id FK "Organization"
        bigint owner_id FK "Personal User"
        varchar approved_categories
        varchar purpose
        varchar status "ACTIVE | REVOKED | EXPIRED"
        datetime expires_at "Automatic expiry timestamp"
        datetime created_at
        datetime revoked_at
    }

    REVOKED_TOKENS {
        bigint id PK
        varchar token UK "Invalidated JWT hash/signature"
        varchar user_email
        datetime revoked_at
        datetime expires_at
    }

    AUDIT_LOGS {
        bigint id PK
        varchar actor_email
        varchar actor_role
        varchar owner_email
        varchar action "LOGIN | VAULT_CREATE | ORG_ACCESS | EMERGENCY_LOCK | etc."
        varchar resource_type
        varchar resource_id
        varchar purpose
        varchar outcome "SUCCESS | DENIED | BLOCKED | FAILURE"
        varchar details
        datetime timestamp
    }
```

---

## Entity Details & Security Controls

### 1. `users`
- Stores authentication credentials and platform identity.
- Passwords are encrypted with **BCrypt**.
- `emergency_lock_active`: A dedicated server-enforced flag. When set to `true`, all organization access attempts to the user's records or documents are immediately blocked with `403 Forbidden`.

### 2. `vault_records`
- Stores sensitive personal attributes (ID numbers, health metrics, credentials).
- `encrypted_data` and `encryption_iv`: Authenticated **AES-256-GCM** encryption. Plaintext is never stored in the database.

### 3. `documents`
- Stores metadata for uploaded files (scans, reports, contracts).
- Files are stored on disk using **UUID-based sanitized file paths** outside public web directories.
- Downloads are served strictly through authenticated streaming endpoints that enforce permissions and emergency lock state.

### 4. `access_requests`
- Purpose-bound request initiated by organizations.
- Contains mandatory `purpose` and finite `duration_hours`.

### 5. `access_permissions`
- Created when a user approves an access request.
- Binds access to the designated organization, owner, approved data categories, purpose, and strict `expires_at` timestamp.
- Checked dynamically on every API access request.

### 6. `revoked_tokens`
- Server-side token revocation table for stateless JWT logout.

### 7. `audit_logs`
- Append-only immutable log of every authentication, vault CRUD, file download, access attempt, approval, denial, revocation, and emergency lock toggle.
