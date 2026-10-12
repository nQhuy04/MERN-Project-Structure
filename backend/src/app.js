import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './shared/config/env.js';
import { corsOptions } from './shared/config/cors.js';
import { apiRouter } from './routes/index.js';
import { docsRouter } from './routes/docs.routes.js';
import { notFound } from './shared/middlewares/notFound.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import { requestLogger } from './shared/middlewares/requestLogger.js';

const JSON_BODY_LIMIT = '100kb';

/**
 * Express app: middleware bảo mật, parser, routes, xử lý lỗi. Không listen ở đây
 * để Supertest dùng trực tiếp — listen nằm trong server.js.
 */
export const app = express();

app.set('trust proxy', env.TRUST_PROXY);

app.use(requestLogger);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(cookieParser());

if (env.IS_DEVELOPMENT) {
  app.use('/api/docs', docsRouter);
}
app.use('/api/v1', apiRouter);

app.use(notFound);
app.use(errorHandler);
