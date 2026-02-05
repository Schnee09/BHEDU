# Admin Component & Hooks Library Documentation

**Date**: December 9, 2025  
**Status**: Foundation Complete ✅  
**Location**: `web/app/dashboard/admin/_components/` and `web/app/dashboard/admin/_hooks/`

---

## 📦 Components

### 1. **AdminTable Component**

A fully-featured data table with sorting, selection, pagination support, and actions.

#### Usage
```tsx
import { AdminTable, Column } from '@/app/dashboard/admin/_components';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const columns: Column<User>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <Badge variant={value === 'active' ? 'success' : 'error'}>{value}</Badge>
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  
  return (
    <AdminTable<User>
      data={users}
      columns={columns}
      loading={false}
      onEdit={(user) => console.log('Edit', user)}
      onDelete={(user) => console.log('Delete', user)}
      sortBy="name"
      sortOrder="asc"
      onSort={(column, order) => console.log('Sort', column, order)}
    />
  );
}
```

#### Props
- `data: T[]` - Array of items to display
- `columns: Column<T>[]` - Column configuration
- `loading?: boolean` - Show loading state
- `onEdit?: (item: T) => void` - Edit button handler
- `onDelete?: (item: T) => void` - Delete button handler
- `onSelect?: (item: T) => void` - Item selection handler
- `selectable?: boolean` - Enable checkboxes
- `selectedIds?: string[]` - Selected item IDs
- `sortBy?: keyof T` - Current sort column
- `sortOrder?: 'asc' | 'desc'` - Sort order
- `onSort?: (column: keyof T, order: 'asc' | 'desc') => void` - Sort handler

---

### 2. **CrudModal Component**

Modal dialog for creating and editing records.

#### Usage
```tsx
import { CrudModal, FormField, Input } from '@/app/dashboard/admin/_components';
import { useState } from 'react';

export default function FeeTypesPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', amount: 0 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/admin/fee-types', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ name: '', amount: 0 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>Create Fee Type</button>

      <CrudModal
        isOpen={showModal}
        title="Create Fee Type"
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <FormField label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </FormField>

        <FormField label="Amount" required>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
          />
        </FormField>
      </CrudModal>
    </>
  );
}
```

#### Props
- `isOpen: boolean` - Modal visibility
- `title: string` - Modal title
- `onClose: () => void` - Close handler
- `onSubmit: (e: React.FormEvent) => void` - Form submission handler
- `loading?: boolean` - Show saving state
- `children: ReactNode` - Form content
- `submitLabel?: string` - Submit button text (default: "Save")
- `submitVariant?: 'primary' | 'danger'` - Button color
- `size?: 'sm' | 'md' | 'lg'` - Modal size

---

### 3. **Form Elements**

Reusable form input components with consistent styling.

#### FormField
Wrapper for form inputs with label, error, and helper text.

```tsx
<FormField
  label="Email"
  required
  error={errors.email}
  helperText="Enter a valid email address"
>
  <Input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    error={!!errors.email}
  />
</FormField>
```

#### Input
Standard text input with error styling.

```tsx
<Input
  type="text"
  placeholder="Enter name..."
  error={hasError}
/>
```

#### Textarea
Multi-line text input.

```tsx
<Textarea
  placeholder="Enter description..."
  rows={4}
/>
```

#### Select
Dropdown select input.

```tsx
<Select
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ]}
/>
```

#### Checkbox
Checkbox input with optional label.

```tsx
<Checkbox label="I agree to terms" />
```

#### Badge
Status badge component.

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="error">Inactive</Badge>
<Badge variant="warning">Pending</Badge>
```

---

### 4. **Alert & ConfirmDialog**

User feedback and confirmation components.

#### Alert
Display informational, success, error, or warning messages.

```tsx
import { Alert } from '@/app/dashboard/admin/_components';

<Alert variant="success" title="Success!">
  Record has been created successfully.
</Alert>

<Alert variant="error" title="Error" onClose={() => setError(null)}>
  Failed to save record. Please try again.
</Alert>
```

#### ConfirmDialog
Confirmation dialog for destructive actions.

```tsx
import { ConfirmDialog } from '@/app/dashboard/admin/_components';
import { useState } from 'react';

export default function DeleteUser() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>Delete</button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete User?"
        message="This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
```

---

### 5. **Pagination**

Pagination controls for large datasets.

```tsx
import { Pagination } from '@/app/dashboard/admin/_components';
import { usePagination } from '@/app/dashboard/admin/_hooks';

