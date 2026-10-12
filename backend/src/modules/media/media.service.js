// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 13.
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { storage } from '../../shared/lib/storage.js';
import { mapLeanDocument } from '../../shared/utils/mongo.js';
import { buildPaginationMeta, getSkip } from '../../shared/utils/pagination.js';
import { escapeRegExp } from '../../shared/utils/regex.js';
import {
  AVATAR_FOLDER,
  FOLDER_COVER_COUNT,
  MAX_AVATAR_SIZE_BYTES,
  MEDIA_STATUSES,
  ORPHAN_GRACE_PERIOD_MS,
  SYSTEM_FOLDERS,
} from './media.constants.js';
import { Media } from './media.model.js';
import { findMediaUsages } from './media.usages.js';
import { MediaFolder } from './mediaFolder.model.js';

const MONGO_DUPLICATE_KEY = 11000;

const LIST_FIELDS = 'folder name contentType size createdAt uploadedBy';

function mediaNotFoundError() {
  return new AppError({
    statusCode: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: 'Không tìm thấy ảnh',
  });
}

function folderNotFoundError() {
  return new AppError({
    statusCode: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: 'Không tìm thấy thư mục',
  });
}

function folderExistsError() {
  return new AppError({
    statusCode: 409,
    code: ERROR_CODES.FOLDER_EXISTS,
    message: 'Tên thư mục đã tồn tại',
    details: [{ field: 'name', message: 'Tên thư mục đã tồn tại' }],
  });
}

/**
 * **[BÀI 13]** Bước 1 upload ảnh — giống `filesService.requestUpload` (bài 12), khác ở `key`.
 *
 * Các bước: `Media.create({ folder, key, name: fileName, contentType, size, uploadedBy:
 * uploaderId })` với `key` dạng `media/<folder>/<randomUUID()>`, rồi
 * `storage.createUploadUrl({ key: media.key, contentType, contentLength: size })`, trả
 * `{ media, upload }`.
 *
 * Không có quota ở đây: folder `avatars` giới hạn 2MB và ảnh cũ thành mồ côi được job dọn; thư
 * viện ảnh chỉ ADMIN trở lên mới vào được. Chặn duy nhất là rate limit ở route.
 *
 * @param {string} uploaderId
 * @param {Object} input `{ folder, fileName, contentType, size }` đã validate
 * @returns {Promise} resolve `{ media, upload }`
 * @throws {AppError} 501 khi chưa làm
 */
async function requestUpload(uploaderId, { folder, fileName, contentType, size }) {
  return notImplemented('bai-13');
}

/**
 * Tải ảnh vào thư viện (quản trị): chỉ vào thư mục đã tạo — không tự sinh thư mục theo tên gõ tay,
 * không tải tay vào thư mục hệ thống.
 * @param {string} uploaderId
 * @param {Object} input `{ folder, fileName, contentType, size }` đã validate
 * @returns {Promise} resolve `{ media, upload }`
 * @throws {AppError} 404 thư mục không tồn tại
 */
async function requestLibraryUpload(uploaderId, input) {
  if (!(await MediaFolder.exists({ name: input.folder }))) throw folderNotFoundError();
  return requestUpload(uploaderId, input);
}

/**
 * **[BÀI 13]** Bước 3: đối chiếu object thật trên R2. **Chỉ người tải lên** được xác nhận.
 *
 * Giống `filesService.completeUpload` (bài 12) từng bước một, chỉ khác: điều kiện sở hữu là
 * `uploadedBy: uploaderId` (không phải `ownerId`), và thông điệp lỗi nói "ảnh" thay vì "file".
 *
 * @param {string} uploaderId
 * @param {string} mediaId
 * @returns {Promise} resolve media READY
 * @throws {AppError} 404 | 400 UPLOAD_NOT_FOUND | 400 UPLOAD_MISMATCH
 */
async function completeUpload(uploaderId, mediaId) {
  return notImplemented('bai-13');
}

/**
 * Nơi dùng gom theo ảnh.
 * @param {Array} mediaIds
 * @returns {Promise} resolve Map mediaId → MediaUsage[]
 */
