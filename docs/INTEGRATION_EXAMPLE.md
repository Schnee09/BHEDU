# Full-Stack Integration Example

This example demonstrates a complete feature implementation from database to UI.

## Feature: Student Enrollment Management

### 1. Database Schema (Already in Supabase)

```sql
-- Students are in profiles table with role='student'
-- Enrollments table tracks class enrollment
-- RLS policies ensure proper access control
```

### 2. Backend Service (`lib/services/studentService.ts`)

```typescript
import { StudentService } from '@/lib/services/studentService';

// Enroll student in a class
const enrollment = await StudentService.enrollStudent(
  'student-uuid',
  'class-uuid'
);

// Get student with all enrollments
const student = await StudentService.getStudentById('student-uuid');
console.log(student.enrollments);
```

### 3. API Route (`app/api/v1/students/[id]/enrollments/route.ts`)

```typescript
import { NextRequest } from 'next/server';
import { withAuth, withTeacher } from '@/lib/api/middleware';
import { success, created } from '@/lib/api/responses';
import { handleApiError } from '@/lib/api/errors';
import { withLogging } from '@/lib/api/logging';
import { uuidSchema } from '@/lib/api/schemas';
import { StudentService } from '@/lib/services/studentService';
import { z } from 'zod';

const enrollSchema = z.object({
  class_id: uuidSchema,
});

/**
 * GET /api/v1/students/[id]/enrollments
 * Get student's enrollments
 */
export const GET = withLogging(
  withAuth(async (request: NextRequest, context) => {
    try {
      const params = await context.params;
      const id = uuidSchema.parse(params?.id);

      const student = await StudentService.getStudentById(id);

      return success(student.enrollments);
    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * POST /api/v1/students/[id]/enrollments
 * Enroll student in a class (teacher/admin only)
 */
export const POST = withLogging(
  withTeacher(async (request: NextRequest, context) => {
    try {
      const params = await context.params;
      const studentId = uuidSchema.parse(params?.id);

      const body = await request.json();
      const { class_id } = enrollSchema.parse(body);

      const enrollment = await StudentService.enrollStudent(
        studentId,
        class_id
      );

      return created(enrollment, 'Student enrolled successfully');
    } catch (error) {
      return handleApiError(error);
    }
  })
);
```

### 4. Client-Side API Call (`lib/api/client.ts`)

```typescript
// Add to existing client.ts or create new file

export interface EnrollmentRequest {
  class_id: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_date: string;
  status: string;
}

export async function getStudentEnrollments(
  studentId: string
): Promise<Enrollment[]> {
  const response = await fetch(`/api/v1/students/${studentId}/enrollments`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch enrollments');
  }

  const data = await response.json();
  return data.data;
}

export async function enrollStudent(
  studentId: string,
  request: EnrollmentRequest
): Promise<Enrollment> {
  const response = await fetch(`/api/v1/students/${studentId}/enrollments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to enroll student');
  }

  const data = await response.json();
  return data.data;
}
```

### 5. React Component (`app/dashboard/students/[id]/enrollments/page.tsx`)

```typescript
'use client';

import { use, useEffect, useState } from 'react';
import { getStudentEnrollments, enrollStudent } from '@/lib/api/client';
import type { Enrollment } from '@/lib/api/client';

interface Props {
  params: Promise<{ id: string }>;
}

