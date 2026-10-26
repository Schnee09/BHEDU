# BH-EDU — Kế hoạch hệ thống vận hành trung tâm

## 1. Mục tiêu

BH-EDU không sao chép cấu trúc của file `Tong_Hop_HP`. File hiện tại là nguồn khảo sát dữ liệu thật,
ngoại lệ thật và các điểm kiểm soát đã phát sinh trong quá trình vận hành. Web/app phải thay thế các
thao tác thủ công bằng một nguồn dữ liệu thống nhất, quy trình rõ ràng và lịch sử có thể kiểm tra.

Hệ thống cần trả lời chính xác năm câu hỏi:

1. Học sinh này là ai và liên hệ phụ huynh bằng cách nào?
2. Học sinh đang học lớp nào, trong khoảng thời gian nào và lịch học ra sao?
3. Hôm nay học sinh có lịch học và đã tham gia buổi học như thế nào?
4. Trung tâm cần thu gì, đã nhận bao nhiêu, đã đối soát bao nhiêu và còn thiếu bao nhiêu?
5. Việc nào đang chờ xác minh, ai phụ trách và lịch sử xử lý ra sao?

## 2. Nguyên tắc sản phẩm

### Một nguồn dữ liệu cho mỗi sự thật

- Hồ sơ học sinh và người liên hệ là dữ liệu dùng chung.
- Việc học lớp nào thuộc đăng ký lớp có ngày hiệu lực.
- Lịch định kỳ và lịch ngoại lệ quyết định buổi học thực tế.
- Khoản phải thu thể hiện nghĩa vụ tài chính.
- Thanh toán thể hiện tiền đã được ghi nhận.
- Phân bổ thanh toán nối tiền nhận với một hoặc nhiều khoản phải thu.
- Đối soát xác nhận tiền thực tế, tách biệt với ghi nhận của lễ tân.
- Điều chỉnh, hủy và hoàn tiền là giao dịch bổ sung; không xóa lịch sử cũ.

### Tự động phần chắc chắn, đưa phần chưa chắc vào hàng chờ

Hệ thống được phép tự động tạo đề xuất, cảnh báo và kết quả tính toán. Hệ thống không tự suy đoán ngày
nghỉ, tự gộp học sinh hoặc tự thay đổi khoản thu từ ghi chú tự do. Dữ liệu chưa đủ căn cứ phải trở thành
một công việc trong hộp `Cần xử lý`.

### Ngoại lệ có kiểm soát

Quy tắc mặc định không phải khóa tuyệt đối. Học thử, học bù, vào/nghỉ giữa tháng, giảm phí cá nhân,
thu bổ sung kỳ cũ, chuyển dư hoặc giao dịch gộp nhiều khoản đều có thể hợp lệ. Ngoại lệ phải có:

- quyền phù hợp;
- lý do bắt buộc;
- người thực hiện và thời điểm;
- dữ liệu trước/sau;
- khả năng tìm lại trong lịch sử.

Chỉ chặn cứng khi thao tác tạo dữ liệu trùng chắc chắn, vi phạm bất biến tài chính, vượt quyền hoặc làm
mất lịch sử.

## 3. Mô hình nghiệp vụ đích

### Đối chiếu với hệ thống đang vận hành thực tế

Roadmap này tham khảo cách tổ chức nghiệp vụ của TutorCruncher, Teachworks, Jackrabbit Class và mô
hình chứng từ của Stripe. Các sản phẩm này không được dùng làm khuôn giao diện; chúng chỉ cung cấp
bằng chứng cho những ranh giới nghiệp vụ đã được kiểm chứng trong vận hành thực tế.

Các mẫu phù hợp với BH-EDU:

- Tách `học sinh` khỏi `người liên hệ/người thanh toán`. Một phụ huynh có thể liên hệ cho nhiều học
  sinh; một học sinh có thể có nhiều người liên hệ với quyền xem và quyền tài chính khác nhau.
