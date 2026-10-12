# 02 — Chạy ở máy local

## 1. Yêu cầu

- Node.js 22 (`nvm use` đọc `.nvmrc`), npm 10.
- MongoDB **replica set** — dự án dùng transaction. Cách nhanh nhất: cluster **MongoDB Atlas**
  gói M0 (miễn phí, có sẵn replica set). Chạy MongoDB tự cài: bật replica set 1 node (mục 3.1).
- (Tuỳ chọn) Cloudflare R2, Google OAuth, Resend — bỏ trống biến môi trường thì tính năng tương
  ứng tự tắt, phần còn lại vẫn chạy.

## 2. Cài đặt

```bash
npm install                                   # cài cả backend + frontend, bật husky
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Điền tối thiểu trong `backend/.env`:

| Biến                                                  | Ghi chú                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `MONGODB_URI`                                         | Chuỗi kết nối Atlas, có tên DB, vd. `.../mern_base_dev?retryWrites=true&w=majority` |
| `JWT_ACCESS_SECRET`                                   | ≥ 32 ký tự: `openssl rand -base64 48`                                               |
| `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_PASSWORD` | Tài khoản Super Admin tạo bởi seed                                                  |

Mọi biến được validate bằng Zod khi khởi động (`backend/src/shared/config/env.js`): thiếu / sai
thì dừng ngay và liệt kê đủ tên biến. Ý nghĩa từng biến: xem comment trong `.env.example`.

## 3. Database

```bash
npm run db:migrate          # tạo index (unique, TTL...) — chạy lại an toàn
npm run db:migrate:status   # xem migration đã / chưa áp dụng
npm run db:seed             # Super Admin + job hệ thống — chạy lại an toàn
```

- **Index luôn tạo bằng migration** (`backend/migrations/`, có `up` / `down`). Schema của model
  khai báo lại cùng tên để người đọc thấy; test `migrations.test.js` báo lỗi nếu hai nơi lệch.
- Tạo migration mới: `npm run db:migrate:create -w backend -- <ten-migration>`.
- `autoIndex` chỉ bật ở development.

### 3.1 (Tuỳ chọn) MongoDB chạy ở máy thay vì Atlas

MongoDB độc lập không hỗ trợ transaction → chạy dạng **replica set 1 node**:

```bash
# Docker
docker run -d --name mongo-rs -p 27017:27017 mongo:8 --replSet rs0 --bind_ip_all
docker exec mongo-rs mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"

# Hoặc mongod cài sẵn: thêm --replSet rs0 khi khởi động, rồi chạy rs.initiate() trong mongosh
```

`MONGODB_URI=mongodb://localhost:27017/mern_base_dev?replicaSet=rs0&directConnection=true`

## 4. Chạy

```bash
npm run dev
```

| Địa chỉ                               |                                                          |
| ------------------------------------- | -------------------------------------------------------- |
| <http://localhost:5173>               | Frontend                                                 |
| <http://localhost:4000/api/v1/health> | Kiểm tra API + database                                  |
| <http://localhost:4000/api/docs>      | Swagger UI (chỉ ở development) — đọc `docs/openapi.yaml` |

**Email ở development** mặc định in ra terminal (kênh `console`), kèm đường link — bấm link
xác thực / đặt lại mật khẩu ngay trong terminal. Muốn nhận email thật mà **chưa có domain**: điền
nhóm `SMTP_*` (vd. Gmail + App Password) theo [docs 05 §3.3](05-storage-va-email.md#33-cấu-hình-kênh-gửi),
rồi vào **Quản trị → Cấu hình → Kênh gửi email** chọn SMTP và bấm "Gửi email thử".

## 5. Kiểm tra trước khi commit

```bash
npm test && npm run build && npm run format:check && npm run check
```

- Test backend dùng MongoDB **in-memory** (replica set, tách hẳn DB dev) — lần đầu tải binary
  MongoDB (~80MB). Mỗi file test một database riêng, chạy song song được.
- Test frontend: Vitest + React Testing Library + MSW (chặn mọi request thật).
- Không chạy 2 lệnh test đồng thời.
- Pre-commit (husky + lint-staged) tự format file đã stage bằng Prettier.

## 6. Sự cố thường gặp

| Hiện tượng                                              | Nguyên nhân / cách xử lý                                                                  |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Khởi động báo "Biến môi trường không hợp lệ"            | Đọc danh sách biến trong thông báo, sửa `backend/.env`                                    |
| `MongoServerSelectionError`                             | Sai URI, hoặc IP máy chưa được thêm vào Network Access của Atlas                          |
| `Transaction numbers are only allowed on a replica set` | MongoDB tự cài chưa bật replica set                                                       |
| Frontend báo lỗi CORS                                   | Thêm origin frontend vào `CORS_ORIGINS`                                                   |
| Tải lại trang bị đăng xuất                              | Cookie refresh bị chặn: frontend và API khác site mà `COOKIE_SAME_SITE=lax` (xem docs 07) |
| Upload báo lỗi mạng                                     | Bucket R2 chưa cấu hình CORS (docs 05)                                                    |

## 7. Quy trình Git

- `main` luôn chạy được (CI xanh) — Render / Vercel tự deploy từ `main`.
- Làm tính năng trên nhánh riêng (`feat/<ten>`, `fix/<ten>`) → pull request → CI xanh → merge.
- Commit message: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` + mô tả ngắn tiếng Việt.
- Không commit `.env` (đã có trong `.gitignore`); thêm biến mới → cập nhật `.env.example` + `env.js`.
