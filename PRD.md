# Numpux Product Requirements Document

**Document status:** Proposed target architecture  
**Version:** 1.0  
**Last updated:** 1 October 2026  
**Product type:** Free collaborative project and task management application  
**UI language:** English  
**Document language:** Indonesian

## Implementation Status

Implemented in the current application:

- Workspace tenant boundary and active workspace selection.
- Workspace Owner, Admin, Member, and Guest memberships.
- Project Owner, Admin, Contributor, and Viewer roles.
- Creator ownership for new projects.
- Pending, expiring, single-use project invitations.
- Invitation acceptance for existing and newly registered users.
- Workspace member role management, removal, and ownership transfer.
- Project ownership transfer and owner protection.
- Workspace-scoped projects, tasks, reports, and member management.
- Server-side authorization for project settings, tasks, members, reports, monitoring, and global account administration.
- Workspace, invitation, and project-role migration for legacy data.
- Workspace and invitation metrics in platform monitoring.

Planned follow-up capabilities:

- Transactional email delivery for invitation and email verification.
- Full normalization of transitional global `admin`/`user` values into system role `account`.
- Database-backed action permission catalog and custom role builder.
- Attachment storage and fair-use quota enforcement.
- Workspace-specific workflow templates and audit-log view.

## 1. Executive Summary

Numpux adalah aplikasi gratis untuk mengelola project, task, workflow board, anggota project, laporan, dan aktivitas pengguna. Produk harus mendukung dua kebutuhan yang berbeda:

1. Pemilik aplikasi perlu mengoperasikan dan memantau seluruh platform.
2. Pengguna biasa perlu membuat project dan berkolaborasi tanpa memperoleh akses administratif ke seluruh aplikasi.

Model akses yang direkomendasikan adalah **multi-level authorization**:

- **System level** mengatur siapa yang mengoperasikan aplikasi.
- **Workspace level** mengatur administrasi sebuah tim atau organisasi.
- **Project level** mengatur apa yang dapat dilakukan seseorang di project tertentu.

Menu visibility hanya membantu navigasi dan tidak boleh menjadi satu-satunya mekanisme keamanan. Setiap API dan server action wajib memeriksa permission yang sesuai.

## 2. Product Vision

Menjadi aplikasi project management gratis yang sederhana untuk mulai digunakan, tetapi tetap aman dan cukup fleksibel untuk kolaborasi tim.

### Product principles

- **Simple by default:** pengguna baru dapat membuat project pertama tanpa konfigurasi kompleks.
- **Least privilege:** pengguna hanya menerima akses minimum yang diperlukan.
- **Project ownership:** pembuat project memiliki kontrol penuh terhadap project tersebut.
- **Explicit invitation:** akses baru diberikan melalui invitation yang dapat dilacak.
- **No cross-tenant access:** anggota satu workspace tidak dapat melihat data workspace lain.
- **Database-driven configuration:** status, priority, menu, permission, dan workflow tersimpan di database.
- **Server-enforced security:** menyembunyikan menu tidak dianggap sebagai authorization.
- **Recoverable operations:** penghapusan utama menggunakan archive atau soft delete.
- **English interface:** seluruh label, pesan, empty state, dan validation message pada aplikasi menggunakan English yang baik dan konsisten.

## 3. Goals

- Mendefinisikan role dan privilege yang mudah dipahami.
- Memastikan pengguna yang membuat project dapat mengelola project tersebut.
- Memastikan pengguna undangan hanya mendapatkan akses sesuai role project.
- Memisahkan data dan administrasi setiap workspace.
- Memberikan superadmin monitoring seluruh platform.
- Membuat permission dapat dikembangkan tanpa hardcode menu atau status.
- Memiliki invitation flow yang aman tanpa membuat password sementara secara otomatis.
- Menyediakan audit trail untuk operasi sensitif.

## 4. Non-Goals

Versi awal tidak mencakup:

- Paket berbayar, subscription, invoice, atau payment gateway.
- SSO enterprise, SCIM, atau domain provisioning.
- Public project tanpa login.
- Custom role builder penuh untuk setiap workspace.
- Automation builder kompleks seperti trigger-action workflow.
- Resource planning atau accounting tingkat enterprise.
- Chat real-time yang menggantikan aplikasi komunikasi khusus.

## 5. Target Users

### 5.1 Application Owner

Pemilik atau operator Numpux. Membutuhkan monitoring sistem, pengelolaan master data, audit log, menu, default permission, serta penanganan akun bermasalah.

### 5.2 Workspace Owner

