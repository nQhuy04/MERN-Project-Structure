import mongoose from 'mongoose';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { up as createMediaFoldersMigration } from '../../migrations/20260930120000-create-media-folders.js';
import { app } from '../../src/app.js';
import { Media } from '../../src/modules/media/media.model.js';
import { MediaFolder } from '../../src/modules/media/mediaFolder.model.js';
import { mediaService } from '../../src/modules/media/media.service.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { User } from '../../src/modules/users/users.model.js';
import { storage } from '../../src/shared/lib/storage.js';
import { signIn } from '../helpers/auth.js';
import { createUser } from '../helpers/factories.js';

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  vi.spyOn(storage, 'createUploadUrl').mockResolvedValue({
    url: 'https://r2.example/upload',
    method: 'PUT',
    headers: {},
  });
  vi.spyOn(storage, 'createDownloadUrl').mockResolvedValue('https://r2.example/signed-get');
  vi.spyOn(storage, 'deleteObject').mockResolvedValue();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all([
    User.deleteMany({}),
    Session.deleteMany({}),
    Media.deleteMany({}),
    MediaFolder.deleteMany({}),
  ]);
});

/** Tạo ảnh READY trực tiếp trong DB. */
function createMedia(overrides = {}) {
  return Media.create({
    folder: 'banners',
    key: `media/banners/${Math.random()}`,
    name: 'anh.png',
    contentType: 'image/png',
    size: 1000,
    status: 'READY',
    uploadedBy: overrides.uploadedBy ?? new User()._id,
    ...overrides,
  });
}

async function signInAs(role) {
  const user = await createUser({ role });
  return { user, ...(await signIn(user)) };
}

