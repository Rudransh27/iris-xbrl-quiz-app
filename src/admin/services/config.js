// src/admin/services/config.js
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
export { SERVER_URL };
export const API_BASE_URL = `${SERVER_URL}/api`;
export const BASE_URL = `${SERVER_URL}/api/modules`;
export const IMAGE_BASE_URL = `${SERVER_URL}/api/image`;
// Socket.IO is served under the API prefix (/api/socket.io) so the API-scoped
// session cookie travels with the handshake. SERVER_URL may itself carry a
// path (prod: https://host/api behind a proxy that strips /api) — keep it, and
// connect to the origin so Socket.IO doesn't read that path as a namespace.
const serverUrl = new URL(SERVER_URL || window.location.origin, window.location.origin);
export const SOCKET_ORIGIN = serverUrl.origin;
export const SOCKET_PATH = `${serverUrl.pathname.replace(/\/+$/, "")}/api/socket.io`;