Orang yang mendaftar secara mandiri. Membuat dan mengelola workspace, project, dan undangan untuk timnya.

### 5.3 Workspace Administrator

Anggota tepercaya yang membantu Workspace Owner mengelola anggota, project, dan konfigurasi workspace.

### 5.4 Contributor

Anggota tim yang bekerja pada task, memperbarui status, menulis komentar, dan mengunggah attachment.

### 5.5 Viewer

Stakeholder yang membutuhkan visibilitas terhadap project tanpa hak untuk mengubah data operasional.

## 6. Recommended Authorization Model

### 6.1 Level 1: System Role

System role bersifat sangat terbatas dan tidak digunakan untuk mengatur kolaborasi project.

| Role | Assignment | Purpose |
|---|---|---|
| `superadmin` | Dibuat atau dipromosikan oleh application owner | Mengoperasikan seluruh platform |
| `account` | Semua pengguna selain superadmin | Identitas pengguna normal tanpa hak global |

Rekomendasi: role global `admin` dan `user` yang ada saat ini secara bertahap dipindahkan menjadi membership di level workspace. Dengan demikian, self-registration tidak pernah memberikan akses administratif global.

### 6.2 Level 2: Workspace Role

| Role | How assigned | Main responsibility |
|---|---|---|
| `owner` | Otomatis untuk pembuat workspace | Kontrol penuh workspace |
| `admin` | Dipromosikan oleh Workspace Owner | Mengelola operasi workspace |
| `member` | Default untuk pengguna undangan | Berpartisipasi di project yang diberikan |
| `guest` | Optional | Akses terbatas ke project tertentu |

Aturan penting:

- Registrasi mandiri membuat satu user, satu workspace, dan satu membership `owner`.
- Invitation oleh Workspace Owner/Admin membuat membership `member` secara default.
- Workspace harus selalu memiliki minimal satu owner aktif.
- Owner terakhir tidak dapat keluar, dihapus, atau diturunkan rolenya sebelum ownership ditransfer.
- Workspace Admin tidak dapat menghapus workspace atau mengubah role Workspace Owner.
- Workspace Member tidak otomatis dapat melihat semua project.

### 6.3 Level 3: Project Role

| Role | Default assignee | Purpose |
|---|---|---|
| `owner` | User yang membuat project | Kontrol penuh project dan ownership |
| `admin` | Dipilih oleh Project Owner | Membantu mengelola project dan anggota |
| `contributor` | Default invitation | Mengerjakan task dan aktivitas project |
| `viewer` | Stakeholder | Read-only access |

Jika seorang invited user membuat project baru dan workspace policy mengizinkannya, user tersebut otomatis menjadi `owner` hanya untuk project baru tersebut. Ia tidak berubah menjadi Workspace Admin atau system administrator.

### 6.4 Permission resolution

Permission efektif dihitung dengan aturan berikut:

1. Akun harus aktif dan session harus valid.
2. `superadmin` dapat melakukan seluruh system operation.
3. Untuk resource workspace, user harus mempunyai workspace membership aktif.
4. Untuk resource project, user harus menjadi Project Owner atau mempunyai project membership aktif.
5. Jika beberapa role berlaku, permission paling tinggi yang sah digunakan.
6. Explicit deny untuk operasi sensitif tetap menang, misalnya Project Admin tidak dapat mengambil ownership.
7. Permission diperiksa di server pada setiap request.

## 7. Permission Matrix

### 7.1 System permissions

| Capability | Superadmin | Workspace Owner | Workspace Admin | Member/Guest |
|---|:---:|:---:|:---:|:---:|
| View platform monitoring | Yes | No | No | No |
| View all registered accounts | Yes | No | No | No |
| Suspend any account | Yes | No | No | No |
| Manage system menus | Yes | No | No | No |
| Manage master statuses and priorities | Yes | No | No | No |
| Manage global permission templates | Yes | No | No | No |
| View platform audit log | Yes | No | No | No |
| Restore globally deleted data | Yes | No | No | No |

### 7.2 Workspace permissions

| Capability | Owner | Admin | Member | Guest |
|---|:---:|:---:|:---:|:---:|
| View workspace profile | Yes | Yes | Yes | Limited |
| Update workspace profile | Yes | Yes | No | No |
| Invite members | Yes | Yes | No | No |
| Remove members | Yes | Yes, except Owner | No | No |
| Change workspace member role | Yes | Limited | No | No |
| View all workspace projects | Yes | Yes | Assigned only | Assigned only |
| Create project | Yes | Yes | Configurable | No |
| View workspace reports | Yes | Yes | No | No |
| View workspace audit log | Yes | Optional | No | No |
| Transfer workspace ownership | Yes | No | No | No |
| Delete/archive workspace | Yes | No | No | No |

