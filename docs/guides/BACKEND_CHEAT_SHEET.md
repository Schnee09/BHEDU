# Backend Cheat Sheet

Quick reference for common backend tasks.

## 📁 File Structure

```
web/
├── lib/
│   ├── api/                    # API utilities
│   │   ├── responses.ts        # Response helpers
│   │   ├── errors.ts           # Error classes
│   │   ├── middleware.ts       # Auth middleware
│   │   ├── schemas.ts          # Zod validation
│   │   └── logging.ts          # Request logging
│   ├── services/               # Business logic
│   │   ├── courseService.ts
│   │   ├── studentService.ts
│   │   └── classService.ts
│   ├── db/
│   │   └── helpers.ts          # Database utilities
│   └── supabase/
│       └── server.ts           # Supabase client
└── app/
    └── api/
        └── v1/                 # Versioned API routes
            ├── courses/
            └── ...
```

## 🚀 Creating a New API Endpoint

### 1. Define Schema (if needed)

```typescript
// lib/api/schemas.ts
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().min(0),
  category: z.string(),
});
```

### 2. Create Service

```typescript
// lib/services/productService.ts
export class ProductService {
  static async getProducts() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw new Error('Failed to fetch');
    return data;
  }
  
  static async createProduct(input: CreateProductInput) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single();
    if (error) throw new Error('Failed to create');
    return data;
  }
}
```

### 3. Create Route Handler

```typescript
// app/api/v1/products/route.ts
import { withAuth } from '@/lib/api/middleware';
import { success, created } from '@/lib/api/responses';
import { handleApiError } from '@/lib/api/errors';
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

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const data = createProductSchema.parse(body);
    const product = await ProductService.createProduct(data);
    return created(product);
  } catch (error) {
    return handleApiError(error);
  }
});
```

## 🔐 Middleware Patterns

### Require Authentication

```typescript
export const GET = withAuth(async (request, context) => {
  const userId = context.userId; // Available after auth
  // ...
});
```

### Require Admin Role

```typescript
export const POST = withAdmin(async (request, context) => {
  // Only admins can access
});
```

### Require Teacher Role

```typescript
export const PATCH = withTeacher(async (request, context) => {
  // Only teachers can access
});
```

### Add Logging

```typescript
import { withLogging } from '@/lib/api/logging';

export const GET = withLogging(
  withAuth(async (request) => {
    // Request/response automatically logged
  })
);
```

### Combine Multiple Middleware

```typescript
import { combineMiddleware } from '@/lib/api/logging';

const withAuthAndLog = combineMiddleware(withLogging, withAuth);

export const GET = withAuthAndLog(async (request) => {
  // Both logging and auth applied
});
```

## ✅ Validation Patterns

### Parse and Validate

```typescript
import { createProductSchema } from '@/lib/api/schemas';

const body = await request.json();
const validData = createProductSchema.parse(body); // Throws on error
```

### Safe Parse

```typescript
const result = createProductSchema.safeParse(body);
if (!result.success) {
  console.log(result.error.issues);
  return badRequest('Validation failed');
}
const validData = result.data;
```

### Validate Route Params

```typescript
import { uuidSchema } from '@/lib/api/schemas';

const params = await context.params;
const id = uuidSchema.parse(params?.id); // Validates UUID
```

### Get Query Params

```typescript
import { getQueryParam, getPaginationParams } from '@/lib/api/middleware';

const search = getQueryParam(request, 'search');
const { page, pageSize, offset } = getPaginationParams(request);
```

## 📤 Response Patterns

### Success (200)

```typescript
return success({ id: 1, name: 'Product' });
// { success: true, data: { ... } }
```

### Created (201)

```typescript
return created(newProduct, 'Product created');
// { success: true, data: {...}, message: '...' }
```

### No Content (204)

```typescript
return noContent();
// Empty response, 204 status
```

### Bad Request (400)

```typescript
return badRequest('Invalid input');
// { success: false, error: 'Invalid input' }
```

### Unauthorized (401)

```typescript
return unauthorized('Login required');
// { success: false, error: '...' }
```

### Forbidden (403)

```typescript
return forbidden('Access denied');
// { success: false, error: '...' }
```

### Not Found (404)

```typescript
return notFound('Product not found');
// { success: false, error: '...' }
```

