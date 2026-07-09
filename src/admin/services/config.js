// src/admin/services/config.js
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
export const API_BASE_URL = `${SERVER_URL}/api`;
export const BASE_URL = `${SERVER_URL}/api/modules`;
export const IMAGE_BASE_URL = `${SERVER_URL}/api/image`;