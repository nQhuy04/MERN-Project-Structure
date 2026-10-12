/** Key setting frontend cần biết — khớp backend (modules/settings/settings.registry.js). */
export const SETTING_KEYS = Object.freeze({
  REGISTRATION_ENABLED: 'auth.registrationEnabled',
  MAGIC_LINK_ENABLED: 'auth.magicLinkEnabled',
  // Chỉ Super Admin thấy (không có trong GET /settings/public).
  EMAIL_PROVIDER: 'email.provider',
});