Recommended default: Workspace Member boleh membuat project. Ketika membuat project, ia menjadi Project Owner untuk project tersebut. Workspace Owner dapat mematikan kemampuan ini melalui workspace setting pada fase berikutnya.

### 7.3 Project permissions

| Capability | Owner | Admin | Contributor | Viewer |
|---|:---:|:---:|:---:|:---:|
| View project and board | Yes | Yes | Yes | Yes |
| Create task | Yes | Yes | Yes | No |
| Edit any task | Yes | Yes | Assigned/created tasks | No |
| Move task between statuses | Yes | Yes | Yes | No |
| Assign task | Yes | Yes | Limited | No |
| Comment on task | Yes | Yes | Yes | Optional, default Yes |
| Add attachment | Yes | Yes | Yes | No |
| Archive/delete task | Yes | Yes | No | No |
| Manage project workflow | Yes | Yes | No | No |
| Update project settings | Yes | Yes | No | No |
| Invite existing workspace member | Yes | Yes | No | No |
| Invite a new email address | Yes | Yes, if Workspace Admin | No | No |
| Change project member role | Yes | Limited | No | No |
| Remove project member | Yes | Yes, except Owner | No | No |
| View project report | Yes | Yes | Yes | Yes |
| Export project data | Yes | Yes | Configurable | No |
| Transfer project ownership | Yes | No | No | No |
| Archive project | Yes | Yes | No | No |
| Permanently delete project | Yes | No | No | No |

### 7.4 Ownership safety rules

- Project selalu memiliki tepat satu active owner pada MVP.
- Owner tidak dapat dikeluarkan dari project.
- Owner role tidak dapat diubah melalui generic member edit.
- Ownership hanya berubah melalui endpoint dan confirmation flow khusus.
- Transfer ownership dicatat di audit log.
- Project Admin tidak dapat mempromosikan dirinya atau user lain menjadi Owner.
- Jika owner account disuspend, project tetap tersimpan dan dapat dipindahkan oleh superadmin atau Workspace Owner melalui recovery flow.

## 8. Menu Access Model

Menu tetap database-driven, tetapi harus menunjuk ke permission key, bukan hanya role name.

Contoh permission keys:

| Permission key | Menu or action |
|---|---|
| `platform.monitor.view` | Monitoring |
| `platform.menu.manage` | Menu Management |
| `platform.master.manage` | Master Data |
| `platform.audit.view` | Platform Audit Log |
| `workspace.member.manage` | User/Member Management |
| `workspace.report.view` | Reports |
| `project.view` | Project Detail and Board |
| `project.update` | Project Settings |
| `project.member.manage` | Project Members |
| `task.create` | Add Task |
| `task.update` | Edit and Move Task |
| `task.archive` | Archive Task |

Sidebar menampilkan menu hanya jika user memiliki permission yang dibutuhkan. API tetap melakukan pemeriksaan permission yang sama secara independen.

### Permission boundaries

- Project role tidak boleh memberikan system permission.
- Workspace role tidak boleh memberikan platform monitoring atau global master-data permission.
- Custom menu visibility boleh lebih ketat dari default permission, tetapi tidak boleh memperluas privilege di atas security ceiling role tersebut.
- Superadmin dapat mengubah default permission template.
- Perubahan template tidak boleh diam-diam mengubah project lama tanpa confirmation atau migration mode.

## 9. Core User Flows

### 9.1 Self-registration

1. User membuka registration page.
2. User mengisi name, email, dan password atau menggunakan OAuth.
3. Sistem memverifikasi email.
4. Sistem membuat user dengan system role `account`.
5. Sistem membuat workspace default.
6. Sistem membuat workspace membership `owner`.
7. User diarahkan ke onboarding untuk membuat project pertama.

Acceptance rule: self-registration tidak pernah menghasilkan `superadmin`.

### 9.2 Create project

1. User dengan `project.create` mengisi project form.
2. Sistem membuat project di workspace aktif.
3. Sistem membuat project membership `owner` untuk creator.
4. Default workflow statuses dan priorities disalin atau direferensikan dari template aktif.
5. Aktivitas dicatat pada audit log.

### 9.3 Invite user by email

