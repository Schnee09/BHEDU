# PLAN.md (Rev 2.0 - Hybrid Monorepo)

## 1. 🎯 Mục tiêu & Triết lý
**Mục tiêu:** Xây dựng Hệ thống Theo Dõi & Đánh Giá Học Sinh (STS) hiệu suất cao — quản trị tốt cho web, trải nghiệm mượt cho mobile.

**Triết lý phát triển (Hybrid Monorepo):**
- **Hiệu suất > Đồng nhất codebase:** Web dùng Next.js tối ưu xử lý dữ liệu; Mobile dùng Flutter tối ưu UX.
- **Tách biệt frontend — backend trung tâm:** Supabase là nguồn dữ liệu duy nhất (Auth, DB, Edge Functions).
- **AI-driven workflow:** Kết hợp tác nhân AI cho coding, testing, và phân tích dữ liệu học tập.

---

## 2. 🏗️ Kiến trúc & Công nghệ
**Frontend (tách biệt 2 ứng dụng):**
- **Web (Admin/Teacher):** Next.js + React + TailwindCSS.  
- **Mobile (Student/Teacher):** Flutter + Supabase SDK.

**Backend (Trung tâm):**
- Supabase (PostgreSQL, Auth, Storage)
- Edge Functions (serverless logic)
- OpenAI/Gemini Integration (AI layer)

**CI/CD:** GitHub Actions + Vercel + Codemagic.  
**Monitoring:** Supabase logs + Sentry.

---

## 3. ⚙️ Module & Phase
### Phase 1 — Core Foundation (4–6 tuần)
- Auth & RLS setup (admin/teacher/student)
- Web MVP: CRUD cho `users`, `classes`, `students`
- Score management + audit logs
- AI Feedback (Edge Function: `generate_ai_insight`)

### Phase 2 — Mobile & Teacher Tools (4–8 tuần)
- Flutter MVP: hiển thị điểm, bài tập, thông báo
- Teacher Dashboard (Web): xuất PDF, bảng dữ liệu lớn
- Notifications: bảng `notifications` + Function `notify_updates`
- Realtime Sync (scores, announcements)

### Phase 3 — Optimization & AI Scaling (6–10 tuần)
- AI model refinement (weekly analysis, suggestions)
- Personalized learning plans
- Caching, SQL optimization, audit & backup

---

## 4. 🚀 AI-Driven Workflow
| Role | Tool | Trách nhiệm |
|------|------|--------------|
| AI CTO | Gemini / GPT-4 | Review kiến trúc, RLS, CI/CD |
| AI Dev | Copilot / Cline | Sinh mã, viết Edge Functions, test |
| Human Dev/PM | Flutter, React | UI/UX, hiệu năng, review merge |

---

## 5. 🧱 Cấu trúc thư mục Monorepo
```
project_root/
├─ web/                # Next.js app (Admin/Teacher)
├─ mobile/             # Flutter app (Student)
├─ backend/
│  ├─ migrations/      # SQL schema & RLS
│  ├─ functions/       # Edge Functions (TypeScript)
│  └─ seed/            # Sample data
├─ ai/                 # Python AI logic & prompt templates
└─ docs/
   ├─ PLAN.md
   ├─ ARCHITECTURE.md
   └─ BACKEND_SETUP.md
```

---

## 6. 📆 Tổng thời gian
**Ước lượng:** 5–7.5 tháng (10–12 sprints)  
**Chi phí MVP:** 0–200 USD/tháng  
**Chi phí mở rộng:** 300–2000 USD/tháng khi AI scale.
