# Audit Lễ tân 360 và vòng đời ghi danh

## Phạm vi

Audit này đối chiếu luồng vận hành lễ tân trong `Tong_Hop_HP` với schema, API và
UI hiện có của BH-EDU. Mục tiêu là xác định nền tảng cần sửa trước khi xây màn
hình “Lễ tân 360”.

Các thao tác mục tiêu:

- tìm và kiểm tra trùng học sinh;
- tạo/cập nhật hồ sơ;
- đăng ký một học sinh vào nhiều lớp;
- nghỉ lớp theo ngày hiệu lực;
- chuyển lớp mà không mất lịch sử;
- thông báo thay đổi cho giáo viên, học vụ và kế toán;
- xem dữ liệu liên quan từ một màn hình.

## Kết luận

BH-EDU đã có phần lớn thực thể nền: học sinh, lớp, ghi danh, lịch, điểm danh,
yêu cầu, thông báo, phân quyền và audit. Tuy nhiên vòng đời ghi danh chưa đủ an
toàn để làm nguồn chuẩn cho trung tâm.

Không nên bắt đầu bằng việc ghép thêm một giao diện tổng hợp. Lát cắt đầu tiên
phải chuẩn hóa schema và một API command duy nhất cho đăng ký/nghỉ/chuyển lớp.

## Thành phần có thể tái sử dụng

| Thành phần      | Hiện có                                                   | Hướng sử dụng                                                            |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| Hồ sơ học sinh  | `profiles`, `student_profiles`, StudentRepository/Service | Giữ làm nguồn chuẩn; bổ sung kiểm tra trùng có cấu trúc.                 |
| Mã học sinh     | `student_code` và logic sinh mã                           | Giữ làm mã nghiệp vụ; UUID vẫn là khóa nội bộ.                           |
| Lớp             | `classes`, ClassRepository/Service                        | Tái sử dụng; cần khóa nghiệp vụ lớp ổn định để import/đối chiếu.         |
| Ghi danh        | `enrollments`, EnrollmentRepository                       | Giữ bảng nhưng mở rộng vòng đời và thay logic mutation.                  |
| Yêu cầu         | `student_requests` có `class_transfer`                    | Có thể dùng cho bước phê duyệt; việc duyệt phải gọi command transaction. |
| Thông báo       | Notifications API/service                                 | Dùng cho sự kiện sau khi transaction thành công.                         |
| Audit           | `audit_logs` và helper audit                              | Dùng để ghi trước/sau, người thao tác và lý do.                          |
| UI học sinh/lớp | Các trang students, classes, enrollments                  | Tái sử dụng component và API đọc; không giữ các mutation nguy hiểm.      |

## Phát hiện ưu tiên

### P0 — Chuyển lớp không atomic và làm mất lịch sử

`EnrollmentRepository.transferStudent()` hiện xóa ghi danh lớp cũ rồi tạo ghi
danh lớp mới bằng hai request tuần tự. Nếu bước tạo mới thất bại, học sinh không
còn ở lớp cũ. Logic cũng không lưu ngày hiệu lực, lý do hoặc liên kết giữa hai
ghi danh.

Yêu cầu sửa:

- thay bằng RPC/database transaction;
- cập nhật ghi danh cũ thành `transferred`/`withdrawn` tương ứng thay vì xóa;
- lưu ngày kết thúc, lý do, lớp/ghi danh đích và người thực hiện;
- tạo ghi danh mới cùng transaction;
- chỉ phát thông báo sau khi commit thành công.

### P0 — API vẫn cho phép xóa ghi danh vật lý

`DELETE /api/classes/[classId]/enrollments?studentId=...` xóa trực tiếp dòng
`enrollments`. UI quản lý ghi danh gọi API này với nội dung “xóa học sinh khỏi
lớp”, kể cả xóa hàng loạt.

Điều này không phù hợp với dữ liệu điểm danh, học phí, kết quả học tập và yêu cầu
truy vết. API DELETE cần được loại bỏ khỏi UI nghiệp vụ; nếu giữ cho mục đích sửa
dữ liệu đặc biệt thì phải giới hạn quyền, kiểm tra quan hệ và audit riêng.

