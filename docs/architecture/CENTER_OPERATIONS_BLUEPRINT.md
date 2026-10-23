# Blueprint vận hành số cho trung tâm BH-EDU

## 1. Mục tiêu

BH-EDU không chỉ thay thế một file Excel. Mục tiêu là tạo một hệ thống vận hành
trung tâm có một nguồn dữ liệu chuẩn, trong đó lễ tân, giáo viên, học vụ, kế toán,
quản lý và phụ huynh nhìn thấy đúng phần dữ liệu dành cho mình và cùng làm việc
trên một trạng thái nhất quán.

Google Sheet `Tong_Hop_HP` hiện được dùng làm nguồn tham chiếu nghiệp vụ để hiểu
cách trung tâm đang vận hành. Sheet chưa phải nguồn đồng bộ trực tiếp và chưa có
dữ liệu thật nào được nhập vào BH-EDU.

Nguồn tham chiếu:
`https://docs.google.com/spreadsheets/d/1TEAUm7A5avS70SC_V_7spyZu_GtwM5w1adpXuu40qNs/edit`

## 2. Vấn đề cần giải quyết

- Một thay đổi phải nhập hoặc chép lại ở nhiều nơi.
- Dữ liệu học sinh, lớp, trạng thái học và học phí có thể lệch nhau giữa lễ tân,
  giáo viên và kế toán.
- Thay đổi không đến đúng người hoặc đến trễ.
- Ghi chú tự do khó chuyển thành hành động có người chịu trách nhiệm và hạn xử
  lý.
- Công thức, tab ẩn và script trong Sheet đang gánh cả dữ liệu, quy trình, phân
  quyền, hàng đợi và báo cáo.
- Sai sót chỉ được phát hiện ở bước đối chiếu cuối thay vì ngay lúc nhập.
- Khó xác định ai đã thay đổi thông tin nào và dữ liệu nào là bản đúng.

## 3. Nguyên tắc kiến trúc vận hành

### Một nguồn dữ liệu chuẩn

Mỗi loại thông tin chỉ có một nơi chịu trách nhiệm chính:

| Dữ liệu                                  | Nguồn chuẩn trong BH-EDU | Không lưu lặp như dữ liệu gốc          |
| ---------------------------------------- | ------------------------ | -------------------------------------- |
| Hồ sơ học sinh và liên hệ phụ huynh      | Hồ sơ học sinh           | Tên/SĐT sao chép tại từng lớp          |
| Danh mục lớp, môn, giáo viên, lịch chuẩn | Lớp và thời khóa biểu    | Chuỗi mô tả lớp trong nhiều tab        |
| Học sinh đang học lớp nào                | Ghi danh                 | Danh sách lớp riêng của từng giáo viên |
| Buổi học và điểm danh                    | Lịch học + điểm danh     | Checkbox phân tán theo file giáo viên  |
| Học phí theo lớp và kỳ                   | Cấu hình học phí         | Mức thu gõ lại trên từng dòng          |
| Hóa đơn, thu tiền, hoàn tiền             | Finance                  | Tổng tiền hoặc trạng thái tự ghi tay   |
| Yêu cầu và việc cần xử lý                | Workflow/task            | Ghi chú tự do không có người phụ trách |
| Nhật ký thay đổi                         | Audit log                | Các bản sao lịch sử thủ công           |

### Dữ liệu gốc và dữ liệu tính toán

Hệ thống chỉ ghi sự kiện và dữ liệu gốc. Các giá trị như sĩ số, số buổi vắng,
tổng phải thu, đã thu, còn nợ và tỷ lệ thu được tính từ dữ liệu nguồn để tránh
chênh lệch.

### Không sửa mất lịch sử

Nghỉ học, chuyển lớp, hủy hóa đơn, hoàn tiền và sửa hồ sơ phải có hiệu lực theo
thời gian và có nhật ký. Không xóa một dòng cũ để biểu diễn trạng thái mới.

### Nhập một lần, thông báo đúng người

Người phát hiện thay đổi nhập tại nơi gần công việc nhất. Hệ thống kiểm tra dữ
liệu, cập nhật nguồn chuẩn và tạo thông báo hoặc việc cần xử lý cho vai trò liên
quan.

## 4. Các miền nghiệp vụ cần bao phủ

