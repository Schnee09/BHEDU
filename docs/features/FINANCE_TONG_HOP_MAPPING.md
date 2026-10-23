# Ánh xạ `Tong_Hop_HP` sang Finance BH-EDU

## Mục đích và phạm vi

Tài liệu này mô tả cách diễn giải dữ liệu nghiệp vụ trong Google Sheet
`Tong_Hop_HP` vào mô hình dữ liệu BH-EDU. Ở giai đoạn hiện tại, Google Sheet chỉ
là nguồn tham chiếu nghiệp vụ; hệ thống **không đồng bộ và không nhập dữ liệu
thật** từ Sheet.

URL nguồn tham chiếu:
`https://docs.google.com/spreadsheets/d/1TEAUm7A5avS70SC_V_7spyZu_GtwM5w1adpXuu40qNs/edit`

Các nguyên tắc:

- Ánh xạ theo thực thể nghiệp vụ, không sao chép cấu trúc 73 tab vào database.
- Một học viên có thể học nhiều lớp; mỗi tổ hợp học viên - lớp - tháng là một
  khoản học phí độc lập.
- Chỉ lưu dữ liệu gốc và lịch sử giao dịch. Các giá trị tổng hợp như đã thu,
  còn nợ và thu dư phải được tính từ hóa đơn, thanh toán và hoàn tiền.
- Không xóa hoặc sửa ngược giao dịch đã chốt. Hủy và hoàn tiền phải tạo dấu vết
  kiểm toán.
- Mọi lần nhập dữ liệu sau này phải có bước xem trước, đối chiếu và khóa chống
  nhập trùng.

## Ánh xạ thực thể

| Nguồn trong `Tong_Hop_HP`        | Khóa nguồn                       | Đích BH-EDU                     | Ghi chú                                                                                                              |
| -------------------------------- | -------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `[HỌC SINH]`                     | `Mã HS`                          | `profiles` + `student_profiles` | `profiles.student_code` giữ mã dạng `HS...`; thông tin liên hệ và hồ sơ tách theo schema hiện hành.                  |
| `[DANH MỤC LỚP]`                 | `Khóa hệ thống`, `Mã lớp`        | `classes`                       | UUID là khóa nội bộ. Cần bổ sung khóa nguồn ổn định trước khi import thật; không dùng tên lớp để nhận diện duy nhất. |
| Danh sách học viên trong các lớp | `Mã HS` + `Mã lớp`               | `enrollments`                   | Trạng thái nghỉ/chuyển lớp phải ánh xạ thành vòng đời ghi danh, không xóa lịch sử.                                   |
| Mức học phí lớp                  | `Mã lớp` + ngày/tháng hiệu lực   | `class_tuition_rates`           | `monthly_amount`, `effective_from`, `effective_to`; không suy đoán mức phí mặc định.                                 |
| Giảm học phí cá nhân             | `Mã HS` + `Mã lớp` + kỳ hiệu lực | `student_tuition_discounts`     | Hỗ trợ giảm theo phần trăm hoặc số tiền cố định và phải có lý do.                                                    |
| `[PROD] LẬP HỌC PHÍ`             | `Mã khoản`                       | `invoices` + `invoice_items`    | Mỗi dòng là một hóa đơn tháng theo lớp. `Tháng` → `billing_period`; `Phải thu đã duyệt` → số tiền sau giảm.          |
| `[PROD] THU TIỀN`                | `Mã giao dịch`                   | `payments`                      | `Mã khoản` xác định hóa đơn; ngày, số tiền, phương thức và người thu được giữ nguyên.                                |
| Hủy/hoàn chuyển tiền             | mã giao dịch gốc + mã hoàn       | `payment_refunds`               | Không ghi số âm trực tiếp vào `payments`; hoàn tiền tham chiếu giao dịch và hóa đơn gốc.                             |
| `[PROD] CÔNG NỢ`                 | `Mã khoản`                       | Truy vấn/view báo cáo           | `Phải thu`, `Đã thu`, `Còn nợ`, `Thu dư` là kết quả tính, không phải nguồn ghi độc lập.                              |
| Nhật ký vận hành                 | mã đối tượng + thời điểm         | `audit_logs`/nhật ký import     | Dùng cho truy vết, cảnh báo và kết quả xử lý; không thay thế dữ liệu nghiệp vụ.                                      |

## Ánh xạ trường học phí