async function groupUsages(mediaIds) {
  const usagesByMedia = new Map();
  for (const usage of await findMediaUsages(mediaIds)) {
    const list = usagesByMedia.get(usage.mediaId) ?? [];
    list.push({ label: usage.label, href: usage.href });
    usagesByMedia.set(usage.mediaId, list);
  }
  return usagesByMedia;
}

/**
 * **[BÀI 13]** Thư viện ảnh cho quản trị: lọc folder / tên / loại / đang dùng · mồ côi, sắp xếp,
 * phân trang, và **kèm nơi dùng** của từng ảnh.
 *
 * Các bước:
 * 1. `filter = { status: MEDIA_STATUSES.READY }`, thêm `folder`, `contentType` (từ `type`),
 *    `name` (regex đã `escapeRegExp`) nếu có.
 * 2. Có `usage` → lấy id các ảnh đang dùng: `[...new Set((await findMediaUsages()).map(item =>
 *    item.mediaId))]`, rồi `filter._id = mongoose.trusted(usage === 'in-use' ? { $in: usedIds } :
 *    { $nin: usedIds })`.
 * 3. `Promise.all` giữa `Media.find(filter).select(LIST_FIELDS).sort(sort).skip(...).limit(...)
 *    .lean()` và `Media.countDocuments(filter)`.
 * 4. `items = mapLeanDocument(documents)`, rồi `groupUsages(items.map(i => i.id))` (**một** lời
 *    gọi cho cả trang — không hỏi từng ảnh một, tránh N+1), gắn `usages` vào từng item.
 *
 * Cách lọc "đang dùng" ở bước 2 nạp toàn bộ id đang dùng vào bộ nhớ. Đủ cho quy mô source base;
 * khi có hàng chục nghìn ảnh thì nên lưu một cờ `inUse` trên document để truy vấn thẳng.
 *
 * @param {Object} query `{ folder, q, type, usage, sort, page, limit }` đã validate
 * @returns {Promise} resolve `{ items, meta }` — mỗi item có `usages`
 * @throws {AppError} 501 khi chưa làm
 */
async function list({ folder, q, type, usage, sort, page, limit }) {
  return notImplemented('bai-13');
}

/**
 * Tổng quan thư mục: thư mục hệ thống + thư mục đã tạo (kể cả rỗng), kèm số ảnh, dung lượng,
 * vài ảnh mới nhất làm ảnh bìa. Chỉ tính ảnh READY.
 * @returns {Promise} resolve mảng `{ name, isSystem, mediaCount, totalSize, coverIds,
 *   lastUploadedAt, createdAt }` — thư mục hệ thống trước, còn lại A → Z
 */
async function listFolders() {
  const [stats, createdFolders] = await Promise.all([
    Media.aggregate([
      { $match: { status: MEDIA_STATUSES.READY } },
      {
        $group: {
          _id: '$folder',
          mediaCount: { $sum: 1 },
          totalSize: { $sum: '$size' },
          lastUploadedAt: { $max: '$createdAt' },
          coverIds: {
            $topN: { n: FOLDER_COVER_COUNT, sortBy: { createdAt: -1 }, output: '$_id' },
          },
        },
      },
    ]),
    MediaFolder.find().select('name createdAt').lean(),
  ]);

  const statsByName = new Map(stats.map((item) => [item._id, item]));
  const createdAtByName = new Map(createdFolders.map((folder) => [folder.name, folder.createdAt]));
  const names = new Set([...SYSTEM_FOLDERS, ...createdAtByName.keys(), ...statsByName.keys()]);

  return [...names]
    .map((name) => {
      const folderStats = statsByName.get(name);
      return {
        name,
        isSystem: SYSTEM_FOLDERS.includes(name),
        mediaCount: folderStats?.mediaCount ?? 0,
        totalSize: folderStats?.totalSize ?? 0,
        coverIds: folderStats?.coverIds.map(String) ?? [],
        lastUploadedAt: folderStats?.lastUploadedAt ?? null,
        createdAt: createdAtByName.get(name) ?? null,
      };
    })
    .sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name));
}