| Miền               | Quy trình hiện thấy trong Sheet                  | Năng lực đích của web/app                                                 | Hiện trạng sơ bộ                                             |
| ------------------ | ------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Tiếp nhận/CRM      | Lễ tân tìm học sinh, thêm hồ sơ, đăng ký học     | Tìm kiếm hợp nhất, hồ sơ tiềm năng/học sinh, kiểm tra trùng, tạo ghi danh | Có hồ sơ và tìm kiếm; thiếu luồng lễ tân xuyên suốt          |
| Hồ sơ học sinh     | `[HỌC SINH]`, cảnh báo thiếu/trùng dữ liệu       | Hồ sơ chuẩn, liên hệ phụ huynh, cảnh báo chất lượng dữ liệu               | Có module học sinh; cần quy tắc trùng và trạng thái xác minh |
| Lớp và ghi danh    | Danh mục lớp, đăng ký, nghỉ/chuyển lớp           | Lớp, lịch, ghi danh có hiệu lực, chuyển lớp có transaction                | Có classes/enrollments; thiếu workflow chuyển/nghỉ rõ ràng   |
| Lịch học           | Lịch chuẩn và `[LỊCH NGOẠI LỆ]`                  | Lịch lặp, nghỉ/bù/đổi phòng/đổi giáo viên theo ngày                       | Có timetable/calendar; cần đối chiếu nghiệp vụ ngoại lệ      |
| Điểm danh          | File riêng theo giáo viên và tháng               | Danh sách buổi học sinh tự sinh từ lịch và ghi danh                       | Có attendance; cần xác nhận luồng giáo viên thực tế          |
| Ghi chú giáo viên  | Theo dõi thay đổi ghi chú, đánh dấu đã xem       | Ghi chú có loại, mức ưu tiên, người nhận và xác nhận đã xử lý             | Có notes/notifications; thiếu inbox nghiệp vụ thống nhất     |
| Học phí            | Lập học phí tháng theo học sinh-lớp              | Mức học phí, giảm giá, hóa đơn theo lớp/tháng                             | Nền tảng mới đã có                                           |
| Thu tiền/kế toán   | Thu tiền, phiếu thu, hoàn, đối soát, hóa đơn     | Giao dịch bất biến, phiếu thu, hoàn tiền, đối soát ngân hàng              | Có thu/hoàn; thiếu đối soát và chứng từ đầy đủ               |
| Công nợ/liên hệ    | Danh sách nợ và nhật ký liên hệ                  | Công nợ tính tự động, lịch sử liên hệ, nhắc việc                          | Có tổng hợp Finance; thiếu case follow-up có người phụ trách |
| Công việc và lỗi   | Hàng chờ, cần xử lý, thử lại, tình trạng đồng bộ | Task queue, retry an toàn, SLA, dashboard ngoại lệ                        | Chưa có module vận hành hợp nhất                             |
| Báo cáo/quản trị   | Báo cáo tổng, đối chiếu lịch sử                  | Dashboard theo vai trò, số liệu truy xuất được về dữ liệu gốc             | Có reports/dashboard; cần KPI nghiệp vụ trung tâm            |
| Phụ huynh/học viên | Thông tin truyền qua lễ tân/giáo viên            | Cổng xem lịch, điểm danh, kết quả, học phí và thông báo                   | Có parent/student portal; cần nối đủ dữ liệu thật            |

## 5. Luồng vận hành đích

### 5.1 Tiếp nhận học sinh và đăng ký lớp

1. Lễ tân tìm theo mã, tên, số điện thoại và định danh trước khi tạo mới.
2. Hệ thống hiển thị ứng viên trùng và yêu cầu xác nhận nếu có rủi ro.
3. Lễ tân tạo/cập nhật hồ sơ một lần.
4. Chọn lớp, ngày bắt đầu và chính sách học phí.
5. Hệ thống tạo ghi danh, cập nhật sĩ số, lịch học sắp tới và cấu hình khoản thu.
6. Giáo viên/học vụ nhận thông báo thay đổi; không cần chép sang danh sách khác.

### 5.2 Nghỉ học hoặc chuyển lớp

