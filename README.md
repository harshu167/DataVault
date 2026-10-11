# DataVault — Secure Personal Data Sharing and Privacy Management Platform

**DataVault** is a privacy-first personal data management and controlled-sharing platform built with **Spring Boot 4**, **Spring Security**, **MySQL**, **AES-256-GCM authenticated encryption**, and **React (Vite)**. It empowers individuals to maintain sovereign ownership over their sensitive personal records and files, authorizing external organizations with purpose-bound, time-limited access, monitoring real-time immutable audit trails, and instantly halting all external access via an **Emergency Privacy Lock**.

---

## 1. Problem Statement

In today's digital landscape, individuals frequently share sensitive personal information—including identity documents, tax records, medical history, and financial credentials—with third-party organizations such as healthcare providers, insurers, financial institutions, and employers. 

Traditional sharing methods present severe security vulnerabilities:
- **Permanent, Unrevocable Access:** Once documents are transmitted, owners lose visibility and control over how their data is retained or utilized.
- **Unbounded Scope:** Organizations frequently request broad access rather than minimal, purpose-specific attributes.
- **Lack of Transparency:** Individuals have zero visibility into when, why, or how often third parties access their sensitive records.
- **Absence of Immediate Containment:** In the event of suspected fraud, identity theft, or data leakage, individuals have no rapid mechanism to cut off external access instantly.

---

## 2. Proposed Solution

**DataVault** introduces a zero-trust, user-centric data governance architecture:
- **Client-Scoped Encrypted Personal Vault:** All sensitive attributes are encrypted using AES-256-GCM before persistent storage in the database.
- **Purpose-Bound & Duration-Limited Sharing:** Organizations must explicitly state their operational purpose and requested access duration in hours.
- **Sovereign Consent & Immediate Revocation:** Data owners explicitly grant or deny requests and can revoke active permissions at any moment with instantaneous server-side enforcement.
- **Emergency Privacy Lock:** A real-time kill-switch enabling users to immediately sever all third-party access, even for active, unexpired permissions.
- **Immutable Append-Only Audit Trail:** Every authentication event, record creation, data access, approval, denial, revocation, and security lock event is logged immutably.
- **Role-Based Access Control (RBAC):** Distinct interfaces and strict backend endpoint security for **USER**, **ORGANIZATION**, and **ADMIN** roles.

---

## 3. Core Features

- 🔐 **AES-256-GCM Encryption:** Authenticated encryption with unique 12-byte initialization vectors (IVs) per record ensures confidentiality and tamper detection.
- 📁 **Secure Private Document Management:** Uploaded files are stored outside the public web root with UUID-sanitized filenames and restricted byte streaming.
- ⏱️ **Automatic Time-Based Expiry:** Every granted permission specifies an expiration timestamp; expired permissions are rejected server-side.
- 🚨 **Emergency Privacy Lock:** Instant kill-switch that blocks all incoming organization data and document access with `403 Forbidden`.
- 📜 **Append-Only Platform Audit Logging:** Comprehensive event logs with timestamps, client IP addresses, actor identities, actions, and status.
- 🌓 **Sage & Warm Ivory Editorial UI:** Distinctive design with light and dark theme switching, responsive sidebar navigation, and glassmorphic telemetry cards.

---

## 4. Role-Based Dashboards & Capabilities

DataVault implements three distinct user roles, enforced both in the frontend router and at the Spring Security backend filter chain:

### 1. USER — Personal Privacy Dashboard
- **Personal Vault:** Store, view, edit, reveal (decrypt), and delete sensitive attributes across categories (`IDENTITY`, `FINANCIAL`, `MEDICAL`, `EMPLOYMENT`, `OTHER`).
- **Document Management:** Upload documents (PDF, DOCX, TXT, images up to 15MB) and securely download personal files.
- **Sharing Consent Management:** Review incoming organization requests, approve with automated time bounds, or deny with explanation notes.
- **Active Permissions Tracker:** Monitor granted permissions, view countdown to expiration, and revoke permissions with immediate effect.
- **Emergency Privacy Lock:** Toggle the platform-wide kill-switch to immediately freeze all organization access to personal data.
- **Personal Audit History:** View an immutable log of all access requests, personal vault views, and approvals.

