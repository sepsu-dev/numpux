import { pool, initDb } from "./src/db/index";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function seedSepsuDev() {
  await initDb();
  console.log("Seeding realistic dummy data for user: sepsu.dev@gmail.com ...");

  // 1. Ensure user sepsu.dev@gmail.com exists
  let userRes = await pool.query("SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)", ["sepsu.dev@gmail.com"]);
  let sepsuUserId = "";

  if (userRes.rows.length === 0) {
    const newId = crypto.randomUUID();
    const pwHash = hashPassword("password123");
    const insertRes = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, 'Sepsu Dev', 'sepsu.dev@gmail.com', $2, 'admin')
       RETURNING id, name, email`,
      [newId, pwHash]
    );
    sepsuUserId = insertRes.rows[0].id;
    console.log("Created user sepsu.dev@gmail.com with ID:", sepsuUserId);
  } else {
    sepsuUserId = userRes.rows[0].id;
    console.log("Found user sepsu.dev@gmail.com with ID:", sepsuUserId);
    // Ensure role is admin
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [sepsuUserId]);
  }

  // 2. Team members to collaborate with Sepsu
  const teamMembers = [
    { name: "Aria Pratama", email: "aria.pratama@techcorp.io", role: "user" },
    { name: "Dewi Lestari", email: "dewi.lestari@techcorp.io", role: "user" },
    { name: "Budi Santoso", email: "budi.santoso@techcorp.io", role: "user" },
    { name: "Siti Rahma", email: "siti.rahma@techcorp.io", role: "user" },
    { name: "Kevin Sanjaya", email: "kevin.sanjaya@techcorp.io", role: "user" },
  ];

  const memberUserIds: { id: string; name: string; email: string }[] = [];

  for (const m of teamMembers) {
    const existing = await pool.query("SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)", [m.email]);
    if (existing.rows.length > 0) {
      memberUserIds.push(existing.rows[0]);
    } else {
      const id = crypto.randomUUID();
      const pwHash = hashPassword("password123");
      const inserted = await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email`,
        [id, m.name, m.email, pwHash, m.role]
      );
      memberUserIds.push(inserted.rows[0]);
    }
  }

  console.log(`Verified ${memberUserIds.length} team members.`);

  // 3. Clear existing projects & tasks created by Sepsu so we have fresh, rich, realistic enterprise data
  await pool.query("DELETE FROM tasks WHERE user_id = $1", [sepsuUserId]);
  await pool.query("DELETE FROM project_members WHERE user_id = $1", [sepsuUserId]);
  await pool.query("DELETE FROM projects WHERE user_id = $1", [sepsuUserId]);

  // 4. Projects Definitions (Realistic enterprise scale projects)
  const projectsData = [
    {
      id: "7a1b2c3d-0001-4000-8000-000000000001",
      title: "OmniChannel Payment Gateway 2.0",
      description: "Arsitektur modern microservices untuk integrasi QRIS Dinamis, Virtual Account, Credit Card 3DS 2.0, dan direct debit payment providers.",
      category: "Product & Tech",
      status: "Active",
      members: [
        { userId: sepsuUserId, role: "Owner" },
        { userId: memberUserIds[0].id, role: "Admin" },
        { userId: memberUserIds[1].id, role: "Member" },
        { userId: memberUserIds[2].id, role: "Member" },
      ],
      tasks: [
        {
          key: "PAY-1",
          title: "Implementasi Idempotency Key pada Endpoint Payment Intent",
          description: "Mencegah double charge transaksi dengan Redis atomic distributed lock berbasis UUID token dari client header.",
          issueType: "Story",
          priority: "Urgent",
          dueDate: "Tomorrow",
          status: "In Progress",
          assignee: sepsuUserId,
        },
        {
          key: "PAY-2",
          title: "Integrasi Webhook Signature Verification untuk Provider BCA & Mandiri",
          description: "Validasi HMAC-SHA256 signature payload untuk menjamin integritas callback status pembayaran real-time.",
          issueType: "Task",
          priority: "High",
          dueDate: "Sep 28",
          status: "Done",
          assignee: memberUserIds[0].id,
        },
        {
          key: "PAY-3",
          title: "Bug: Race Condition Settlement Transaksi pada Jam Pergantian Hari",
          description: "Terjadi duplikasi status pending ke settlement saat cron job rekap batch berjalan pada pukul 23:59:59 WIB.",
          issueType: "Bug",
          priority: "Urgent",
          dueDate: "Today",
          status: "In Progress",
          assignee: sepsuUserId,
        },
        {
          key: "PAY-4",
          title: "Setup Prometheus Exporter & Grafana Dashboard untuk Latency Transaksi",
          description: "Monitoring P95 dan P99 response time query transaksi database dan downstream third-party provider.",
          issueType: "Improvement",
          priority: "Medium",
          dueDate: "Oct 02",
          status: "Review",
          assignee: memberUserIds[1].id,
        },
        {
          key: "PAY-5",
          title: "Implementasi Fallback Circuit Breaker saat Provider Core Banking Timeout",
          description: "Gunakan resilience4j atau pattern retry exponential backoff dengan cutoff waktu 3.5 detik.",
          issueType: "Task",
          priority: "High",
          dueDate: "Oct 05",
          status: "To Do",
          assignee: memberUserIds[2].id,
        },
        {
          key: "PAY-6",
          title: "Penyusunan Dokumentasi API Swagger OpenAPI 3.1 untuk Integrator Merchant",
          description: "Lengkapi contoh request cURL, Node.js, Python, Golang SDK serta panduan sandbox testing.",
          issueType: "Task",
          priority: "Low",
          dueDate: "Oct 10",
          status: "To Do",
          assignee: memberUserIds[1].id,
        }
      ]
    },
    {
      id: "7a1b2c3d-0002-4000-8000-000000000002",
      title: "Enterprise Core ERP & Inventory",
      description: "Platform manajemen pergudangan multi-cabang, barcode scanning logistik, procurement purchase order, dan auto-journaling keuangan.",
      category: "Operations",
      status: "Active",
      members: [
        { userId: sepsuUserId, role: "Owner" },
        { userId: memberUserIds[2].id, role: "Admin" },
        { userId: memberUserIds[3].id, role: "Member" },
      ],
      tasks: [
        {
          key: "ERP-1",
          title: "Auto-reorder Level Generator berbasis Analisis Penjualan 30 Hari Terakhir",
          description: "Kalkulasi safety stock dan lead time supplier untuk merekomendasikan draft Purchase Order otomatis.",
          issueType: "Story",
          priority: "High",
          dueDate: "Tomorrow",
          status: "In Progress",
          assignee: memberUserIds[2].id,
        },
        {
          key: "ERP-2",
          title: "Integrasi Barcode Scanner Zebra TC21 untuk Stock Opname Gudang Cikarang",
          description: "WebSocket sync real-time saat scan barang masuk dan keluar tanpa refresh halaman.",
          issueType: "Task",
          priority: "Medium",
          dueDate: "Oct 01",
          status: "Done",
          assignee: sepsuUserId,
        },
        {
          key: "ERP-3",
          title: "Optimasi Query Postgres Rekonsiliasi Jurnal Umum Akhir Bulan",
          description: "Tambahkan indexing komposit pada (ledger_account_id, posting_date) untuk memangkas waktu query dari 18s ke 420ms.",
          issueType: "Improvement",
          priority: "Urgent",
          dueDate: "Today",
          status: "Review",
          assignee: sepsuUserId,
        },
        {
          key: "ERP-4",
          title: "Export Laporan Neraca Saldo dan Laba Rugi ke Format XLSX Terformat",
          description: "Formula cell Excel otomatis untuk subtotal dan grouping akun hierarki.",
          issueType: "Task",
          priority: "Low",
          dueDate: "Oct 08",
          status: "To Do",
          assignee: memberUserIds[3].id,
        }
      ]
    },
    {
      id: "7a1b2c3d-0003-4000-8000-000000000003",
      title: "Mobile Banking & Lifestyle SuperApp",
      description: "Aplikasi seluler cross-platform (React Native / iOS & Android) dengan biometrik login, transfer dana instan BI-FAST, dan split bill.",
      category: "Product & Tech",
      status: "Active",
      members: [
        { userId: sepsuUserId, role: "Owner" },
        { userId: memberUserIds[0].id, role: "Member" },
        { userId: memberUserIds[4].id, role: "Member" },
      ],
      tasks: [
        {
          key: "APP-1",
          title: "FaceID & Fingerprint Biometric Authentication Flow",
          description: "Implementasi secure enclave storage untuk token biometrik dengan auto-lock saat idle 90 detik.",
          issueType: "Security",
          priority: "Urgent",
          dueDate: "Sep 29",
          status: "Done",
          assignee: sepsuUserId,
        },
        {
          key: "APP-2",
          title: "Redesign Halaman Beranda Dashboard dengan Widget Finansial Interaktif",
          description: "Widget ringkasan saldo mutasi, grafik pengeluaran mingguan, dan quick action transfer favorit.",
          issueType: "Story",
          priority: "High",
          dueDate: "Oct 03",
          status: "In Progress",
          assignee: memberUserIds[4].id,
        },
        {
          key: "APP-3",
          title: "Fitur Split Bill Pintar dengan OCR Struk Pembelian Kamera HP",
          description: "Ekstraksi item makanan dan harga otomatis menggunakan computer vision OCR sebelum dibagi ke kontak.",
          issueType: "Story",
          priority: "Medium",
          dueDate: "Oct 12",
          status: "To Do",
          assignee: memberUserIds[0].id,
        },
        {
          key: "APP-4",
          title: "Bug: Push Notification FCM Delay saat Perangkat dalam Doze Mode",
          description: "Ubah priority payload FCM menjadi 'high' untuk transfer alert dan OTP verification.",
          issueType: "Bug",
          priority: "High",
          dueDate: "Tomorrow",
          status: "Review",
          assignee: memberUserIds[4].id,
        }
      ]
    },
    {
      id: "7a1b2c3d-0004-4000-8000-000000000004",
      title: "Customer Support & Ticketing AI Agent",
      description: "Platform customer support terpusat dengan routing cerdas, live agent chat, integrasi WhatsApp Business API, dan auto-reply berbasis LLM.",
      category: "Client Work",
      status: "Planning",
      members: [
        { userId: sepsuUserId, role: "Owner" },
        { userId: memberUserIds[1].id, role: "Admin" },
      ],
      tasks: [
        {
          key: "CS-1",
          title: "R&D Integrasi RAG Knowledge Base Dokumen FAQ Perusahaan",
          description: "Evaluasi embedding model dan chunking dokumen PDF helpdesk untuk akurasi jawaban bot.",
          issueType: "Task",
          priority: "Medium",
          dueDate: "Oct 15",
          status: "To Do",
          assignee: sepsuUserId,
        },
        {
          key: "CS-2",
          title: "Setup Webhook WhatsApp Cloud API Official Meta",
          description: "Menerima pesan masuk pelanggan dan memproses template pesan terverifikasi.",
          issueType: "Task",
          priority: "High",
          dueDate: "Oct 18",
          status: "To Do",
          assignee: memberUserIds[1].id,
        }
      ]
    },
    {
      id: "7a1b2c3d-0005-4000-8000-000000000005",
      title: "Infrastructure & DevSecOps Platform",
      description: "Modernisasi Kubernetes cluster, zero-trust network access, HashiCorp Vault secrets management, dan automated container scanning.",
      category: "Product & Tech",
      status: "Active",
      members: [
        { userId: sepsuUserId, role: "Owner" },
        { userId: memberUserIds[0].id, role: "Admin" },
      ],
      tasks: [
        {
          key: "INF-1",
          title: "Migrasi Environment Secret dari .env ke HashiCorp Vault Agent",
          description: "Rotasi database credential berkala setiap 30 hari secara dinamis tanpa downtime.",
          issueType: "Security",
          priority: "Urgent",
          dueDate: "Sep 30",
          status: "Done",
          assignee: sepsuUserId,
        },
        {
          key: "INF-2",
          title: "Konfigurasi Zero-downtime Rolling Update di K8s Ingress Controller",
          description: "Penyesuaian readinessProbe, livenessProbe, dan terminationGracePeriodSeconds pada pod backend.",
          issueType: "Improvement",
          priority: "High",
          dueDate: "Oct 04",
          status: "In Progress",
          assignee: memberUserIds[0].id,
        },
        {
          key: "INF-3",
          title: "Setup Automated Trivy Vulnerability Scan pada GitHub Actions Pipeline",
          description: "Block merge jika ditemukan CVE severity Critical atau High pada base image Docker.",
          issueType: "Security",
          priority: "Medium",
          dueDate: "Oct 07",
          status: "Review",
          assignee: memberUserIds[0].id,
        }
      ]
    },
    {
      id: "7a1b2c3d-0006-4000-8000-000000000006",
      title: "Growth Marketing & SEO Automation",
      description: "Automasi penerbitan konten blog teknis, sitemap generator otomatis, monitoring Core Web Vitals, dan kampanye email newsletter berkala.",
      category: "Marketing & Growth",
      status: "Completed",
      members: [
        { userId: sepsuUserId, role: "Owner" },
        { userId: memberUserIds[3].id, role: "Member" },
      ],
      tasks: [
        {
          key: "MKT-1",
          title: "Audit Core Web Vitals (LCP, FID, CLS) dan Optimasi Asset Gambar WebP",
          description: "Meningkatkan skor Lighthouse performance dari 72 menjadi 98 di desktop dan mobile.",
          issueType: "Improvement",
          priority: "High",
          dueDate: "Sep 20",
          status: "Done",
          assignee: memberUserIds[3].id,
        },
        {
          key: "MKT-2",
          title: "Implementasi Dynamic OpenGraph Metadata Generator untuk Social Sharing",
          description: "Generate gambar banner preview otomatis berdasarkan judul artikel blog.",
          issueType: "Task",
          priority: "Low",
          dueDate: "Sep 22",
          status: "Done",
          assignee: sepsuUserId,
        }
      ]
    }
  ];

  // 5. Insert Projects, Project Members, and Tasks into Database
  for (const proj of projectsData) {
    const totalTasks = proj.tasks.length;
    const completedTasks = proj.tasks.filter((t) => t.status === "Done").length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await pool.query(
      `INSERT INTO projects (id, user_id, title, description, category, status, tasks_count, progress)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         status = EXCLUDED.status,
         tasks_count = EXCLUDED.tasks_count,
         progress = EXCLUDED.progress`,
      [proj.id, sepsuUserId, proj.title, proj.description, proj.category, proj.status, totalTasks, progress]
    );

    // Insert Project Members
    for (const mem of proj.members) {
      const pmId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO project_members (id, project_id, user_id, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
        [pmId, proj.id, mem.userId, mem.role]
      );
    }

    // Insert Tasks
    for (const t of proj.tasks) {
      const taskId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO tasks (id, user_id, project_id, assignee_id, task_key, issue_type, title, project_name, priority, due_date, status, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          taskId,
          sepsuUserId,
          proj.id,
          t.assignee,
          t.key,
          t.issueType,
          t.title,
          proj.title,
          t.priority,
          t.dueDate,
          t.status,
          t.description,
        ]
      );

      // Add activity log
      await pool.query(
        `INSERT INTO task_activities (id, task_id, user_id, user_name, action, details)
         VALUES ($1, $2, $3, $4, 'created', 'Task dibuat dan dialokasikan ke sprint aktif')`,
        [crypto.randomUUID(), taskId, sepsuUserId, "Sepsu Dev"]
      );

      if (t.status === "Done") {
        await pool.query(
          `INSERT INTO task_activities (id, task_id, user_id, user_name, action, details)
           VALUES ($1, $2, $3, $4, 'status_changed', 'Status diubah ke Done setelah lolos QA & Code Review')`,
          [crypto.randomUUID(), taskId, sepsuUserId, "Sepsu Dev"]
        );
      }
    }
  }

  console.log("Projects and tasks successfully seeded!");

  // 6. Ensure Privileges for Sepsu Dev
  // User group admin privilege
  const adminGroupRes = await pool.query("SELECT id FROM user_groups WHERE name = 'admin' LIMIT 1");
  if (adminGroupRes.rows.length > 0) {
    const adminGroupId = adminGroupRes.rows[0].id;
    // ensure all master menus can be viewed by admin
    const menusRes = await pool.query("SELECT id FROM master_menus");
    for (const m of menusRes.rows) {
      const privId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO user_privileges (id, group_id, menu_id, can_view)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (group_id, menu_id) DO UPDATE SET can_view = true`,
        [privId, adminGroupId, m.id]
      );
    }
  }

  console.log("All dummy data seeded successfully for sepsu.dev@gmail.com!");
}

seedSepsuDev()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  });