1. Lễ tân/học vụ tạo yêu cầu với ngày hiệu lực và lý do.
2. Hệ thống kiểm tra điểm danh, khoản thu và lịch tương lai bị ảnh hưởng.
3. Người có quyền xác nhận nếu phát sinh điều chỉnh tài chính.
4. Một transaction kết thúc ghi danh cũ và, nếu chuyển lớp, tạo ghi danh mới.
5. Lịch, danh sách giáo viên, học phí và thông báo được cập nhật từ cùng sự kiện.

### 5.3 Lịch học và điểm danh

1. Lịch chuẩn của lớp sinh các buổi học dự kiến.
2. Ngoại lệ nghỉ/bù/đổi giờ được ghi trên đúng ngày và có lý do.
3. Danh sách điểm danh lấy theo ghi danh có hiệu lực tại ngày học.
4. Giáo viên điểm danh và thêm ghi chú theo học sinh/buổi học.
5. Vắng bất thường hoặc ghi chú cần xử lý tạo thông báo cho đúng vai trò.

### 5.4 Học phí và thu tiền

1. Mức học phí lớp và giảm giá cá nhân có khoảng hiệu lực.
2. Hệ thống tạo danh sách xem trước theo học sinh-lớp-tháng.
3. Kế toán/học vụ kiểm tra ngoại lệ rồi chốt hóa đơn theo lô.
4. Lễ tân ghi nhận thanh toán đúng hóa đơn; kế toán đối soát độc lập.
5. Hủy/hoàn tiền tạo giao dịch ngược có lý do, không xóa lịch sử.
6. Công nợ và thông tin phụ huynh được cập nhật tức thời từ sổ giao dịch.

### 5.5 Xử lý ngoại lệ

Mọi cảnh báo cần có `loại`, `mức ưu tiên`, `đối tượng`, `người phụ trách`, `hạn xử
lý`, `trạng thái`, `kết quả` và liên kết về dữ liệu gốc. Dashboard “Cần xử lý”
thay cho các tab lỗi/hàng chờ phân tán.

## 6. Ma trận trách nhiệm

| Vai trò            | Tạo/cập nhật chính                                | Xác nhận/đối soát                    | Chỉ xem                                    |
| ------------------ | ------------------------------------------------- | ------------------------------------ | ------------------------------------------ |
| Lễ tân             | Hồ sơ, đăng ký, yêu cầu nghỉ/chuyển, ghi nhận thu | Xác nhận thông tin phụ huynh         | Lịch, công nợ liên quan                    |
| Giáo viên          | Điểm danh, ghi chú học tập/vận hành               | Xác nhận danh sách lớp               | Thông tin tối thiểu của học sinh           |
| Học vụ             | Lớp, lịch, ghi danh, ngoại lệ                     | Nghỉ/chuyển lớp, danh sách giáo viên | Tình trạng học phí cần thiết               |
| Kế toán            | Hóa đơn, đối soát, hoàn tiền, chứng từ            | Chốt kỳ học phí và giao dịch         | Hồ sơ/liên hệ phục vụ thu phí              |
| Quản lý            | Chính sách, phân quyền, cấu hình                  | Ngoại lệ nhạy cảm và báo cáo         | Toàn cảnh hoạt động                        |
| Phụ huynh/học viên | Yêu cầu/cập nhật được cho phép                    | Xác nhận liên hệ nếu triển khai      | Lịch, điểm danh, kết quả, học phí của mình |

Quyền truy cập cần áp dụng cả ở API và database, không chỉ ẩn nút trên giao diện.

## 7. Lộ trình chuyển đổi

### Giai đoạn 0 — Chuẩn hóa nền tảng

- Chốt khóa ổn định cho học sinh, lớp và ghi danh.
- Xác định chủ sở hữu từng trường dữ liệu và chuẩn trạng thái.
- Thiết lập audit log, quy tắc chống trùng và dashboard chất lượng dữ liệu.
- Không import giao dịch thật khi chưa có staging và báo cáo đối chiếu.

### Giai đoạn 1 — Hồ sơ, lớp và ghi danh

- Làm “Lễ tân 360” để tìm học sinh một lần và thao tác từ một màn hình.
- Hoàn thiện đăng ký, nghỉ và chuyển lớp theo ngày hiệu lực.
- Tạo danh sách ngoại lệ dữ liệu để trung tâm xử lý dần.
- Đây là giai đoạn ưu tiên cao nhất vì các module khác đều phụ thuộc dữ liệu này.

