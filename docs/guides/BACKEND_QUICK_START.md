# Backend Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm
- Supabase account and project

### Installation

```bash
cd web
npm install
```

### Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Lint code
npm run lint

# Format code
npm run format
```

## 📝 Creating Your First API Endpoint

### 1. Define Schema (Optional but Recommended)

```typescript
// lib/api/schemas.ts
import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  isbn: z.string().regex(/^\d{13}$/),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
```

### 2. Create Service

```typescript
// lib/services/bookService.ts
import { createClient } from '@/lib/supabase/server';
import { NotFoundError } from '@/lib/api/errors';
import type { CreateBookInput } from '@/lib/api/schemas';

export class BookService {
  static async getBooks() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('books').select('*');
    
    if (error) throw new Error('Failed to fetch books');
    return data;
  }
  
  static async createBook(input: CreateBookInput) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('books')
      .insert(input)
      .select()
      .single();
    
    if (error) throw new Error('Failed to create book');
    return data;
  }
}
```

### 3. Create Route Handler

```typescript
// app/api/v1/books/route.ts
import { NextRequest } from 'next/server';
import { withAuth, withAdmin, getPaginationParams } from '@/lib/api/middleware';
import { success, created } from '@/lib/api/responses';
import { handleApiError } from '@/lib/api/errors';
import { createBookSchema } from '@/lib/api/schemas';
import { BookService } from '@/lib/services/bookService';

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const books = await BookService.getBooks();
    return success(books);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedData = createBookSchema.parse(body);
    const book = await BookService.createBook(validatedData);
    return created(book);
  } catch (error) {
    return handleApiError(error);
  }
});
```

### 4. Write Tests

```typescript
// lib/services/__tests__/bookService.test.ts
import { BookService } from '@/lib/services/bookService';

jest.mock('@/lib/supabase/server');

describe('BookService', () => {
  it('should create a book', async () => {
    const input = {
      title: 'Test Book',
      author: 'John Doe',
      isbn: '1234567890123',
    };
    
    const book = await BookService.createBook(input);
    expect(book).toMatchObject(input);
  });
});
```

### 5. Test Your Endpoint

```bash
# Run tests
npm test

# Start dev server
npm run dev
```

Then make a request:

```bash
# GET (requires authentication)
curl -H "Cookie: sb-access-token=YOUR_TOKEN" \
  http://localhost:3000/api/v1/books

# POST (requires admin role)
curl -X POST \
  -H "Cookie: sb-access-token=YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Book","author":"Jane Doe","isbn":"1234567890123"}' \
  http://localhost:3000/api/v1/books
```

## 🛡️ Authentication

### Protecting Routes

```typescript
// Require authentication
export const GET = withAuth(async (request, context) => {
  // context.userId available
  return success({ userId: context.userId });
});

// Require admin role
export const POST = withAdmin(async (request, context) => {
  return success({ message: 'Admin only' });
});

// Require teacher role
export const PATCH = withTeacher(async (request, context) => {
  return success({ message: 'Teachers only' });
});
```

### Getting Current User

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  throw new AuthenticationError();
}
```

## ✅ Validation

### Using Zod Schemas

```typescript
import { createBookSchema } from '@/lib/api/schemas';

try {
  const body = await request.json();
  const validatedData = createBookSchema.parse(body);
  // validatedData is now type-safe!
} catch (error) {
  // Zod validation errors automatically handled by handleApiError
  return handleApiError(error);
}
```

### Creating Custom Schemas

```typescript
import { z } from 'zod';

const mySchema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(100),
  tags: z.array(z.string()).optional(),
});

type MyType = z.infer<typeof mySchema>;
```

## 🔄 Pagination

```typescript
import { getPaginationParams } from '@/lib/api/middleware';
import { paginated } from '@/lib/api/responses';

export const GET = withAuth(async (request) => {
  const { page, pageSize, offset } = getPaginationParams(request);
  
  const supabase = await createClient();
  const { data, count } = await supabase
    .from('books')
    .select('*', { count: 'exact' })
    .range(offset, offset + pageSize - 1);
  
  return paginated(data, page, pageSize, count);
});
```

## 📊 Response Formats

### Success Response

```typescript
import { success } from '@/lib/api/responses';

return success({ id: 1, name: 'Book' });
// { "success": true, "data": { "id": 1, "name": "Book" } }
```

### Created Response

```typescript
import { created } from '@/lib/api/responses';

return created({ id: 1 }, 'Book created');
// { "success": true, "data": { "id": 1 }, "message": "Book created" }
```

### Error Response

```typescript
import { badRequest, notFound } from '@/lib/api/responses';

return badRequest('Invalid input');
// { "success": false, "error": "Invalid input" }

return notFound('Book not found');
// { "success": false, "error": "Book not found" }
```

## 🧪 Testing

### Writing Unit Tests

```typescript
import { BookService } from '@/lib/services/bookService';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

describe('BookService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 1, title: 'Test' }],
          error: null,
        }),
      }),
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should fetch books', async () => {
    const books = await BookService.getBooks();
    expect(books).toHaveLength(1);
    expect(books[0].title).toBe('Test');
  });
});
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 🔍 Debugging

### Enable Debug Logging

```typescript
// In your service
console.log('Debug:', { userId, params });

// In tests
console.log('Test data:', testData);
```

### Common Issues

**Issue: "Authentication required"**
```typescript
// Solution: Use withAuth middleware
export const GET = withAuth(async (request, context) => {
  // Now authenticated
});
```

**Issue: "Validation failed"**
```typescript
// Solution: Check schema matches request body
const validatedData = createBookSchema.parse(body);
// Use safeParse for custom error handling
const result = createBookSchema.safeParse(body);
if (!result.success) {
  console.log('Validation errors:', result.error.issues);
}
```

**Issue: "Database error"**
```typescript
// Solution: Check Supabase connection and RLS policies
const { data, error } = await supabase.from('books').select('*');
if (error) {
  console.error('DB Error:', error);
}
```

## 📚 Resources

- [Full Documentation](./BACKEND_INFRASTRUCTURE.md)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Documentation](https://zod.dev/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Jest Testing](https://jestjs.io/docs/getting-started)

## 💡 Tips

1. **Always validate input** with Zod schemas
2. **Use service layer** for business logic
3. **Write tests** alongside features
4. **Handle errors** with try-catch + handleApiError
5. **Use middleware** for auth/authorization
6. **Type everything** with TypeScript
7. **Follow REST conventions** for endpoints
8. **Version your APIs** (`/api/v1/`)

## 🎯 Checklist for New Endpoints

- [ ] Define Zod schema in `lib/api/schemas.ts`
- [ ] Create service class in `lib/services/`
- [ ] Write unit tests in `__tests__/`
- [ ] Create route handler in `app/api/v1/`
- [ ] Add middleware (`withAuth`, `withAdmin`, etc.)
- [ ] Implement error handling
- [ ] Test locally with curl/Postman
- [ ] Run `npm run typecheck`
- [ ] Run `npm test`
- [ ] Update documentation if needed

---

**Ready to build? Start with the example above!** 🚀
