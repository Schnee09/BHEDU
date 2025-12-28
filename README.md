# 🎓 BH-EDU — School Management System

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

A comprehensive school management system built for **Vietnamese education**, featuring grades, attendance, and student management.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 👥 **User Management** | Students, Teachers, Staff, Admins with role-based access |
| 📝 **Attendance** | Daily tracking with QR check-in support |
| 📊 **Vietnamese Grading** | Oral, 15-min, 1-period, Midterm, Final evaluations |
| 💰 **Finance** | Fee management and payment tracking |
| 📈 **Reports** | Comprehensive analytics and transcripts |

---

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Schnee09/BHEDU.git
cd BH-EDU/web
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

---

## 📁 Project Structure

```
BH-EDU/
├── web/                # Next.js Application
│   ├── app/            # App Router (pages, API routes)
│   │   ├── api/        # 20 API domains
│   │   └── dashboard/  # Dashboard pages
│   ├── components/     # React components
│   ├── lib/            # Services & utilities
│   │   ├── grades/     # Vietnamese grading system
│   │   ├── attendance/ # Attendance domain
│   │   └── supabase/   # Database clients
│   └── hooks/          # Custom React hooks
├── supabase/           # Database migrations
├── scripts/            # Utility scripts
└── docs/               # Documentation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19 |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Language | TypeScript 5.9 |
| Deployment | Vercel |

---

## 📚 Documentation

| Topic | Link |
|-------|------|
| Quick Start | [docs/START_HERE.md](docs/START_HERE.md) |
| Architecture | [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) |
| API Reference | [docs/api/ENDPOINTS.md](docs/api/ENDPOINTS.md) |
| All Docs | [docs/README.md](docs/README.md) |

---

## 🔧 Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server only!
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

*Built with ❤️ for Vietnamese Education | December 2025*