### 2. ORGANIZATION — Organization Portal
- **Data Owner Directory:** Search and browse eligible personal users on the platform.
- **Access Request Submissions:** Request access to specific data categories or documents by specifying a mandatory legal/operational `purpose` and requested `durationHours`.
- **Authorized Data Access:** View permitted personal records and download approved documents strictly within the authorized window and while the user's Emergency Privacy Lock is inactive.
- **Permission Lifecycle:** Track pending, active, and expired access requests.

### 3. ADMIN — System Overview & Platform Audit Logs
- **System Overview:** Real-time platform metrics aggregated directly from backend repositories:
  - Total Registered Users (breakdown of personal users and organizations)
  - Total Encrypted Vault Records
  - Total Stored Documents
  - Total Access Requests & Permissions
  - Total Audit Events Logged
- **Platform Audit Trail:** Comprehensive, system-wide search and monitoring across all platform events, user logins, data access queries, and security lock toggles.

---

## 5. Technology Stack

### Frontend
- **Framework:** React 19 (SPA)
- **Tooling & Build:** Vite 8
- **Language:** Modern JavaScript (ES Modules)
- **HTTP Client:** Axios (configured with JWT interceptors)
- **Styling:** Custom CSS design system (Sage & Warm Ivory editorial palette, dark/light mode token architecture)
- **Icons:** Inline SVG asset suite

### Backend
- **Framework:** Spring Boot 4.1.1 (Java 17+)
- **Security:** Spring Security 6 (Stateless JWT Filter Chain, BCrypt password hashing)
- **JWT Provider:** JJWT 0.12.6 (HMAC-SHA256 with minimum 256-bit signing keys)
- **Cryptography:** Java Cryptography Architecture (`AES/GCM/NoPadding`, SecureRandom 12-byte IVs)
- **Persistence:** Spring Data JPA / Hibernate ORM 7
- **Database:** MySQL 8.0

---

## 6. System Architecture

```
+-------------------------------------------------------------------------------+
|                       React (Vite) Frontend (Port 5173)                       |
|   - Sage & Warm Ivory UI (Light / Dark Mode)                                  |
|   - Role-Aware Routing: USER | ORGANIZATION | ADMIN                           |
|   - Personal Vault CRUD & Decrypted Reveal Controls                           |
|   - Document Manager & Blob Streaming Downloader                              |
|   - Request Consent Engine & Emergency Privacy Lock Kill-Switch               |
+---------------------------------------+---------------------------------------+
                                        | REST APIs / Bearer JWT / CORS
+---------------------------------------v---------------------------------------+
|                       Spring Boot 4 Backend (Port 8080)                       |
|   - SecurityFilterChain: Stateless JWT validation & role-based route guards   |
|   - Server-Side Token Revocation (revoked_tokens blacklist)                   |
|   - AES-256-GCM Cryptographic Service (Unique 12-byte random IV per record)   |
|   - FileStorageService: Isolated UUID file storage outside web roots          |
|   - Permission & Emergency Lock Evaluator on every data access query          |
+---------------------------------------+---------------------------------------+
                                        | Hibernate / JPA
+---------------------------------------v---------------------------------------+
|                           MySQL Database: datavault                           |
|   - users: BCrypt credentials, roles, emergency_lock_active flag              |
|   - vault_records: owner_id, category, AES ciphertext, GCM IV                 |
|   - documents: owner_id, original_name, stored_filename, file_type, size      |
|   - access_requests: requester_id, owner_id, purpose, duration, status        |
|   - access_permissions: scope, expires_at, status                            |
|   - revoked_tokens: token signature, expiration timestamp                     |
|   - audit_logs: immutable event trail (action, actor, target, timestamp)      |
+-------------------------------------------------------------------------------+
```

---

## 7. Security Design & Cryptographic Standards

1. **AES-256-GCM Authenticated Encryption:**
   - Every sensitive vault record is encrypted using AES in Galois/Counter Mode (`AES/GCM/NoPadding`) with a 128-bit authentication tag.
   - A fresh, cryptographically secure 12-byte initialization vector (IV) is generated via `SecureRandom` for each record and stored alongside ciphertext.
   - Ciphertext and IV are base64-encoded. Plaintext is never stored in persistent storage.

2. **Stateless JWT with Server-Side Revocation:**
   - Authentication tokens are signed using HMAC-SHA256 with a minimum 256-bit secret key.
   - Upon logout (`POST /api/auth/logout`), the token signature is recorded in the `revoked_tokens` table.
   - The security filter rejects revoked tokens immediately with `401 Unauthorized`.