1. Project Owner/Admin membuka Project Members drawer.
2. User memasukkan email dan memilih project role.
3. Sistem memeriksa apakah email sudah menjadi anggota workspace.
4. Jika sudah ada, sistem membuat project membership.
5. Jika belum ada, sistem membuat invitation record berstatus `pending`.
6. Sistem mengirim email berisi single-use invitation link.
7. Recipient login atau register melalui link tersebut.
8. Setelah email cocok dan token valid, workspace/project membership dibuat.
9. Invitation berubah menjadi `accepted`.
10. Inviter dan recipient menerima notification.

Sistem **tidak boleh** membuat akun aktif dengan random temporary password. Akun hanya dibuat setelah recipient menerima invitation atau menyelesaikan registration.

### 9.4 Change project role

1. Project Owner/Admin memilih anggota.
2. UI hanya menampilkan role yang boleh diberikan oleh actor.
3. Server memvalidasi actor, target, dan requested role.
4. Perubahan disimpan dan dicatat di audit log.
5. Permission target berubah pada request berikutnya.

### 9.5 Transfer project ownership

1. Owner memilih anggota aktif sebagai owner baru.
2. UI menampilkan confirmation yang menjelaskan dampak.
3. Server menjalankan transfer dalam satu database transaction.
4. Owner lama menjadi Project Admin secara default.
5. Owner baru menerima notification.
6. Audit log menyimpan actor, previous owner, new owner, timestamp, dan project ID.

### 9.6 Remove member

1. Owner/Admin memilih Remove Member.
2. Server memastikan target bukan owner.
3. Task assignment target dapat dipertahankan sebagai historical reference atau di-unassign berdasarkan pilihan.
4. Project membership dinonaktifkan atau dihapus secara soft delete.
5. User langsung kehilangan akses ke project.

## 10. Functional Requirements

### FR-AUTH: Authentication and account lifecycle

- `FR-AUTH-01` Sistem mendukung email/password authentication.
- `FR-AUTH-02` Sistem dapat mendukung OAuth tanpa mengubah authorization model.
- `FR-AUTH-03` Password disimpan menggunakan password hashing yang kuat dan salted.
- `FR-AUTH-04` Suspended user tidak dapat membuat session baru.
- `FR-AUTH-05` Perubahan password, suspension, dan sensitive role changes membatalkan session lama.
- `FR-AUTH-06` Login dan registration memiliki rate limiting.
- `FR-AUTH-07` Email verification diperlukan sebelum menerima invitation produksi.
- `FR-AUTH-08` User dapat logout dari current session dan seluruh sessions.

### FR-WRK: Workspace

- `FR-WRK-01` Self-registration membuat default workspace.
- `FR-WRK-02` Setiap project harus terhubung ke satu workspace.
- `FR-WRK-03` User dapat mengganti active workspace jika tergabung di lebih dari satu workspace.
- `FR-WRK-04` Workspace Owner/Admin dapat melihat dan mencari anggota workspace.
- `FR-WRK-05` Admin hanya dapat mengelola anggota pada workspace-nya.
- `FR-WRK-06` Workspace harus selalu memiliki minimal satu owner.

### FR-INV: Invitations

- `FR-INV-01` Invitation menyimpan inviter, email, workspace, optional project, requested role, expiry, dan status.
- `FR-INV-02` Token invitation disimpan sebagai hash, bukan plaintext.
- `FR-INV-03` Invitation hanya dapat digunakan satu kali.
- `FR-INV-04` Invitation default kedaluwarsa setelah tujuh hari.
- `FR-INV-05` Inviter dapat resend dan revoke invitation.
- `FR-INV-06` Sistem mencegah duplicate pending invitation untuk scope yang sama.
- `FR-INV-07` Invitation hanya dapat diterima oleh email yang dituju.
- `FR-INV-08` Existing user dapat menerima invitation setelah login.

### FR-PRJ: Projects

- `FR-PRJ-01` Creator otomatis menjadi Project Owner.
- `FR-PRJ-02` Project Owner/Admin dapat memperbarui nama, deskripsi, category, status, dan workflow.
- `FR-PRJ-03` Project hanya terlihat bagi anggota yang memiliki akses, kecuali superadmin saat support/recovery.
- `FR-PRJ-04` Project dapat di-archive dan dipulihkan.
- `FR-PRJ-05` Permanent delete memerlukan confirmation dan hanya tersedia untuk owner sesuai retention policy.
- `FR-PRJ-06` Ownership transfer dilakukan secara atomik.

### FR-TSK: Tasks