### P0 — Không có ngày kết thúc và lý do trạng thái

`enrollments` mới lưu `enrollment_date` và `status`. Không có các trường cần thiết
để xác định học sinh thuộc lớp tại một ngày cụ thể:

- `end_date`;
- `status_reason`;
- `ended_by`/`ended_at`;
- `source_enrollment_id` hoặc quan hệ chuyển lớp;
- nguồn tạo/import và khóa idempotency.

Thiếu các trường này khiến điểm danh, học phí tháng và danh sách giáo viên dễ
khác nhau.

### P0 — Trạng thái chưa thống nhất

Enum database và schema request dùng `enrolled`, `completed`, `dropped`,
`withdrawn`, nhưng một đường service vẫn tạo ghi danh với trạng thái `active`.
Một số UI tiếp tục coi `active/inactive` là alias. Cần chuẩn hóa ở database và
xóa alias khỏi mutation; alias chỉ được dùng tạm ở lớp đọc dữ liệu cũ.

### P1 — Unique constraint không biểu diễn nhiều giai đoạn học

Unique `(student_id, class_id)` ngăn một học sinh quay lại cùng lớp trong một
giai đoạn mới. Upsert hiện có thể biến việc ghi danh lại thành ghi đè ngày bắt
đầu/trạng thái của lịch sử cũ.

Nên thay bằng unique partial cho ghi danh đang hoạt động hoặc thêm khái niệm
`enrollment_period`. Mỗi lần quay lại lớp là một dòng vòng đời mới.

### P1 — Nhiều API mutation chồng chéo

Hiện có mutation qua:

- `/api/admin/enrollments`;
- `/api/admin/enrollments/[id]`;
- `/api/classes/[classId]/enrollments`;
- `/api/classes/[classId]/enrollments/[studentId]`;
- phương thức trực tiếp trong StudentService/EnrollmentRepository.

Các đường này dùng validation, auth và hành vi khác nhau. Cần một service/command
chính; route cũ phải gọi vào cùng command hoặc được ngừng dùng.

### P1 — Mutation dùng service role không đồng nhất với permission system

Một số class-enrollment route dùng `adminAuth` rồi service client, bỏ qua RLS và
permission code chi tiết. Route admin mới hơn dùng `getDataClient` cùng
`enrollments.manage`. Cần chuẩn hóa quyền ở API và giữ RLS như lớp bảo vệ thứ hai.

### P1 — Tạo ghi danh theo lô không atomic

Route lớp hiện upsert từng học sinh trong vòng lặp. Kết quả có thể thành công một
phần và chỉ trả danh sách lỗi chuỗi. Cần RPC/batch command trả kết quả từng dòng,
idempotency key và chính sách rõ ràng: all-or-nothing hoặc partial có audit.

### P2 — UI không phù hợp công việc lễ tân

Trang ghi danh hiện:

- bắt đầu từ lớp thay vì bắt đầu từ học sinh;
- tải tối đa 1.000 học sinh rồi lọc ở client;
- không hiển thị cảnh báo trùng hoặc chất lượng hồ sơ;
- không yêu cầu ngày hiệu lực/lý do khi nghỉ;
- xóa hàng loạt bằng nhiều request tuần tự;
- không hiển thị tác động tới lịch, điểm danh và học phí.

Trang này vẫn hữu ích cho quản trị danh sách lớp, nhưng không nên là giao diện
Lễ tân 360.

## Mô hình vòng đời đề xuất

### Trạng thái

| Trạng thái    | Ý nghĩa                                    |
| ------------- | ------------------------------------------ |
| `enrolled`    | Đang học trong khoảng hiệu lực.            |
| `completed`   | Hoàn thành lớp theo kế hoạch.              |
| `withdrawn`   | Chủ động nghỉ lớp.                         |
| `transferred` | Kết thúc do chuyển sang lớp khác.          |
| `dropped`     | Trung tâm dừng ghi danh vì lý do quản trị. |

### Trường tối thiểu

