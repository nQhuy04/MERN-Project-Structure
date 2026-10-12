import { MongoMemoryReplSet } from 'mongodb-memory-server';

/**
 * Chạy một lần trước toàn bộ test: khởi động MongoDB replica set 1 node trong bộ
 * nhớ (tách hẳn khỏi DB dev), truyền URI cho các file test qua `inject('mongoUri')`.
 * @param {Object} project Vitest TestProject
 * @returns {Promise<Function>} teardown dừng replica set
 */
export default async function setup(project) {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  project.provide('mongoUri', replSet.getUri());

  return async () => {
    await replSet.stop();
  };
}