export default function UsersPage() {
  const { page, setPage, perPage, setPerPage } = usePagination(totalUsers);

  return (
    <>
      <AdminTable data={paginatedData} {...props} />
      
      <Pagination
        page={page}
        perPage={perPage}
        total={totalUsers}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />
    </>
  );
}
```

---

### 6. **FilterBar**

Search and filter controls.

```tsx
import { FilterBar } from '@/app/dashboard/admin/_components';

<FilterBar
  searchValue={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Search users..."
  onReset={() => {
    setSearchQuery('');
    setFilters({});
  }}
>
  <div className="grid grid-cols-2 gap-3">
    <Select
      options={statusOptions}
      value={filters.status}
      onChange={(e) => setFilter('status', e.target.value)}
    />
    <Select
      options={departmentOptions}
      value={filters.department}
      onChange={(e) => setFilter('department', e.target.value)}
    />
  </div>
</FilterBar>
```

---

## 🪝 Hooks

### 1. **useAdminData**

Fetch and manage data for admin pages.

#### Usage
```tsx
import { useAdminData } from '@/app/dashboard/admin/_hooks';

export default function FeeTypesPage() {
  const { data: feeTypes, loading, error, refetch } = useAdminData<FeeType[]>(
    '/api/admin/fee-types'
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <AdminTable
      data={feeTypes || []}
      columns={columns}
      loading={loading}
    />
  );
}
```

#### API
- `data: T | null` - Fetched data
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Refetch data
- `mutate: (data: T) => void` - Update data locally

---

### 2. **useAdminForm**

Form state management with validation.

#### Usage
```tsx
import { useAdminForm } from '@/app/dashboard/admin/_hooks';

export default function CreateFeeType() {
  const { formData, errors, loading, setField, handleSubmit } = useAdminForm(
    { name: '', amount: 0 },
    {
      onSuccess: () => toast.success('Created!'),
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <form onSubmit={handleSubmit(async (data) => {
      const response = await fetch('/api/admin/fee-types', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    })}>
      <FormField label="Name" error={errors.name}>
        <Input
          value={formData.name}
          onChange={(e) => setField('name', e.target.value)}
        />
      </FormField>

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

#### API
- `formData: T` - Current form values
- `errors: Partial<Record<keyof T, string>>` - Field errors
- `loading: boolean` - Submission loading state
- `setField(key, value)` - Update single field
- `setMultipleFields(fields)` - Update multiple fields
- `reset()` - Reset to initial values
- `handleSubmit(onSubmit)` - Form submission handler

---

### 3. **usePagination**

Pagination state management.

#### Usage
```tsx
import { usePagination } from '@/app/dashboard/admin/_hooks';

const pagination = usePagination(totalRecords, { initialPerPage: 25 });

const startIdx = pagination.getStart();
const endIdx = pagination.getEnd();
const paginatedData = data.slice(startIdx, endIdx);

<Pagination
  page={pagination.page}
  perPage={pagination.perPage}
  total={pagination.total}
  onPageChange={pagination.setPage}
  onPerPageChange={pagination.setPerPage}
/>
```

#### API
- `page: number` - Current page
- `perPage: number` - Items per page
- `total: number` - Total items
- `totalPages: number` - Total pages
- `setPage(page)` - Go to page
- `setPerPage(perPage)` - Change items per page
- `nextPage()` - Go to next page
- `prevPage()` - Go to previous page
- `getStart()` - Start index for current page
- `getEnd()` - End index for current page

---

### 4. **useFilters & useSearch**

Filter and search data.

#### Usage
```tsx
import { useFilters, useSearch } from '@/app/dashboard/admin/_hooks';

const { filters, setFilter, filteredData } = useFilters(
  allUsers,
  (user, filters) => {
    if (filters.status && user.status !== filters.status) return false;
    if (filters.role && user.role !== filters.role) return false;
    return true;
  }
);

const { searchQuery, setSearchQuery, searchedData } = useSearch(
  filteredData,
  (user, query) => 
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.email.toLowerCase().includes(query.toLowerCase())
);

return (
  <>
    <FilterBar
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      onReset={() => {
        setSearchQuery('');
        // reset filters
      }}
    />
    <AdminTable data={searchedData} {...props} />
  </>
);
```

---

## 🎨 Design System

### Colors
```css
/* Status colors */
--success: #10b981 (green-600)
--error: #ef4444 (red-600)
--warning: #f59e0b (amber-600)
--info: #3b82f6 (blue-600)

/* Neutral colors */
--text-primary: #111827 (gray-900)
--text-secondary: #6b7280 (gray-500)
--border: #e5e7eb (gray-200)
--bg-hover: #f9fafb (gray-50)
```

### Spacing
- Padding: 4px, 8px, 12px, 16px, 20px, 24px
- Gaps: 8px, 12px, 16px, 20px, 24px
- Border radius: 6px (buttons), 8px (cards), 12px (modals)

### Typography
- Headers: 20px (600 weight)
- Titles: 16px (600 weight)
- Body: 14px (400 weight)
- Small: 12px (400 weight)

---

## 📋 Complete Admin Page Template

```tsx
'use client';

import { useState } from 'react';
import {
  AdminTable,
  CrudModal,
  FormField,
  Input,
  Select,
  Pagination,
  FilterBar,
  Alert,
  ConfirmDialog,
  Column,
} from '@/app/dashboard/admin/_components';
import {
  useAdminData,
  useAdminForm,
  usePagination,
  useFilters,
  useSearch,
} from '@/app/dashboard/admin/_hooks';

interface Record {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function AdminPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch data
  const { data: allRecords = [], loading, refetch } = useAdminData<Record[]>(
    '/api/admin/records'
  );

  // Pagination
  const pagination = usePagination(allRecords.length);

  // Search & Filter
  const { searchQuery, setSearchQuery, searchedData } = useSearch(
    allRecords,
    (record, query) =>
      record.name.toLowerCase().includes(query.toLowerCase())
  );

  const { filters, setFilter, filteredData } = useFilters(
    searchedData,
    (record, filters) => {
      if (filters.status && record.status !== filters.status) return false;
      return true;
    }
  );

  // Pagination on filtered data
  const paginatedData = filteredData.slice(
    pagination.getStart(),
    pagination.getEnd()
  );

  // Form
  const { formData, setField, loading: saving, handleSubmit } = useAdminForm(
    { name: '', status: 'active' }
  );

  // Handlers
  const handleCreate = () => {
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (record: Record) => {
    setEditingId(record.id);
    setField('name', record.name);
    setField('status', record.status);
    setShowModal(true);
  };

  const handleDelete = (record: Record) => {
    setDeleteId(record.id);
    setShowConfirm(true);
  };

  const onSubmit = handleSubmit(async (data) => {
    const response = await fetch(
      editingId
        ? `/api/admin/records/${editingId}`
        : '/api/admin/records',
      {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) throw new Error('Failed to save');

    setSuccessMsg(editingId ? 'Updated!' : 'Created!');
    setShowModal(false);
    refetch();
  });

  const onConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/admin/records/${deleteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');

      setSuccessMsg('Deleted!');
      setShowConfirm(false);
      refetch();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const columns: Column<Record>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Records</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Record
        </button>
      </div>

      {successMsg && (
        <Alert variant="success" onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="error" onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onReset={() => setSearchQuery('')}
      >
        <Select
          options={[
            { value: '', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          value={filters.status || ''}
          onChange={(e) => setFilter('status', e.target.value)}
        />
      </FilterBar>

      <AdminTable<Record>
        data={paginatedData}
        columns={columns}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Pagination
        page={pagination.page}
        perPage={pagination.perPage}
        total={filteredData.length}
        onPageChange={pagination.setPage}
        onPerPageChange={pagination.setPerPage}
      />

      <CrudModal
        isOpen={showModal}
        title={editingId ? 'Edit Record' : 'Create Record'}
        onClose={() => setShowModal(false)}
        onSubmit={onSubmit}
        loading={saving}
      >
        <FormField label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setField('name', e.target.value)}
          />
        </FormField>

        <FormField label="Status">
          <Select
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={formData.status}
            onChange={(e) => setField('status', e.target.value)}
          />
        </FormField>
      </CrudModal>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Record?"
        message="This action cannot be undone."
        variant="danger"
        onConfirm={onConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
```

---

## ✅ Next Steps

With this component and hook library in place, you can now:

1. **Refactor Configuration Module** (academic-years, fee-types, grading-scales)
2. **Refactor Finance Module** (split invoices, create student accounts, build reports)
3. **Add Bulk Operations** (select, delete, export multiple items)
4. **Create Specialized Components** (invoice wizard, student selector, date pickers)

All pages will use consistent patterns and styling! 🎨

---

**Created**: December 9, 2025  
**Component Count**: 6 core + 3 form element types  
**Hook Count**: 4 custom hooks  
**Ready for Production**: ✅
