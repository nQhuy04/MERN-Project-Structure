# 06 — Quy ước API

- Đặc tả đầy đủ từng endpoint: [`openapi.yaml`](openapi.yaml) (OpenAPI 3.1).
- Xem và gọi thử: **Swagger UI** tại <http://localhost:4000/api/docs> (chỉ ở development).
- Sửa / thêm endpoint → cập nhật `openapi.yaml` trong cùng commit.

## 1. URL

- Tiền tố `/api/v1`. Danh từ số nhiều, chữ thường, gạch ngang: `/admin/users/:id/lock`.
- Khu quản trị tách tiền tố `/admin/...` → đọc URL là biết cần quyền quản trị.
- Hành động không phải CRUD dùng động từ ở cuối: `/media/:id/complete`, `/admin/jobs/:id/run`.

| Nhóm              | Tiền tố                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| Hệ thống          | `/health`, `/settings/public`                                                    |
| Xác thực          | `/auth/*`                                                                        |
| Tài khoản của tôi | `/users/me*`, `/sessions`, `/files`                                              |
| Ảnh               | `/media/*` (công khai / avatar)                                                  |
| Quản trị          | `/admin/users`, `/admin/media`, `/admin/stats`, `/admin/jobs`, `/admin/settings` |
| Cron bên ngoài    | `/jobs/trigger` (header `X-Jobs-Secret`)                                         |

## 2. Định dạng response

