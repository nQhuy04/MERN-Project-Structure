import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** MSW chặn request HTTP thật trong test, trả response giả theo định dạng chuẩn của backend. */
export const server = setupServer(...handlers);
