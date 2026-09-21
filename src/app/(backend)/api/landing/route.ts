import { NextResponse } from "next/server";

export interface LandingData {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    cta: string;
    mockup: {
      url: string;
      boardTitle: string;
      workspace: string;
      progress: number;
    };
  };
  features: Array<{
    title: string;
    desc: string;
    category: string;
  }>;
  benefits: Array<{
    title: string;
    desc: string;
  }>;
  testimonials: Array<{
    text: string;
    author: string;
    role: string;
    avatar: string;
  }>;
  faqs: Array<{
    q: string;
    a: string;
  }>;
}

const landingData: LandingData = {
  hero: {
    badge: "100% GRATIS SELAMANYA",
    title: "Kelola Tugas Lebih Rapi",
    subtitle: "Capai Target Lebih Cepat",
    description: "Platform manajemen tugas dan proyek modern untuk pengembang, desainer, dan tim kreatif. Tanpa batasan proyek, tanpa iklan, dan 100% gratis selamanya.",
    cta: "Mulai Daftar Gratis",
    mockup: {
      url: "numpux.app/dashboard",
      boardTitle: "Proyek Landing Page",
      workspace: "Workspace Utama",
      progress: 78,
    },
  },
  features: [
    {
      title: "Papan Kanban",
      desc: "Kelola alur kerja secara visual menggunakan fitur drag-and-drop papan Kanban yang intuitif.",
      category: "Workflow",
    },
    {
      title: "Kalender Tim",
      desc: "Petakan tenggat waktu tugas, rencana rilis, dan milestone mingguan dalam kalender rapi.",
      category: "Schedule",
    },
    {
      title: "Kolaborasi Instan",
      desc: "Undang rekan kerja tanpa batasan, delegasikan tugas harian, dan berdiskusi secara real-time.",
      category: "Team",
    },
    {
      title: "Analitik Progres",
      desc: "Pantau persentase penyelesaian tugas dan performa sprint mingguan dengan grafik ringkas.",
      category: "Analytics",
    },
  ],
  benefits: [
    {
      title: "Fokus & Minimalis",
      desc: "Antarmuka bersih bebas gangguan iklan. Fokus sepenuhnya pada penyelesaian tugas harian Anda tanpa fitur yang membingungkan.",
    },
    {
      title: "100% Gratis Selamanya",
      desc: "Semua fitur utama, mulai dari papan Kanban hingga kalender tim, dapat Anda nikmati gratis tanpa biaya berlangganan bulanan.",
    },
    {
      title: "Privasi & Keamanan",
      desc: "Data Anda disimpan dengan aman menggunakan enkripsi HTTPS standar industri untuk memastikan proyek Anda tetap rahasia.",
    },
  ],
  testimonials: [
    {
      text: "Sangat menyukai papan Kanban Numpux yang bersih. Membuat saya bisa fokus mendesain tanpa terganggu oleh fitur-fitur kompleks yang tidak perlu.",
      author: "Kristin",
      role: "UI Designer",
      avatar: "🎨",
    },
    {
      text: "Sebagai developer, kesederhanaan adalah segalanya. Numpux sangat cepat, responsif, dan yang terpenting: 100% gratis tanpa batasan proyek.",
      author: "Budi",
      role: "Software Engineer",
      avatar: "💻",
    },
    {
      text: "Kalender proyeknya sangat membantu saya menyusun jadwal kampanye iklan mingguan. Kolaborasi tim juga berjalan mulus dan instan.",
      author: "Siti",
      role: "Digital Marketer",
      avatar: "📈",
    },
  ],
  faqs: [
    {
      q: "Apakah Numpux benar-benar gratis?",
      a: "Ya, Numpux 100% gratis digunakan selamanya. Anda dapat membuat tugas, mengelola proyek, dan berkolaborasi tanpa dipungut biaya.",
    },
    {
      q: "Bisa digunakan untuk kolaborasi tim?",
      a: "Tentu saja. Anda dapat mengundang rekan kerja atau anggota tim Anda ke dalam workspace proyek untuk memantau pengerjaan tugas secara real-time.",
    },
    {
      q: "Bagaimana Numpux menjaga keamanan data saya?",
      a: "Semua data proyek dan tugas Anda dienkripsi secara aman menggunakan protokol HTTPS standar industri dan disimpan di server cloud yang andal.",
    },
    {
      q: "Apakah Numpux responsif di perangkat mobile?",
      a: "Ya, Numpux dirancang dengan antarmuka yang sangat responsif, sehingga Anda bisa mengelola tugas Anda dengan nyaman melalui smartphone, tablet, maupun komputer.",
    },
  ],
};

export async function GET() {
  return NextResponse.json({
    status: "success",
    data: landingData,
  });
}