/**
 * Tạo thư mục rỗng.
 * @param {string} userId người tạo
 * @param {string} name đã validate (`[a-z0-9-]`)
 * @returns {Promise} resolve thư mục vừa tạo
 * @throws {AppError} 409 FOLDER_EXISTS (trùng tên, kể cả tên thư mục hệ thống)
 */
async function createFolder(userId, name) {
  if (SYSTEM_FOLDERS.includes(name)) throw folderExistsError();
  try {
    return await MediaFolder.create({ name, createdBy: userId });
  } catch (error) {
    // Unique index bắt cả trường hợp hai người tạo cùng tên cùng lúc.
    if (error.code === MONGO_DUPLICATE_KEY) throw folderExistsError();
    throw error;
  }
}

/**
 * Xoá thư mục RỖNG (còn ảnh, kể cả ảnh đang tải dở → chặn; xoá ảnh trước).
 * Giữa lúc kiểm tra và lúc xoá vẫn có thể có người vừa xin tải ảnh vào — ảnh đó vẫn xem / xoá
 * được trong "Tất cả ảnh"; chấp nhận khe hở này thay vì khoá cả thư viện.
 * @param {string} name
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 404 | 409 FOLDER_NOT_EMPTY
 */
async function deleteFolder(name) {
  const folder = await MediaFolder.findOne({ name }).select('_id');
  if (!folder) throw folderNotFoundError();
  if (await Media.exists({ folder: name })) {
    throw new AppError({
      statusCode: 409,
      code: ERROR_CODES.FOLDER_NOT_EMPTY,
      message: 'Thư mục còn ảnh — xoá hết ảnh trước khi xoá thư mục',
    });
  }
  await MediaFolder.deleteOne({ _id: folder._id });
}

/**
 * **[BÀI 13]** Xoá ảnh — **chặn nếu ảnh đang được dùng**.
 *
 * Các bước:
 * 1. `Media.findById(mediaId)`; không có → `mediaNotFoundError()`.
 * 2. `groupUsages([String(media._id)])` rồi lấy phần tử của ảnh này. Có nơi dùng → ném 409
 *    `MEDIA_IN_USE` với **`details`** chính là mảng `{ label, href }` đó.
 * 3. `storage.deleteObject(media.key)` **trước**, `Media.deleteOne` **sau** (bài 12, mục 1.3).
 *
 * ⚠️ MongoDB **không có khoá ngoại**, nên không ai chặn việc xoá một ảnh đang là avatar của ai
 * đó. Kiểm tra này là thứ thay thế — và `details` cho quản trị viên biết **ảnh đang nằm ở đâu**
 * để gỡ trước, thay vì chỉ báo "không xoá được".
 *
 * @param {string} mediaId
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 404 | 409 MEDIA_IN_USE (details: `[{ label, href }]`)
 */
async function remove(mediaId) {
  return notImplemented('bai-13');
}

/**
 * **[BÀI 13]** Dọn ảnh mồ côi: READY, **không nơi nào dùng**, và tải lên **quá 24 giờ**.
 *
 * Các bước: lấy `usedIds` như trong `list`; `Media.find({ status: READY, createdAt sớm hơn
 * now - ORPHAN_GRACE_PERIOD_MS, _id: { $nin: usedIds } }).select('key')`; rồi với mỗi ảnh:
 * `storage.deleteObject` → `Media.deleteOne`. Trả số ảnh đã xoá.
 *
 * ⚠️ **Khoảng ân hạn 24 giờ là bắt buộc.** Giữa lúc người dùng tải ảnh lên và lúc họ bấm "Lưu",
 * ảnh đó chưa được gán vào đâu cả — tức là "mồ côi" theo đúng định nghĩa. Không có ân hạn, job
 * chạy ngay lúc ấy sẽ xoá mất ảnh người dùng vừa tải.
 *
 * @param {Object} [options] `{ now }` để test
 * @returns {Promise} resolve số ảnh đã xoá
 * @throws {AppError} 501 khi chưa làm
 */
async function cleanupOrphans({ now = new Date() } = {}) {
  return notImplemented('bai-13');
}

