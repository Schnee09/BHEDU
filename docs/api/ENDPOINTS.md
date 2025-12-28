# 🔌 API Endpoint Reference

All API routes are located in `web/app/api/`. This document provides an overview of available endpoints.

---

## Authentication Required

Most endpoints require authentication. Include the session cookie or pass the `Authorization: Bearer <token>` header.

---

## Endpoint Categories

### `/api/auth` - Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/reset-password` | Password reset |

---

### `/api/admin` - Admin Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/users` | Manage users |
| GET/PUT/DELETE | `/api/admin/users/[id]` | Single user ops |
| GET/POST | `/api/admin/classes` | Manage classes |
| GET/POST | `/api/admin/students` | Manage students |
| GET/POST | `/api/admin/teachers` | Manage teachers |
| GET/POST | `/api/admin/courses` | Manage courses |
| GET/POST | `/api/admin/grades` | Manage grades |
| GET/POST | `/api/admin/attendance` | Attendance records |
| GET/POST | `/api/admin/enrollments` | Student enrollments |
| GET/POST | `/api/admin/fee-types` | Fee type management |
| GET/POST | `/api/admin/grading-scales` | Grading scales |
| GET/POST | `/api/admin/academic-years` | Academic years |

---

### `/api/attendance` - Attendance System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | List attendance records |
| POST | `/api/attendance/bulk` | Bulk attendance update |
| GET | `/api/attendance/class/[classId]` | Class attendance by date |
| GET | `/api/attendance/reports` | Attendance reports |
| POST | `/api/attendance/qr` | QR code check-in |
| POST | `/api/attendance/checkin` | Manual check-in |

---

### `/api/grades` - Grade Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/grades` | List grades |
| POST | `/api/grades` | Create grade |
| POST | `/api/grades/vietnamese` | Vietnamese grading entry |

---

### `/api/students` - Student Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List students |
| GET | `/api/students/[id]` | Get student details |
| GET | `/api/students/[id]/progress` | Student progress |
| GET | `/api/students/[id]/transcript` | Generate transcript |
| GET | `/api/students/[id]/report-card` | Report card |

---

### `/api/teacher` - Teacher Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teacher/classes` | Teacher's classes |
| GET | `/api/teacher/classes/[classId]/students` | Students in class |
| GET/POST | `/api/teacher/assignments` | Assignments |

---

### `/api/classes` - Class Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | List all classes |
| GET | `/api/classes/my-classes` | Current user's classes |
| GET | `/api/classes/[classId]/students` | Students in a class |

---

### `/api/subjects` - Subject Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects` | List all subjects |

---

### `/api/reports` - Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | Generate reports |

---

### `/api/health` - System Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

---

## Response Format

All endpoints return JSON with this structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

*Last Updated: December 2025*