### Giai đoạn 2 — Lịch, điểm danh và phối hợp giáo viên

- Chuẩn hóa lịch lặp và lịch ngoại lệ.
- Sinh buổi học và danh sách điểm danh từ ghi danh.
- Biến ghi chú giáo viên thành thông báo/việc cần xử lý có xác nhận.
- Chạy song song với file trong phạm vi một số lớp pilot.

### Giai đoạn 3 — Finance vận hành thật

- Bổ sung khóa nguồn, staging/import preview và đối soát.
- Chạy thử lập phí, thu tiền và công nợ cho nhóm lớp pilot.
- Đối chiếu tổng tiền hằng ngày/tháng trước khi mở rộng.
- Chi tiết ánh xạ nằm trong `docs/features/FINANCE_TONG_HOP_MAPPING.md`.

### Giai đoạn 4 — Cổng phụ huynh và tự phục vụ

- Cho phụ huynh xem lịch, chuyên cần, kết quả, học phí và thông báo nhất quán.
- Cho phép gửi yêu cầu có cấu trúc thay vì nhắn rời rạc.
- Chỉ mở sau khi dữ liệu nội bộ đã ổn định.

### Giai đoạn 5 — Giảm phụ thuộc Sheet

- Đo mức sử dụng và sai lệch sau từng giai đoạn.
- Chuyển Sheet sang chỉ đọc/đối chiếu theo từng miền đã ổn định.
- Lưu trữ snapshot cuối và quy trình khôi phục trước khi ngừng vận hành cũ.

## 8. Tiêu chí ưu tiên backlog

Chấm mỗi hạng mục theo năm yếu tố:

1. Số lần thao tác lặp được loại bỏ.
2. Mức độ giảm sai tiền hoặc sai trạng thái học sinh.
3. Số vai trò đang phải chờ hoặc hỏi lại thông tin.
4. Khả năng truy vết và phục hồi khi có lỗi.
5. Mức độ phụ thuộc của các chức năng phía sau.

Theo tiêu chí này, thứ tự hiện tại là:

1. Khóa dữ liệu và chất lượng hồ sơ.
2. Luồng đăng ký/nghỉ/chuyển lớp.
3. Lịch ngoại lệ và danh sách điểm danh theo hiệu lực.
4. Inbox “Cần xử lý” và thông báo theo vai trò.
5. Finance pilot và đối soát.
6. Portal phụ huynh/học viên và báo cáo quản trị.

## 9. Kiểm soát chuyển đổi và chất lượng

- Mọi import phải idempotent: chạy lại không tạo bản ghi trùng.
- Mỗi dòng nguồn phải có kết quả `hợp lệ`, `cảnh báo` hoặc `lỗi` trước khi ghi.
- Tổng số học sinh, ghi danh, hóa đơn và giao dịch phải được đối chiếu sau import.
- Các nhóm pilot có thời gian chạy song song và tiêu chí thoát pilot cụ thể.
- Mọi thay đổi nhạy cảm lưu người thực hiện, thời điểm, giá trị trước/sau và lý do.
- Thông tin định danh và liên hệ phụ huynh không xuất hiện trong log kỹ thuật.
- Dashboard vận hành phải hiển thị dữ liệu trễ, hàng đợi lỗi và việc quá hạn.

## 10. Hạng mục triển khai kế tiếp

Hạng mục nên làm tiếp theo là **Luồng Lễ tân 360 và vòng đời ghi danh**:

- tìm và kiểm tra trùng học sinh;
- tạo/cập nhật hồ sơ;
- đăng ký nhiều lớp;
- nghỉ/chuyển lớp theo ngày hiệu lực;
- xem lịch, công nợ và cảnh báo liên quan tại cùng một nơi;
- phát sinh task/thông báo cho học vụ, giáo viên và kế toán;
- audit đầy đủ, không ghi dữ liệu trực tiếp vào nhiều module.

Trước khi viết tính năng, cần audit chi tiết API/schema hiện có cho `profiles`,
`student_profiles`, `classes`, `enrollments`, `timetable`, `attendance`,
`notifications` và `student_requests` để tái sử dụng tối đa thay vì tạo hệ thống
song song.
