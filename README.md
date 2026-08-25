# 🚀 MiniApp Portal & Admin Dashboard

Hệ thống Quản trị Đa dự án (Multi-Tenant / Multi-Project Admin Dashboard) cho các Siêu ứng dụng SuperApp & Mini Apps Framework (**365Trade** & **HomeBooking**).

---

## 🌟 Chức năng nổi bật

1. **🔄 Đổi môi trường dự án Động (Multi-Project Switcher)**:
   - Hỗ trợ chuyển đổi mượt mà giữa dự án **🏢 365Trade Global** và **🏠 HomeBooking Global**.
   - Cập nhật linh hoạt `baseUrl` API tương ứng với từng Backend Server trên Railway.

2. **📱 Quản lý Nhóm Mini App & Mini Apps**:
   - Quản lý danh mục nhóm ứng dụng (SuperApp Cha & các Mini App con).
   - Đẩy file nén `.zip` bản build và kích hoạt phiên bản phát hành trực tiếp.

3. **📌 Quản lý Menu Động Portal & Menu Tài khoản (App Menus & Account Menus)**:
   - Cấu hình các nút điều hướng (Bottom Nav, Sidebar, Action Button) cho các ứng dụng FE/Mobile.

4. **🔐 Phân quyền Người dùng & Nhật ký Duyệt (RBAC & Moderation Logs)**:
   - Phân quyền chi tiết từng Menu theo vai trò người dùng.
   - Theo dõi lịch sử kiểm duyệt bản build.

---

## 🛠️ Cấu hình Môi trường Backend APIs

- **🏢 365Trade API**: `https://365trademiniappapidev-production.up.railway.app/api`
- **🏠 HomeBooking API**: `https://homebookingminiappapidev-production.up.railway.app/api`

---

## 🚀 Hướng dẫn Chạy ứng dụng

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Chạy Môi trường Phát triển (Development):
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`

### 3. Build Sản phẩm (Production Build):
```bash
npm run build
```

---

## 📚 Tài liệu chi tiết

- 📖 [**DASHBOARD_ARCHITECTURE.md**](docs/DASHBOARD_ARCHITECTURE.md) - Kiến trúc mã nguồn & Luồng xử lý.
- 🌐 [**PROJECT_ENVIRONMENTS.md**](docs/PROJECT_ENVIRONMENTS.md) - Hướng dẫn cấu hình API Endpoints 365Trade & HomeBooking.
