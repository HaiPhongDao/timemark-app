# TimeMark Photo Stamper Pro 🕒📷

Ứng dụng web đóng dấu ngày giờ, tọa độ GPS, thông tin dự án/công việc và logo lên ảnh sẵn có theo phong cách **TimeMark** chuyên nghiệp.

Hoạt động hoàn toàn trên trình duyệt (Client-side), xử lý ảnh ở độ phân giải gốc 100%, bảo mật tuyệt đối không tải ảnh lên máy chủ bên thứ ba.

---

## ✨ Tính Năng Nổi Bật

### 1. 📷 Tự động đọc dữ liệu chụp gốc (EXIF Metadata)
- **Ngày & Giờ chụp gốc**: Tự động giải mã tag EXIF (`DateTimeOriginal`, `CreateDate`) từ ảnh điện thoại/máy ảnh.
- **Tọa độ GPS gốc**: Đọc vĩ độ (Latitude), kinh độ (Longitude) chính xác từ ảnh.
- **Hỗ trợ định dạng DMS & Thập phân**: Hiển thị dạng `10°46'36.8" N, 106°42'02.9" E`.
- **Tự động tìm tên đường (Reverse Geocode)**: 1 cú nhấp chuột để chuyển tọa độ GPS thành địa chỉ hành chính chi tiết (qua OpenStreetMap).
- Tùy chọn chuyển đổi tức thì: **"Giờ chụp gốc"** ↔ **"Giờ hiện tại"** ↔ **"Nhập tùy ý"**.

### 2. 🎨 5 Mẫu Tem Đóng Dấu (Templates) Chuyên Nghiệp
1. **Báo cáo Công trình (Construction & Field Work)**: Mẫu đặc trưng của TimeMark với giờ số to rõ, thanh màu nhấn, bảng kê khai Dự án, Hạng mục, Người thực hiện, Mã xác thực chống giả.
2. **TimeMark Cổ điển (Classic TimeMark)**: Đồng hồ số kỹ thuật số cỡ lớn, thứ trong tuần, nhiệt độ thời tiết, địa chỉ và logo.
3. **Thẻ Nghiệm thu / Giám sát (Inspection Card)**: Dạng biên bản hiện trường với huy hiệu `✓ ĐÃ NGHIỆM THU / VERIFIED`, đóng khung trang trọng.
4. **Tối giản (Minimalist)**: Chữ viền đổ bóng sắc nét, không viền hộp che nền, phù hợp ảnh nghệ thuật hoặc check-in sạch sẽ.
5. **HUD Tọa độ GPS (Technical HUD)**: Phong cách kỹ thuật đo đạc, viễn thông, trắc địa với 4 góc ngắm và tọa độ vệ tinh.

### 3. 🏢 Nhãn Thương Hiệu & Logo
- Hỗ trợ tải lên logo công ty / cá nhân (PNG trong suốt hoặc JPG).
- Tích hợp sẵn bộ logo biểu tượng công trình mẫu để trải nghiệm ngay.
- Tùy chỉnh kích thước logo và hiển thị sắc nét.

### 4. 🎛️ Tùy Biến Trực Quan & Toàn Diện
- **Vị trí tem linh hoạt**: 6 vị trí (Dưới Trái [chuẩn], Dưới Giữa, Dưới Phải, Trên Trái, Trên Giữa, Trên Phải).
- **Thu phóng tỷ lệ (Scale)**: 50% đến 180% (tự động cân đối theo độ phân giải ảnh gốc).
- **Màu sắc & Nền**: Đổi màu nhấn (Cyan TimeMark, Vàng công trình, Xanh lá, Đỏ cam...), chỉnh độ mờ đục nền kính mờ (Glassmorphism) hoặc đen đặc.
- **Xem trước so sánh (Compare)**: Nhấn giữ nút "Xem ảnh gốc" để đối chiếu trước và sau khi đóng dấu.

### 5. ⚡ Xử Lý Hàng Loạt (Batch Mode) & Tải ZIP
- Kéo thả nhiều ảnh cùng lúc.
- Mỗi ảnh tự giữ nguyên ngày giờ và tọa độ GPS riêng biệt của ảnh đó.
- Nút **"Tải tất cả (ZIP)"** tự động kết xuất toàn bộ danh sách và nén thành 1 tệp `.zip` duy nhất.

---

## 🚀 Hướng Dẫn Sử Dụng

### Cách 1: Chạy nhanh bằng file `start.bat` (Khuyên Dùng Trên Windows)
1. Nhấp đúp chuột vào tệp `start.bat`.
2. Ứng dụng sẽ tự khởi động máy chủ cục bộ và tự động mở trình duyệt web tại địa chỉ `http://localhost:8080`.

### Cách 2: Chạy trực tiếp từ dòng lệnh
```bash
cd timemark-web
python server.py
```

### Cách 3: Mở trực tiếp file `index.html`
- Nhấp đúp vào `index.html` để mở trong trình duyệt bất kỳ (Google Chrome, Microsoft Edge, Cốc Cốc, Safari...).

---

## 🛠️ Cấu Trúc Mã Nguồn

```
timemark-web/
├── index.html            # Giao diện người dùng responsive & dark mode
├── styles.css            # Hệ thống CSS hiện đại, phong cách Linear/Tailwind
├── app.js                # Bộ dựng Canvas full-resolution, đọc EXIF, xử lý Batch & ZIP
├── server.py             # Máy chủ cục bộ nhỏ gọn bằng Python
├── start.bat             # File khởi động 1-click cho người dùng Windows
├── vendor/
│   ├── exifr.full.umd.js # Thư viện đọc EXIF độc lập offline
│   └── jszip.min.js      # Thư viện nén ZIP hàng loạt
└── README.md             # Tài liệu hướng dẫn sử dụng
```

---

## 🔒 Cam Kết Quyền Riêng Tư (Privacy)
Toàn bộ quá trình giải mã ảnh, đọc EXIF và đóng dấu đều thực hiện **ngay trên bộ nhớ trình duyệt** của bạn. Không có bất kỳ hình ảnh nào bị tải lên máy chủ ngoài, an toàn tuyệt đối cho dữ liệu dự án và thông tin cá nhân.
