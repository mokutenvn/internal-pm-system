# Hướng dẫn Vận hành Hệ thống Quản trị & Theo dõi Dự án (Nexus R&D PM)

Chào mừng bạn đến với tài liệu hướng dẫn vận hành hệ thống **Nexus R&D PM**. Dưới đây là giải thích chi tiết về mô hình quản lý, các thuật ngữ phần mềm chuyên ngành và cấu trúc hoạt động của ứng dụng.

---

## 1. Giải thích Thuật ngữ Quy trình Công việc (Kanban & Scrum)

Hệ thống của chúng tôi áp dụng sự kết hợp giữa bảng trực quan **Kanban** và chu trình **Scrum (Sprint)** để theo dõi sát sao tiến độ công việc. Dưới đây là ý nghĩa của từng trạng thái công việc (Task Status):

### 📝 Backlog (Yêu cầu tồn đọng)
- **Định nghĩa**: Là nơi lưu trữ tất cả các ý tưởng, tính năng, lỗi cần sửa hoặc đầu việc tiềm năng sẽ làm trong tương lai nhưng **chưa được lên lịch cụ thể** cho chu kỳ hiện tại.
- **Mục đích**: Giúp lưu lại mọi ý kiến và kế hoạch để không bị quên, trước khi quyết định đưa vào thực hiện.

### 📋 To Do (Cần làm)
- **Định nghĩa**: Các công việc đã được phê duyệt và lên kế hoạch thực hiện trong Sprint/chu kỳ hiện tại nhưng **chưa có ai bắt tay vào làm**.
- **Mục đích**: Nhân viên có thể tự nhận việc hoặc Leader giao việc tại cột này để chuẩn bị triển khai.

### ⚙️ In Progress (Đang thực hiện)
- **Định nghĩa**: Các công việc **đang được nhân sự trực tiếp xử lý**. 
- **Mục đích**: Cho thấy năng suất tức thời của nhóm, giúp quản lý biết ai đang làm gì để kịp thời hỗ trợ nếu xảy ra sự cố hay nghẽn cổ chai (bottleneck).

### 🔍 Review (Đang đánh giá / Kiểm thử)
- **Định nghĩa**: Công việc đã được nhân viên hoàn thành về mặt kỹ thuật/mỹ thuật và đang **chờ Leader hoặc khách hàng kiểm thử, duyệt chất lượng**.
- **Mục đích**: Bảo đảm chất lượng đầu ra, tránh lỗi hệ thống trước khi chính thức đưa vào vận hành thực tế.

### ✅ Done (Đã hoàn thành)
- **Định nghĩa**: Các công việc đã hoàn tất 100%, vượt qua vòng kiểm thử và được **xác nhận đóng lại**.
- **Mục đích**: Đánh giá kết quả của Sprint và là cơ sở để tính toán hiệu suất làm việc của mỗi nhân viên.

---

## 2. Dự án (Projects) & Sprints (Chu kỳ phát triển)

- **Dự án (Project)**: Là mục tiêu vĩ mô lâu dài (ví dụ: phát triển phần mềm A, thiết kế phần cứng B). Dự án chứa nhiều Sprints và các thành viên khác nhau.
- **Sprint (Chu kỳ)**: Là một khung thời gian ngắn cố định (thường từ 1 - 4 tuần) nhằm hoàn thành một số lượng công việc nhất định. Việc chia nhỏ thành Sprints giúp tăng độ thích ứng nhanh của dự án.

---

## 3. Cơ chế Hợp nhất "Mục tiêu công việc" và "Task" trên Dashboard

Để tránh sự chồng chéo, hệ thống tự động liên kết **Mục tiêu ngày/tuần/tháng** trực tiếp từ **Hạn chót (Due Date)** của các Task trên lịch trình:
1. **Mục tiêu Hôm nay**: Tất cả các Task có hạn chót trùng với ngày hiện tại.
2. **Mục tiêu Tuần này**: Các Task có hạn chót trong vòng 7 ngày tới.
3. **Mục tiêu Tháng này**: Các Task có hạn chót trong vòng 30 ngày tới.

Nhân viên và quản lý chỉ cần kéo thả và cập nhật tiến độ công việc tại bảng Kanban hoặc Lịch trình, Dashboard sẽ tự động cập nhật số liệu và gửi thông báo Telegram tương ứng.

---

## 4. Quyền hạn Người dùng (Roles & Permissions)

- **Admin (Quản trị viên tổng)**: Có quyền tối cao. Quản lý, thêm, sửa, xóa tất cả người dùng, dự án, sprints và mọi tasks của toàn bộ hệ thống.
- **Leader (Trưởng nhóm)**: Chỉ nhìn thấy và quản lý được danh sách nhân sự cùng bộ phận chuyên môn. Có quyền tạo, sửa, xóa các Tasks thuộc bộ phận của mình.
- **Employee (Nhân viên)**: Chỉ thấy và tự cập nhật các Task do chính mình phụ trách. Không có quyền quản lý nhân sự khác.
