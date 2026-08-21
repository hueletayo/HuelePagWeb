// ============================================================
// auth.js — Utilidades de autenticación compartidas
// Incluir en dashboard.html, admin.html, pagos.html, completar_perfil.html
// ============================================================

const API = "https://api-3erround.onrender.com";

function getSession() {
  const raw = localStorage.getItem("atleta_data");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function requireAuth(redirectTo = "login.html") {
  const s = getSession();
  if (!s || !s.id) { window.location.href = redirectTo; return null; }
  return s;
}

function requireAdmin() {
  const s = requireAuth();
  if (!s) return null;
  if (s.role !== "ADMIN") { window.location.href = "dashboard.html"; return null; }
  return s;
}

function requireUser() {
  const s = requireAuth();
  if (!s) return null;
  if (s.role === "ADMIN") { window.location.href = "admin.html"; return null; }
  return s;
}

function logout() {
  localStorage.removeItem("atleta_data");
  window.location.href = "login.html";
}

function adminHeaders(session) {
  return { "Content-Type": "application/json", "x-athlete-id": String(session.id) };
}

function userHeaders(session) {
  return { "Content-Type": "application/json", "x-athlete-id": String(session.id) };
}
