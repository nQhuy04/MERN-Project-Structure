import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import {
  MAX_FILES_PER_USER,
  MAX_TOTAL_SIZE_BYTES_PER_USER,
} from '../../src/modules/files/files.constants.js';
import { File } from '../../src/modules/files/files.model.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { User } from '../../src/modules/users/users.model.js';
import { features } from '../../src/shared/config/features.js';
import { storage } from '../../src/shared/lib/storage.js';
import { signIn } from '../helpers/auth.js';
import { createUser } from '../helpers/factories.js';

const FILES_URL = '/api/v1/files';
const PNG = { fileName: 'ảnh.png', contentType: 'image/png', size: 2048 };

let owner;
let authHeader;

beforeEach(async () => {
  owner = await createUser();
  ({ authHeader } = await signIn(owner));
  vi.spyOn(storage, 'createUploadUrl').mockResolvedValue({
    url: 'https://r2.example/upload',
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
  });
  vi.spyOn(storage, 'createDownloadUrl').mockResolvedValue('https://r2.example/download');
  vi.spyOn(storage, 'deleteObject').mockResolvedValue();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all([User.deleteMany({}), Session.deleteMany({}), File.deleteMany({})]);
});

/** Xin URL upload rồi giả lập R2 đã có object đúng thông tin → file READY. */
async function uploadFile(body = PNG, header = authHeader) {
  const presign = await request(app)
    .post(`${FILES_URL}/presign`)
    .set('Authorization', header)
    .send(body);
  vi.spyOn(storage, 'headObject').mockResolvedValueOnce({
    contentType: body.contentType,
    size: body.size,
  });
  const complete = await request(app)
    .post(`${FILES_URL}/${presign.body.data.file.id}/complete`)
    .set('Authorization', header);
  return complete.body.data;
}