export default function StudentEnrollmentsPage({ params }: Props) {
  const { id } = use(params);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    loadEnrollments();
  }, [id]);

  async function loadEnrollments() {
    try {
      setLoading(true);
      const data = await getStudentEnrollments(id);
      setEnrollments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      setEnrolling(true);
      await enrollStudent(id, { class_id: selectedClass });
      await loadEnrollments(); // Refresh list
      setSelectedClass('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student Enrollments</h1>

      {/* Enrollment Form */}
      <form onSubmit={handleEnroll} className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-4">Enroll in New Class</h2>
        <div className="flex gap-4">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex-1 p-2 border rounded"
            required
          >
            <option value="">Select a class...</option>
            {/* Add your classes here */}
          </select>
          <button
            type="submit"
            disabled={enrolling || !selectedClass}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {enrolling ? 'Enrolling...' : 'Enroll'}
          </button>
        </div>
      </form>

      {/* Enrollments List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Current Enrollments</h2>
        {enrollments.length === 0 ? (
          <p className="text-gray-500">No enrollments yet</p>
        ) : (
          <div className="grid gap-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="p-4 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Class ID: {enrollment.class_id}</p>
                    <p className="text-sm text-gray-600">
                      Enrolled: {enrollment.enrollment_date}
                    </p>
                    <span className={`text-sm px-2 py-1 rounded ${
                      enrollment.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {enrollment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6. Testing the Feature

#### Unit Tests

```typescript
// lib/services/__tests__/studentService.test.ts
describe('StudentService.enrollStudent', () => {
  it('should enroll student in class', async () => {
    const enrollment = await StudentService.enrollStudent(
      'student-id',
      'class-id'
    );

    expect(enrollment.student_id).toBe('student-id');
    expect(enrollment.class_id).toBe('class-id');
    expect(enrollment.status).toBe('active');
  });

  it('should prevent duplicate enrollment', async () => {
    await expect(
      StudentService.enrollStudent('student-id', 'same-class-id')
    ).rejects.toThrow('already enrolled');
  });
});
```

#### Integration Tests

```typescript
// __tests__/integration/enrollment.test.ts
describe('Enrollment API', () => {
  it('should complete enrollment flow', async () => {
    // 1. Create student
    const student = await StudentService.createStudent({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      date_of_birth: '2000-01-01',
    });

    // 2. Enroll in class
    const enrollment = await StudentService.enrollStudent(
      student.id,
      'class-id'
    );

    // 3. Verify enrollment
    const studentData = await StudentService.getStudentById(student.id);
    expect(studentData.enrollments).toHaveLength(1);
    expect(studentData.enrollments[0].class_id).toBe('class-id');
  });
});
```

#### Manual Testing

```bash
# 1. Get student enrollments
curl http://localhost:3000/api/v1/students/STUDENT_ID/enrollments \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# 2. Enroll student
curl -X POST http://localhost:3000/api/v1/students/STUDENT_ID/enrollments \
  -H "Cookie: sb-access-token=YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"class_id":"CLASS_UUID"}'
```

### 7. Logging Output

With logging middleware enabled:

```
[API Request] {
  requestId: 'req_1700000000_abc123',
  method: 'POST',
  url: 'http://localhost:3000/api/v1/students/123/enrollments',
  userId: 'teacher-uuid'
}

[API Response] {
  requestId: 'req_1700000000_abc123',
  method: 'POST',
  url: 'http://localhost:3000/api/v1/students/123/enrollments',
  status: 201,
  duration: '45ms',
  userId: 'teacher-uuid'
}
```

## Key Patterns Demonstrated

### 1. **Layered Architecture**
- Database → Service → API → Client → UI
- Each layer has clear responsibilities
- Easy to test each layer independently

### 2. **Type Safety**
- TypeScript interfaces throughout
- Zod validation at API boundary
- Type-safe client functions

### 3. **Error Handling**
- Service layer throws custom errors
- API layer catches and formats responses
- Client handles errors gracefully
- UI displays user-friendly messages

### 4. **Security**
- Authentication required (withAuth)
- Role-based authorization (withTeacher)
- Input validation (Zod schemas)
- RLS at database level

### 5. **Developer Experience**
- Logging for debugging
- Type hints in IDE
- Reusable components
- Clear error messages

### 6. **Testing**
- Unit tests for services
- Integration tests for flows
- Manual testing with curl

## Extending This Pattern

To add a new feature:

1. **Define schema** in `lib/api/schemas.ts`
2. **Add service methods** in `lib/services/`
3. **Create API route** in `app/api/v1/`
4. **Add client function** in `lib/api/client.ts`
5. **Build UI component** in `app/dashboard/`
6. **Write tests** in `__tests__/`

This pattern scales to any feature in your application!