**Thành công**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": { "accessToken": "…", "user": { "id": "…" } }
}
```

**Danh sách phân trang** — query `page` (≥ 1), `limit` (1–100, mặc định 20):

```json
{ "success": true, "data": [ … ], "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 } }
```

**Lỗi**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [{ "field": "email", "message": "Email không hợp lệ" }]
  }
}
```

- `message` là tiếng Việt, hiển thị thẳng cho người dùng được.
- `details` chỉ có khi cần: lỗi theo ô nhập (`field` — frontend gắn vào đúng ô form bằng
  `applyServerErrors`), hoặc dữ liệu kèm theo (vd. danh sách nơi dùng của `MEDIA_IN_USE`).
- **Frontend rẽ nhánh theo `error.code`**, không theo HTTP status hay nội dung `message`.
- Document trả về: có `id` (không có `_id`, `__v`), không bao giờ có trường nhạy cảm
  (`passwordHash`, hash token...) — `toJSON` toàn cục bỏ mọi trường `select: false`.
- Lỗi 500: log đầy đủ ở server, client chỉ nhận thông báo chung (không lộ stack trace).

## 3. HTTP status

| Status    | Dùng khi                                                                         |
| --------- | -------------------------------------------------------------------------------- |
| 200 / 201 | Thành công / vừa tạo mới                                                         |
| 302       | Chuyển hướng (Google OAuth, nội dung ảnh)                                        |
| 400       | Dữ liệu sai, lỗi nghiệp vụ (sai mật khẩu hiện tại, token email hết hạn...)       |
| 401       | **Chỉ** khi access / refresh token không hợp lệ hoặc hết hạn                     |
| 403       | Đã xác thực nhưng không được phép; tài khoản bị khoá; thiếu header CSRF          |
| 404       | Không có — hoặc không phải của bạn; tính năng chưa cấu hình                      |
| 409       | Xung đột: trùng giá trị unique, dữ liệu vừa bị đổi, ảnh đang dùng, job đang chạy |
| 413       | Body quá 100KB                                                                   |
| 429       | Vượt rate limit                                                                  |
| 503       | Database không phản hồi (`/health`)                                              |

## 4. Mã lỗi

Khai báo tập trung: `backend/src/shared/errors/errorCodes.js` (backend) và
`frontend/src/shared/constants/errorCodes.js` (các mã frontend cần rẽ nhánh).

| Nhóm                | Mã                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chung               | `VALIDATION_ERROR`, `INVALID_JSON`, `PAYLOAD_TOO_LARGE`, `ROUTE_NOT_FOUND`, `RESOURCE_NOT_FOUND`, `DUPLICATE_VALUE`, `RATE_LIMITED`, `FORBIDDEN`, `CSRF_REJECTED`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR` |
| Token               | `AUTH_TOKEN_INVALID`, `AUTH_TOKEN_EXPIRED` (401) · `TOKEN_INVALID` (token trong link email, 400)                                                                                                           |
| Đăng nhập, mật khẩu | `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_LOCKED`, `INVALID_CURRENT_PASSWORD`, `PASSWORD_NOT_SET`, `CANNOT_REVOKE_CURRENT_SESSION`                                                             |
| Quản lý người dùng  | `CANNOT_MODIFY_SELF`, `CANNOT_MODIFY_SUPER_ADMIN`, `INSUFFICIENT_PERMISSION`, `USER_STATE_CHANGED`                                                                                                         |
| Lưu trữ             | `UPLOAD_NOT_FOUND`, `UPLOAD_MISMATCH`, `MEDIA_IN_USE`, `FOLDER_EXISTS`, `FOLDER_NOT_EMPTY`, `INVALID_AVATAR`                                                                                               |
| Lịch tự động        | `SYSTEM_JOB_PROTECTED`, `JOB_RUNNING`                                                                                                                                                                      |
| Tính năng           | `REGISTRATION_DISABLED`, `FEATURE_DISABLED` (Super Admin tắt), `FEATURE_NOT_CONFIGURED` (thiếu biến môi trường, 404)                                                                                       |
| Google OAuth        | `OAUTH_CANCELLED`, `OAUTH_STATE_INVALID`, `OAUTH_EMAIL_NOT_VERIFIED`, `OAUTH_FAILED` — trả về frontend qua `/auth/callback?error=CODE`                                                                     |

## 5. Validate đầu vào

- Mọi route có `validate({ body, query, params })` với Zod schema trong `*.schema.js` của module.
  Kết quả đã parse / chuẩn hoá nằm ở **`req.validated`** (Express 5: `req.query` chỉ đọc).
- Trường không khai báo trong schema bị **bỏ đi** (Zod mặc định) → client không ghi được trường
  ngoài ý muốn (vd. `role`). Riêng body cấu hình hệ thống dùng `strictObject` (key lạ → lỗi).
  Chuỗi được `trim`, email chuẩn hoá chữ thường.
- `id` phải là ObjectId hợp lệ → sai định dạng trả 400 trước khi chạm DB.
- Chống NoSQL injection: Mongoose `sanitizeFilter` bật toàn cục; toán tử do server tự dựng bọc
  `mongoose.trusted()`; ô tìm kiếm được escape trước khi đưa vào `$regex`.

## 6. Header & cookie

|                                       |                                                                   |
| ------------------------------------- | ----------------------------------------------------------------- |
| `Authorization: Bearer <accessToken>` | Mọi route cần đăng nhập                                           |
| `X-Requested-With: XMLHttpRequest`    | Bắt buộc ở `/auth/refresh`, `/auth/logout` (chống CSRF)           |
| Cookie `refresh_token`                | `httpOnly`, `path=/api/v1/auth`, SameSite theo `COOKIE_SAME_SITE` |
| `X-Jobs-Secret`                       | `/jobs/trigger` — so sánh timing-safe                             |

## 7. Thêm một endpoint

1. `*.schema.js`: Zod schema cho body / query / params.
2. `*.service.js`: logic + kiểm tra quyền lớp 2; ném `AppError({ statusCode, code, message })`.
3. `*.controller.js`: đọc `req.validated`, gọi service, trả bằng `sendSuccess` / `sendCreated` /
   `sendPaginated` — không chứa logic nghiệp vụ.
4. `*.routes.js`: `authenticate` → `authorize(...)` → `validate(...)` → controller.
5. Test bằng Supertest (thành công, validate, từng role, không phải của mình).
6. Cập nhật `docs/openapi.yaml`.