describe('[bai-12] POST /files/presign — xin URL upload', () => {
  it('tạo bản ghi PENDING, key do server sinh trong thư mục của chủ sở hữu, trả presigned PUT', async () => {
    const res = await request(app)
      .post(`${FILES_URL}/presign`)
      .set('Authorization', authHeader)
      .send(PNG);

    expect(res.status).toBe(201);
    expect(res.body.data.upload).toEqual({
      url: 'https://r2.example/upload',
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
    });
    const file = await File.findById(res.body.data.file.id);
    expect(file).toMatchObject({ status: 'PENDING', originalName: 'ảnh.png', size: 2048 });
    expect(file.key).toMatch(new RegExp(`^users/${owner._id}/[0-9a-f-]{36}$`));
    expect(storage.createUploadUrl).toHaveBeenCalledWith({
      key: file.key,
      contentType: 'image/png',
      contentLength: 2048,
    });
  });

  it.each([
    ['loại file ngoài whitelist', { ...PNG, contentType: 'application/x-msdownload' }],
    ['quá 10MB', { ...PNG, size: 10 * 1024 * 1024 + 1 }],
    ['thiếu tên', { ...PNG, fileName: ' ' }],
  ])('%s → 400 VALIDATION_ERROR', async (_label, body) => {
    const res = await request(app)
      .post(`${FILES_URL}/presign`)
      .set('Authorization', authHeader)
      .send(body);

    expect(res.status).toBe(400);
    expect(await File.countDocuments()).toBe(0);
  });

  it('vượt quota dung lượng → 403 STORAGE_QUOTA_EXCEEDED, không tạo bản ghi', async () => {
    await File.create({
      ownerId: owner._id,
      key: `users/${owner._id}/cu`,
      originalName: 'cu.png',
      contentType: 'image/png',
      size: MAX_TOTAL_SIZE_BYTES_PER_USER - 1024,
      status: 'READY',
    });

    const res = await request(app)
      .post(`${FILES_URL}/presign`)
      .set('Authorization', authHeader)
      .send({ ...PNG, size: 2048 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('STORAGE_QUOTA_EXCEEDED');
    expect(await File.countDocuments({ ownerId: owner._id })).toBe(1);
  });

  it('quota tính cả bản ghi PENDING → xin URL liên tục rồi bỏ ngang không lách được', async () => {
    await File.create({
      ownerId: owner._id,
      key: `users/${owner._id}/dang-cho`,
      originalName: 'dang-cho.png',
      contentType: 'image/png',
      size: MAX_TOTAL_SIZE_BYTES_PER_USER - 1024,
      status: 'PENDING',
    });

    const res = await request(app)
      .post(`${FILES_URL}/presign`)
      .set('Authorization', authHeader)
      .send({ ...PNG, size: 2048 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('STORAGE_QUOTA_EXCEEDED');
  });

  it('vượt quota SỐ file → 403 STORAGE_QUOTA_EXCEEDED dù còn dung lượng', async () => {
    await File.insertMany(
      Array.from({ length: MAX_FILES_PER_USER }, (_unused, index) => ({
        ownerId: owner._id,
        key: `users/${owner._id}/f-${index}`,
        originalName: `f-${index}.png`,
        contentType: 'image/png',
        size: 1,
        status: 'READY',
      })),
    );

    const res = await request(app)
      .post(`${FILES_URL}/presign`)
      .set('Authorization', authHeader)
      .send(PNG);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('STORAGE_QUOTA_EXCEEDED');
  });

  it('quota tính riêng từng user: người khác đầy không ảnh hưởng mình', async () => {
    const other = await createUser();
    await File.create({
      ownerId: other._id,
      key: `users/${other._id}/to`,
      originalName: 'to.png',
      contentType: 'image/png',
      size: MAX_TOTAL_SIZE_BYTES_PER_USER,
      status: 'READY',
    });

    await request(app)
      .post(`${FILES_URL}/presign`)
      .set('Authorization', authHeader)
      .send(PNG)
      .expect(201);
  });

  it('chưa cấu hình R2 → 404 FEATURE_NOT_CONFIGURED; chưa đăng nhập → 401', async () => {
    const guest = await request(app).post(`${FILES_URL}/presign`).send(PNG);
    expect(guest.status).toBe(401);

    vi.spyOn(features, 'isStorageEnabled').mockReturnValue(false);
    const res = await request(app)
      .post(`${FILES_URL}/presign`)
      .set('Authorization', authHeader)
      .send(PNG);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('FEATURE_NOT_CONFIGURED');
  });
});

describe('[bai-12] POST /files/:id/complete — xác nhận upload', () => {
  it('object thật khớp khai báo → READY', async () => {
    const file = await uploadFile();

    expect(file.status).toBe('READY');
  });

  it('chưa có object trên R2 → 400 UPLOAD_NOT_FOUND, bản ghi giữ PENDING', async () => {
    const presign = await request(app)
      .post(`${FILES_URL}/presign`)
      .set('Authorization', authHeader)
      .send(PNG);
    vi.spyOn(storage, 'headObject').mockResolvedValueOnce(null);

    const res = await request(app)
      .post(`${FILES_URL}/${presign.body.data.file.id}/complete`)
      .set('Authorization', authHeader);

    expect(res.body.error.code).toBe('UPLOAD_NOT_FOUND');
    expect((await File.findById(presign.body.data.file.id)).status).toBe('PENDING');
  });

  it('dung lượng/loại lệch → xoá object + bản ghi, 400 UPLOAD_MISMATCH', async () => {
    const presign = await request(app)
      .post(`${FILES_URL}/presign`)
      .set('Authorization', authHeader)
      .send(PNG);
    vi.spyOn(storage, 'headObject').mockResolvedValueOnce({
      contentType: 'image/png',
      size: 999999,
    });

    const res = await request(app)
      .post(`${FILES_URL}/${presign.body.data.file.id}/complete`)
      .set('Authorization', authHeader);

    expect(res.body.error.code).toBe('UPLOAD_MISMATCH');
    expect(storage.deleteObject).toHaveBeenCalledOnce();
    expect(await File.countDocuments()).toBe(0);
  });

  it('file của người khác → 404 (chống IDOR)', async () => {
    const presign = await request(app)
      .post(`${FILES_URL}/presign`)
      .set('Authorization', authHeader)
      .send(PNG);
    const other = await signIn(await createUser());

    const res = await request(app)
      .post(`${FILES_URL}/${presign.body.data.file.id}/complete`)
      .set('Authorization', other.authHeader);

    expect(res.status).toBe(404);
  });
});

describe('[bai-12] GET /files, tải về, xoá', () => {
  it('danh sách chỉ gồm file READY của chính mình, phân trang, trả id', async () => {
    await uploadFile();
    await uploadFile({ ...PNG, fileName: 'hai.png' });
    await request(app).post(`${FILES_URL}/presign`).set('Authorization', authHeader).send(PNG);
    const other = await signIn(await createUser());
    await uploadFile(PNG, other.authHeader);

    const res = await request(app)
      .get(FILES_URL)
      .query({ limit: 1 })
      .set('Authorization', authHeader);

    expect(res.body.meta).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).not.toHaveProperty('key');
  });

  it('tải về → presigned GET kèm tên gốc; file người khác → 404', async () => {
    const file = await uploadFile();
    const other = await signIn(await createUser());

    const mine = await request(app)
      .get(`${FILES_URL}/${file.id}/download`)
      .set('Authorization', authHeader);
    expect(mine.body.data).toEqual({ url: 'https://r2.example/download' });
    expect(storage.createDownloadUrl).toHaveBeenCalledWith({
      key: expect.stringMatching(/^users\//),
      downloadName: 'ảnh.png',
    });

    const theirs = await request(app)
      .get(`${FILES_URL}/${file.id}/download`)
      .set('Authorization', other.authHeader);
    expect(theirs.status).toBe(404);
  });

  it('xoá → xoá object trên R2 rồi xoá bản ghi; người khác không xoá được', async () => {
    const file = await uploadFile();
    const other = await signIn(await createUser());

    const theirs = await request(app)
      .delete(`${FILES_URL}/${file.id}`)
      .set('Authorization', other.authHeader);
    expect(theirs.status).toBe(404);

    const mine = await request(app)
      .delete(`${FILES_URL}/${file.id}`)
      .set('Authorization', authHeader);
    expect(mine.body.message).toBe('Đã xoá file');
    expect(storage.deleteObject).toHaveBeenCalledOnce();
    expect(await File.countDocuments()).toBe(0);
  });

  it('R2 lỗi khi xoá → 500, bản ghi còn nguyên để thử lại', async () => {
    const file = await uploadFile();
    storage.deleteObject.mockRejectedValueOnce(new Error('R2 DELETE lỗi 503'));

    const res = await request(app)
      .delete(`${FILES_URL}/${file.id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(500);
    expect(await File.exists({ _id: file.id })).toBeTruthy();
  });
});
