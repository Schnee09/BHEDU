# Database Schema Synchronization Guide

This guide ensures database schema changes don't break the application.

## Problem

Previously, the API code used column names that didn't match the database schema:
- API used `title`, DB had `name` (courses table)
- API used `order_index`, DB had `lesson_order` (lessons table)  
- API used `author_id`, `is_published`, DB didn't have these (courses table)

## Solution: Type-Safe Schema Layer

### 1. Single Source of Truth

**File: `lib/database.types.ts`**

This file is generated from `supabase/COMPLETE_STUDENT_MANAGEMENT.sql` and contains:

- TypeScript interfaces for all tables
- Column name constants (`TableColumns`)
- Foreign key references (`ForeignKeys`)
- Mapping helpers for API ↔ Database transformations
- Type guards for runtime validation

### 2. Usage in API Routes

```typescript
// ✅ CORRECT - Use types and helpers
import { TableColumns, mapCourseToAPI, type Course } from '@/lib/database.types';

// Fetch with correct columns
const { data } = await supabase
  .from('courses')
  .select(TableColumns.courses) // ✅ Type-safe column selection
  .order('created_at', { ascending: false });

// Map to API format
const courses = (data as Course[]).map(mapCourseToAPI);

// ❌ WRONG - Hardcoded columns
const { data } = await supabase
  .from('courses')
  .select('id, title, author_id') // These columns don't exist!
```

### 3. Mapping Helpers

**For tables with API ↔ DB differences:**

```typescript
// Course: DB uses 'name', API uses 'title'
export function mapCourseToAPI(course: Course): Course & { title: string } {
  return { ...course, title: course.name };
}

export function mapCourseFromAPI(apiCourse: { title: string }): Partial<Course> {
  const { title, ...rest } = apiCourse;
  return { ...rest, name: title };
}
```

### 4. Foreign Key Type Safety

```typescript
// ✅ CORRECT - Use predefined foreign key names
import { ForeignKeys } from '@/lib/database.types';

const { data } = await supabase
  .from('classes')
  .select(`
    *,
    teacher:profiles!${ForeignKeys.classes.teacher}(*),
    academic_year:academic_years!${ForeignKeys.classes.academic_year}(*)
  `);

// ❌ WRONG - Guessing foreign key names
.select(`
  *,
  teacher:profiles(*),  // Might fail if multiple FKs exist
  academic_year:academic_years(*)
`);
```

## When Schema Changes

### Step 1: Update SQL Schema

Edit `supabase/COMPLETE_STUDENT_MANAGEMENT.sql`:

```sql
-- Example: Adding a new column
ALTER TABLE courses ADD COLUMN difficulty TEXT;
```

### Step 2: Update Type Definitions

Edit `lib/database.types.ts`:

```typescript
export interface Course {
  id: string;
  name: string;
  description: string | null;
  difficulty: string | null; // ✅ Add new field
  // ... rest
}

export const TableColumns = {
  courses: 'id, name, description, difficulty, subject_id, ...', // ✅ Add to select
  // ... rest
} as const;
```

### Step 3: Update API Routes (if needed)

```typescript
// If the new field needs transformation
export function mapCourseToAPI(course: Course) {
  return {
    ...course,
    title: course.name,
    level: course.difficulty // Map to different name if needed
  };
}
```

### Step 4: Verify with TypeScript

Run type check:
```bash
npm run type-check
```

TypeScript will catch:
- ✅ Missing columns in SELECT statements
- ✅ Invalid column names in INSERT/UPDATE
- ✅ Type mismatches in function parameters

## Best Practices

### ✅ DO:

1. **Always use `TableColumns` for SELECT**
   ```typescript
   .select(TableColumns.courses)
   ```

2. **Use mapping helpers for transformations**
   ```typescript
   const apiCourses = dbCourses.map(mapCourseToAPI);
   ```

3. **Use explicit foreign key hints**
   ```typescript
   .select(`*, teacher:profiles!${ForeignKeys.courses.teacher}(*)`)
   ```

4. **Update types immediately after schema changes**

### ❌ DON'T:

1. **Don't hardcode column lists**
   ```typescript
   .select('id, title, author_id') // ❌ Can go out of sync
   ```

2. **Don't guess foreign key names**
   ```typescript
   .select('*, teacher:profiles(*)') // ❌ Might be ambiguous
   ```

3. **Don't skip type definitions**
   ```typescript
   const data: any = await supabase... // ❌ Loses type safety
   ```

## Migration Checklist

When adding a new feature:

- [ ] Design database schema
- [ ] Update `COMPLETE_STUDENT_MANAGEMENT.sql`
- [ ] Generate/update TypeScript types in `lib/database.types.ts`
- [ ] Add to `TableColumns` constant
- [ ] Add foreign keys to `ForeignKeys` (if applicable)
- [ ] Create mapping helpers (if needed)
- [ ] Update API routes to use types
- [ ] Run `npm run type-check`
- [ ] Test locally
- [ ] Apply schema to Supabase dashboard
- [ ] Deploy

## Files to Update

For every schema change, check these files:

1. `supabase/COMPLETE_STUDENT_MANAGEMENT.sql` - Schema definition
2. `lib/database.types.ts` - TypeScript types
3. `app/api/**/route.ts` - API routes using the table
4. `app/dashboard/**/page.tsx` - Frontend pages displaying the data
5. `app/dashboard/**/actions.ts` - Server actions modifying the data

## Testing Schema Sync

```bash
# 1. Start dev server
npm run dev

# 2. Check for TypeScript errors
npm run type-check

# 3. Test API endpoints
curl http://localhost:3000/api/courses

# 4. Check browser console for errors
# Navigate to each page that uses the changed table
```

## Common Issues

### Issue: "Column does not exist"

**Cause:** API using wrong column name

**Fix:** Check `TableColumns` in `database.types.ts` and compare with SQL schema

### Issue: "Could not find relationship"

**Cause:** Missing foreign key hint in JOIN

**Fix:** Use `ForeignKeys` constant: `.select('*, table:foreign!${ForeignKeys.x.y}(*)')`

### Issue: TypeScript shows property doesn't exist

**Cause:** Type definition out of sync with schema

**Fix:** Update interface in `database.types.ts`

## Future Improvements

1. **Auto-generate types from Supabase**
   ```bash
   npx supabase gen types typescript --local > lib/database.types.ts
   ```

2. **Schema validation tests**
   - Compare `TableColumns` with actual DB columns
   - Verify foreign keys exist

3. **Migration scripts**
   - Track schema version
   - Auto-apply changes to local/production

## References

- Database Schema: `supabase/COMPLETE_STUDENT_MANAGEMENT.sql`
- Type Definitions: `lib/database.types.ts`
- Supabase Docs: https://supabase.com/docs/reference/javascript