- `FR-TSK-01` Task wajib berada pada project.
- `FR-TSK-02` Status, priority, severity, dan issue type berasal dari database.
- `FR-TSK-03` Board mengikuti urutan status dari database.
- `FR-TSK-04` Contributor dapat membuat, mengubah, dan memindahkan task sesuai permission.
- `FR-TSK-05` Viewer tidak dapat mengubah task.
- `FR-TSK-06` Delete task menggunakan archive/soft delete.
- `FR-TSK-07` Perubahan status, assignee, priority, dan due date masuk activity log.

### FR-ACL: Authorization

- `FR-ACL-01` Setiap protected API memerlukan session dan account aktif.
- `FR-ACL-02` Setiap resource query melakukan scope berdasarkan workspace/project membership.
- `FR-ACL-03` Client tidak dapat meningkatkan role melalui request payload.
- `FR-ACL-04` Menu hidden tidak menggantikan server authorization.
- `FR-ACL-05` Semua authorization default ke deny.
- `FR-ACL-06` Permission cache harus di-invalidasi setelah perubahan membership atau role.
- `FR-ACL-07` User tidak dapat mengubah role miliknya sendiri.
- `FR-ACL-08` Superadmin system account tidak dapat dihapus melalui UI biasa.

### FR-MON: Monitoring

- `FR-MON-01` Hanya superadmin yang dapat melihat platform monitoring.
- `FR-MON-02` Monitoring menampilkan total registrations, verified accounts, invited accounts, suspended accounts, dan online users.
- `FR-MON-03` Online berarti heartbeat diterima dalam dua menit terakhir.
- `FR-MON-04` Monitoring menampilkan last login dan last seen.
- `FR-MON-05` Monitoring menampilkan jumlah workspace, project, task, dan completed task.
- `FR-MON-06` Monitoring dapat difilter berdasarkan date range dan status.
- `FR-MON-07` PII yang tampil dibatasi pada operator berwenang.

### FR-AUD: Audit and notification

- `FR-AUD-01` Operasi sensitif dicatat dengan actor, action, entity, timestamp, dan metadata aman.
- `FR-AUD-02` Password, token, secret, dan raw session tidak boleh masuk audit metadata.
- `FR-AUD-03` User menerima notification ketika diundang, role berubah, ownership ditransfer, atau task penting diberikan.
- `FR-AUD-04` Superadmin dapat mencari dan memfilter platform audit log.
- `FR-AUD-05` Workspace Owner dapat melihat audit log workspace pada fase lanjutan.

## 11. Suggested Database Design

### 11.1 Identity and system authorization

#### `users`

- `id`
- `name`
- `email`
- `password_hash`
- `system_role_id`
- `account_status`
- `email_verified_at`
- `last_login_at`
- `last_seen_at`
- `session_version`
- `account_origin`
- `created_at`
- `updated_at`
- `deleted_at`

#### `system_roles`

- `id`
- `code` (`superadmin`, `account`)
- `name`
- `is_system`

#### `permissions`

- `id`
- `code`
- `scope` (`system`, `workspace`, `project`)
- `description`

#### `role_permissions`

- `role_id`
- `permission_id`
- `allowed`

Unique constraint: `(role_id, permission_id)`.

### 11.2 Workspace

#### `workspaces`

- `id`
- `name`
- `slug`
- `created_by`
- `status`
- `settings_json`
- `created_at`
- `updated_at`
- `deleted_at`

#### `workspace_members`

- `id`
- `workspace_id`
- `user_id`
- `role_id`
- `status`
- `joined_at`
- `created_at`
- `updated_at`
- `deleted_at`

Unique constraint: `(workspace_id, user_id)` for active membership.

#### `workspace_roles`

- `id`
- `code` (`owner`, `admin`, `member`, `guest`)
- `name`
- `sort_order`
- `is_system`

### 11.3 Project authorization

#### `projects`

Tambahkan:

- `workspace_id`
- `created_by`
- `archived_at`

#### `project_members`

- `id`
- `project_id`
- `user_id`
- `role_id`
- `invited_by`
- `joined_at`
- `created_at`
- `updated_at`
- `deleted_at`

Unique constraint: `(project_id, user_id)` for active membership.

#### `project_roles`

- `id`
- `code` (`owner`, `admin`, `contributor`, `viewer`)
- `name`
- `description`
- `sort_order`
- `is_system`

#### `project_role_permissions`

- `project_role_id`
- `permission_id`
- `allowed`

### 11.4 Invitations

#### `invitations`

- `id`
- `workspace_id`
- `project_id` nullable
- `email`
- `workspace_role_id` nullable
- `project_role_id` nullable
- `invited_by`
- `token_hash`
- `status` (`pending`, `accepted`, `revoked`, `expired`)
- `expires_at`
- `accepted_by` nullable
- `accepted_at` nullable
- `created_at`
- `updated_at`