/**
 * **[BÀI 13]** Dọn upload dở: bản ghi PENDING quá hạn (xin URL rồi bỏ ngang).
 *
 * Các bước: `Media.find({ status: PENDING, createdAt sớm hơn now - olderThanMs }).select('key')`,
 * rồi với mỗi bản ghi: `storage.deleteObject` → `Media.deleteOne`. Trả số bản ghi đã dọn.
 *
 * Xoá object trước dù có thể **chưa** có object nào trên R2 (người dùng bỏ ngang trước khi PUT) —
 * `deleteObject` trên key không tồn tại không gây lỗi.
 *
 * @param {Object} params `{ olderThanMs, now }`
 * @returns {Promise} resolve số bản ghi đã dọn
 * @throws {AppError} 501 khi chưa làm
 */
async function cleanupPendingUploads({ olderThanMs, now = new Date() }) {
  return notImplemented('bai-13');
}

/**
 * **[BÀI 13]** URL ảnh để hiển thị (presigned GET) — endpoint công khai trả **302** tới URL này.
 *
 * Các bước: `Media.findOne({ _id: mediaId, status: READY }).select('key')`; không có →
 * `mediaNotFoundError()`. Rồi `storage.createDownloadUrl({ key: media.key })`.
 *
 * Không có `downloadName` (khác `filesService.getDownloadUrl`): ảnh này để **hiển thị** trong thẻ
 * `<img>`, không phải để tải về — đặt `Content-Disposition: attachment` sẽ làm trình duyệt tải
 * xuống thay vì vẽ ra.
 *
 * @param {string} mediaId
 * @returns {Promise} resolve URL
 * @throws {AppError} 404 khi ảnh chưa READY hoặc không tồn tại
 */
async function getContentUrl(mediaId) {
  return notImplemented('bai-13');
}

/**
 * **[BÀI 13]** Kiểm tra một ảnh có dùng được làm avatar của `userId` không.
 *
 * Các bước: `Media.findOne({ _id: mediaId, uploadedBy: userId, folder: AVATAR_FOLDER, status:
 * READY }).select('size')`. Không tìm thấy **hoặc** `media.size > MAX_AVATAR_SIZE_BYTES` → ném
 * 400 `INVALID_AVATAR` (`'Ảnh đại diện không hợp lệ — hãy tải ảnh lên lại'`).
 *
 * ⚠️ **Bốn điều kiện, cả bốn đều cần.** `mediaId` đến từ body của người dùng: thiếu `uploadedBy`
 * thì họ gán ảnh của người khác làm avatar của mình; thiếu `folder` thì họ trỏ vào một ảnh hệ
 * thống bất kỳ trong thư viện admin; thiếu `status` thì avatar trỏ vào object chưa tồn tại.
 *
 * ⚠️ Một thông điệp lỗi chung cho cả bốn trường hợp — không nói rõ "ảnh này của người khác", vì
 * như thế là xác nhận `mediaId` đó có thật.
 *
 * @param {string} userId
 * @param {string} mediaId
 * @returns {Promise} resolve khi hợp lệ
 * @throws {AppError} 400 INVALID_AVATAR
 */
async function assertUsableAsAvatar(userId, mediaId) {
  return notImplemented('bai-13');
}

/**
 * **[BÀI 13]** Thống kê cho trang tổng quan quản trị (bài 14 dùng lại).
 *
 * Các bước: lấy `usedIds` như trong `list`; `Promise.all` đếm `total` (mọi ảnh READY) và `inUse`
 * (ảnh READY có `_id` trong `usedIds`); trả `{ total, orphans: total - inUse }`.
 *
 * @returns {Promise} resolve `{ total, orphans }`
 * @throws {AppError} 501 khi chưa làm
 */
async function getStats() {
  return notImplemented('bai-13');
}

export const mediaService = {
  getStats,
  requestUpload,
  requestLibraryUpload,
  completeUpload,
  list,
  listFolders,
  createFolder,
  deleteFolder,
  remove,
  cleanupOrphans,
  cleanupPendingUploads,
  getContentUrl,
  assertUsableAsAvatar,
};