### Paginated Response

```typescript
return paginated(data, page, pageSize, totalCount);
// {
//   success: true,
//   data: [...],
//   pagination: { page, pageSize, totalItems, totalPages }
// }
```

## 🚨 Error Handling

### Throw Custom Errors

```typescript
import { ValidationError, NotFoundError } from '@/lib/api/errors';

if (!product) throw new NotFoundError('Product not found');
if (price < 0) throw new ValidationError('Price must be positive');
```

### Catch and Handle

```typescript
try {
  await ProductService.createProduct(data);
} catch (error) {
  return handleApiError(error); // Automatic error response
}
```

### Available Error Classes

```typescript
new ValidationError('message')      // 400
new AuthenticationError('message')  // 401
new AuthorizationError('message')   // 403
new NotFoundError('message')        // 404
new ConflictError('message')        // 409
new RateLimitError('message')       // 429
new AppError('message', 500)        // Custom
```

## 🗄️ Database Helpers

### Check Record Exists

```typescript
import { recordExists } from '@/lib/db/helpers';

if (!(await recordExists('products', productId))) {
  throw new NotFoundError('Product not found');
}
```

### Check Roles

```typescript
import { isAdmin, isTeacher } from '@/lib/db/helpers';

const admin = await isAdmin(userId);
const teacher = await isTeacher(userId);
```

### Check Enrollment

```typescript
import { isEnrolledInClass } from '@/lib/db/helpers';

const enrolled = await isEnrolledInClass(classId, studentId);
```

### Batch Insert

```typescript
import { batchInsert } from '@/lib/db/helpers';

const records = [{ name: 'A' }, { name: 'B' }];
await batchInsert('products', records, 100); // Batch size 100
```

## 🧪 Testing

### Create Service Test

```typescript
import { ProductService } from '@/lib/services/productService';

jest.mock('@/lib/supabase/server');
import { createClient } from '@/lib/supabase/server';

describe('ProductService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = { from: jest.fn() };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should get products', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      }),
    });

    const products = await ProductService.getProducts();
    expect(products).toHaveLength(1);
  });
});
```

### Run Tests

```bash
npm test              # Run all
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## 📝 Common Patterns

### Pagination

```typescript
const { page, pageSize, offset } = getPaginationParams(request);
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .range(offset, offset + pageSize - 1);

return paginated(data, page, pageSize, count);
```

### Search

```typescript
let query = supabase.from('products').select('*');

if (search) {
  query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
}

const { data } = await query;
```

### Filter

```typescript
let query = supabase.from('products').select('*');

if (categoryId) query = query.eq('category_id', categoryId);
if (minPrice) query = query.gte('price', minPrice);
if (maxPrice) query = query.lte('price', maxPrice);
```

### Sort

```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .order('name', { ascending: true });
```

## 🔧 Development Commands

```bash
# Development
npm run dev            # Start dev server

# Quality Checks
npm run typecheck      # Type checking
npm run lint           # Lint code
npm run lint:fix       # Fix linting issues
npm run format         # Format code
npm run format:check   # Check formatting

# Testing
npm test               # Run tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage

# Build
npm run build          # Production build
npm start              # Start production server
```

## 🎯 Quick Checklist

When creating a new endpoint:

- [ ] Define Zod schema in `lib/api/schemas.ts`
- [ ] Create service in `lib/services/`
- [ ] Write tests in `__tests__/`
- [ ] Create route in `app/api/v1/`
- [ ] Add auth middleware (`withAuth`, `withAdmin`, etc.)
- [ ] Add validation (Zod parse)
- [ ] Add error handling (try/catch + handleApiError)
- [ ] Add logging (`withLogging`)
- [ ] Test locally
- [ ] Run `npm run typecheck`
- [ ] Run `npm test`
- [ ] Run `npm run build`

## 📚 Documentation

- [Backend Infrastructure](./BACKEND_INFRASTRUCTURE.md) - Complete guide
- [Quick Start](./BACKEND_QUICK_START.md) - Getting started
- [Integration Example](./INTEGRATION_EXAMPLE.md) - Full-stack example
- [Phase 2 Summary](./BACKEND_PHASE_2_COMPLETE.md) - Latest changes

---

**Keep this handy for quick reference!** 🚀