Indexes:

- `(LOWER(email), status)`
- `(workspace_id, status)`
- `(project_id, status)`
- `(token_hash)` unique
- `(expires_at)`

## 12. API Requirements

Suggested endpoints:

### Workspace

- `POST /api/workspaces`
- `GET /api/workspaces`
- `GET /api/workspaces/:workspaceId`
- `PATCH /api/workspaces/:workspaceId`
- `DELETE /api/workspaces/:workspaceId`
- `GET /api/workspaces/:workspaceId/members`
- `PATCH /api/workspaces/:workspaceId/members/:memberId`
- `DELETE /api/workspaces/:workspaceId/members/:memberId`
- `POST /api/workspaces/:workspaceId/transfer-ownership`

### Invitations

- `POST /api/workspaces/:workspaceId/invitations`
- `GET /api/workspaces/:workspaceId/invitations`
- `POST /api/invitations/:invitationId/resend`
- `DELETE /api/invitations/:invitationId`
- `GET /api/invitations/accept?token=...`
- `POST /api/invitations/accept`

### Projects and members

- `POST /api/workspaces/:workspaceId/projects`
- `GET /api/projects/:projectId/members`
- `POST /api/projects/:projectId/members`
- `PATCH /api/projects/:projectId/members/:memberId`
- `DELETE /api/projects/:projectId/members/:memberId`
- `POST /api/projects/:projectId/transfer-ownership`

### Authorization behavior

- Gunakan resource IDs dari URL hanya setelah server melakukan membership lookup.
- Jangan menerima `workspaceId`, `userId`, atau role dari client tanpa validasi ownership.
- Gunakan database transaction untuk invitation acceptance dan ownership transfer.
- Response `403` digunakan untuk authenticated user tanpa permission.
- Response `404` dapat digunakan untuk resource di luar scope agar tidak membocorkan keberadaan data.

## 13. UI/UX Requirements

### Navigation

- Dashboard menjadi menu pertama.
- Menu berasal dari database dan diurutkan menggunakan `sort_order`.
- Menu menampilkan skeleton/loading state saat privilege sedang dimuat.
- Unauthorized menu tidak ditampilkan.
- Direct navigation ke halaman tanpa permission diarahkan ke Dashboard atau halaman `403` yang jelas.

### Member management

- Semua create/edit form menggunakan right-side drawer.
- Project Members menampilkan avatar, email, project role, invitation status, dan joined date.
- Role selector hanya berisi role yang boleh diberikan actor.
- Pending invitation dapat di-resend atau revoke.
- Dangerous action memiliki confirmation dialog.

### Permission explanation

- Role dropdown menampilkan deskripsi singkat.
- UI menampilkan alasan saat action disabled, misalnya “Only the project owner can transfer ownership.”
- Settings menyediakan read-only permission summary untuk Owner/Admin.

### Empty and error states

- Empty project: “Create your first task to start planning this project.”
- Empty member list: “Invite teammates to collaborate on this project.”
- Expired invite: tampilkan tombol meminta invitation baru.
- Forbidden: jangan hanya menampilkan blank page.

## 14. Free Product Limits

Karena aplikasi gratis, limit sebaiknya digunakan untuk menjaga stabilitas, bukan memaksa upgrade.

Recommended initial fair-use limits:

| Resource | Suggested limit |
|---|---:|
| Workspaces owned per account | 3 |
| Active projects per workspace | 25 |
| Members per workspace | 50 |
| Members per project | 50 |
| Pending invitations per workspace | 50 |
| Invitation sends per user per day | 100 |
| Attachment size | 10 MB |
| Total storage per workspace | 1 GB |
| API requests | Rate limited by endpoint risk |

Limit harus tersimpan di configuration/database agar dapat diubah. Jika limit tercapai, data lama tetap dapat dibaca dan user mendapat pesan yang jelas. Archive dapat digunakan untuk mengurangi active project count.

## 15. Security Requirements

- Gunakan secure, HTTP-only, SameSite cookies untuk browser session.
- Gunakan CSRF protection untuk mutation berbasis cookie.
- Validate session version dan account status pada request terlindungi.
- Ambil current role dari database, bukan hanya dari JWT claim.
- Hash invitation token sebelum disimpan.
- Rate limit login, registration, invitation, password reset, dan export.
- Normalize email ke lowercase dan gunakan unique case-insensitive constraint.
- Gunakan parameterized SQL untuk seluruh input.
- Jangan mengekspos apakah email terdaftar pada unauthenticated endpoint.
- Prevent IDOR dengan workspace/project scoping pada setiap resource query.
- Sanitize filename dan content type attachment.
- Audit role changes, member removal, export, ownership transfer, suspension, restore, dan permanent delete.
- Superadmin support access ke project harus diaudit.

