import { Router } from 'express';
import { authRateLimiter, loginRateLimiter } from '../../shared/middlewares/rateLimit.js';
import { features } from '../../shared/config/features.js';
import { requireFeature } from '../../shared/middlewares/requireFeature.js';
import { requireXhr } from '../../shared/middlewares/requireXhr.js';
import { validate } from '../../shared/middlewares/validate.js';
import { authController } from './auth.controller.js';
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  magicLinkBodySchema,
  magicLinkVerifyBodySchema,
  registerBodySchema,
  resendVerificationBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
} from './auth.schema.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validate({ body: registerBodySchema }),
  authController.register,
);
authRouter.post(
  '/verify-email',
  authRateLimiter,
  validate({ body: verifyEmailBodySchema }),
  authController.verifyEmail,
);
authRouter.post(
  '/resend-verification',
  authRateLimiter,
  validate({ body: resendVerificationBodySchema }),
  authController.resendVerification,
);
authRouter.post(
  '/login',
  loginRateLimiter,
  validate({ body: loginBodySchema }),
  authController.login,
);
// Dùng cookie (không có access token) → bắt buộc header chống CSRF.
authRouter.post('/refresh', requireXhr, authController.refresh);
authRouter.post('/logout', requireXhr, authController.logout);
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordBodySchema }),
  authController.forgotPassword,
);
authRouter.post(
  '/reset-password',
  authRateLimiter,
  validate({ body: resetPasswordBodySchema }),
  authController.resetPassword,
);
authRouter.post(
  '/magic-link',
  authRateLimiter,
  validate({ body: magicLinkBodySchema }),
  authController.requestMagicLink,
);
authRouter.post(
  '/magic-link/verify',
  loginRateLimiter,
  validate({ body: magicLinkVerifyBodySchema }),
  authController.loginWithMagicLink,
);

// Google OAuth: điều hướng trình duyệt (không phải API JSON). Chưa cấu hình GOOGLE_* → 404.
const requireGoogleOAuth = requireFeature(() => features.isGoogleOAuthEnabled());
authRouter.get('/google', authRateLimiter, requireGoogleOAuth, authController.startGoogleLogin);
authRouter.get('/google/callback', requireGoogleOAuth, authController.handleGoogleCallback);