3. **Emergency Privacy Lock Kill-Switch:**
   - Data owners can activate an Emergency Privacy Lock with a single click.
   - When engaged, the backend query interceptor immediately blocks all organization requests with `403 Forbidden`, regardless of active permissions.

4. **Private File Storage:**
   - Files are stored in a configurable private directory outside public web server roots (`./uploads/documents`).
   - Filenames are replaced with UUIDs to eliminate path traversal vulnerabilities (`../`).
   - File downloads are verified against user ownership or active organization permissions.

---

## 8. Database Setup

1. **Install MySQL Server 8.0+** and ensure it is running on port `3306`.
2. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS datavault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Hibernate will automatically manage and update the schema on backend startup (`spring.jpa.hibernate.ddl-auto=update`).

---

## 9. Backend Setup & Execution

### Prerequisites
- Java Development Kit (JDK 17 or higher)
- Maven 3.8+ (or use the included `mvnw` wrapper)
- MySQL 8.0+

### Steps
1. Navigate to the repository root:
   ```bash
   cd DataVault
   ```
2. Configure your environment variables or copy `.env.example`:
   ```bash
   # Optional: set environment variables in your terminal
   export DB_HOST=localhost
   export DB_PORT=3306
   export DB_NAME=datavault
   export DB_USER=root
   export DB_PASSWORD=your_password
   ```
   *(Alternatively, create an untracked `application-local.properties` file with `spring.datasource.password=your_password`)*
3. Build and run the Spring Boot application:
   ```bash
   # Windows
   mvnw.cmd spring-boot:run

   # Linux / macOS
   ./mvnw spring-boot:run
   ```
4. The backend server starts on `http://localhost:8080`.

---

## 10. Frontend Setup & Execution

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Steps
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the frontend API URL (defaults to `http://localhost:8080` in `.env.example`):
   ```bash
   cp .env.example .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.
6. To create an optimized production build:
   ```bash
   npm run build
   ```

---

## 11. Environment Variables Reference

A safe template is provided in [`.env.example`](.env.example):

| Variable | Description | Example / Default |
|---|---|---|
| `DB_HOST` | MySQL database host | `localhost` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_NAME` | Database schema name | `datavault` |
| `DB_USER` | MySQL database username | `root` |
| `DB_PASSWORD` | MySQL database password | *(set in local env)* |
| `JWT_SECRET` | 256-bit secret key for HMAC-SHA256 | *(configured 256-bit string)* |
| `DATAVAULT_ENCRYPTION_KEY` | 256-bit AES cryptographic key | *(configured 32-character key)* |
| `DATAVAULT_UPLOAD_DIR` | Private document storage directory | `./uploads/documents` |
| `PORT` | Backend application port | `8080` |
| `VITE_API_BASE_URL` | Frontend API target endpoint | `http://localhost:8080` |

---

## 12. Testing & Verification

### 1. Role-Based Verification Test Suite
DataVault includes an automated role verification suite in [`scratch/test_roles.js`](scratch/test_roles.js) that validates:
- Personal User (`USER`) login and dashboard metric schema.
- Organization (`ORGANIZATION`) login and access payload.
- System Administrator (`ADMIN`) authentication and system overview statistics.
- Platform audit log retrieval for administrative users.

Execute the role test:
```bash
node scratch/test_roles.js
```

### 2. Backend Unit & Context Tests
Run the Spring Boot test suite using Maven:
```bash
mvnw.cmd test
```

### 3. Frontend Production Build Verification
Verify client bundle compilation and assets:
```bash
cd frontend
npm run build
```

---

## 13. Future Scope

- 📱 **Mobile Native Client:** React Native companion application with biometric unlock (FaceID / Fingerprint).
- 🔗 **Zero-Knowledge Key Derivation:** Client-side passphrase derivation using PBKDF2/Argon2 for end-to-end zero-knowledge encryption.
- ⏱️ **Granular Single-Use Tokens:** Ephemeral one-time cryptographic download links for single-document sharing.
- 🔔 **Webhook & Push Notifications:** Real-time push alerts when an organization requests access or when a permission is nearing expiration.

---

## 14. Author

- **GitHub:** [@harshu167](https://github.com/harshu167)
- **Project:** DataVault — Secure Personal Data Sharing and Privacy Management Platform