- Dùng `buổi học thực tế` làm đơn vị nối lịch, điểm danh, ghi chú và dữ liệu tính phí. Lịch định kỳ chỉ
  là quy tắc sinh buổi học, không phải bằng chứng rằng buổi học đã diễn ra.
- Tạo khoản thu ở trạng thái nháp từ dữ liệu vận hành, cho phép người phụ trách xem trước rồi mới ghi
  nhận chính thức. Thay đổi lịch hoặc đăng ký phải làm nổi bật khoản thu bị ảnh hưởng.
- Tách khoản phải thu, thanh toán, phân bổ, đối soát, hoàn tiền và số dư. Tiền nhận trước hoặc tiền dư
  được giữ ở tài khoản phụ huynh để phân bổ sau, không ép gắn ngay vào một tháng/lớp.
- Chứng từ đã ghi nhận không bị sửa/xóa âm thầm. Sai lệch được xử lý bằng hủy, điều chỉnh, hoàn tiền
  hoặc bút toán bù trừ có liên kết với bản ghi gốc.
- Dashboard ưu tiên `việc cần làm`: buổi chưa hoàn tất, khoản thu cần duyệt, tiền chưa phân bổ, giao
  dịch chưa đối soát và dữ liệu cần xác minh; không chỉ hiển thị số liệu tổng quan.
- Hỗ trợ nhiều cách tính phí ở tầng chính sách, nhưng BH-EDU mặc định theo tháng và theo từng đăng ký
  lớp. Học theo buổi, học thử, học bù và phí phát sinh là ngoại lệ có cấu trúc.

Các mẫu không áp dụng nguyên trạng:

- Không lấy hóa đơn theo từng buổi làm mặc định vì trung tâm chủ yếu thu theo tháng.
- Không đưa toàn bộ CRM bán hàng, bảng lương giáo viên, đặt lịch tự phục vụ hoặc cổng phụ huynh vào
  giai đoạn đầu khi dữ liệu vận hành cốt lõi chưa ổn định.
- Không cho điểm danh tự động tạo khoản phải thu chính thức. Điểm danh và số buổi có thể tạo đề xuất,
  nhưng chính sách tháng, giảm giá và ngoại lệ vẫn phải đi qua bước kiểm tra.
- Không dùng một bảng ma trận lớn làm giao diện chính cho mọi vai trò. Ma trận phù hợp cho rà soát
  hàng loạt; hồ sơ học sinh, buổi học và giao dịch cần màn hình tác vụ riêng.

Tài liệu tham khảo chính:

