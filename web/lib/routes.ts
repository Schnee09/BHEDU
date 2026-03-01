/**
 * Canonical route helpers.
 *
 * Goal:
 * - prevent hard-coded route strings scattered across the app
 * - establish a single, professional URL contract
 * - make refactors (like /dashboard/admin/*) safe
 */

export const routes = {
  dashboard: () => "/dashboard",

  students: {
    list: () => "/dashboard/students",
    import: () => "/dashboard/students/import",
    detail: (id: string) => `/dashboard/students/${id}`,
    edit: (id: string) => `/dashboard/students/${id}/edit`,
    progress: (id: string) => `/dashboard/students/${id}/progress`,
    transcript: (id: string) => `/dashboard/students/${id}/transcript`,
  },

  classes: {
    list: () => "/dashboard/classes",
    detail: (id: string) => `/dashboard/classes/${id}`,
    edit: (id: string) => `/dashboard/classes/${id}/edit`,
  },

  attendance: {
    list: () => "/dashboard/attendance",
    mark: () => "/dashboard/attendance/mark",
    history: () => "/dashboard/attendance/history",
    reports: () => "/dashboard/attendance/reports",
  },

  grades: {
    list: () => "/dashboard/grades",
    entry: () => "/dashboard/grades/entry",
    assignments: () => "/dashboard/grades/assignments",
    analytics: () => "/dashboard/grades/analytics",
    reports: () => "/dashboard/grades/reports",
    transcripts: () => "/dashboard/grades/transcripts",
    vietnameseEntry: () => "/dashboard/grades/entry", // Now unified with standard entry
  },

  admin: {
    root: () => "/dashboard/admin",

    students: {
      list: () => "/dashboard/admin/students",
      detail: (id: string) => `/dashboard/admin/students/${id}`,
    },
  },

  // User management routes
  users: {
    list: () => "/dashboard/users",
    detail: (id: string) => `/dashboard/users/${id}`,
  },

  // Tutor management routes
  tutors: {
    list: () => "/dashboard/tutors",
    detail: (id: string) => `/dashboard/tutors/${id}`,
  },

  // Profile routes
  profile: () => "/dashboard/profile",

  // Timetable routes
  timetable: {
    manage: () => "/dashboard/timetable",
    mySchedule: () => "/dashboard/my-schedule",
  },

  // Parent routes
  parent: {
    root: () => "/dashboard/parent",
    linkStudent: () => "/dashboard/parent/link-student",
    studentDetail: (id: string) => `/dashboard/parent/student/${id}`,
  },

  // Notifications
  notifications: () => "/dashboard/notifications",

  unauthorized: () => "/unauthorized",
} as const;
