const ADMIN_SESSION_KEY = "gutshoes-admin-session";
const SESSION_RENDER_TTL = 15 * 60 * 1000;
const SESSION_VERIFY_INTERVAL = 60 * 1000;

export function readAdminSession() {
  try {
    const checkedAt = Number(sessionStorage.getItem(ADMIN_SESSION_KEY));
    const age = Date.now() - checkedAt;
    return {
      valid: Number.isFinite(checkedAt) && checkedAt > 0 && age < SESSION_RENDER_TTL,
      fresh: checkedAt > 0 && age < SESSION_VERIFY_INTERVAL,
    };
  } catch {
    return {valid: false, fresh: false};
  }
}

export function rememberAdminSession() {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, String(Date.now()));
  } catch {
    // Kegagalan storage tidak boleh memblokir autentikasi server.
  }
}

export function forgetAdminSession() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Sesi backend tetap menjadi sumber otorisasi.
  }
}