- [TutorCruncher — Clients](https://help.tutorcruncher.com/en/articles/14182893-clients)
- [TutorCruncher — Generating Invoices](https://help.tutorcruncher.com/en/articles/14182965-generating-invoices)
- [Teachworks — Getting Started](https://www.teachworks.com/getting-started/introduction)
- [Teachworks — Billing](https://www.teachworks.com/features/billing)
- [Stripe — Credit Notes](https://docs.stripe.com/api/credit_notes/create)

### Bài học phù hợp từ hệ thống UIT

Các cổng thông tin của Trường Đại học Công nghệ Thông tin — ĐHQG-HCM cung cấp thêm góc nhìn về một
hệ thống giáo dục có nhiều vai trò và đơn vị chịu trách nhiệm. BH-EDU nên tiếp thu các nguyên tắc sau:

- **Một tài khoản, nhiều tiện ích theo vai trò:** học sinh/phụ huynh xem lịch, kết quả và học phí;
  giáo viên xem lịch dạy, báo nghỉ và báo dạy bù; nhân viên chỉ thấy tác vụ thuộc quyền của mình.
- **Thông tin chung và dữ liệu cá nhân là hai lớp khác nhau:** thông báo, hướng dẫn có thể công khai;
  lịch cá nhân, điểm danh, kết quả học tập và tài chính chỉ hiển thị sau đăng nhập.
- **Mỗi loại dữ liệu có đơn vị chịu trách nhiệm:** học vụ quản lý lớp/lịch/kết quả, bộ phận học sinh
  quản lý hồ sơ và hỗ trợ, tài chính quản lý học phí. Trên BH-EDU đây là quyền sở hữu nghiệp vụ, không
  nhất thiết tách thành các website riêng.
- **Yêu cầu ngoại lệ là một hồ sơ có quy trình:** người dùng gửi yêu cầu, hệ thống kiểm tra điều kiện,
  người có thẩm quyền xét duyệt, kết quả được thông báo và lưu lịch sử. Có thể áp dụng cho chuyển lớp,
  tạm nghỉ, học bù, điều chỉnh học phí, hoàn/chuyển dư và sửa điểm danh.
- **Có thời hạn và các đợt xử lý rõ ràng:** đăng ký, hiệu chỉnh và cứu xét là những giai đoạn khác nhau.
  BH-EDU có thể áp dụng cho chốt danh sách lớp, khóa điểm danh và khóa kỳ học phí.
- **Thông báo kết quả chủ động:** sau khi xử lý, người gửi phải nhận được trạng thái/kết quả thay vì tự
  hỏi lại lễ tân. Trước mắt có thể dùng thông báo trong hệ thống; Zalo/email triển khai sau.
- **Một hồ sơ tổng hợp nghĩa vụ:** trước một mốc quan trọng, hệ thống kiểm tra đồng thời dữ liệu học
  tập, hồ sơ còn thiếu và khoản tài chính còn tồn.

Không áp dụng nguyên trạng các điểm sau:

- Không chia BH-EDU thành nhiều cổng rời theo bộ phận; người dùng cần một ứng dụng và điều hướng theo
  vai trò.
- Không số hóa biểu mẫu giấy thành một form dài rồi giữ nguyên quy trình hành chính. Form phải ngắn,
  tự điền dữ liệu đã có và chỉ hỏi thông tin cần cho quyết định.
- Không dùng mô hình tín chỉ/học kỳ của đại học cho lớp học thêm; chỉ tái sử dụng tư duy về thời hạn,
  điều kiện, xét duyệt và lịch sử.

Tài liệu UIT tham khảo:

- [UIT — Cổng thông tin đào tạo](https://student.uit.edu.vn/content/cong-thong-tin-dao-tao)
- [UIT — Một số quy trình dành cho sinh viên](https://portal.uit.edu.vn/van-ban-bieu-mau/mot-so-quy-trinh-danh-cho-sinh-vien)
- [UIT — Phân công đầu mối hỗ trợ](https://www.uit.edu.vn/bai-viet/thong-tin-cac-don-vi-sinh-vien-can-luu-y-khi-lien-he)
- [UIT — Website môn học](https://courses.uit.edu.vn/)

### Bốn lát cắt vận hành cần hoàn thiện đầu-cuối

1. **Tiếp nhận → hồ sơ → đăng ký lớp:** tìm/chống trùng, người liên hệ, đăng ký có ngày hiệu lực,
   chuyển/nghỉ/tạm nghỉ và lịch sử thay đổi.
2. **Lịch lớp → buổi học → điểm danh:** sinh buổi, thay lịch, học thử/học bù, điểm danh, ghi chú và
   việc cần xác minh.
3. **Chính sách phí → đề xuất → duyệt → khoản phải thu:** phí tháng theo từng lớp, giảm giá, vào/nghỉ
   giữa kỳ, điều chỉnh và khóa kỳ.
4. **Nhận tiền → phân bổ → đối soát → xử lý sai lệch:** thu thiếu/đủ/dư, đóng gộp, tiền chưa phân bổ,
   hoàn/chuyển dư, nhắc nợ và trạng thái hóa đơn.

Mỗi lát cắt chỉ được coi là hoàn thành khi vai trò liên quan có thể xử lý cả trường hợp bình thường lẫn
ngoại lệ mà không cần quay lại Sheet để sửa dữ liệu gốc.

```text
Học sinh
├── Người liên hệ / phụ huynh
├── Đăng ký lớp theo ngày hiệu lực
│   ├── Lịch định kỳ
│   ├── Lịch ngoại lệ / học bù / học thử
│   ├── Điểm danh theo buổi
│   └── Ghi chú giáo viên → đề xuất xác minh
├── Khoản phải thu theo lớp và kỳ
│   ├── Mức gốc
│   ├── Giảm / miễn / điều chỉnh
│   ├── Thanh toán
│   ├── Phân bổ thanh toán
│   ├── Đối soát
│   └── Hủy / hoàn / chuyển dư
└── Công việc cần xử lý và nhật ký thay đổi
```

## 4. Quy trình trọng tâm

### Tiếp nhận và quản lý học sinh

1. Tìm trước theo mã, tên, số điện thoại, Zalo hoặc mã định danh.
2. Hiển thị ứng viên trùng và bằng chứng; người có quyền quyết định dùng hồ sơ cũ hay tạo mới.
3. Một hồ sơ có nhiều đăng ký lớp độc lập.
4. Nghỉ, chuyển và tạm nghỉ không xóa đăng ký cũ.
5. Thay đổi muộn tạo cảnh báo cho điểm danh và học phí đã phát sinh.

### Lịch học và điểm danh

1. Lịch lớp là lịch định kỳ có hiệu lực theo thời gian.
2. Buổi học thực tế được tạo từ lịch định kỳ cộng ngoại lệ.
3. Điểm danh gắn với buổi học, không chỉ gắn với thứ trong tuần.
4. Học thử/học bù có thể thêm học sinh ngoại lệ kèm lý do.
5. Ghi chú như `nghỉ luôn` chỉ tạo đề xuất cho lễ tân, không tự kết thúc đăng ký.

### Học phí hàng tháng

1. Hệ thống tạo danh sách đề xuất từ đăng ký lớp và chính sách phí.
2. Áp dụng mức phí lớp theo ngày hiệu lực.
3. Áp dụng giảm giá hoặc quy tắc cá nhân.
4. Trường hợp vào/nghỉ giữa tháng nhận mức đề xuất nhưng cho phép người có quyền điều chỉnh.
5. Người phụ trách xem trước và duyệt.
6. Sau khi duyệt mới tạo khoản phải thu.
7. Thay đổi sau khi duyệt tạo bản ghi điều chỉnh; không ghi đè lịch sử.

### Thanh toán và đối soát

1. Lễ tân ghi nhận tiền phụ huynh báo/chuyển.
2. Một thanh toán có thể phân bổ cho nhiều lớp hoặc nhiều tháng.
3. Cho phép thu một phần và giữ phần tiền chưa phân bổ.
4. Kế toán đối soát thanh toán với tiền mặt/sao kê.
5. Theo dõi hóa đơn pháp lý là trạng thái riêng, không đồng nhất với thanh toán.
6. Hủy, hoàn hoặc chuyển dư dùng nghiệp vụ bù trừ; không xóa payment/allocation đã ghi.

## 5. Trạng thái tài chính cần tách biệt

### Khoản phải thu

`draft → pending_approval → posted → partially_paid → paid → cancelled`

### Thanh toán

`received → needs_review → verified → partially_allocated/allocated → cancelled/refunded`

### Hóa đơn pháp lý

`not_required/not_issued → issued → adjusted/replaced/cancelled`

Giao diện phải dùng từ ngữ dễ hiểu: `Khoản phải thu`, `Đã ghi nhận`, `Chờ đối soát`, `Đã đối soát`,
`Còn cần thu`. Tên bảng kỹ thuật có thể giữ nguyên trong giai đoạn chuyển đổi.

## 6. Hộp Cần xử lý

Thay nhiều tab cảnh báo bằng một hàng đợi công việc có cấu trúc:

- loại công việc;
- đối tượng liên quan;
- mức ưu tiên;
- trạng thái;
- người phụ trách;
- hạn xử lý;
- bằng chứng nguồn;
- kết quả và lịch sử.

Những nguồn tạo việc gồm nghi trùng học sinh, thiếu thông tin, giáo viên báo nghỉ/chuyển, thanh toán
chưa khớp, chênh lệch học phí, import thất bại và xung đột chỉnh sửa.

## 7. Lộ trình chuyển đổi

### Giai đoạn 0 — Nền nghiệp vụ

- Chốt thuật ngữ, quyền và các bất biến dữ liệu.
- Chốt quy ước ngày bắt đầu/ngày cuối học.
- Lập danh mục ngoại lệ hợp lệ.
- Chuyển các thao tác tài chính sang RPC nguyên tử, không xóa lịch sử.

### Giai đoạn 1 — Hồ sơ và đăng ký lớp

- Hồ sơ dùng chung, người liên hệ và chống trùng có xác nhận.
- Đăng ký/nghỉ/chuyển/tạm nghỉ theo ngày.
- Import có `source_system` và `source_key` để chạy lại an toàn.
- Hộp việc chất lượng dữ liệu.

Điều kiện chuyển nguồn: lễ tân không còn sửa hồ sơ hoặc danh sách lớp trong Sheet.

### Giai đoạn 2 — Lịch và điểm danh

- Lịch định kỳ, lịch ngoại lệ và buổi học thực tế.
- Điểm danh theo buổi, học thử và học bù.
- Ghi chú giáo viên tạo đề xuất xác minh.

Điều kiện chuyển nguồn: giáo viên điểm danh trên web; file giáo viên chỉ còn đối chiếu tạm thời.

### Giai đoạn 3 — Khoản phải thu

- Mức phí theo lớp và thời gian.
- Giảm/miễn/điều chỉnh.
- Danh sách đề xuất, xem trước và duyệt hàng loạt.
- Ngoại lệ có quyền và lý do.

Điều kiện chuyển nguồn: không lập khoản phải thu mới trong Sheet.

### Giai đoạn 4 — Thanh toán và đối soát

- Thanh toán độc lập với khoản phải thu.
- Phân bổ nhiều-nhiều, tiền chưa phân bổ và thu một phần.
- Đối soát, hủy, hoàn, chuyển dư và theo dõi hóa đơn.
- Nhật ký liên hệ công nợ.

Điều kiện chuyển nguồn: tổng phải thu, đã nhận, đã đối soát và còn thiếu khớp theo học sinh/lớp/kỳ.

### Giai đoạn 5 — Báo cáo và cổng phụ huynh

- Báo cáo theo vai trò.
- Phụ huynh xem lịch, điểm danh và tài chính.
- Thông báo và tự động hóa liên hệ chỉ triển khai khi dữ liệu nền đã ổn định.

## 8. Việc kỹ thuật ưu tiên kế tiếp

1. Giữ các bộ lọc ngày hiệu lực đã thêm cho danh sách lớp, lịch và điểm danh.
2. Sửa RPC tạo học phí: kiểm tra đăng ký giao với kỳ thu, không chỉ `status = enrolled` hiện tại.
3. Thiết kế ngoại lệ khoản thu có quyền, lý do và audit; `Không học` là cảnh báo mặc định, không phải
   ngõ cụt.
4. Loại bỏ việc đảo trạng thái bằng cách xóa `payments` và `payment_allocations`.
5. Cho phép payment độc lập và phân bổ nhiều khoản.
6. Bổ sung trạng thái ghi nhận/đối soát/hóa đơn riêng biệt.
7. Sau khi nền dữ liệu ổn định mới thay UI checkbox bằng quy trình đề xuất và duyệt.

## 9. Nguyên tắc chuyển dữ liệu từ Sheet

- Chuyển theo từng miền nghiệp vụ, không chuyển toàn bộ một lần.
- Mỗi lần import phải chạy lại an toàn và giữ tham chiếu nguồn.
- Đối chiếu theo tổng số, khóa nghiệp vụ và mẫu dữ liệu ngoại lệ.
- Không duy trì chỉnh sửa hai chiều không kiểm soát.
- Khi một miền đã chuyển nguồn, Sheet chỉ được đọc hoặc xuất từ web.
- Dữ liệu nhạy cảm như mã định danh, SĐT và địa chỉ phải được giới hạn quyền và ghi audit khi truy cập.
