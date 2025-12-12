'use client';

/**
 * Admin Components Index
 * Exports all reusable admin components
 */

export { AdminTable } from './AdminTable';
export type { AdminTableProps, Column } from './AdminTable';

export { CrudModal } from './CrudModal';
export type { CrudModalProps } from './CrudModal';

export {
  FormField,
  Input,
  Textarea,
  Select,
  Checkbox,
  Badge,
} from './FormElements';
export type {
  FormFieldProps,
  InputProps,
  TextareaProps,
  SelectProps,
  CheckboxProps,
  BadgeProps,
} from './FormElements';

export { Alert, ConfirmDialog } from './Alert';
export type { AlertProps, ConfirmDialogProps } from './Alert';

export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';

export { FilterBar } from './FilterBar';
export type { FilterBarProps } from './FilterBar';
