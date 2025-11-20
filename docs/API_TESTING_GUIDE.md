# API Testing Guide

Quick reference for testing all student API endpoints.

## 🔧 Prerequisites

1. **Get Authentication Token**
   - Login to your app
   - Open browser DevTools > Application > Cookies
   - Find Supabase auth token, or use the access_token from login response

2. **Set Environment**
   ```bash
   # Local development
   API_BASE_URL=http://localhost:3000

   # Production
   API_BASE_URL=https://your-domain.com
   ```

## 📝 Test Scripts

### Using cURL

#### 1. Health Check (No Auth Required)

```bash
curl http://localhost:3000/api/health
```

Expected: `200 OK` with health status

#### 2. Create Student

```bash
curl -X POST http://localhost:3000/api/v1/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "teststu dent@example.com",
    "password": "SecurePassword123!",
    "firstName": "Test",
    "lastName": "Student",
    "dateOfBirth": "2005-06-15",
    "phoneNumber": "+1234567890",
    "address": "123 Test Street",
    "parentContact": "parent@example.com"
  }'
```

Expected: `201 Created` with student data

#### 3. List Students

```bash
curl http://localhost:3000/api/v1/students \
  -H "Authorization: Bearer YOUR_TOKEN"
```

With pagination:
```bash
curl "http://localhost:3000/api/v1/students?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

With search:
```bash
curl "http://localhost:3000/api/v1/students?search=test" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `200 OK` with student list and pagination info

#### 4. Get Student by ID

```bash
curl http://localhost:3000/api/v1/students/STUDENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `200 OK` with student data including enrollments

#### 5. Update Student

```bash
curl -X PATCH http://localhost:3000/api/v1/students/STUDENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phoneNumber": "+1987654321",
    "address": "456 Updated Avenue"
  }'
```

Expected: `200 OK` with updated student data

#### 6. Enroll Student

```bash
curl -X POST http://localhost:3000/api/v1/students/STUDENT_ID/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "classId": "CLASS_UUID"
  }'
```

Expected: `201 Created` with enrollment data

#### 7. Get Student Grades

```bash
curl http://localhost:3000/api/v1/students/STUDENT_ID/grades \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `200 OK` with grades array

#### 8. Get Student Attendance

```bash
curl http://localhost:3000/api/v1/students/STUDENT_ID/attendance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `200 OK` with attendance records

#### 9. Unenroll Student

```bash
curl -X DELETE http://localhost:3000/api/v1/students/STUDENT_ID/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "classId": "CLASS_UUID"
  }'
```

Expected: `204 No Content`

#### 10. Delete Student

```bash
curl -X DELETE http://localhost:3000/api/v1/students/STUDENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `204 No Content`

⚠️ **Note**: Will fail if student has active enrollments

---

### Using JavaScript/Fetch

#### Setup

```javascript
const API_BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'your-auth-token-here';

async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.status === 204 ? null : response.json();
}
```

#### 1. Create Student

```javascript
const newStudent = await apiCall('/api/v1/students', {
  method: 'POST',
  body: JSON.stringify({
    email: 'teststudent@example.com',
    password: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'Student',
    dateOfBirth: '2005-06-15',
    phoneNumber: '+1234567890',
    address: '123 Test Street',
    parentContact: 'parent@example.com',
  }),
});

console.log('Created student:', newStudent);
const studentId = newStudent.data.id;
```

#### 2. List Students

```javascript
const students = await apiCall('/api/v1/students?page=1&pageSize=10');
console.log('Students:', students.data);
console.log('Pagination:', students.pagination);
```

#### 3. Get Student

```javascript
const student = await apiCall(`/api/v1/students/${studentId}`);
console.log('Student:', student.data);
console.log('Enrollments:', student.data.enrollments);
```

#### 4. Update Student

```javascript
const updated = await apiCall(`/api/v1/students/${studentId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    phoneNumber: '+1987654321',
    address: '456 Updated Ave',
  }),
});

console.log('Updated:', updated.data);
```

#### 5. Enroll Student

```javascript
const classId = 'your-class-uuid';

