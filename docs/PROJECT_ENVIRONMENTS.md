# 🌐 Project Environments & Railway API Configuration

Tài liệu hướng dẫn về các Môi trường Dự án Backend và Cấu hình Kết nối API trên Admin Dashboard.

---

## 1. Danh sách Môi trường Backend APIs

| Tên Dự án | Environment ID | Railway Base URL Endpoint | Database Backend |
| :--- | :--- | :--- | :--- |
| **🏢 365Trade Global** | `365trade` | `https://365trademiniappapidev-production.up.railway.app/api` | Supabase PostgreSQL 365Trade (`xjvqpgnznyqkmhkhctsu`) |
| **🏠 HomeBooking Global** | `homebooking` | `https://homebookingminiappapidev-production.up.railway.app/api` | Supabase PostgreSQL HomeBooking (`ydvadtmubpbrshfqqkts`) |

---

## 2. Cách thức Hoạt động

Khi người dùng thao tác chuyển dự án trên giao diện Admin Dashboard:
1. Giá trị `selectedProjectId` trong `localStorage` thay đổi.
2. Hàm `getApiBaseUrl()` trả về đúng địa chỉ `baseUrl` tương ứng.
3. Tất cả các thao tác (Đăng nhập, lấy danh sách Mini Apps, tạo nhóm, cập nhật App Menu, upload bản build...) sẽ gửi HTTP Request trực tiếp đến máy chủ Backend Railway của dự án đó.

---

## 3. Hướng dẫn Thêm Môi trường Dự án Mới

Nếu sau này hệ thống mở rộng thêm dự án thứ 3 (ví dụ: `BookingSuperApp`), bạn chỉ cần khai báo thêm vào mảng `PROJECTS` trong file [`src/services/api.js`](../src/services/api.js):

```javascript
export const PROJECTS = [
  {
    id: '365trade',
    name: '365Trade',
    badge: '365Trade Global',
    color: '#0284c7',
    baseUrl: 'https://365trademiniappapidev-production.up.railway.app/api'
  },
  {
    id: 'homebooking',
    name: 'HomeBooking',
    badge: 'HomeBooking Global',
    color: '#059669',
    baseUrl: 'https://homebookingminiappapidev-production.up.railway.app/api'
  },
  // Thêm dự án mới tại đây:
  {
    id: 'new_project',
    name: 'New Project',
    badge: 'New Project Global',
    color: '#8b5cf6',
    baseUrl: 'https://newproject-api.up.railway.app/api'
  }
];
```

Giao diện Đăng nhập và Dashboard Header sẽ tự động hiển thị dự án mới mà không cần sửa đổi thêm code UI.