## 16. Non-Functional Requirements

### Performance

- Sidebar permission load p95 di bawah 300 ms pada database normal.
- Board initial load p95 di bawah 1.5 detik untuk 500 task.
- User/member search menggunakan pagination dan debounce.
- Query project/task selalu menggunakan workspace/project indexes.
- Monitoring dapat menggunakan aggregated query atau cache dengan refresh 30 detik.

### Reliability

- Ownership transfer dan invitation acceptance bersifat atomic.
- Email delivery failure tidak membatalkan invitation record.
- Background job dapat melakukan resend dengan idempotency key.
- Soft-deleted membership tidak memberikan akses.

### Accessibility

- Seluruh action dapat diakses dengan keyboard.
- Focus trap diterapkan pada right-side drawer dan modal.
- Warna status dan priority tidak menjadi satu-satunya indikator.
- Contrast minimum mengikuti WCAG AA.
- Icon-only button memiliki accessible label.

### Observability

- Structured error logging dengan request ID.
- Metrics untuk login failure, registration, invitations, online users, API latency, dan error rate.
- Health check database dan email provider.
- Alert untuk abnormal registration atau invitation spikes.

## 17. Reporting and Monitoring Metrics

Superadmin dashboard:

- Total accounts.
- Self-registered workspace owners.
- Invited accounts.
- Verified and unverified accounts.
- Active, suspended, and deleted accounts.
- Online users.
- Daily/weekly/monthly registrations.
- Total workspaces, projects, and tasks.
- Active projects in the last 30 days.
- Invitation sent, accepted, expired, and revoked rates.
- Storage usage.
- API error rate and slow endpoints.

Workspace report:

- Project completion.
- Task status and priority distribution.
- Overdue tasks.
- Member workload.
- Activity trend.
- Data hanya berasal dari workspace aktif milik user.

## 18. Migration Plan from Current Model

### Phase 1: Stabilize current roles

- Pertahankan `superadmin` sebagai application owner.
- Pertahankan current `admin` sebagai transitional Workspace Owner.
- Pertahankan current `user` sebagai transitional Workspace Member.
- Pastikan report dan user management selalu scoped, tidak global untuk admin.
- Pertahankan project roles Owner/Admin/Member/Viewer sampai mapping baru siap.

### Phase 2: Add workspace layer

- Buat `workspaces`, `workspace_members`, `workspace_roles`, dan `invitations`.
- Buat satu default workspace untuk setiap self-registered admin.
- Hubungkan project milik admin ke default workspace tersebut.
- Hubungkan invited users menggunakan `invited_by` dan project memberships yang ada.
- Data yang tidak dapat dipetakan masuk migration review queue, bukan ditebak otomatis.

### Phase 3: Normalize roles and permissions

- Ubah system roles menjadi `superadmin` dan `account`.
- Map global `admin` ke workspace `owner`.
- Map global `user` ke workspace `member` atau `guest` sesuai relationship.
- Rename project `member` menjadi `contributor` untuk memperjelas kemampuan transaksi.
- Migrasikan menu privilege ke action-based permissions.

### Phase 4: Secure invitation flow

- Hentikan pembuatan akun dengan temporary random password.
- Tambahkan pending invitation dan email acceptance.
- Tambahkan verification, resend, revoke, dan expiry.
- Migrasikan existing active memberships tanpa mengirim invitation ulang.

### Phase 5: Cleanup

- Hapus transitional global `admin` dan `user` authorization checks.
- Hapus kolom atau code path lama setelah seluruh data tervalidasi.
- Jalankan permission regression tests sebelum release.

## 19. Acceptance Criteria

### Registration and workspace

- User baru tidak memiliki akses platform administration.
- User baru otomatis menjadi owner pada workspace miliknya.
- User baru dapat membuat project pertama.
- Workspace Owner tidak dapat melihat workspace lain.

### Project ownership

- Creator menjadi Project Owner secara otomatis.
- Creator dapat mengatur project, workflow, task, anggota, dan ownership.
- Project tetap memiliki satu owner setelah setiap perubahan.
- Project Admin tidak dapat menghapus owner atau mengambil ownership.

### Invited user

