# Custom Hooks Documentation

Complete guide to using custom hooks in BH-EDU for cleaner, more maintainable code.

---

## 📚 Available Hooks

| Hook | Purpose | Status |
|------|---------|--------|
| `useFetch` | Data fetching with loading states | ✅ Ready |
| `useMutation` | POST/PUT/DELETE requests | ✅ Ready |
| `useForm` | Form state management | ✅ Ready |
| `usePagination` | Pagination logic | ✅ Ready |
| `useDebounce` | Debounce values (search) | ✅ Ready |
| `useToast` | Toast notifications | ✅ Ready |
| `useUser` | Current user state | ✅ Ready |

---

## 🎯 useFetch - Data Fetching

**Purpose:** Eliminates duplicate data fetching code with built-in loading and error states.

### Basic Usage

```typescript
import { useFetch } from '@/hooks';

function UsersList() {
  const { data, loading, error, refetch } = useFetch<User[]>('/api/users');

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.map(user => <UserCard key={user.id} user={user} />)}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### With Callbacks

```typescript
const { data, loading } = useFetch('/api/students', {
  immediate: true,  // Fetch on mount (default: true)
  onSuccess: (data) => {
    toast.success(`Loaded ${data.length} students`);
  },
  onError: (error) => {
    toast.error('Failed to load students', error);
  },
});
```

### Manual Fetching

```typescript
const { data, refetch } = useFetch('/api/data', { immediate: false });

// Fetch manually
<button onClick={refetch}>Load Data</button>
```

---

## 🔄 useMutation - Create/Update/Delete

**Purpose:** Handle POST/PUT/DELETE requests with loading states.

### POST Request

```typescript
import { useMutation } from '@/hooks';

