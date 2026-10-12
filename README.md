# MERN Base — bản thực hành

> ### 🎓 Đây là bộ bài thực hành
>
> Dự án đã có sẵn **giao diện, hạ tầng và toàn bộ bộ test**, nhưng **phần logic nghiệp vụ đã bị
> xoá**. Nhiệm vụ của bạn là viết lại nó, mỗi bài một tính năng từ backend tới frontend.
>
> **Bắt đầu từ [docs/practice/README.md](docs/practice/README.md)** → [Bài 00 — Chuẩn bị môi
> trường](docs/practice/bai-00-chuan-bi-moi-truong.md). Theo dõi tiến độ trong
> [CHECKLIST.md](CHECKLIST.md).
>
> Phần còn lại của README này mô tả **bản hoàn chỉnh** — tức là đích bạn cần đạt tới.

Source base MERN fullstack **JavaScript (ESM)** dùng lại cho nhiều dự án web. Chỉ gồm phần
lõi dùng chung: auth, phiên đăng nhập, user & phân quyền, system settings, storage, email,
media, lịch tự động.

## Tính năng

- **Xác thực**: đăng ký + xác thực email, đăng nhập mật khẩu, magic link, Google OAuth (PKCE),
  quên / đặt lại / đổi mật khẩu. Access token 15 phút trong bộ nhớ + refresh token xoay vòng
  (cookie httpOnly, phát hiện token bị đánh cắp).
- **Phiên đăng nhập**: xem thiết bị đang đăng nhập, đăng xuất từ xa.
- **Người dùng & phân quyền**: MEMBER / ADMIN / SUPER_ADMIN, hồ sơ + ảnh đại diện; quản trị: tìm
  kiếm, lọc, khoá / mở khoá, đổi vai trò.
- **Cấu hình hệ thống**: Super Admin bật / tắt đăng ký, magic link.
- **Lưu trữ** (Cloudflare R2, upload thẳng từ trình duyệt): tệp cá nhân, thư viện ảnh hệ thống
  có "nơi dùng" và dọn ảnh mồ côi.
- **Email** (Resend + React Email): toàn bộ email giao dịch, in ra terminal ở development.
- **Lịch tự động**: job dọn dẹp hệ thống, gửi email thông báo theo lịch; đúng múi giờ, không
  chạy trùng.
- **Trang tổng quan quản trị**: số liệu người dùng, lưu trữ, job lỗi gần đây.

Google OAuth, R2, trigger job từ ngoài là **tuỳ chọn**: bỏ trống biến môi trường thì tính năng
tự tắt (API trả 404, giao diện ẩn nút).

## Tech stack

| Phần     | Công nghệ                                                                               |
| -------- | --------------------------------------------------------------------------------------- |
| Chung    | Node 22, npm workspaces, Prettier, husky + lint-staged (không dùng ESLint)              |
| Backend  | Express 5, Mongoose, migrate-mongo, Zod, pino                                           |
| Frontend | React + Vite, React Router (data router), TanStack Query, axios, Tailwind CSS, sonner   |
| Test     | Vitest, Supertest, mongodb-memory-server (replica set); React Testing Library, MSW (FE) |
| Database | MongoDB (dev dùng MongoDB Atlas — cần replica set vì dự án dùng transaction)            |

## Yêu cầu môi trường

- Node.js 22 (`nvm use` sẽ đọc `.nvmrc`), npm 10.
- Một cluster MongoDB Atlas (gói M0 miễn phí là đủ cho dev).

## Cài đặt và chạy

```bash
npm install                                   # cài cho cả backend + frontend, bật husky
cp backend/.env.example backend/.env          # điền MONGODB_URI, JWT_ACCESS_SECRET, SEED_SUPER_ADMIN_*
cp frontend/.env.example frontend/.env
npm run db:migrate                            # áp dụng migration (index...) lên DB dev
npm run db:seed                               # tạo Super Admin + job hệ thống (chạy lại vẫn an toàn)
npm run dev                                   # chạy đồng thời API (4000) + web (5173)
```

- Web: <http://localhost:5173> — trang chủ hiển thị trạng thái API và database.
- API: <http://localhost:4000/api/v1/health>
- Tài liệu API (Swagger UI, chỉ ở development): <http://localhost:4000/api/docs>

Backend kiểm tra biến môi trường bằng Zod lúc khởi động: thiếu hoặc sai biến thì dừng ngay và
liệt kê tên biến. Ý nghĩa từng biến ghi trong `backend/.env.example` và `frontend/.env.example`.

## Lệnh thường dùng (chạy ở thư mục gốc)

