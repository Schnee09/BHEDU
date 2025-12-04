# React Query Integration Guide

## Overview

React Query has been integrated into the BH-EDU project to provide advanced data caching, automatic background updates, and optimized API request handling.

## Installation

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

✅ **Status:** Installed

## Setup

### 1. Provider Configuration

The `ReactQueryProvider` is configured in `web/providers/ReactQueryProvider.tsx`:

```tsx
// Default configuration
{
  queries: {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 10 * 60 * 1000,        // 10 minutes
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 1,
  }
}
```

### 2. Root Integration

Added to `web/components/ClientProviders.tsx`:

```tsx
<ReactQueryProvider>
  <ToastProvider>
    {children}
  </ToastProvider>
</ReactQueryProvider>
```

## Custom Hooks

### useQueryData

Fetch data with automatic caching and background updates.

```tsx
import { useQueryData } from '@/hooks';

const { data, loading, error, refetch } = useQueryData<Response>(
  'queryKey',           // Unique key for caching
  '/api/endpoint',      // API endpoint
  {
    enabled: true,      // Enable/disable query
    staleTime: 30000,   // Fresh for 30s
    onSuccess: (data) => console.log(data),
    onError: (error) => console.error(error),
  }
);
```

**Features:**
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Request deduplication
- ✅ Stale-while-revalidate pattern
- ✅ Loading and error states
- ✅ Manual refetch

### useQueryMutation

Perform mutations with automatic cache invalidation.

```tsx
import { useQueryMutation, useQueryClient } from '@/hooks';

const queryClient = useQueryClient();

const { mutate, loading } = useQueryMutation<Response, Variables>(
  '/api/endpoint',
  'POST',
  {
    onSuccess: (data) => {
      // Invalidate cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['queryKey'] });
    },
    onError: (error) => console.error(error),
  }
);

// Use mutation
mutate({ name: 'John' });
```

**Features:**
- ✅ Optimistic updates
- ✅ Automatic retries
- ✅ Cache invalidation
- ✅ Success/error callbacks
- ✅ Loading states

## Query Keys

Query keys should be **unique** and **descriptive**. Include dependencies in the key:

```tsx
// ❌ Bad - not specific
useQueryData('students', '/api/students');

// ✅ Good - includes dependencies
useQueryData(['students', page, search], `/api/students?page=${page}&search=${search}`);

// ✅ Great - hierarchical
useQueryData(['classes', classId, 'students'], `/api/classes/${classId}/students`);
```

## Cache Invalidation

Invalidate cache after mutations to trigger background refetch:

```tsx
import { useQueryClient } from '@/hooks';

const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['students'] });

// Invalidate multiple related queries
queryClient.invalidateQueries({ queryKey: ['students'] });
queryClient.invalidateQueries({ queryKey: ['classes'] });

// Invalidate all queries
queryClient.invalidateQueries();
```

## Comparison: useFetch vs useQueryData

| Feature | useFetch | useQueryData |
|---------|----------|--------------|
| **Caching** | ❌ None | ✅ Automatic |
| **Background Updates** | ❌ No | ✅ Yes |
| **Deduplication** | ❌ No | ✅ Yes |
| **DevTools** | ❌ No | ✅ Yes |
| **Retry** | ❌ Manual | ✅ Automatic |
| **Loading State** | ✅ Yes | ✅ Yes |
| **Error Handling** | ✅ Yes | ✅ Yes |
| **Refetch** | ✅ Yes | ✅ Yes |
| **Stale-While-Revalidate** | ❌ No | ✅ Yes |

## When to Use What

### Use `useQueryData` (React Query) for:
- ✅ Data that's fetched frequently
- ✅ Data shared across components
- ✅ Lists with pagination/filtering
- ✅ Data that needs background updates
- ✅ Complex cache invalidation logic

### Use `useFetch` for:
- ✅ One-time data fetching
- ✅ Simple pages with no caching needs
- ✅ When React Query is overkill

## Example: Students Page with React Query

```tsx
'use client';

import { useQueryData, useQueryMutation, useQueryClient } from '@/hooks';

export default function StudentsPage() {
  const queryClient = useQueryClient();
  
  // Fetch students (cached)
  const { data, loading } = useQueryData<{ students: Student[] }>(
    ['students', page, search],
    `/api/students?page=${page}&search=${search}`,
    {
      staleTime: 30 * 1000, // Fresh for 30 seconds
    }
  );
  
  // Delete mutation
  const { mutate: deleteStudent } = useQueryMutation(
    '/api/students',
    'DELETE',
    {
      onSuccess: () => {
        // Invalidate to refetch
        queryClient.invalidateQueries({ queryKey: ['students'] });
      },
    }
  );
  
  return (
    <div>
      {loading ? (
        <LoadingState />
      ) : (
        <StudentTable 
          students={data?.students} 
          onDelete={(id) => deleteStudent({ id })}
        />
      )}
    </div>
  );
}
```