function CreateUserForm() {
  const { mutate, loading, error } = useMutation('/api/users', 'POST');

  const handleSubmit = async (formData) => {
    try {
      const result = await mutate(formData);
      toast.success('User created!');
    } catch (err) {
      toast.error('Failed to create user');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### PUT Request

```typescript
const { mutate: updateUser } = useMutation('/api/users/123', 'PUT');

await updateUser({ name: 'New Name' });
```

### DELETE Request

```typescript
const { mutate: deleteUser } = useMutation('/api/users/123', 'DELETE');

await deleteUser(); // No body needed
```

---

## 📝 useForm - Form Management

**Purpose:** Manage form state, validation, and submission.

### Basic Form

```typescript
import { useForm } from '@/hooks';

function LoginForm() {
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: (values) => {
      const errors: any = {};
      if (!values.email) errors.email = 'Required';
      if (!values.password) errors.password = 'Required';
      return errors;
    },
    onSubmit: async (values) => {
      await loginUser(values);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Input
        name="email"
        value={form.values.email}
        onChange={form.handleChange}
        onBlur={() => form.handleBlur('email')}
        error={form.touched.email ? form.errors.email : undefined}
      />
      <Button type="submit" isLoading={form.isSubmitting}>
        Login
      </Button>
    </form>
  );
}
```

### Form Methods

```typescript
form.values           // Current form values
form.errors           // Validation errors
form.touched          // Fields that have been touched
form.isSubmitting     // Is form being submitted?
form.isDirty          // Has form been modified?

form.handleChange     // Handle input changes
form.handleBlur       // Handle field blur (validation)
form.handleSubmit     // Submit form
form.setFieldValue    // Set specific field value
form.setFieldError    // Set specific field error
form.reset()          // Reset to initial values
form.resetForm(newValues) // Reset with new values
```

---

## 📄 usePagination - Pagination

**Purpose:** Handle pagination logic without duplicating code.

### Basic Usage

```typescript
import { usePagination } from '@/hooks';

function StudentsList() {
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 20,
    totalItems: 0,
  });

  // Fetch with pagination
  const { data } = useFetch(
    `/api/students?page=${pagination.page}&limit=${pagination.limit}`
  );

  // Update total when data loads
  useEffect(() => {
    if (data) {
      pagination.setTotalItems(data.total);
    }
  }, [data]);

  return (
    <div>
      {/* Your content */}
      
      <div className="pagination">
        <button 
          onClick={pagination.prevPage} 
          disabled={!pagination.hasPrevPage}
        >
          Previous
        </button>
        
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        
        <button 
          onClick={pagination.nextPage} 
          disabled={!pagination.hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Pagination Methods

```typescript
pagination.page           // Current page number
pagination.limit          // Items per page
pagination.offset         // Offset for SQL queries
pagination.totalPages     // Total number of pages
pagination.hasNextPage    // Can go to next page?
pagination.hasPrevPage    // Can go to previous page?

pagination.nextPage()     // Go to next page
pagination.prevPage()     // Go to previous page
pagination.goToFirstPage() // Jump to first page
pagination.goToLastPage()  // Jump to last page
pagination.setPage(5)     // Go to specific page
pagination.setLimit(50)   // Change items per page
pagination.reset()        // Reset pagination
```

---

## ⏱️ useDebounce - Search Optimization

**Purpose:** Prevent excessive API calls during user typing.

### Search Input

```typescript
import { useDebounce } from '@/hooks';

function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500); // 500ms delay

  // This effect only runs 500ms after user stops typing
  useEffect(() => {
    if (debouncedSearch) {
      fetchSearchResults(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### With State Management

```typescript
const { value, debouncedValue, setValue } = useDebouncedState('', 500);

// Show immediate value in input
<input value={value} onChange={(e) => setValue(e.target.value)} />

// Use debounced value for API
useEffect(() => {
  fetchResults(debouncedValue);
}, [debouncedValue]);
```

---

## 🔔 useToast - Notifications

**Purpose:** Show toast notifications instead of alerts.

### Basic Usage

```typescript
import { useToast } from '@/hooks';
import { ToastContainer } from '@/components/ui/Toast';

function MyApp() {
  const toast = useToast();

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      
      <button onClick={() => toast.success('Saved!', 'Your changes were saved')}>
        Save
      </button>
    </>
  );
}
```

### Toast Methods

```typescript
// Success notification
toast.success('User created', 'John Doe has been added');

// Error notification
toast.error('Failed to save', 'Please try again');

// Warning notification
toast.warning('Unsaved changes', 'You have unsaved changes');

// Info notification
toast.info('New version', 'A new version is available');

// Custom toast
toast.showToast({
  type: 'success',
  title: 'Custom Toast',
  message: 'Custom message',
  duration: 5000, // 5 seconds (default)
});

// Remove specific toast
toast.removeToast(toastId);

// Clear all toasts
toast.clearAll();
```

---

## 👤 useUser - Current User

**Purpose:** Access current logged-in user across components.

### Basic Usage

```typescript
import { useUser } from '@/hooks';

function Dashboard() {
  const { user, isAdmin, isTeacher, isStudent, loading } = useUser();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Login />;

  return (
    <div>
      <h1>Welcome, {user.full_name}!</h1>
      
      {isAdmin && <AdminPanel />}
      {isTeacher && <TeacherPanel />}
      {isStudent && <StudentPanel />}
    </div>
  );
}
```

### User Properties

```typescript
user.id           // User ID
user.email        // User email
user.full_name    // Full name
user.role         // 'admin' | 'teacher' | 'student'
user.is_active    // Active status
user.avatar_url   // Profile picture
user.phone        // Phone number
user.department   // Department (teachers)
user.student_id   // Student ID (students)
user.grade_level  // Grade level (students)
```

---

## 🎨 Complete Example

Here's how to use multiple hooks together:

```typescript
"use client"

import { useEffect } from 'react';
import { 
  useFetch, 
  useMutation, 
  useForm, 
  usePagination, 
  useDebounce, 
  useToast,
  useUser 
} from '@/hooks';

export default function StudentsPage() {
  const toast = useToast();
  const { user, isAdmin } = useUser();
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 });
  
  // Search with debounce
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  // Fetch students
  const { data, loading, refetch } = useFetch(
    `/api/students?page=${pagination.page}&limit=${pagination.limit}&search=${debouncedSearch}`,
    {
      onSuccess: (data) => pagination.setTotalItems(data.total),
    }
  );
  
  // Create student mutation
  const { mutate: createStudent } = useMutation('/api/students', 'POST');
  
  // Form for creating student
  const form = useForm({
    initialValues: { name: '', email: '' },
    validate: (values) => {
      const errors: any = {};
      if (!values.name) errors.name = 'Required';
      return errors;
    },
    onSubmit: async (values) => {
      try {
        await createStudent(values);
        toast.success('Student created!');
        form.reset();
        refetch();
      } catch (error) {
        toast.error('Failed to create student');
      }
    },
  });
  
  return (
    <div>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      
      {/* Search */}
      <input 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        placeholder="Search..." 
      />
      
      {/* Student list */}
      {loading ? <LoadingState /> : (
        <StudentTable data={data?.students} />
      )}
      
      {/* Pagination */}
      <Pagination {...pagination} />
      
      {/* Create form (admin only) */}
      {isAdmin && (
        <form onSubmit={form.handleSubmit}>
          <Input {...form.getFieldProps('name')} />
          <Button type="submit" isLoading={form.isSubmitting}>
            Create
          </Button>
        </form>
      )}
    </div>
  );
}
```

---

## 📝 Best Practices

1. **Use useFetch for GET requests**
   - Provides loading states automatically
   - Handles errors consistently
   - Easy to refetch data

2. **Use useMutation for modifications**
   - POST/PUT/DELETE operations
   - Consistent loading states
   - Error handling

3. **Combine useDebounce with useFetch**
   - Prevents excessive API calls
   - Better user experience
   - Reduces server load

4. **Use useForm for complex forms**
   - Validation built-in
   - Dirty tracking
   - Easy reset

5. **usePagination with useFetch**
   - Clean pagination logic
   - Works with any API
   - Easy navigation

6. **useToast instead of alert()**
   - Better UX
   - Non-blocking
   - Consistent styling

---

## 🚀 Next Steps

1. Refactor existing pages to use these hooks
2. Replace `window.alert()` with `useToast()`
3. Replace manual fetch code with `useFetch()`
4. Use `useForm()` for all forms
5. Add `usePagination()` to all lists

---

## 📂 File Locations

- **Hooks:** `/web/hooks/`
- **Components:** `/web/components/ui/`
- **Example:** `/web/app/dashboard/hooks-example/page.tsx`
- **Documentation:** `/web/hooks/README.md`

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅
