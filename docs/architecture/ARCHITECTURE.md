# BH-EDU Comprehensive Architecture Reference

> **Tài liệu Kiến trúc Chi tiết - Phiên bản 5.0**\
> _Mục đích: Tài liệu tham chiếu toàn diện để đảm bảo code không lỗi và không
> thiếu sót._

**CẬP NHẬT 2026-01-28**: Hoàn thành Migration tất cả Services sang
Instance-based pattern

---

## Mục lục

1. [Tổng quan Kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Database Schema](#2-database-schema)
3. [API Routes Chi tiết](#3-api-routes-chi-tiết)
4. [Services Layer](#4-services-layer)
5. [Repositories Layer](#5-repositories-layer)
6. [Zod Schemas](#6-zod-schemas)
7. [Custom Hooks](#7-custom-hooks)
8. [Hệ thống Tính điểm Việt Nam](#8-hệ-thống-tính-điểm-việt-nam)
9. [Business Rules & Constraints](#9-business-rules--constraints)
10. [Error Handling](#10-error-handling)
11. [Checklist Phát triển](#11-checklist-phát-triển)

---

## Quick Reference - Patterns Mới

### API Handler Factory (`lib/api/apiHandler.ts`)

```typescript
// CÁCH MỚI - Giảm 60% boilerplate
export const PUT = createApiHandler({
    permission: "classes.manage",
    bodySchema: updateClassSchema,
}, async ({ body, params, user }) => {
    const updated = await ClassService.updateClass(params.id, body);
    return apiSuccess(updated);
});
```

### Caching Layer (`lib/cache/cache.ts`)

```typescript
// Cache dữ liệu ít thay đổi
const subjects = await cached(
    CACHE_KEYS.SUBJECTS_ALL,
    () => SubjectService.getSubjects(),
    { ttl: CACHE_TTL.MEDIUM },
);

// Invalidate khi data thay đổi
invalidateCache("subjects:");
```

### Instance-based Service Pattern

```typescript
export class ExampleService {
    private supabase: SupabaseClient;

    constructor(supabase?: SupabaseClient) {
        this.supabase = supabase || createServiceClient();
    }

    async doSomething() {/* ... */}

    // Static wrapper for backward compatibility
    static async doSomething() {
        return exampleService.doSomething();
    }
}

export const exampleService = new ExampleService();
```

---

## 1. Tổng quan Kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────┐│
│  │   Pages     │ │ Components  │ │  Custom Hooks               ││
│  │ (app/)      │ │(components/)│ │  (hooks/)                   ││
│  └─────────────┘ └─────────────┘ └─────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                        API LAYER                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │   API Routes (app/api/) - 140+ endpoints                    ││
│  │   + Zod Validation + Auth Check + Error Handling            ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                  BUSINESS LOGIC LAYER                           │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │ Services (6)     │ │ Schemas (40+)    │ │ Domain Logic     │ │
│  │ lib/services/    │ │ lib/schemas/     │ │ lib/grades/      │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │   Repositories (5) - SOLID Pattern                          ││
│  │   lib/repositories/                                         ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │   Supabase (PostgreSQL) + Row Level Security                ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

### Core Tables

| Table            | Mô tả                | Primary Key | Foreign Keys                               |
| ---------------- | -------------------- | ----------- | ------------------------------------------ |
| `profiles`       | Thông tin người dùng | `id` (UUID) | `id` → auth.users                          |
| `classes`        | Lớp học              | `id`        | teacher_id → profiles, course_id → courses |
| `courses`        | Khóa học             | `id`        | subject_id → subjects                      |
| `subjects`       | Môn học              | `id`        | -                                          |
| `enrollments`    | Đăng ký học          | `id`        | student_id → profiles, class_id → classes  |
| `attendance`     | Điểm danh            | `id`        | student_id → profiles, class_id → classes  |
| `grades`         | Điểm số              | `id`        | student_id → profiles, class_id → classes  |
| `assignments`    | Bài tập/Bài kiểm tra | `id`        | class_id → classes                         |
| `academic_years` | Năm học              | `id`        | -                                          |
| `semesters`      | Học kỳ               | `id`        | academic_year_id → academic_years          |

### Finance Tables

| Table                  | Mô tả                        |
| ---------------------- | ---------------------------- |
| `invoices`             | Hóa đơn học phí              |
| `payment_transactions` | Giao dịch thanh toán         |
| `fee_types`            | Loại phí                     |
| `student_accounts`     | Tài khoản tài chính học sinh |
| `tuition_config`       | Cấu hình học phí             |

### Key Columns in `profiles`

| Column                    | Type  | Description                             |
| ------------------------- | ----- | --------------------------------------- |
| `id`                      | UUID  | PK, links to auth.users                 |
| `email`                   | TEXT  | unique                                  |
| `first_name`, `last_name` | TEXT  | -                                       |
| `full_name`               | TEXT  | computed                                |
| `role`                    | ENUM  | 'admin', 'teacher', 'student', 'parent' |
| `phone`, `address`        | TEXT? | optional                                |
| `date_of_birth`           | DATE? | optional                                |

### Key Columns in `classes`

| Column              | Type    | Default             |
| ------------------- | ------- | ------------------- |
| `id`                | UUID    | PK                  |
| `name`              | TEXT    | -                   |
| `teacher_id`        | UUID    | FK → profiles       |
| `course_id`         | UUID?   | FK → courses        |
| `academic_year_id`  | UUID    | FK                  |
| `max_capacity`      | INTEGER | 12                  |
| `sessions_per_week` | INTEGER | 2                   |
| `class_type`        | ENUM    | 'group', 'tutoring' |

### Key Columns in `grades`

| Column        | Type         | Description                                  |
| ------------- | ------------ | -------------------------------------------- |
| `id`          | UUID         | PK                                           |
| `student_id`  | UUID         | FK                                           |
| `score`       | DECIMAL(5,2) | Thang điểm 10                                |
| `grade_type`  | TEXT         | 'oral', '15min', '45min', 'midterm', 'final' |
| `coefficient` | INTEGER      | Hệ số: 1, 2, 3                               |

---

## 3. API Routes Chi tiết

### Authentication (`/api/auth/`)

| Method | Endpoint                    | Mô tả                  | Auth |
| ------ | --------------------------- | ---------------------- | ---- |
| POST   | `/api/auth/login`           | Đăng nhập              | No   |
| POST   | `/api/auth/signup`          | Đăng ký                | No   |
| POST   | `/api/auth/logout`          | Đăng xuất              | Yes  |
| POST   | `/api/auth/reset-password`  | Yêu cầu reset mật khẩu | No   |
| POST   | `/api/auth/update-password` | Cập nhật mật khẩu      | Yes  |

### Students (`/api/students/`)

| Method | Endpoint                        | Mô tả                          | Auth               |
| ------ | ------------------------------- | ------------------------------ | ------------------ |
| GET    | `/api/students`                 | Danh sách học sinh (paginated) | Admin              |
| POST   | `/api/students`                 | Tạo học sinh mới               | Admin              |
| GET    | `/api/students/[id]`            | Chi tiết học sinh              | Admin/Teacher      |
| PUT    | `/api/students/[id]`            | Cập nhật học sinh              | Admin              |
| DELETE | `/api/students/[id]`            | Xóa học sinh                   | Admin              |
| GET    | `/api/students/[id]/grades`     | Điểm số                        | Admin/Teacher/Self |
| GET    | `/api/students/[id]/attendance` | Điểm danh                      | Admin/Teacher/Self |

### Classes (`/api/classes/`)

| Method | Endpoint                     | Mô tả              | Auth          |
| ------ | ---------------------------- | ------------------ | ------------- |
| GET    | `/api/classes`               | Danh sách lớp      | All           |
| POST   | `/api/classes`               | Tạo lớp mới        | Admin         |
| GET    | `/api/classes/[id]`          | Chi tiết lớp       | All           |
| PUT    | `/api/classes/[id]`          | Cập nhật lớp       | Admin         |
| DELETE | `/api/classes/[id]`          | Xóa lớp            | Admin         |
| GET    | `/api/classes/[id]/students` | Học sinh trong lớp | Teacher/Admin |

### Grades (`/api/grades/`)

| Method | Endpoint           | Mô tả               | Auth          |
| ------ | ------------------ | ------------------- | ------------- |
| GET    | `/api/grades`      | Danh sách điểm      | Teacher/Admin |
| POST   | `/api/grades`      | Nhập điểm           | Teacher       |
| PUT    | `/api/grades/[id]` | Sửa điểm            | Teacher       |
| DELETE | `/api/grades/[id]` | Xóa điểm            | Admin         |
| POST   | `/api/grades/bulk` | Nhập điểm hàng loạt | Teacher       |

### Attendance (`/api/attendance/`)

| Method | Endpoint                          | Mô tả               | Auth    |
| ------ | --------------------------------- | ------------------- | ------- |
| GET    | `/api/attendance/class/[classId]` | Điểm danh theo lớp  | Teacher |
| POST   | `/api/attendance`                 | Điểm danh           | Teacher |
| POST   | `/api/attendance/bulk`            | Điểm danh hàng loạt | Teacher |

### Finance (`/api/payments/`, `/api/admin/finance/`)

| Method | Endpoint                      | Mô tả                    | Auth   |
| ------ | ----------------------------- | ------------------------ | ------ |
| POST   | `/api/payments/create`        | Tạo giao dịch thanh toán | Admin  |
| GET    | `/api/payments/callback`      | VNPay callback           | Public |
| GET    | `/api/admin/finance/invoices` | Danh sách hóa đơn        | Admin  |
| POST   | `/api/admin/finance/invoices` | Tạo hóa đơn              | Admin  |
| GET    | `/api/admin/finance/reports`  | Báo cáo tài chính        | Admin  |

---

## 4. Services Layer

### Service Migration Status ✅

| Service             | Instance-based | DI Constructor | Static Wrappers | Singleton              |
| ------------------- | -------------- | -------------- | --------------- | ---------------------- |
| `ClassService`      | ✅             | ✅ `supabase?` | ✅              | ✅ `classService`      |
| `StudentService`    | ✅             | ✅ `supabase?` | ✅              | ✅ `studentService`    |
| `CourseService`     | ✅             | ✅ `supabase?` | ✅              | ✅ `courseService`     |
| `TuitionService`    | ✅             | ✅ `supabase?` | ✅              | ✅ `tuitionService`    |
| `SubjectService`    | ✅             | ✅ `supabase?` | ✅              | ✅ `subjectService`    |
| `EnrollmentService` | ✅             | ✅ `supabase?` | ✅              | ✅ `enrollmentService` |

### ClassService (`lib/services/classService.ts`)

```typescript
class ClassService {
    // CRUD Operations
    async getClasses(
        filters?: { courseId?; teacherId?; search?; page?; pageSize? },
    );
    async getClassById(id: string): Promise<ClassWithDetails>;
    async createClass(input: CreateClassInput): Promise<Class>;
    async updateClass(id: string, input: UpdateClassInput): Promise<Class>;
    async deleteClass(id: string): Promise<void>;

    // Related Data
    async getClassStudents(classId: string): Promise<Enrollment[]>;
    async getClassAssignments(classId: string): Promise<Assignment[]>;
    async getClassAttendance(
        classId: string,
        date?: string,
    ): Promise<Attendance[]>;
    async getClassGradeStats(classId: string): Promise<GradeStats>;

    // Teacher-specific
    async getTeacherClasses(
        teacherId: string,
        academicYearId?: string,
    ): Promise<Class[]>;
}
```

### StudentService (`lib/services/studentService.ts`)

```typescript
class StudentService {
    // CRUD Operations
    async getStudents(
        filters?: { search; page; pageSize },
    ): Promise<PaginatedResult>;
    async getStudentById(id: string): Promise<StudentWithEnrollments>;
    async createStudent(input: CreateStudentInput): Promise<Student>;
    async updateStudent(
        id: string,
        input: UpdateStudentInput,
    ): Promise<Student>;
    async deleteStudent(id: string): Promise<void>;

    // Related Data
    async getStudentGrades(
        studentId: string,
        classId?: string,
    ): Promise<Grade[]>;
    async getStudentAttendance(
        studentId: string,
        classId?: string,
    ): Promise<Attendance[]>;

    // Enrollment
    async enrollStudent(
        studentId: string,
        classId: string,
    ): Promise<Enrollment>;
    async unenrollStudent(
        studentId: string,
        classId: string,
    ): Promise<Enrollment>;
}
```

### EnrollmentService (`lib/services/EnrollmentService.ts`)

```typescript
class EnrollmentService {
    async getEnrollments(
        options: EnrollmentListOptions,
    ): Promise<EnrollmentListResult>;
    async createEnrollment(input: CreateEnrollmentInput): Promise<Enrollment>;
    async bulkEnroll(
        classId: string,
        studentIds: string[],
    ): Promise<BulkResult>;
    async deleteEnrollment(id: string): Promise<void>;
    async removeStudentFromClass(
        studentId: string,
        classId: string,
    ): Promise<void>;
    async transferStudent(
        studentId: string,
        fromClassId: string,
        toClassId: string,
    ): Promise<Enrollment>;
    async getClassStudentCount(classId: string): Promise<number>;
    async getStudentClasses(studentId: string): Promise<any[]>;
}
```

### SubjectService (`lib/services/SubjectService.ts`)

```typescript
class SubjectService {
    async getSubjects(
        options?: SubjectListOptions,
    ): Promise<{ subjects; total }>;
    async getSubjectById(id: string): Promise<Subject | null>;
    async createSubject(input: CreateSubjectInput): Promise<Subject>;
    async updateSubject(
        id: string,
        input: UpdateSubjectInput,
    ): Promise<Subject>;
    async deleteSubject(id: string, hardDelete?: boolean): Promise<void>;
}
```

### TuitionService (`lib/services/tuitionService.ts`)

```typescript
class TuitionService {
    async getTuitionRates(): Promise<TuitionRate[]>;
    async getClassTuition(classId: string): Promise<number>;
    async calculateStudentTuition(
        studentId: string,
    ): Promise<{ totalMonthly; classes }>;
    async getTuitionRate(
        classType: "group" | "tutoring",
        sessionsPerWeek: number,
    ): Promise<number>;
    async updateTuitionRate(
        classType,
        sessionsPerWeek,
        monthlyFee,
    ): Promise<void>;
}
```

---

## 5. Repositories Layer

### BaseRepository Pattern

```typescript
abstract class BaseRepository<T, CreateInput, UpdateInput> {
    protected readonly supabase: SupabaseClient;
    protected abstract readonly tableName: string;
    protected abstract readonly primaryKey: string;

    async findById(id: string): Promise<T | null>;
    async findAll(params?: PaginationParams): Promise<PaginatedResult<T>>;
    async create(input: CreateInput): Promise<T>;
    async update(id: string, input: UpdateInput): Promise<T>;
    async delete(id: string): Promise<void>;
}
```

### Available Repositories

| Repository             | Table       | Additional Methods                                 |
| ---------------------- | ----------- | -------------------------------------------------- |
| `StudentRepository`    | profiles    | `findByEmail()`, `findWithEnrollments()`           |
| `ClassRepository`      | classes     | `findWithDetails()`, `findByTeacher()`             |
| `GradeRepository`      | grades      | `findByStudent()`, `findByClass()`, `bulkCreate()` |
| `AttendanceRepository` | attendance  | `findByDateRange()`, `bulkUpsert()`                |
| `EnrollmentRepository` | enrollments | `findActive()`, `changeStatus()`                   |

---

## 6. Zod Schemas

### Student Schemas (`lib/schemas/students.ts`)

```typescript
createStudentSchema = z.object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: z.string().email(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    phone: z.string().optional(),
    address: z.string().max(500).optional(),
});

updateStudentSchema = createStudentSchema.partial();

studentQuerySchema = z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
```

### Grade Schemas (`lib/schemas/grades.ts`)

```typescript
vietnameseGradeSchema = z.number().min(0).max(10);

gradeTypeSchema = z.enum(["oral", "15min", "45min", "midterm", "final"]);

createGradeSchema = z.object({
    student_id: uuidSchema,
    score: vietnameseGradeSchema,
    grade_type: gradeTypeSchema.optional(),
    coefficient: z.number().int().min(1).max(3).default(1),
    notes: z.string().max(500).optional(),
});

bulkGradeEntrySchema = z.object({
    class_id: uuidSchema,
    grades: z.array(z.object({
        student_id: uuidSchema,
        score: vietnameseGradeSchema,
    })).min(1),
});
```

### Common Schemas (`lib/schemas/common.ts`)

```typescript
uuidSchema = z.string().uuid();

paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

userRoleSchema = z.enum(["admin", "teacher", "student", "parent"]);

attendanceStatusSchema = z.enum(["present", "absent", "late", "excused"]);
```

---

## 7. Custom Hooks

### useFetch (`hooks/useFetch.ts`)

```typescript
function useFetch<T>(url: string, options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: object;
    revalidateOnFocus?: boolean;
    fallbackData?: T;
}): {
    data: T | undefined;
    error: Error | undefined;
    isLoading: boolean;
    mutate: () => void;
};
```

### useForm (`hooks/useForm.ts`)

```typescript
function useForm<T>(options: {
    initialValues: T;
    validationSchema?: ZodSchema;
    onSubmit: (values: T) => Promise<void>;
}): {
    values: T;
    errors: Record<string, string>;
    isSubmitting: boolean;
    handleChange: (field: keyof T) => (value: any) => void;
    handleSubmit: () => Promise<void>;
    reset: () => void;
};
```

### usePermissions (`hooks/usePermissions.tsx`)

```typescript
function usePermissions(): {
    user: User | null;
    role: "admin" | "teacher" | "student" | "parent" | null;
    isAdmin: boolean;
    isTeacher: boolean;
    isStudent: boolean;
    can: (permission: string) => boolean;
    loading: boolean;
};
```

### usePagination (`hooks/usePagination.ts`)

```typescript
function usePagination(options: {
    totalItems: number;
    pageSize?: number;
    initialPage?: number;
}): {
    currentPage: number;
    totalPages: number;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};
```

---

## 8. Hệ thống Tính điểm Việt Nam

### Thang điểm 10 và Xếp loại

| Mức        | Khoảng điểm | Tiếng Việt | English   | Màu     |
| ---------- | ----------- | ---------- | --------- | ------- |
| Xuất sắc   | ≥ 9.0       | Xuất sắc   | Excellent | emerald |
| Giỏi       | ≥ 8.0       | Giỏi       | Good      | blue    |
| Khá        | ≥ 6.5       | Khá        | Fair      | cyan    |
| Trung bình | ≥ 5.0       | Trung bình | Average   | amber   |
| Yếu        | ≥ 3.5       | Yếu        | Weak      | orange  |
| Kém        | < 3.5       | Kém        | Failing   | red     |

### Hệ số điểm (Coefficients)

| Loại điểm    | Hệ số | Mô tả                 |
| ------------ | ----- | --------------------- |
| oral         | 1     | Điểm miệng            |
| fifteenMin   | 1     | Điểm 15 phút          |
| fortyFiveMin | 2     | Điểm 1 tiết (45 phút) |
| midterm      | 2     | Điểm giữa kỳ          |
| final        | 3     | Điểm cuối kỳ          |

### Công thức tính điểm trung bình môn

```
Điểm TB = Σ(điểm × hệ số) / Σ(hệ số)
```

### GPA Calculator Functions (`lib/grades/gpaCalculator.ts`)

```typescript
calculateSubjectAverage(grade: SubjectGrade): number | null
calculateSemesterGPA(grades, semesterId, semesterName, academicYear): SemesterGPA
calculateCumulativeGPA(semesters: SemesterGPA[]): CumulativeGPA
getAcademicStanding(gpa: number): AcademicStanding
convertTo4PointScale(vietnameseGPA: number): number
getLetterGradeFromScore(score: number): string // A+, A, B+, B, C+, C, D, F
```

---

## 9. Business Rules & Constraints

### Student Rules

- ❌ Không xóa học sinh có active enrollments
- ✅ Email phải unique
- ✅ `full_name` = `first_name` + ' ' + `last_name`
- ✅ `date_of_birth` format: YYYY-MM-DD

### Class Rules

- ❌ Không xóa lớp có enrollments
- ✅ `teacher_id` phải có role teacher hoặc admin
- ✅ `max_capacity` mặc định 12
- ✅ `sessions_per_week` mặc định 2

### Grade Rules

- ✅ `score` trong khoảng 0-10
- ✅ `coefficient` trong khoảng 1-3
- ✅ Mỗi cặp (student_id, assignment_id) là unique

### Attendance Rules

- ✅ `status` phải là: present, absent, late, excused
- ✅ Mỗi cặp (student_id, class_id, date) là unique

### Payment Rules

- ✅ `amount` phải > 0
- ✅ Trạng thái: pending → processing → completed / failed

---

## 10. Error Handling

### Error Classes (`lib/api/errors.ts`)

```typescript
class AppError extends Error {
    constructor(message: string, statusCode: number, code?: string);
}

class ValidationError extends AppError {} // 400
class AuthenticationError extends AppError {} // 401
class AuthorizationError extends AppError {} // 403
class NotFoundError extends AppError {} // 404
class ConflictError extends AppError {} // 409
class RateLimitError extends AppError {} // 429
```

### Sử dụng trong API Route

```typescript
import {
    handleApiError,
    NotFoundError,
    ValidationError,
} from "@/lib/api/errors";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = someSchema.safeParse(body);
        if (!result.success) {
            throw new ValidationError(result.error.issues[0].message);
        }
        // Business logic...
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error);
    }
}
```

---

## 11. Checklist Phát triển

### Khi thêm API Route mới

- [ ] Tạo/cập nhật Zod schema trong `lib/schemas/`
- [ ] Tạo route file trong `app/api/[resource]/route.ts`
- [ ] Import errors: `handleApiError`, `ValidationError`, etc.
- [ ] Validate request với Zod schema
- [ ] Check authentication (nếu cần)
- [ ] Check authorization (role-based)
- [ ] Gọi Service hoặc Repository
- [ ] Wrap trong try-catch với `handleApiError`

### Khi thêm Service mới

- [ ] Tạo file trong `lib/services/`
- [ ] Thêm optional `supabase` param vào constructor
- [ ] Thêm static wrapper methods
- [ ] Export singleton instance
- [ ] Định nghĩa interfaces cho input/output
- [ ] Throw custom errors (ValidationError, NotFoundError, etc.)
- [ ] Đăng ký trong `lib/container/index.ts`

### Khi thêm tính năng Frontend

- [ ] Tạo/sử dụng custom hook (hooks/)
- [ ] Handle loading, error, empty states
- [ ] Sử dụng UI components từ `components/ui/`
- [ ] Test responsive trên mobile

### Khi sửa đổi Database

- [ ] Tạo migration mới trong `supabase/migrations/`
- [ ] Cập nhật `lib/database.types.ts`
- [ ] Cập nhật Repository nếu cần
- [ ] Cập nhật Service nếu cần
- [ ] Cập nhật Zod schema nếu cần
- [ ] Cập nhật tài liệu này

---

## Phụ lục: Import Paths Thường dùng

```typescript
// Services (both patterns work)
import { classService } from "@/lib/services/classService";
import { ClassService } from "@/lib/services/classService";

// Container & DI
import { container, TOKENS } from "@/lib/container";

// Schemas
import {
    createStudentSchema,
    paginationSchema,
    uuidSchema,
} from "@/lib/schemas";

// Errors
import {
    handleApiError,
    NotFoundError,
    ValidationError,
} from "@/lib/api/errors";

// Supabase
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createBrowserClient } from "@/lib/supabase/client";

// Hooks
import { useFetch, useForm, usePagination, usePermissions } from "@/hooks";

// UI Components
import { Badge, Button, Card, EmptyState, Input, Table } from "@/components/ui";

// Utils
import { cn } from "@/lib/utils";
import { formatGPA, getAcademicStanding } from "@/lib/grades/gpaCalculator";

// Caching
import { CACHE_KEYS, CACHE_TTL, cached, invalidateCache } from "@/lib/cache";
```

---

## Tech Stack

| Layer      | Technology            | Version  |
| ---------- | --------------------- | -------- |
| Frontend   | Next.js               | 16.0.10  |
| UI Library | React                 | 19.2.3   |
| Styling    | Tailwind CSS          | 4.1.18   |
| State      | React Query           | 5.x      |
| Database   | Supabase (PostgreSQL) | 2.87.1   |
| Auth       | Supabase Auth         | Built-in |
| Language   | TypeScript            | 5.9.3    |
| Testing    | Jest                  | 29.x     |
| Deployment | Vercel                | -        |

---

_Last Updated: January 28, 2026_