- Recipient belum menjadi active member sebelum invitation diterima.
- Contributor dapat mengerjakan task tetapi tidak dapat mengelola member atau project settings.
- Viewer tidak dapat melakukan mutation.
- User yang dikeluarkan langsung kehilangan akses pada request berikutnya.

### Data isolation

- Workspace Admin hanya melihat anggota dan report workspace miliknya.
- Project query tidak mengembalikan project yang tidak dimiliki atau tidak diikuti user.
- Manipulasi URL atau ID menghasilkan `403`/`404`, bukan data dari tenant lain.
- Menu hidden dan direct API call menghasilkan keputusan authorization yang sama.

### Superadmin

- Superadmin dapat melihat monitoring seluruh platform.
- Superadmin dapat mengelola default menus, master data, and permission templates.
- Superadmin account utama tidak dapat dihapus atau diturunkan melalui UI biasa.
- Seluruh support action superadmin tercatat di audit log.

## 20. Test Strategy

### Unit tests

- Permission resolver per scope dan role.
- Invitation token hashing and expiry.
- Owner safety rules.
- Session invalidation.
- Rate limiting.

### Integration tests

- Register → workspace owner → create project.
- Invite new email → register → accept → contributor access.
- Existing user invitation.
- Project role change.
- Ownership transfer.
- Member removal.
- Cross-workspace API access rejection.
- Suspended and deleted account rejection.

### Permission regression matrix

Setiap protected endpoint diuji dengan:

- No session.
- Invalid session.
- Suspended account.
- Superadmin.
- Workspace Owner.
- Workspace Admin.
- Project Owner.
- Project Admin.
- Contributor.
- Viewer.
- Authenticated user tanpa membership.

## 21. Rollout Plan

1. Deploy database additions tanpa menghapus kolom lama.
2. Backfill workspace dan membership secara idempotent.
3. Jalankan data consistency report.
4. Aktifkan dual-read permission resolver di staging.
5. Jalankan integration dan permission regression tests.
6. Aktifkan workspace-scoped authorization dengan feature flag.
7. Monitor `403`, `404`, login failure, dan invitation failure.
8. Aktifkan invitation acceptance flow.
9. Hentikan legacy temporary-account invitation.
10. Hapus legacy checks setelah stabilization period.

Rollback harus menonaktifkan feature flag tanpa menghapus workspace/membership data yang sudah dibuat.

## 22. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Role global dan project role tercampur | Privilege escalation | Pisahkan scope dan permission keys |
| Admin melihat data admin lain | Data leak | Tambahkan workspace scoping pada query |
| Invitation membuat akun tanpa consent | Security and UX issue | Pending invitation with single-use token |
| Owner terakhir terhapus | Project inaccessible | Owner invariant and transfer flow |
| Menu hidden dianggap security | Unauthorized API access | Server-side permission checks |
| Dynamic privilege terlalu bebas | Project role mendapat system access | Scope ceiling and protected system permissions |
| Legacy data tidak memiliki workspace | Incorrect ownership | Review queue and explicit migration report |
| Free usage disalahgunakan | Infrastructure cost | Fair-use limits and risk-based rate limiting |

## 23. Product Decisions

Keputusan yang direkomendasikan untuk implementasi:

1. **Gunakan workspace sebagai tenant boundary.**
2. **Self-registered user menjadi Workspace Owner, bukan global admin.**
3. **Project creator selalu menjadi Project Owner.**
4. **Invitation default memberikan Project Contributor.**
5. **Hanya Owner/Admin yang boleh mengelola anggota project.**
6. **Hanya Owner yang boleh transfer ownership atau permanent delete.**
7. **Viewer read-only; comment dapat diaktifkan sebagai default terpisah.**
8. **Jangan auto-create active account dengan temporary password.**
9. **Gunakan action-based permission pada server, bukan hanya menu privilege.**
10. **Pertahankan superadmin hanya untuk operator aplikasi.**

## 24. Open Questions

- Apakah satu user boleh memiliki lebih dari satu workspace?
- Apakah Workspace Member boleh membuat project secara default?
- Apakah Viewer boleh menulis komentar?
- Apakah Contributor boleh menghapus task yang dibuat sendiri?
- Apakah project dapat dibagikan ke guest dari luar workspace?
- Berapa retention period untuk archived/deleted data?
- Email provider apa yang akan digunakan untuk invitation dan verification?
- Apakah fair-use limits perlu ditampilkan di UI sejak versi pertama?

Default recommendation sudah diberikan di dokumen ini sehingga implementasi dapat dimulai tanpa menunggu seluruh pertanyaan dijawab. Pertanyaan tersebut dapat dijadikan configurable product decisions pada fase berikutnya.