const enrollment = await apiCall(`/api/v1/students/${studentId}/enroll`, {
  method: 'POST',
  body: JSON.stringify({ classId }),
});

console.log('Enrolled:', enrollment.data);
```

#### 6. Get Grades

```javascript
const grades = await apiCall(`/api/v1/students/${studentId}/grades`);
console.log('Grades:', grades.data);
```

#### 7. Get Attendance

```javascript
const attendance = await apiCall(`/api/v1/students/${studentId}/attendance`);
console.log('Attendance:', attendance.data);
```

#### 8. Unenroll

```javascript
await apiCall(`/api/v1/students/${studentId}/enroll`, {
  method: 'DELETE',
  body: JSON.stringify({ classId }),
});

console.log('Unenrolled successfully');
```

#### 9. Delete Student

```javascript
await apiCall(`/api/v1/students/${studentId}`, {
  method: 'DELETE',
});

console.log('Deleted successfully');
```

---

### Using the API Client

If you're in a Next.js component:

```typescript
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollStudent,
  unenrollStudent,
  getStudentGrades,
  getStudentAttendance,
} from '@/lib/api/client';

// Example usage in a React component
async function testAllOperations() {
  try {
    // 1. Create student
    const newStudent = await createStudent({
      email: 'teststudent@example.com',
      password: 'SecurePassword123!',
      firstName: 'Test',
      lastName: 'Student',
      dateOfBirth: '2005-06-15',
      phoneNumber: '+1234567890',
      address: '123 Test Street',
      parentContact: 'parent@example.com',
    });
    console.log('✅ Created:', newStudent);
    const studentId = newStudent.id;

    // 2. List students
    const list = await getStudents({ page: 1, pageSize: 10 });
    console.log('✅ Listed:', list.data.length, 'students');

    // 3. Search students
    const searchResult = await getStudents({ search: 'test' });
    console.log('✅ Search found:', searchResult.data.length, 'students');

    // 4. Get student by ID
    const student = await getStudentById(studentId);
    console.log('✅ Got student:', student);

    // 5. Update student
    const updated = await updateStudent(studentId, {
      phoneNumber: '+1987654321',
    });
    console.log('✅ Updated:', updated);

    // 6. Enroll student
    const classId = 'your-class-uuid';
    const enrollment = await enrollStudent(studentId, classId);
    console.log('✅ Enrolled:', enrollment);

    // 7. Get grades
    const grades = await getStudentGrades(studentId);
    console.log('✅ Grades:', grades);

    // 8. Get attendance
    const attendance = await getStudentAttendance(studentId);
    console.log('✅ Attendance:', attendance);

    // 9. Unenroll
    await unenrollStudent(studentId, classId);
    console.log('✅ Unenrolled');

    // 10. Delete student
    await deleteStudent(studentId);
    console.log('✅ Deleted');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
```

---

## 🧪 Automated Test Script

Save this as `test-student-api.js`:

```javascript
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('❌ AUTH_TOKEN environment variable is required');
  process.exit(1);
}

async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      ...options.headers,
    },
  });

  const data = response.status === 204 ? null : await response.json();

  return { status: response.status, data };
}