| Trường Sheet        | Trường/nguồn BH-EDU                             | Quy tắc                                                                                    |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `Tháng`             | `invoices.billing_period`                       | Chuẩn hóa thành ngày đầu tháng, ví dụ `10/2026` → `2026-10-01`.                            |
| `Mã HS`             | `profiles.student_code` → `invoices.student_id` | Tra UUID bằng mã học sinh; mã không tồn tại phải đưa vào danh sách lỗi.                    |
| `Mã lớp`            | khóa nguồn lớp → `invoices.class_id`            | Không ghép bằng tên hiển thị hoặc tên giáo viên.                                           |
| `Phải thu đã duyệt` | `invoices.total_amount`                         | Số tiền cuối cùng phải thu.                                                                |
| Mức thu trước giảm  | `invoices.gross_amount`                         | Lấy từ mức học phí lớp có hiệu lực trong tháng.                                            |
| Khoản giảm          | `invoices.discount_amount`                      | `gross_amount - total_amount`; phải khớp quy tắc giảm nếu có.                              |
| `Mã khoản`          | khóa nguồn hóa đơn                              | Dùng để chống nhập trùng và liên kết giao dịch cũ; không thay thế `invoice_number` nội bộ. |
| `Ghi chú`           | `invoices.notes`                                | Giữ nội dung nghiệp vụ, không nhúng trạng thái tính toán.                                  |
| `Duyệt học phí`     | trạng thái import/phê duyệt                     | Chỉ dòng đã chốt mới đủ điều kiện nhập.                                                    |

## Ánh xạ trường thanh toán

| Trường Sheet   | Trường/nguồn BH-EDU         | Quy tắc                                                                             |
| -------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| `Mã giao dịch` | khóa nguồn thanh toán       | Khóa chống nhập trùng; `receipt_number` tiếp tục là số phiếu thu nội bộ.            |
| `Ngày thu`     | `payments.payment_date`     | Ngày nghiệp vụ, không lấy ngày import.                                              |
| `Mã khoản`     | hóa đơn theo khóa nguồn     | Bắt buộc tìm thấy đúng một hóa đơn.                                                 |
| `Số tiền nhận` | `payments.amount`           | Phải lớn hơn 0 và không vượt quy tắc thu của hóa đơn.                               |
| `Phương thức`  | `payment_methods`           | Chuẩn hóa danh mục như tiền mặt/chuyển khoản; không tạo phương thức theo từng dòng. |
| `Mã KT`        | `payments.reference_number` | Mã tham chiếu ngân hàng/kế toán, không dùng làm ID nội bộ.                          |
| `Người thu`    | `payments.received_by`      | Tra tài khoản nhân viên; thiếu ánh xạ phải được cảnh báo.                           |
| `Trạng thái`   | `payments.status`           | Chỉ giao dịch đã chốt hợp lệ mới được tính thu.                                     |
| `Đối soát`     | trạng thái đối soát riêng   | Schema hiện tại chưa có mô hình đối soát đầy đủ.                                    |
| `Hóa đơn`      | trạng thái chứng từ         | Schema hiện tại chưa có mô hình xuất hóa đơn/chứng từ đầy đủ.                       |

## Khoảng trống cần hoàn thiện trước khi nhập thật

1. **Khóa nguồn ngoài:** thêm nơi lưu `source_system`, mã lớp nguồn, `Mã khoản`
   và `Mã giao dịch`, kèm unique constraint phù hợp để import có tính idempotent.
2. **Đối soát thanh toán:** bổ sung trạng thái, thời điểm và người đối soát; nếu
   cần đối chiếu sao kê thì lưu thêm mã/dòng sao kê thay vì ghi đè giao dịch.
3. **Chứng từ/hóa đơn:** thống nhất trung tâm có cần quản lý xuất hóa đơn riêng
   với phiếu thu hay không trước khi thiết kế bảng.
4. **Vòng đời ghi danh:** xác nhận ngày vào lớp, ngày kết thúc và cách xử lý học
   sinh nghỉ giữa tháng để quyết định có tính đủ tháng hay tính điều chỉnh.
5. **Kiểu database sinh tự động:** cập nhật lại `web/lib/database.types.ts` sau
   các migration Finance mới; file hiện chưa phản ánh đầy đủ các cột mới.

## Quy trình import dự kiến

1. Chụp phiên bản nguồn và ghi mã lần import.
2. Đọc dữ liệu vào vùng staging, không ghi thẳng vào bảng nghiệp vụ.
3. Chuẩn hóa mã, ngày tháng, số tiền và danh mục phương thức.
4. Kiểm tra khóa trùng, quan hệ học viên/lớp, tổng tiền và trạng thái chốt.
5. Xuất báo cáo xem trước: hợp lệ, cảnh báo, lỗi và sai lệch tổng tiền.
6. Người có thẩm quyền xác nhận lần import.
7. Ghi dữ liệu theo transaction/idempotency key và lưu nhật ký từng dòng.
8. Đối chiếu tổng phải thu, tổng đã thu, công nợ và số giao dịch với nguồn.

## Cảnh báo về importer cũ

`web/scripts/import-excel-tuition.ts` là script thử nghiệm theo cấu trúc workbook
cũ và **không được dùng cho dữ liệu thật**. Script này nhận diện lớp bằng tên,
suy đoán học phí mặc định, tạo tài khoản giáo viên và ghi trực tiếp vào bảng
nghiệp vụ. Importer chính thức phải được viết lại theo quy trình staging và xem
trước ở trên.
