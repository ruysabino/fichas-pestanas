/* ==========================================================================
   LASH STUDIO – Security Module
   Autenticação local · Cifra AES-GCM · Backup/Restore · RGPD
   (Adaptado do módulo Beleza Rara)
   ========================================================================== */
'use strict';

let _authSession = null;
const SESSION_KEY = 'ls_session';
const USERS_KEY   = 'ls_users_v1';
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 horas

const crypto = window.crypto || window.msCrypto;
const subtle = crypto.subtle;

function buf2hex(buf) { return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''); }
function hex2buf(hex) { const b = new Uint8Array(hex.length/2); for(let i=0;i<b.length;i++) b[i]=parseInt(hex.slice(i*2,i*2+2),16); return b.buffer; }
function str2buf(str) { return new TextEncoder().encode(str); }
function buf2str(buf) { return new TextDecoder().decode(buf); }
function buf2b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function b642buf(b64) { const bin=atob(b64); const b=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) b[i]=bin.charCodeAt(i); return b.buffer; }

async function importKeyMaterial(password) {
  return subtle.importKey('raw', str2buf(password), 'PBKDF2', false, ['deriveBits','deriveKey']);
}
async function deriveBitsFromPassword(password, salt) {
  const saltBuf = typeof salt === 'string' ? hex2buf(salt) : salt;
  const km = await importKeyMaterial(password);
  return subtle.deriveBits({ name:'PBKDF2', salt:saltBuf, iterations:310_000, hash:'SHA-256' }, km, 256);
}
async function deriveKey(password, salt) {
  const saltBuf = typeof salt === 'string' ? hex2buf(salt) : salt;
  const km = await importKeyMaterial(password);
  return subtle.deriveKey({ name:'PBKDF2', salt:saltBuf, iterations:310_000, hash:'SHA-256' }, km, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
}
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const bits = await deriveBitsFromPassword(password, salt.buffer);
  return { salt: buf2hex(salt.buffer), hash: buf2hex(bits) };
}
async function verifyPassword(password, storedSalt, storedHash) {
  const bits = await deriveBitsFromPassword(password, storedSalt);
  return buf2hex(bits) === storedHash;
}
async function encryptData(data, password) {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const enc  = await subtle.encrypt({ name:'AES-GCM', iv }, key, str2buf(JSON.stringify(data)));
  const packed = new Uint8Array(32+12+enc.byteLength);
  packed.set(new Uint8Array(salt.buffer), 0);
  packed.set(new Uint8Array(iv.buffer), 32);
  packed.set(new Uint8Array(enc), 44);
  return buf2b64(packed.buffer);
}
async function decryptData(b64, password) {
  const packed = new Uint8Array(b642buf(b64));
  const salt   = packed.slice(0, 32).buffer;
  const iv     = packed.slice(32, 44);
  const cipher = packed.slice(44);
  const key    = await deriveKey(password, salt);
  const plain  = await subtle.decrypt({ name:'AES-GCM', iv }, key, cipher);
  return JSON.parse(buf2str(plain));
}

function getUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)||'{}'); } catch { return {}; } }
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
async function createUser(username, password, role) {
  const users = getUsers();
  if (users[username]) throw new Error('Utilizador já existe.');
  const { salt, hash } = await hashPassword(password);
  users[username] = { salt, hash, role: role||'user', createdAt: new Date().toISOString() };
  saveUsers(users);
}
async function loginUser(username, password) {
  const u = getUsers()[username];
  if (!u) return false;
  return verifyPassword(password, u.salt, u.hash);
}
function hasAnyUser() { return Object.keys(getUsers()).length > 0; }
function getUserRole(username) { return getUsers()[username]?.role || 'user'; }
function getAllUsers() { return Object.entries(getUsers()).map(([u,d]) => ({ username:u, role:d.role, createdAt:d.createdAt })); }
async function changePassword(username, oldPass, newPass) {
  if (!(await loginUser(username, oldPass))) throw new Error('Senha atual incorreta.');
  const { salt, hash } = await hashPassword(newPass);
  const users = getUsers();
  users[username] = { ...users[username], salt, hash };
  saveUsers(users);
}
async function adminResetPassword(username, newPass) {
  const users = getUsers();
  if (!users[username]) throw new Error('Utilizador não encontrado.');
  const { salt, hash } = await hashPassword(newPass);
  users[username] = { ...users[username], salt, hash };
  saveUsers(users);
}
function deleteUser(username) { const u=getUsers(); delete u[username]; saveUsers(u); }

function startSession(username) {
  _authSession = { user:username, role:getUserRole(username), loginAt:Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(_authSession));
}
function loadSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');
    if (!s) return false;
    if (Date.now()-s.loginAt > SESSION_TTL) { clearSession(); return false; }
    _authSession = s; return true;
  } catch { return false; }
}
function clearSession() { _authSession=null; sessionStorage.removeItem(SESSION_KEY); }
function isLoggedIn() { return !!_authSession; }
function currentUser() { return _authSession?.user||''; }
function isAdmin() { return _authSession?.role==='admin'; }