async function runTests() {
  console.log('🧪 Starting API tests...\n');

  let studentId;
  let classId = process.env.TEST_CLASS_ID;

  try {
    // Test 1: Create student
    console.log('1️⃣  Creating student...');
    const createResult = await apiCall('/api/v1/students', {
      method: 'POST',
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'Student',
        dateOfBirth: '2005-06-15',
      }),
    });
    
    if (createResult.status === 201) {
      studentId = createResult.data.data.id;
      console.log('✅ Student created:', studentId);
    } else {
      throw new Error(`Create failed: ${createResult.status}`);
    }

    // Test 2: List students
    console.log('\n2️⃣  Listing students...');
    const listResult = await apiCall('/api/v1/students?page=1&pageSize=10');
    if (listResult.status === 200) {
      console.log(`✅ Found ${listResult.data.data.length} students`);
    }

    // Test 3: Get student by ID
    console.log('\n3️⃣  Getting student by ID...');
    const getResult = await apiCall(`/api/v1/students/${studentId}`);
    if (getResult.status === 200) {
      console.log('✅ Got student:', getResult.data.data.email);
    }

    // Test 4: Update student
    console.log('\n4️⃣  Updating student...');
    const updateResult = await apiCall(`/api/v1/students/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        phoneNumber: '+1234567890',
      }),
    });
    if (updateResult.status === 200) {
      console.log('✅ Student updated');
    }

    // Test 5: Enroll student (if class ID provided)
    if (classId) {
      console.log('\n5️⃣  Enrolling student...');
      const enrollResult = await apiCall(`/api/v1/students/${studentId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ classId }),
      });
      if (enrollResult.status === 201) {
        console.log('✅ Student enrolled');
      }

      // Test 6: Get grades
      console.log('\n6️⃣  Getting grades...');
      const gradesResult = await apiCall(`/api/v1/students/${studentId}/grades`);
      if (gradesResult.status === 200) {
        console.log(`✅ Found ${gradesResult.data.data.length} grades`);
      }

      // Test 7: Get attendance
      console.log('\n7️⃣  Getting attendance...');
      const attendanceResult = await apiCall(`/api/v1/students/${studentId}/attendance`);
      if (attendanceResult.status === 200) {
        console.log(`✅ Found ${attendanceResult.data.data.length} attendance records`);
      }

      // Test 8: Unenroll
      console.log('\n8️⃣  Unenrolling student...');
      const unenrollResult = await apiCall(`/api/v1/students/${studentId}/enroll`, {
        method: 'DELETE',
        body: JSON.stringify({ classId }),
      });
      if (unenrollResult.status === 204) {
        console.log('✅ Student unenrolled');
      }
    }

    // Test 9: Delete student
    console.log('\n9️⃣  Deleting student...');
    const deleteResult = await apiCall(`/api/v1/students/${studentId}`, {
      method: 'DELETE',
    });
    if (deleteResult.status === 204) {
      console.log('✅ Student deleted');
    }

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Cleanup: try to delete the student if it was created
    if (studentId) {
      console.log('\n🧹 Cleaning up...');
      try {
        await apiCall(`/api/v1/students/${studentId}`, { method: 'DELETE' });
        console.log('✅ Cleanup successful');
      } catch (cleanupError) {
        console.error('❌ Cleanup failed:', cleanupError.message);
      }
    }
    
    process.exit(1);
  }
}

runTests();
```

Run the test:
```bash
AUTH_TOKEN=your-token node test-student-api.js

# With class ID for enrollment tests
AUTH_TOKEN=your-token TEST_CLASS_ID=class-uuid node test-student-api.js
```

---

## ✅ Expected Results

### Success Responses

| Endpoint | Status | Response |
|----------|--------|----------|
| GET /students | 200 | `{ success: true, data: [...], pagination: {...} }` |
| POST /students | 201 | `{ success: true, data: {...}, message: "..." }` |
| GET /students/{id} | 200 | `{ success: true, data: {...} }` |
| PATCH /students/{id} | 200 | `{ success: true, data: {...}, message: "..." }` |
| DELETE /students/{id} | 204 | (no content) |
| POST /students/{id}/enroll | 201 | `{ success: true, data: {...}, message: "..." }` |
| DELETE /students/{id}/enroll | 204 | (no content) |
| GET /students/{id}/grades | 200 | `{ success: true, data: [...] }` |
| GET /students/{id}/attendance | 200 | `{ success: true, data: [...] }` |

### Error Responses

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Student not found |
| 409 | Conflict | Email already exists |
| 500 | Internal Server Error | Server error |

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Check if auth token is valid
- Token might be expired, login again
- Ensure token is in Authorization header

### 404 Not Found
- Verify student ID is correct UUID
- Student might have been deleted
- Check database directly

### 409 Conflict
- Email already exists
- Try with different email
- Check existing students in database

### 500 Internal Server Error
- Check server logs
- Verify database connection
- Check Supabase project status

---

**Happy Testing!** 🚀
