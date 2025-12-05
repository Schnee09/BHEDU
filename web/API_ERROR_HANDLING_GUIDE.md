# API Error Handling Guide

## 📘 Overview
This guide documents the improved error handling system implemented across all API routes to eliminate 404, 400, and 500 errors.

## 🎯 Error Classes

### Standard Error Types (lib/api/errors.ts)

```typescript
// 400 Bad Request
throw new ValidationError('Invalid input format')

// 401 Unauthorized 
throw new AuthenticationError('Authentication required')

// 403 Forbidden
throw new AuthorizationError('Admin access required')

// 404 Not Found
throw new NotFoundError('Resource not found')

// 409 Conflict
throw new ConflictError('Resource already exists')

// 429 Rate Limit
throw new RateLimitError('Too many requests')

// 500 Internal Server Error
throw new AppError('Something went wrong', 500)
```

## 🛠️ Utility Functions

### 1. Request Validation (lib/api/validation.ts)

```typescript
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '@/lib/api/validation';

// Validate request body
const schema = z.object({
  title: z.string().min(1),
  age: z.number().min(0).max(150),
});
const data = await validateBody(request, schema);

// Validate query parameters
const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('25').transform(Number),
});
const { page, limit } = validateQuery(request, querySchema);

// Validate route parameters
const paramsSchema = z.object({
  id: z.string().uuid(),
});
const { id } = await validateParams(context.params, paramsSchema);
```

### 2. Error Handling Middleware (lib/api/middleware.ts)

```typescript
import { withErrorHandler, withAuth, withAdmin, withTeacher } from '@/lib/api/middleware';

// Basic error handling
export const GET = withErrorHandler(async (request) => {
  // Your code here
  return Response.json({ data });
});

// With authentication
export const POST = withAuth(async (request, context) => {
  console.log(context.userId); // Access authenticated user ID
  return Response.json({ success: true });
});

// With admin authorization
export const DELETE = withAdmin(async (request, context) => {
  // Only admins can access
  return Response.json({ success: true });
});
```

## 📝 Best Practices

### ✅ DO

1. **Always wrap handlers in try-catch or use withErrorHandler**
```typescript
export const GET = withErrorHandler(async (request) => {
  // Your code
});
```

2. **Use specific error classes**
```typescript
if (!userId) {
  throw new ValidationError('User ID is required');
}
```

3. **Validate all inputs**
```typescript
const data = await validateBody(request, schema);
```

4. **Return consistent response format**
```typescript
return Response.json({
  success: true,
  data: results,
});
```

5. **Log errors for debugging**
```typescript
console.error('Failed to fetch users:', error);
```

### ❌ DON'T

1. **Don't return different response formats**
```typescript
// Bad
return new Response(JSON.stringify({ error }), { status: 400 });
return NextResponse.json({ success: false, error });
return Response.json({ error });

// Good - use handleApiError
return handleApiError(error);
```

2. **Don't ignore errors**
```typescript
// Bad
const { data } = await supabase.from('users').select();
return Response.json({ data });

// Good
const { data, error } = await supabase.from('users').select();
if (error) throw new Error(`Database query failed: ${error.message}`);
return Response.json({ success: true, data });
```

3. **Don't expose sensitive error details**
```typescript
// Bad
return Response.json({ error: error.stack }, { status: 500 });

// Good
console.error('Internal error:', error);
throw new AppError('An error occurred processing your request');
```

## 🔍 Common Error Scenarios

### 1. Missing Route Parameters (404)

```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await validateParams(context.params, z.object({
      id: z.string().uuid('Invalid ID format'),
    }));
    
    // Use id safely
  } catch (error) {
    return handleApiError(error); // Returns 400 with clear message
  }
}
```

### 2. Invalid Request Body (400)

```typescript
export const POST = withAuth(async (request) => {
  const schema = z.object({
    email: z.string().email(),
    age: z.number().int().positive(),
  });
  
  const data = await validateBody(request, schema);
  // data is type-safe now
});
```

### 3. Database Errors (500)

```typescript
const { data, error } = await supabase.from('users').select();

if (error) {
  console.error('Database error:', error);
  throw new Error('Failed to fetch users');
}

if (!data || data.length === 0) {
  throw new NotFoundError('No users found');
}
```

### 4. Authentication Errors (401)

```typescript
export const GET = withAuth(async (request, context) => {
  // User is authenticated, context.userId available
  const userId = context.userId;
});
```

### 5. Authorization Errors (403)

```typescript
export const DELETE = withAdmin(async (request, context) => {
  // Only admins can reach this code
});
```

## 🧪 Testing Error Responses

### Valid Request
```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "age": 25}'
```

### Response
```json
{
  "success": true,
  "data": { "id": "123", "email": "test@example.com" }
}
```

### Invalid Request (Validation Error)
```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid", "age": -5}'
```

### Response (400)
```json
{
  "success": false,
  "error": "Validation failed: email: Invalid email, age: Number must be positive",
  "code": "VALIDATION_ERROR"
}
```

### Unauthorized Request
```bash
curl -X GET https://api.example.com/admin/users
```

### Response (401)
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTHENTICATION_ERROR"
}
```

## 🚀 Migration Checklist

When updating existing API routes:

- [ ] Add `try-catch` or use `withErrorHandler`
- [ ] Replace direct `NextResponse.json` error returns with custom error classes
- [ ] Add request body validation with Zod schemas
- [ ] Add query parameter validation
- [ ] Validate route parameters
- [ ] Check environment variables with `requireEnv()`
- [ ] Handle database errors properly
- [ ] Log errors for debugging
- [ ] Test all error scenarios

## 📊 Error Response Format

All errors follow this consistent format:

```typescript
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE", // e.g., "VALIDATION_ERROR"
  "issues": [...] // Optional, for validation errors
}
```

## 🔗 Related Files

- `lib/api/errors.ts` - Error classes and handleApiError
- `lib/api/validation.ts` - Request validation utilities
- `lib/api/middleware.ts` - Authentication and error handling middleware
- `ERROR_FIX_PLAN.md` - Comprehensive error fixing plan

## 💡 Tips

1. Use TypeScript for type safety
2. Test both success and error paths
3. Provide clear, actionable error messages
4. Log errors with context for debugging
5. Use specific HTTP status codes
6. Never expose sensitive information in errors
7. Rate limit public endpoints
8. Validate all user input
9. Use prepared statements for database queries
10. Keep error messages consistent across the API
