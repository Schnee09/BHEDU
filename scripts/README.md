# Database Seeding Script

This script populates your database with sample data for testing.

## What It Creates

- **5 Classes** (Mathematics, English, Science, History, PE)
- **~40 Enrollments** (students enrolled in classes)
- **20 Assignment Categories** (4 per class: Homework, Quizzes, Midterm, Final)
- **~50 Assignments** (various types across all classes)
- **~500 Grades** (grades for all assignments)
- **~800 Attendance Records** (30 days of attendance for all enrollments)

## Prerequisites

Make sure you have these environment variables set in your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## How to Run

From the root directory of the project:

```bash
npm run seed
```

Or directly:

```bash
node scripts/seed-data.js
```

## What Happens

1. ✅ Creates 5 classes with existing teachers
2. ✅ Enrolls your 9 existing students in these classes
3. ✅ Creates assignment categories for each class (Homework, Quizzes, Exams)
4. ✅ Creates ~10 assignments per class
5. ✅ Generates random grades (60-100) for each student
6. ✅ Creates 30 days of attendance records with realistic patterns

## After Seeding

The script will output sample IDs you can use to test your pages:

- Student Detail: `/dashboard/students/[id]`
- Class Detail: `/dashboard/admin/classes/[id]`
- Attendance Detail: `/dashboard/admin/attendance/[id]`
- Assignment Detail: `/dashboard/admin/assignments/[id]`

## Notes

- The script uses your existing student and teacher IDs
- Attendance records are created for the past 30 days (excluding weekends)
- Grades are randomly distributed between 60-100
- Most attendance records are "present" (weighted distribution)
- All enrollments are set to "active" status

## Safety

- Uses service role key to bypass RLS
- Only creates new data, doesn't modify existing records
- Can be run multiple times (will create duplicate data)

## Troubleshooting

**Error: Missing environment variables**
- Make sure `.env` file exists in root with correct variables

**Error: Failed to fetch data**
- Check your Supabase connection
- Verify service role key has admin permissions

**Error: Foreign key violation**
- The script expects certain students and teachers to exist
- Check that the IDs in `EXISTING_IDS` match your database
