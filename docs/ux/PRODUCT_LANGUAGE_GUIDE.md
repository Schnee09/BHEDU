# Quy chuẩn ngôn ngữ sản phẩm BH-EDU

## Mục tiêu

Ngôn ngữ giao diện phải mô tả đúng công việc của trung tâm, ngắn gọn và nhất
quán giữa bộ phận tiếp nhận, giáo viên, kế toán, phụ huynh và học sinh THCS/THPT.
Không dùng tên mang tính khẩu hiệu nếu người dùng không thể đoán được chức năng.

Quy chuẩn này áp dụng cho nhãn điều hướng, tiêu đề trang, nút thao tác, thông báo
và nội dung trợ giúp. Tên kỹ thuật trong database, API và mã nguồn không đổi chỉ
để đồng bộ câu chữ giao diện.

## Thuật ngữ chuẩn

| Dùng thống nhất          | Phạm vi sử dụng                                                                    | Hạn chế dùng                                                |
| ------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Học sinh**             | Dùng thống nhất trong hồ sơ, lớp học, điểm danh, học phí và trao đổi với phụ huynh | `học viên`                                                  |
| **Hồ sơ học sinh**       | Thông tin cá nhân, liên hệ, trạng thái và lịch sử học tại trung tâm                | `quản trị học sinh`                                         |
| **Mã học sinh**          | Mã do trung tâm cấp                                                                | `UID`, `ID học sinh` trên giao diện                         |
| **Mã định danh cá nhân** | CCCD hoặc mã định danh chính thức                                                  | gộp với mã học sinh                                         |
| **Đăng ký lớp**          | Học sinh bắt đầu học một lớp từ ngày xác định                                      | `ghi danh` ở các màn hình dành cho người dùng phổ thông     |
| **Nghỉ lớp**             | Học sinh dừng học một lớp, có ngày và lý do                                        | `xóa khỏi lớp`                                              |
| **Chuyển lớp**           | Chuyển từ lớp đang học sang lớp khác, vẫn giữ lịch sử                              | mô tả như hai thao tác rời                                  |
| **Còn phải đóng**        | Số tiền gia đình còn cần thanh toán                                                | `khoản phải thu` ngoài màn hình kế toán                     |
| **Công nợ quá hạn**      | Khoản học phí đã qua hạn thanh toán                                                | `nợ` cho khoản chưa đến hạn                                 |
| **Thu học phí**          | Hóa đơn, thanh toán, hoàn tiền và công nợ                                          | `tài chính & học phí` nếu trang chủ yếu phục vụ thu tiền    |
| **Học phí theo lớp**     | Theo dõi học phí tháng theo lớp và học sinh                                        | `lưới học phí`                                              |
| **Yêu cầu học tập**      | Xin nghỉ, học bù, đổi ca hoặc các đề nghị liên quan                                | `đơn từ trực tuyến`, `yêu cầu học vụ` ở giao diện phụ huynh |
| **Người dùng**           | Tài khoản, vai trò, phân quyền và đăng nhập                                        | dùng để gọi học sinh                                        |
| **Nhân sự**              | Giáo viên, gia sư, bộ phận tiếp nhận và kế toán                                    | `người dùng` khi nói về đội ngũ trung tâm                   |

## Tên chức năng chính

| Tên cũ            | Tên chuẩn          |
| ----------------- | ------------------ |
| Lễ tân 360        | Tiếp nhận học sinh |
| Quản trị học sinh | Hồ sơ học sinh     |
| Ghi danh học sinh | Đăng ký lớp        |
| Quản trị lớp học  | Lớp học            |
| Quản lý Học kèm   | Học kèm            |
| Học phí & Hóa đơn | Thu học phí        |
| Lưới học phí      | Học phí theo lớp   |
| Đơn từ trực tuyến | Yêu cầu học tập    |
| Bảng điều khiển   | Tổng quan          |

## Cách viết

- Dùng câu chủ động và nêu kết quả: `Tạo hồ sơ`, `Đăng ký lớp`, `Ghi nhận
thanh toán`.
- Nút chính bắt đầu bằng động từ; nhãn điều hướng dùng danh từ hoặc cụm danh từ.
- Không viết hoa từng từ trong câu tiếng Việt. Viết `Thêm người dùng mới`, không
  viết `Thêm Người Dùng Mới`.
- Tránh thuật ngữ kỹ thuật như `UID`, `RPC`, `bulk`, `sync` nếu người dùng không
  cần biết cách hệ thống triển khai.
- Phân biệt `không có dữ liệu`, `không tìm thấy kết quả` và `không có quyền`.
- Thông báo lỗi nói rõ việc chưa hoàn tất và bước tiếp theo.
- Trạng thái phải có nhãn bằng chữ, không chỉ dựa vào màu sắc hoặc biểu tượng.

## Phạm vi chuyển đổi

Việc chuẩn hóa được thực hiện theo từng module để có thể kiểm thử và rà soát ngữ
cảnh. Ưu tiên theo thứ tự: điều hướng và tìm kiếm, tiếp nhận/đăng ký lớp, tài chính,
yêu cầu học tập, hồ sơ và biểu mẫu. Tên database, route API và type TypeScript có
thể tiếp tục dùng `student`, `user`, `invoice` cho đến khi có lý do kỹ thuật để
đổi.
