# BH-EDU Web

Ứng dụng quản lý trung tâm dạy thêm dành cho học sinh cấp 2 và cấp 3, xây dựng bằng Next.js 16, React 19 và Supabase.

## Chức năng chính

- Quản lý học sinh, giáo viên, lớp học và ghi danh.
- Điểm danh, nhập điểm và theo dõi kết quả học tập.
- Quản lý học phí theo tháng, hóa đơn, thanh toán và giảm giá.
- Phân quyền theo vai trò và quyền nghiệp vụ cụ thể.
- Nhật ký hoạt động, thông báo và giám sát tình trạng hệ thống.

## Yêu cầu

- Node.js 24 trên CI hoặc phiên bản tương thích với Next.js 16.
- npm 10.9.4, đúng với trường `packageManager` trong `package.json`.
- Một dự án Supabase đã áp dụng đầy đủ migration của repository.

## Cấu hình môi trường

Tạo `web/.env.local` và chỉ lưu bí mật ở máy cục bộ hoặc hệ thống quản lý biến môi trường của Vercel.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Không commit `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` chỉ được sử dụng ở phía máy chủ và tuyệt đối không đặt trong biến bắt đầu bằng `NEXT_PUBLIC_`.

## Phát triển cục bộ

Chạy các lệnh từ thư mục `web`:

```powershell
npm ci
npm run dev
```

Ứng dụng mặc định chạy tại [http://localhost:3000](http://localhost:3000).

## Kiểm tra chất lượng

```powershell
npm run typecheck
npm run lint
npm test -- --runInBand
npm run build
npm run security:audit
```

`security:audit` chặn lỗ hổng production mức high/critical, ngoại trừ allowlist hẹp được ghi rõ trong script audit.

## Xác thực và phân quyền

- API nghiệp vụ dùng phiên đăng nhập Supabase của ứng dụng.
- API quản trị kiểm tra quyền chi tiết như `users.create`, `students.view` hoặc `finance.manage`.
- Tạo tài khoản qua `/api/admin/users`; endpoint này tạo đồng bộ tài khoản Auth và hồ sơ nghiệp vụ.
- Các endpoint thử nghiệm dùng khóa tĩnh trước đây đã ngừng hoạt động.

## Triển khai

Vercel phải đặt Root Directory là `web` và sử dụng lockfile đã commit:

- Install Command: `npm ci`
- Build Command: `npm run build`
- Output: `.next`

Sau khi triển khai:

1. Kiểm tra `/api/health`.
2. Đăng nhập bằng tài khoản quản trị hợp lệ.
3. Kiểm tra các luồng học sinh, lớp học, điểm danh và tài chính theo đúng quyền.
4. Theo dõi log Vercel và Sentry nếu có lỗi runtime.

## Lưu ý vận hành

- Không tạo hồ sơ trực tiếp bằng service role bên ngoài quy trình nghiệp vụ.
- Không sửa dữ liệu production bằng script thử nghiệm cũ.
- Luôn chạy migration trước khi triển khai mã phụ thuộc schema mới.
- Xoay ngay mọi khóa đã từng xuất hiện trong Git hoặc log công khai.
