# BH-EDU Flutter Mobile App

A Flutter mobile application for the BH-EDU School Management System.

## Features

- **Multi-role support**: Admin, Staff, Teacher, Student
- **Attendance tracking**: View and mark attendance with QR code check-in
- **Vietnamese grading**: Miệng, 15 phút, 1 tiết, Giữa kỳ, Cuối kỳ
- **Class management**: View classes, students, and schedules
- **Real-time sync**: Direct Supabase integration

## Getting Started

### Prerequisites

- Flutter SDK 3.10+
- Dart SDK 3.0+
- Supabase project (same as web app)

### Setup

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Install dependencies:
   ```bash
   flutter pub get
   ```

4. Run the app:
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
├── main.dart              # App entry point
├── app/
│   ├── app.dart           # MaterialApp configuration
│   └── routes.dart        # GoRouter navigation
├── config/
│   ├── supabase_config.dart
│   └── theme.dart         # Golden Amber theme
├── core/
│   └── constants/         # Enums and constants
├── data/
│   ├── models/            # Data models
│   └── repositories/      # Data access layer
├── features/
│   ├── auth/              # Login/logout
│   ├── dashboard/         # Home screen
│   ├── attendance/        # Attendance tracking
│   ├── grades/            # Grade viewing/entry
│   ├── students/          # Student management
│   └── classes/           # Class management
└── shared/
    ├── providers/         # Riverpod providers
    └── widgets/           # Reusable widgets
```

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | test123 |
| Staff | staff@test.com | test123 |
| Teacher | teacher@test.com | test123 |
| Student | student@test.com | test123 |

## Tech Stack

- **Flutter**: UI framework
- **Riverpod**: State management
- **GoRouter**: Navigation
- **Supabase**: Backend (auth, database)
- **Google Fonts**: Typography