| Lệnh                              | Tác dụng                                                           |
| --------------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                     | Chạy backend + frontend ở chế độ dev                               |
| `npm test`                        | Chạy test backend rồi frontend (DB test in-memory, tách DB dev)    |
| `npm run build`                   | Build frontend                                                     |
| `npm run format` / `format:check` | Format / kiểm tra format bằng Prettier                             |
| `npm run check`                   | Kiểm quy ước dự án (thay ESLint) — `scripts/check-conventions.mjs` |
| `npm run db:migrate`              | Chạy migration (`db:migrate:down`, `db:migrate:status`)            |
| `npm run db:seed`                 | Seed dữ liệu bắt buộc (Super Admin, job hệ thống), idempotent      |

Lệnh riêng một app: `npm run <script> -w backend` hoặc `-w frontend` (ví dụ `npm run test:watch -w backend`).
Tạo migration mới: `npm run db:migrate:create -w backend -- <ten-migration>`. Index luôn tạo bằng
migration và khai báo lại (cùng tên) trong schema của model — test sẽ báo nếu hai nơi lệch nhau.

Trước mỗi commit, husky chạy lint-staged (Prettier format file đã stage).

## Cấu trúc thư mục

```text
├── backend/
│   ├── src/
│   │   ├── app.js            # express app (middleware, routes, error handler) — export cho test
│   │   ├── server.js         # env → kết nối DB → listen → graceful shutdown
│   │   ├── routes/           # router tổng /api/v1, Swagger UI
│   │   ├── modules/<tên>/    # routes → controller → service → model, schema Zod
│   │   └── shared/           # config (env, db, cors), middlewares, lib, utils, errors
│   ├── migrations/           # migrate-mongo (up/down)
│   └── tests/                # integration test (Vitest + Supertest)
├── frontend/
│   ├── src/
│   │   ├── app/              # providers, router (client/admin routes, guards)
│   │   ├── layouts/          # ClientLayout, AuthLayout, AdminLayout
│   │   ├── pages/            # trang mỏng, chỉ ghép component
│   │   ├── features/<tên>/   # api, hooks, components, index.js (public API)
│   │   └── shared/           # UI dùng chung, http client, queryClient, constants
│   ├── tests/                # Vitest + React Testing Library + MSW
│   └── vercel.json           # proxy /api + SPA fallback
├── docs/                     # tài liệu (openapi.yaml, 01-... → 09-...)
├── render.yaml               # Render Blueprint (backend)
└── .github/workflows/ci.yml  # CI: format → test → build
```

## Quy ước chính

- Response thành công: `{ success: true, message?, data }`; lỗi:
  `{ success: false, error: { code, message, details? } }` — frontend rẽ nhánh theo `error.code`.
- API trả `id` (string), không trả `_id`/`__v`.
- Không dùng TypeScript; kiểu dữ liệu ghi bằng JSDoc thuần.

Chi tiết quy ước dành cho người phát triển nằm trong thư mục `docs/` (bắt đầu từ
[docs/01](docs/01-kien-truc.md)).

## Tài liệu

|                                                               |                                                                             |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [01 — Kiến trúc](docs/01-kien-truc.md)                        | Thành phần, luồng request, cấu trúc module, mô hình dữ liệu (ERD)           |
| [02 — Chạy local](docs/02-chay-local.md)                      | Cài đặt, database, migration, test, sự cố thường gặp                        |
| [03 — Xác thực & phiên](docs/03-auth-va-phien.md)             | Token, refresh xoay vòng, đăng ký, magic link, Google OAuth                 |
| [04 — Phân quyền](docs/04-phan-quyen.md)                      | Vai trò, ma trận quyền, guard frontend                                      |
| [05 — Storage & email](docs/05-storage-va-email.md)           | R2, thư viện ảnh, "nơi dùng", email                                         |
| [06 — Quy ước API](docs/06-api.md)                            | URL, response, mã lỗi, validate · đặc tả: [openapi.yaml](docs/openapi.yaml) |
| [07 — Dự án mới & deploy](docs/07-tao-du-an-moi-va-deploy.md) | Đổi tên, Render + Vercel, dịch vụ ngoài, checklist production, CI           |
| [08 — Lịch tự động](docs/08-lich-tu-dong.md)                  | Toán lịch, khoá chống chạy trùng, thêm loại job                             |
| [09 — Giao diện](docs/09-giao-dien.md)                        | Design tokens, primitives, khuôn trang, khung trang & điều hướng            |

## Deploy

Backend lên **Render** (`render.yaml`), frontend lên **Vercel** (`frontend/vercel.json`, proxy
`/api` về Render để cookie cùng site), database **MongoDB Atlas**. CI GitHub Actions:
format → test → build. Hướng dẫn từng bước: [docs 07](docs/07-tao-du-an-moi-va-deploy.md).
