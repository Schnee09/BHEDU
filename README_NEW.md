# BH-EDU — School Management System

> A modern, comprehensive school management system built with Next.js, Supabase, and TypeScript.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

- 👥 **User Management** - Admin, teacher, and student roles with role-based access control
- 📚 **Academic Management** - Classes, subjects, lessons, and assignments
- 📊 **Grading System** - Vietnamese education system compatible grading (0-10 scale)
- 📄 **Học bạ (Transcript)** - Vietnamese student transcript generation with QR codes
- 💰 **Financial Management** - Tuition, payments, invoices, and financial reports
- 📅 **Attendance Tracking** - Student attendance management
- 📈 **Progress Reports** - Student academic progress tracking
- 🔐 **Secure Authentication** - Row-level security with Supabase Auth
- 🎨 **Modern UI** - Clean, responsive interface with Tailwind CSS and Swiss Modernism design
- 📱 **Mobile Responsive** - Works seamlessly on all devices

## 🚀 Quick Start

**New to the project?** See [START_HERE.md](START_HERE.md) for a 3-step quick setup!

### Prerequisites

- Node.js 20+ 
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Schnee09/BHEDU.git
   cd BH-EDU
   ```

2. **Install dependencies**
   ```bash
   cd web
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Setup database**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project
   - Open SQL Editor
   - Run the migration file from `supabase/migrations/`

5. **Run development server**
   ```bash
   pnpm dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
BH-EDU/
├── web/                    # Next.js application
│   ├── app/               # App router (Next.js 16)
│   │   ├── api/          # API routes
│   │   ├── dashboard/    # Dashboard pages
│   │   └── (auth)/       # Authentication pages
│   ├── components/       # React components
│   │   └── ui/          # Base UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   │   ├── api/         # API client
│   │   ├── auth/        # Authentication utilities
│   │   └── supabase/    # Supabase client
│   ├── providers/       # React context providers
│   ├── public/          # Static assets
│   └── styles/          # Global styles
├── supabase/            # Supabase configuration
│   └── migrations/      # Database migrations
├── scripts/             # Utility scripts
├── docs/               # Documentation
└── archive/            # Historical files

```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Swiss Modernism 2.0 design system
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security
- **PDF Generation**: @react-pdf/renderer
- **State Management**: React Query (TanStack Query)
- **Icons**: Heroicons 2.0
- **Deployment**: Vercel

### Key Features

- **No separate backend server** - All APIs are Next.js API routes
- **Type-safe** - Full TypeScript coverage
- **Secure** - Row-level security (RLS) on all database tables
- **Modern** - Uses latest Next.js 16 features and React 19
- **Fast** - Optimized with React Query caching
- **Accessible** - WCAG compliant UI components

## 📖 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- **[Quick Start Guide](START_HERE.md)** - Get up and running in 5 minutes
- **[Architecture Documentation](docs/architecture/)** - System design and patterns
- **[API Documentation](docs/api/)** - API endpoints and usage
- **[Database Schema](docs/database/)** - Database structure and migrations
- **[Authentication Guide](docs/auth/)** - Auth implementation and security
- **[Deployment Guide](docs/deployment/)** - Production deployment steps
- **[Developer Guides](docs/guides/)** - Development best practices

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## 🚀 Deployment

The application is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy!

See [Deployment Guide](docs/deployment/DEPLOYMENT_CHECKLIST.md) for detailed instructions.

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- **Service role key** never exposed to client
- **Environment variables** properly configured
- **Rate limiting** on sensitive endpoints
- **Audit logging** for admin actions

See [Auth Architecture](docs/auth/AUTH_ARCHITECTURE.md) for security details.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Heroicons](https://heroicons.com/)

## 📞 Support

- 📧 Email: [Your Email]
- 📝 Issues: [GitHub Issues](https://github.com/Schnee09/BHEDU/issues)
- 📚 Documentation: [docs/](docs/)

---

**Made with ❤️ by the BH-EDU Team**
