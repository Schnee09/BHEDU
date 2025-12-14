/**
 * Canonical route helpers.
 *
 * Goal:
 * - prevent hard-coded route strings scattered across the app
 * - establish a single, professional URL contract
 * - make refactors (like /dashboard/admin/*) safe
 */

export const routes = {
  dashboard: () => '/dashboard',

  students: {
    list: () => '/dashboard/students',
    import: () => '/dashboard/students/import',
    detail: (id: string) => `/dashboard/students/${id}`,
    edit: (id: string) => `/dashboard/students/${id}/edit`,
    progress: (id: string) => `/dashboard/students/${id}/progress`,
    transcript: (id: string) => `/dashboard/students/${id}/transcript`,
  },

  classes: {
    list: () => '/dashboard/classes',
    detail: (id: string) => `/dashboard/classes/${id}`,
  },

  attendance: {
    list: () => '/dashboard/attendance',
    mark: () => '/dashboard/attendance/mark',
    qr: () => '/dashboard/attendance/qr',
    reports: () => '/dashboard/attendance/reports',
  },

  grades: {
    list: () => '/dashboard/grades',
    entry: () => '/dashboard/grades/entry',
    assignments: () => '/dashboard/grades/assignments',
    analytics: () => '/dashboard/grades/analytics',
    reports: () => '/dashboard/grades/reports',
    conductEntry: () => '/dashboard/grades/conduct-entry',
    vietnameseEntry: () => '/dashboard/grades/vietnamese-entry',
  },

  finance: {
    root: () => '/dashboard/finance',
    fees: () => '/dashboard/finance/fees',
    payments: () => '/dashboard/finance/payments',
    invoices: () => '/dashboard/finance/invoices',
    invoiceDetail: (id: string) => `/dashboard/finance/invoices/${id}`,
    accounts: () => '/dashboard/finance/accounts',
    accountDetail: (id: string) => `/dashboard/finance/accounts/${id}`,
    reports: () => '/dashboard/finance/reports',
  },

  admin: {
    root: () => '/dashboard/admin',

    students: {
      list: () => '/dashboard/admin/students',
      detail: (id: string) => `/dashboard/admin/students/${id}`,
    },

    finance: {
      studentAccounts: {
        list: () => '/dashboard/admin/finance/student-accounts',
        detail: (id: string) => `/dashboard/admin/finance/student-accounts/${id}`,
      },
      invoices: {
        list: () => '/dashboard/admin/finance/invoices',
        detail: (id: string) => `/dashboard/admin/finance/invoices/${id}`,
      },
      payments: () => '/dashboard/admin/finance/payments',
      reports: () => '/dashboard/admin/finance/reports',
    },
  },

  unauthorized: () => '/unauthorized',
} as const
