# Backend API Infrastructure

This document describes the backend infrastructure for the BH-EDU Next.js application.

## Architecture

The backend is built using **Next.js App Router Route Handlers**, providing a modern, serverless API architecture with:

- Type-safe API routes with TypeScript
- Zod schema validation
- Standardized response formats
- Authentication & authorization middleware
- Service layer for business logic
- Comprehensive testing with Jest

## Project Structure

```
web/
├── app/api/          # API route handlers
│   └── v1/           # Versioned API endpoints
│       └── courses/  # Example CRUD routes
├── lib/
│   ├── api/          # API infrastructure
│   │   ├── errors.ts      # Error classes & handler
│   │   ├── middleware.ts  # Auth, validation helpers
│   │   ├── responses.ts   # Response helpers
│   │   └── schemas.ts     # Zod validation schemas
│   ├── db/           # Database utilities
│   │   └── helpers.ts     # DB helper functions
│   ├── services/     # Business logic layer
│   │   └── courseService.ts
│   └── supabase/     # Supabase clients
│       ├── client.ts      # Browser client
│       └── server.ts      # Server client
```

## Key Features

### 1. Standardized Responses

All API responses follow a consistent format:

```typescript
// Success response
{
  "success": true,
  "data": { /* ... */ }
}

// Error response
{
  "success": false,
  "error": "Error message"
}

// Paginated response
{
  "success": true,
  "data": [ /* ... */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

Use response helpers in `lib/api/responses.ts`:

```typescript
import { success, created, badRequest, notFound } from '@/lib/api/responses';

export async function GET() {
  const data = await fetchData();
  return success(data);
}
```

### 2. Error Handling

Custom error classes with automatic HTTP status mapping:

```typescript
import { ValidationError, NotFoundError, AuthorizationError } from '@/lib/api/errors';

// Throws 400 Bad Request
throw new ValidationError('Invalid email format');

// Throws 404 Not Found
throw new NotFoundError('Course not found');

// Throws 403 Forbidden
throw new AuthorizationError('Admin access required');
```

Centralized error handler:

```typescript
import { handleApiError } from '@/lib/api/errors';

export async function POST(request: NextRequest) {
  try {
    // ... your logic
  } catch (error) {
    return handleApiError(error); // Automatic error response
  }
}
```

### 3. Authentication & Authorization

Middleware for protected routes:

```typescript
import { withAuth, withAdmin, withTeacher } from '@/lib/api/middleware';

// Require authentication
export const GET = withAuth(async (request, context) => {
  // context.userId and context.userEmail available
  return success({ userId: context.userId });
});

// Require admin role
export const POST = withAdmin(async (request, context) => {
  // Only admins can access
  return created(data);
});

// Require teacher role
export const PATCH = withTeacher(async (request, context) => {
  // Only teachers can access
  return success(data);
});
```

### 4. Validation with Zod

Type-safe validation schemas in `lib/api/schemas.ts`:

```typescript
import { createCourseSchema } from '@/lib/api/schemas';

export const POST = withAdmin(async (request) => {
  const body = await request.json();
  const validatedData = createCourseSchema.parse(body); // Throws if invalid
  
  // validatedData is fully typed
  const course = await CourseService.createCourse(validatedData);
  return created(course);
});
```

Available schemas:
- `createCourseSchema`, `updateCourseSchema`
- `createClassSchema`, `updateClassSchema`
- `createStudentSchema`, `updateStudentSchema`
- `createAssignmentSchema`, `updateAssignmentSchema`
- `createGradeSchema`, `updateGradeSchema`
- `createAttendanceSchema`, `bulkAttendanceSchema`
- `paginationSchema`, `uuidSchema`, `emailSchema`

### 5. Service Layer

Business logic separated from routes:

```typescript
// lib/services/courseService.ts
export class CourseService {
  static async getCourses(filters?: { search?: string; page?: number }) {
    const supabase = await createClient();
    // ... business logic
    return { courses, total };
  }
  
  static async createCourse(input: CreateCourseInput) {
    // Validation, database operations, error handling
  }
}
```

Use in routes:

```typescript
import { CourseService } from '@/lib/services/courseService';

export const GET = withAuth(async (request) => {
  const result = await CourseService.getCourses();
  return success(result);
});
```

### 6. Database Helpers

Utility functions in `lib/db/helpers.ts`:

```typescript
import { isAdmin, isTeacher, recordExists } from '@/lib/db/helpers';

