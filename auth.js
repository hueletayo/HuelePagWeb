// ============================================================
// auth.js — Sesión compartida del portal
// Incluir en dashboard.html, admin.html, pagos.html,
// completar_perfil.html, login.html y registro.html
// ============================================================

const API = "https://api-3erround.onrender.com";

const TOKEN_KEY = "3rf_token";
const USER_KEY = "atleta_data";

// ---------- Sesión ----------

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getSession() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function saveUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function logout() {
  clearSession();
  window.location.href = "login.html";
}

// ---------- Llamadas a la API ----------

function authHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

/**
 * fetch con el token puesto y manejo central de sesión caída.
 * Un 401/403 del servidor cierra la sesión: el token venció o fue revocado.
 */
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: Object.assign(authHeaders(), options.headers || {}),
  });

  if (res.status === 401) {
    clearSession();
    window.location.href = "login.html?expirada=1";
    throw new Error("Sesión expirada");
  }
  return res;
}

// ---------- Guardas de navegación ----------
// OJO: esto es solo enrutado de UI. Quien decide de verdad es el backend,
// que verifica la firma del token en cada endpoint. Cambiar el rol en
// localStorage no da acceso a nada.

function requireAuth(redirectTo = "login.html") {
  const s = getSession();
  if (!s || !s.id || !getToken()) {
    clearSession();
    window.location.href = redirectTo;
    return null;
  }
  return s;
}

function requireAdmin() {
  const s = requireAuth();
  if (!s) return null;
  if (s.role !== "ADMIN") {
    window.location.href = "dashboard.html";
    return null;
  }
  return s;
}

function requireUser() {
  const s = requireAuth();
  if (!s) return null;
  if (s.role === "ADMIN") {
    window.location.href = "admin.html";
    return null;
  }
  return s;
}

/** A dónde mandar a alguien que ya tiene sesión abierta. */
function destinoSegunSesion(user) {
  if (user.role === "ADMIN") return "admin.html";
  if (!user.perfilCompletado) return "completar_perfil.html";
  return "dashboard.html";
}

// ---------- Utilidades ----------

/**
 * Escapa texto que viene del servidor antes de meterlo en innerHTML.
 * El nombre, la cédula y la ficha de salud los escribe el propio atleta:
 * sin esto, cualquiera podía inyectar HTML en el panel del administrador.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
