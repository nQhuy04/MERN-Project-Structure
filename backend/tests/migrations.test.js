import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { EmailToken } from '../src/modules/auth/emailTokens.model.js';
import { File } from '../src/modules/files/files.model.js';
import { Job, JobRun } from '../src/modules/jobs/jobs.model.js';
import { Media } from '../src/modules/media/media.model.js';
import { MediaFolder } from '../src/modules/media/mediaFolder.model.js';
import { Session } from '../src/modules/sessions/sessions.model.js';
import { Setting } from '../src/modules/settings/settings.model.js';
import { User } from '../src/modules/users/users.model.js';
import { migrateDown, migrateUp } from './helpers/migrations.js';

// Mỗi model mới thêm vào đây để kiểm tra index khai báo trong schema khớp với migration.
const MODELS = [User, EmailToken, Session, Setting, File, Media, MediaFolder, Job, JobRun];

describe('[bai-01] Migration', () => {
  it.each(MODELS.map((model) => [model.modelName, model]))(
    'index trong schema %s khớp với index do migration tạo',
    async (_name, model) => {
      // diffIndexes so key + option nhưng bỏ qua tên index → so tên riêng. Tên lệch làm
      // `down` (dropIndex theo tên) hỏng và autoIndex ở dev báo xung đột.
      const schemaIndexNames = model.schema.indexes().map(([, options]) => options.name);
      const dbIndexNames = (await model.collection.indexes())
        .map((index) => index.name)
        .filter((name) => name !== '_id_');

      expect(dbIndexNames.sort()).toEqual(schemaIndexNames.sort());
      expect(await model.diffIndexes()).toEqual({ toDrop: [], toCreate: [] });
    },
  );

  // Chạy tất cả migration xuống rồi lên lại mất ~4,5 giây — sát ngưỡng 5 giây mặc định của
  // Vitest nên hay đỏ giả. Nới riêng cho test này thay vì nới cho cả bộ.
  it('down gỡ hết index của mọi migration, up tạo lại đầy đủ', async () => {
    const appliedCount = (await mongoose.connection.collection('changelog').countDocuments()) || 0;
    for (let step = 0; step < appliedCount; step += 1) await migrateDown();

    for (const model of MODELS) {
      const names = (await model.collection.indexes()).map((index) => index.name);
      expect(names, model.modelName).toEqual(['_id_']);
    }

    await migrateUp();

    for (const model of MODELS) {
      const names = (await model.collection.indexes()).map((index) => index.name);
      const expected = model.schema.indexes().map(([, options]) => options.name);
      expect(names.sort(), model.modelName).toEqual(['_id_', ...expected].sort());
    }
  }, 30_000);
});