describe('[bai-13] GET /media/:id/content — hiển thị ảnh công khai', () => {
  it('302 sang presigned GET, cache ngắn, cho phép nhúng khác origin (CORP cross-origin)', async () => {
    const media = await createMedia();

    const res = await request(app).get(`/api/v1/media/${media._id}/content`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://r2.example/signed-get');
    expect(res.headers['cache-control']).toBe('public, max-age=240');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('ảnh chưa READY / không tồn tại → 404', async () => {
    const pending = await createMedia({ status: 'PENDING' });

    expect((await request(app).get(`/api/v1/media/${pending._id}/content`)).status).toBe(404);
  });
});

describe('[bai-13] Ảnh đại diện', () => {
  async function uploadAvatar(authHeader, size = 1000) {
    const presign = await request(app)
      .post('/api/v1/media/avatar/presign')
      .set('Authorization', authHeader)
      .send({ fileName: 'mat.png', contentType: 'image/png', size });
    vi.spyOn(storage, 'headObject').mockResolvedValueOnce({ contentType: 'image/png', size });
    const complete = await request(app)
      .post(`/api/v1/media/${presign.body.data.media.id}/complete`)
      .set('Authorization', authHeader);
    return complete.body.data;
  }

  it('thành viên tải ảnh (luôn vào folder avatars) rồi đặt làm avatar; ảnh cũ thành mồ côi', async () => {
    const { user, authHeader } = await signInAs('MEMBER');
    const first = await uploadAvatar(authHeader);
    const second = await uploadAvatar(authHeader);

    await request(app)
      .patch('/api/v1/users/me/avatar')
      .set('Authorization', authHeader)
      .send({ mediaId: first.id });
    const res = await request(app)
      .patch('/api/v1/users/me/avatar')
      .set('Authorization', authHeader)
      .send({ mediaId: second.id });

    expect(res.body.data.avatarMediaId).toBe(second.id);
    expect((await Media.findById(first.id)).folder).toBe('avatars');
    expect(await Media.exists({ _id: first.id })).toBeTruthy();
    expect(String((await User.findById(user._id)).avatarMediaId)).toBe(second.id);
  });

  it('ảnh đại diện > 2MB → 400 ngay khi xin URL', async () => {
    const { authHeader } = await signInAs('MEMBER');

    const res = await request(app)
      .post('/api/v1/media/avatar/presign')
      .set('Authorization', authHeader)
      .send({ fileName: 'to.png', contentType: 'image/png', size: 2 * 1024 * 1024 + 1 });

    expect(res.status).toBe(400);
  });

  it('không lấy được ảnh của người khác / ảnh ngoài folder avatars làm avatar → 400 INVALID_AVATAR', async () => {
    const { authHeader } = await signInAs('MEMBER');
    const other = await createUser();
    const othersAvatar = await createMedia({ folder: 'avatars', uploadedBy: other._id });
    const banner = await createMedia({ folder: 'banners' });

    for (const media of [othersAvatar, banner]) {
      const res = await request(app)
        .patch('/api/v1/users/me/avatar')
        .set('Authorization', authHeader)
        .send({ mediaId: String(media._id) });
      expect(res.body.error.code).toBe('INVALID_AVATAR');
    }
  });

  it('gỡ ảnh đại diện (mediaId null)', async () => {
    const { authHeader } = await signInAs('MEMBER');
    const avatar = await uploadAvatar(authHeader);
    await request(app)
      .patch('/api/v1/users/me/avatar')
      .set('Authorization', authHeader)
      .send({ mediaId: avatar.id });

    const res = await request(app)
      .patch('/api/v1/users/me/avatar')
      .set('Authorization', authHeader)
      .send({ mediaId: null });

    expect(res.body.data.avatarMediaId).toBeNull();
  });
});

describe('[bai-13] /admin/media — thư viện ảnh', () => {
  it('MEMBER → 403; ADMIN tải ảnh vào thư mục đã tạo (tên thư mục được kiểm tra)', async () => {
    const member = await signInAs('MEMBER');
    const admin = await signInAs('ADMIN');
    await MediaFolder.create({ name: 'banners' });
    const body = { folder: 'banners', fileName: 'b.png', contentType: 'image/png', size: 500 };

    expect(
      (await request(app).get('/api/v1/admin/media').set('Authorization', member.authHeader))
        .status,
    ).toBe(403);

    const ok = await request(app)
      .post('/api/v1/admin/media/presign')
      .set('Authorization', admin.authHeader)
      .send(body);
    expect(ok.status).toBe(201);
    expect(ok.body.data.media.folder).toBe('banners');

    const bad = await request(app)
      .post('/api/v1/admin/media/presign')
      .set('Authorization', admin.authHeader)
      .send({ ...body, folder: '../Bi Mat' });
    expect(bad.status).toBe(400);
  });

  it('danh sách kèm nơi dùng; lọc đang dùng / mồ côi, folder, tên, loại', async () => {
    const { authHeader } = await signInAs('ADMIN');
    const used = await createMedia({ folder: 'avatars', name: 'mat-an.png' });
    await createUser({ name: 'An', email: 'an@example.com', avatarMediaId: used._id });
    await createMedia({ folder: 'banners', name: 'banner-he.webp', contentType: 'image/webp' });

    const all = await request(app).get('/api/v1/admin/media').set('Authorization', authHeader);
    const usedItem = all.body.data.find((item) => item.id === String(used._id));
    expect(usedItem.usages).toEqual([
      { label: 'Ảnh đại diện của An', href: '/admin/users?q=an%40example.com' },
    ]);
    expect(usedItem).not.toHaveProperty('key');

    const query = async (params) =>
      (
        await request(app).get('/api/v1/admin/media').query(params).set('Authorization', authHeader)
      ).body.data.map((item) => item.name);
    expect(await query({ usage: 'in-use' })).toEqual(['mat-an.png']);
    expect(await query({ usage: 'orphan' })).toEqual(['banner-he.webp']);
    expect(await query({ folder: 'banners' })).toEqual(['banner-he.webp']);
    expect(await query({ q: 'MAT' })).toEqual(['mat-an.png']);
    expect(await query({ type: 'image/webp' })).toEqual(['banner-he.webp']);

    const folders = await request(app)
      .get('/api/v1/admin/media/folders')
      .set('Authorization', authHeader);
    expect(folders.body.data.map((folder) => folder.name)).toEqual(['avatars', 'banners']);
  });

  it('xoá ảnh đang dùng → 409 MEDIA_IN_USE kèm nơi dùng; ảnh không dùng → xoá object + bản ghi', async () => {
    const { authHeader } = await signInAs('ADMIN');
    const used = await createMedia();
    await createUser({ name: 'An', avatarMediaId: used._id });
    const free = await createMedia();

    const blocked = await request(app)
      .delete(`/api/v1/admin/media/${used._id}`)
      .set('Authorization', authHeader);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error).toMatchObject({
      code: 'MEDIA_IN_USE',
      details: [{ label: 'Ảnh đại diện của An', href: expect.any(String) }],
    });
    expect(await Media.exists({ _id: used._id })).toBeTruthy();

    await request(app)
      .delete(`/api/v1/admin/media/${free._id}`)
      .set('Authorization', authHeader)
      .expect(200);
    expect(storage.deleteObject).toHaveBeenCalledWith(free.key);
    expect(await Media.exists({ _id: free._id })).toBeNull();
  });
});

describe('[bai-13] /admin/media/folders — danh sách thư mục, tải vào thư mục', () => {
  const foldersUrl = '/api/v1/admin/media/folders';

  it('danh sách: thư mục hệ thống trước (kể cả chưa có ảnh), thư mục rỗng vẫn có; chỉ đếm ảnh READY', async () => {
    const { authHeader } = await signInAs('ADMIN');
    await MediaFolder.create([{ name: 'banners' }, { name: 'trong' }]);
    const older = await createMedia({ size: 100, createdAt: new Date(Date.now() - DAY_MS) });
    const newer = await createMedia({ size: 250 });
    await createMedia({ size: 999, status: 'PENDING' });

    const res = await request(app).get(foldersUrl).set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.map((folder) => folder.name)).toEqual(['avatars', 'banners', 'trong']);
    const [avatars, banners, empty] = res.body.data;
    expect(avatars).toMatchObject({ isSystem: true, mediaCount: 0, coverIds: [] });
    expect(banners).toMatchObject({ isSystem: false, mediaCount: 2, totalSize: 350 });
    expect(banners.coverIds).toEqual([String(newer._id), String(older._id)]);
    expect(empty).toMatchObject({ mediaCount: 0, totalSize: 0, lastUploadedAt: null });
  });

  it('ảnh bìa: tối đa 4 ảnh mới nhất', async () => {
    const { authHeader } = await signInAs('ADMIN');
    await MediaFolder.create({ name: 'banners' });
    for (let index = 0; index < 6; index += 1) {
      await createMedia({ createdAt: new Date(Date.now() - index * 1000) });
    }

    const res = await request(app).get(foldersUrl).set('Authorization', authHeader);

    expect(res.body.data.find((folder) => folder.name === 'banners').coverIds).toHaveLength(4);
  });

  it('tải ảnh vào thư mục chưa tạo / thư mục hệ thống → 404, không tạo bản ghi ảnh', async () => {
    const { authHeader } = await signInAs('ADMIN');

    for (const folder of ['chua-tao', 'avatars']) {
      const res = await request(app)
        .post('/api/v1/admin/media/presign')
        .set('Authorization', authHeader)
        .send({ folder, fileName: 'b.png', contentType: 'image/png', size: 500 });
      expect(res.status, folder).toBe(404);
    }
    expect(await Media.countDocuments()).toBe(0);
  });
});

// Tạo / xoá thư mục là phần có sẵn (không phải viết), nhưng cần đăng nhập (bài 04–05) nên chỉ
// xanh khi đã làm tới bài 13.
describe('[bai-13] /admin/media/folders — tạo / xoá thư mục (có sẵn)', () => {
  const foldersUrl = '/api/v1/admin/media/folders';

  it('tạo thư mục rỗng → 201; trùng tên / tên thư mục hệ thống → 409 FOLDER_EXISTS; tên sai → 400', async () => {
    const { authHeader, user } = await signInAs('ADMIN');

    const created = await request(app)
      .post(foldersUrl)
      .set('Authorization', authHeader)
      .send({ name: 'su-kien' });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ name: 'su-kien', createdBy: String(user._id) });

    for (const name of ['su-kien', 'avatars']) {
      const duplicate = await request(app)
        .post(foldersUrl)
        .set('Authorization', authHeader)
        .send({ name });
      expect(duplicate.status, name).toBe(409);
      expect(duplicate.body.error.code).toBe('FOLDER_EXISTS');
      expect(duplicate.body.error.details).toEqual([
        { field: 'name', message: 'Tên thư mục đã tồn tại' },
      ]);
    }

    const invalid = await request(app)
      .post(foldersUrl)
      .set('Authorization', authHeader)
      .send({ name: 'Sự Kiện' });
    expect(invalid.status).toBe(400);
  });

  it('MEMBER không tạo / xoá được thư mục', async () => {
    const { authHeader } = await signInAs('MEMBER');

    const res = await request(app)
      .post(foldersUrl)
      .set('Authorization', authHeader)
      .send({ name: 'x' });

    expect(res.status).toBe(403);
  });

  it('xoá: còn ảnh (kể cả đang tải dở) → 409 FOLDER_NOT_EMPTY; rỗng → xoá; không tồn tại / hệ thống → 404', async () => {
    const { authHeader } = await signInAs('ADMIN');
    await MediaFolder.create([{ name: 'banners' }, { name: 'trong' }]);
    await createMedia({ status: 'PENDING' });

    const notEmpty = await request(app)
      .delete(`${foldersUrl}/banners`)
      .set('Authorization', authHeader);
    expect(notEmpty.status).toBe(409);
    expect(notEmpty.body.error.code).toBe('FOLDER_NOT_EMPTY');

    const removed = await request(app)
      .delete(`${foldersUrl}/trong`)
      .set('Authorization', authHeader);
    expect(removed.status).toBe(200);
    expect(await MediaFolder.exists({ name: 'trong' })).toBeNull();

    for (const name of ['khong-co', 'avatars']) {
      const missing = await request(app)
        .delete(`${foldersUrl}/${name}`)
        .set('Authorization', authHeader);
      expect(missing.status, name).toBe(404);
    }
  });

  it('migration tạo bù thư mục cho ảnh có sẵn (trừ thư mục hệ thống), chạy lại không nhân đôi', async () => {
    await createMedia({ folder: 'banners' });
    await createMedia({ folder: 'avatars' });
    await MediaFolder.create({ name: 'co-san' });

    await createMediaFoldersMigration(mongoose.connection.db);
    await createMediaFoldersMigration(mongoose.connection.db);

    const names = (await MediaFolder.find().lean()).map((folder) => folder.name).sort();
    expect(names).toEqual(['banners', 'co-san']);
  });
});