## DevTools

React Query DevTools are enabled in development mode:

- **Location:** Bottom-right corner
- **Toggle:** Click the React Query icon
- **Features:**
  - View all queries and their status
  - Inspect cache data
  - Trigger refetch manually
  - Monitor background updates
  - Debug stale/fresh state

## Best Practices

### 1. Use Consistent Query Keys
```tsx
// ✅ Good pattern
const QUERY_KEYS = {
  students: (page: number, search: string) => ['students', page, search],
  student: (id: string) => ['students', id],
  classes: ['classes'],
  class: (id: string) => ['classes', id],
};

useQueryData(QUERY_KEYS.students(1, 'john'), '/api/students?...');
```

### 2. Set Appropriate Stale Times
```tsx
// Fast-changing data (grades, attendance)
staleTime: 10 * 1000  // 10 seconds

// Moderate data (students, classes)
staleTime: 5 * 60 * 1000  // 5 minutes

// Slow-changing data (settings, categories)
staleTime: 30 * 60 * 1000  // 30 minutes
```

### 3. Invalidate Related Queries
```tsx
// After creating a student
mutate(newStudent, {
  onSuccess: () => {
    // Invalidate students list
    queryClient.invalidateQueries({ queryKey: ['students'] });
    // Invalidate class enrollments
    queryClient.invalidateQueries({ queryKey: ['classes'] });
  },
});
```

### 4. Optimistic Updates (Advanced)
```tsx
const { mutate } = useQueryMutation('/api/students', 'POST', {
  onMutate: async (newStudent) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['students'] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['students']);
    
    // Optimistically update
    queryClient.setQueryData(['students'], (old: any) => {
      return { ...old, students: [...old.students, newStudent] };
    });
    
    // Return context with snapshot
    return { previous };
  },
  onError: (err, newStudent, context) => {
    // Rollback on error
    queryClient.setQueryData(['students'], context.previous);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['students'] });
  },
});
```

## Migration Guide

### Converting useFetch to useQueryData

**Before (useFetch):**
```tsx
const { data, loading, error, refetch } = useFetch<Response>(
  '/api/students',
  {
    onSuccess: (data) => console.log(data),
    onError: (error) => console.error(error),
  }
);
```

**After (useQueryData):**
```tsx
const { data, loading, error, refetch } = useQueryData<Response>(
  'students',  // Add query key
  '/api/students',
  {
    onSuccess: (data) => console.log(data),
    onError: (error) => console.error(error),
  }
);
```

**Changes:**
1. Add query key as first parameter
2. Include dependencies in query key for proper caching
3. Remove manual refetch on mount (handled automatically)

## Performance Tips

1. **Prefetch Data:** Load data before it's needed
```tsx
queryClient.prefetchQuery({
  queryKey: ['student', id],
  queryFn: () => fetch(`/api/students/${id}`),
});
```

2. **Parallel Queries:** Fetch multiple endpoints simultaneously
```tsx
const students = useQueryData(['students'], '/api/students');
const classes = useQueryData(['classes'], '/api/classes');
const grades = useQueryData(['grades'], '/api/grades');
// All three fetch in parallel!
```

3. **Dependent Queries:** Fetch based on previous results
```tsx
const { data: user } = useQueryData(['user'], '/api/user');

const { data: classes } = useQueryData(
  ['classes', user?.id],
  user ? `/api/classes?teacher=${user.id}` : null,
  { enabled: !!user }  // Only run if user exists
);
```

## Troubleshooting

### Query Not Refetching
- Check `enabled` option
- Verify query key includes dependencies
- Check `staleTime` (might still be fresh)
- Ensure `refetchOnWindowFocus` is enabled

### Data Not Updating After Mutation
- Call `queryClient.invalidateQueries()` in `onSuccess`
- Verify query key matches exactly
- Check DevTools for cache state

### Multiple Requests
- Query key might be changing unnecessarily
- Use stable query keys (avoid inline objects)
- Check DevTools for duplicate queries

## Resources

- **Documentation:** https://tanstack.com/query/latest
- **Example Page:** `/dashboard/react-query-example`
- **Hooks:** `web/hooks/useQueryData.ts`
- **Provider:** `web/providers/ReactQueryProvider.tsx`

## Next Steps

1. ✅ Install React Query
2. ✅ Configure provider
3. ✅ Create custom hooks
4. ✅ Add example page
5. ⏳ Migrate Students page
6. ⏳ Migrate Grades pages
7. ⏳ Migrate Classes page
8. ⏳ Add optimistic updates
9. ⏳ Add prefetching
10. ⏳ Performance monitoring