| Trường                                 | Mục đích                                        |
| -------------------------------------- | ----------------------------------------------- |
| `enrollment_date`                      | Ngày bắt đầu hiệu lực.                          |
| `end_date`                             | Ngày cuối còn thuộc lớp, nullable khi đang học. |
| `status`                               | Trạng thái vòng đời chuẩn.                      |
| `status_reason`                        | Lý do nghiệp vụ bắt buộc khi kết thúc.          |
| `ended_at`, `ended_by`                 | Audit thao tác kết thúc.                        |
| `previous_enrollment_id`               | Liên kết nguồn khi chuyển lớp.                  |
| `source_system`, `source_key`          | Chống trùng khi import từ hệ thống cũ.          |
| `created_by`, `updated_by`, timestamps | Truy vết chuẩn.                                 |

Ràng buộc chính:

- `end_date >= enrollment_date`;
- chỉ một ghi danh `enrolled` cho cùng học sinh-lớp tại một thời điểm;
- không cho khoảng hiệu lực của cùng học sinh-lớp chồng nhau;
- ghi danh chuyển lớp mới phải bắt đầu sau hoặc theo chính sách ngày kết thúc
  của ghi danh cũ;
- capacity và trạng thái lớp được kiểm tra trong transaction.

## Command nghiệp vụ đề xuất

### `enroll_student`

Đầu vào: học sinh, lớp, ngày bắt đầu, ghi chú, idempotency key.

Kiểm tra: đúng vai trò học sinh, lớp hoạt động, không trùng khoảng thời gian,
capacity và quyền thao tác.

### `end_enrollment`

Đầu vào: enrollment, ngày kết thúc, trạng thái kết thúc, lý do.

Kiểm tra tác động tới buổi học tương lai và hóa đơn chưa chốt; trả cảnh báo để UI
yêu cầu xác nhận khi cần.

### `transfer_student`

Đầu vào: ghi danh nguồn, lớp đích, ngày hiệu lực, lý do, lựa chọn điều chỉnh tài
chính nếu được phép.

Trong một transaction:

1. khóa ghi danh nguồn và lớp đích;
2. kiểm tra trạng thái/capacity/xung đột;
3. kết thúc ghi danh nguồn;
4. tạo ghi danh đích và liên kết hai dòng;
5. ghi audit/outbox event;
6. trả ảnh hưởng tới lịch và học phí.

## Lát cắt triển khai đầu tiên

### Migration

- thêm trường vòng đời và nguồn dữ liệu;
- bổ sung `transferred` vào enum;
- thay unique constraint bằng quy tắc hỗ trợ lịch sử;
- tạo RPC atomic cho đăng ký, kết thúc và chuyển lớp;
- tạo index tra cứu theo học sinh/lớp/khoảng hiệu lực;
- giữ tương thích đọc cho dữ liệu hiện tại.

### Backend

- tạo EnrollmentLifecycleService gọi các RPC;
- hợp nhất validation và permission;
- chuyển route hiện hữu sang command mới;
- ngừng DELETE vật lý từ giao diện;
- thêm test rollback, idempotency, capacity và permission.

### UI pilot

- thêm thẻ “Lớp đang học” trong hồ sơ học sinh;
- form Đăng ký lớp, Nghỉ lớp, Chuyển lớp có ngày hiệu lực và lý do;
- hiển thị preview tác động trước khi xác nhận;
- timeline lịch sử ghi danh;
- chưa cần xây toàn bộ dashboard Lễ tân 360 trong lát cắt đầu.

## Tiêu chí hoàn thành lát cắt

- Không còn đường UI nào xóa vật lý ghi danh.
- Chuyển lớp thành công hoặc rollback toàn bộ.
- Có thể truy vấn chính xác học sinh thuộc lớp nào tại một ngày bất kỳ.
- Ghi danh lại cùng lớp không ghi đè lịch sử cũ.
- Trạng thái chỉ dùng bộ enum chuẩn.
- Mọi thay đổi có người thực hiện, thời điểm và lý do.
- API, repository và RPC có test cho đường thành công và thất bại.
- Finance và attendance có thể lọc ghi danh theo ngày hiệu lực.