// Check user roles
const isAdminUser = await isAdmin(userId);
const isTeacherUser = await isTeacher(userId);

// Check record existence
const courseExists = await recordExists('courses', courseId);

// Get current academic year
const academicYear = await getCurrentAcademicYear();

// Batch operations
await batchInsert('enrollments', records, 100);
```

## Creating a New API Endpoint

### Step 1: Define Validation Schema

```typescript
// lib/api/schemas.ts
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().min(0),
  category_id: uuidSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
```

### Step 2: Create Service

```typescript
// lib/services/productService.ts
import { createClient } from '@/lib/supabase/server';
import { NotFoundError } from '@/lib/api/errors';
import type { CreateProductInput } from '@/lib/api/schemas';

export class ProductService {
  static async getProducts() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('products').select('*');
    
    if (error) throw new Error('Failed to fetch products');
    return data;
  }
  
  static async createProduct(input: CreateProductInput) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single();
    
    if (error) throw new Error('Failed to create product');
    return data;
  }
}
```

### Step 3: Create Route Handler

```typescript
// app/api/v1/products/route.ts
import { withAuth, withAdmin } from '@/lib/api/middleware';
import { success, created, handleApiError } from '@/lib/api/responses';
import { createProductSchema } from '@/lib/api/schemas';
import { ProductService } from '@/lib/services/productService';

export const GET = withAuth(async () => {
  try {
    const products = await ProductService.getProducts();
    return success(products);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAdmin(async (request) => {
  try {
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);
    
    const product = await ProductService.createProduct(validatedData);
    return created(product);
  } catch (error) {
    return handleApiError(error);
  }
});
```

### Step 4: Write Tests

```typescript
// lib/services/__tests__/productService.test.ts
import { ProductService } from '@/lib/services/productService';

describe('ProductService', () => {
  it('should fetch products', async () => {
    const products = await ProductService.getProducts();
    expect(products).toBeDefined();
  });
});
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

- Unit tests for services: `lib/services/__tests__/`
- Integration tests: `lib/__tests__/`
- API route tests: `app/api/__tests__/`

### Example Test

```typescript
import { CourseService } from '@/lib/services/courseService';

jest.mock('@/lib/supabase/server');

describe('CourseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should create a course', async () => {
    const input = {
      name: 'Math 101',
      code: 'MATH101',
      subject_id: 'uuid-here',
    };
    
    const course = await CourseService.createCourse(input);
    expect(course).toMatchObject(input);
  });
});
```

## Code Quality

### Linting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Formatting

```bash
npm run format       # Format all files
npm run format:check # Check formatting
```

### Type Checking

```bash
npm run typecheck   # Run TypeScript compiler
```

## Best Practices

1. **Always validate input** using Zod schemas
2. **Use service layer** for business logic, not in routes
3. **Consistent error handling** with try-catch and handleApiError
4. **Test all services** with unit tests
5. **Use middleware** for authentication/authorization
6. **Version your APIs** (e.g., `/api/v1/`)
7. **Return typed responses** with response helpers
8. **Document complex logic** with JSDoc comments

## Security

- All routes protected by authentication middleware
- Role-based access control (RBAC) via RLS helpers
- Input validation on all requests
- SQL injection protection via Supabase client
- Rate limiting (via `lib/rateLimit.ts`)
- Audit logging (via `lib/auditLog.ts`)

## Performance

- Pagination on list endpoints (default 20 items)
- Database query optimization with select projections
- Efficient RLS policies with helper functions
- Connection pooling via Supabase
- Static generation where possible

## API Versioning

All new endpoints should use `/api/v1/` prefix:

```
/api/v1/courses      # Good
/api/courses         # Legacy, avoid for new endpoints
```

This allows breaking changes in future versions without affecting existing clients.

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Common Issues

**Error: "Authentication required"**
- Ensure you're using `withAuth` middleware
- Check that cookies are being sent with request
- Verify Supabase session is valid

**Error: "Validation failed"**
- Check request body matches Zod schema
- Verify all required fields are present
- Check data types match schema

**Error: "Permission denied"**
- Verify user has correct role (admin/teacher)
- Check RLS policies in Supabase
- Ensure RLS helper functions exist

## Additional Resources

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Documentation](https://zod.dev/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Jest Testing](https://jestjs.io/docs/getting-started)