describe('[bai-13] mediaService — dọn dẹp', () => {
  it('cleanupOrphans: chỉ xoá ảnh không ai dùng VÀ đã quá 24 giờ', async () => {
    const now = new Date();
    const oldOrphan = await createMedia({ createdAt: new Date(now - 2 * DAY_MS) });
    const newOrphan = await createMedia();
    const oldUsed = await createMedia({ createdAt: new Date(now - 2 * DAY_MS) });
    await createUser({ avatarMediaId: oldUsed._id });

    const deletedCount = await mediaService.cleanupOrphans({ now });

    expect(deletedCount).toBe(1);
    expect(await Media.exists({ _id: oldOrphan._id })).toBeNull();
    expect(await Media.exists({ _id: newOrphan._id })).toBeTruthy();
    expect(await Media.exists({ _id: oldUsed._id })).toBeTruthy();
  });

  it('cleanupPendingUploads: xoá PENDING quá hạn, giữ PENDING mới và READY', async () => {
    const now = new Date();
    const stale = await createMedia({
      status: 'PENDING',
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
    });
    const fresh = await createMedia({ status: 'PENDING' });
    const ready = await createMedia({ createdAt: new Date(now - DAY_MS) });

    const count = await mediaService.cleanupPendingUploads({ olderThanMs: 60 * 60 * 1000, now });

    expect(count).toBe(1);
    expect(await Media.exists({ _id: stale._id })).toBeNull();
    expect(await Media.exists({ _id: fresh._id })).toBeTruthy();
    expect(await Media.exists({ _id: ready._id })).toBeTruthy();
  });

  it('POST /admin/media/cleanup-orphans trả số ảnh đã dọn', async () => {
    const { authHeader } = await signInAs('ADMIN');
    await createMedia({ createdAt: new Date(Date.now() - 2 * DAY_MS) });

    const res = await request(app)
      .post('/api/v1/admin/media/cleanup-orphans')
      .set('Authorization', authHeader);

    expect(res.body).toMatchObject({ message: 'Đã dọn 1 ảnh mồ côi', data: { deletedCount: 1 } });
  });
});
