// src/admin/services/api.js
import { API_BASE_URL, IMAGE_BASE_URL } from './config';

// The backend now pairs every JWT with an HttpOnly session-binding cookie
// (see quiz-backend/src/middleware/auth.js) — without `credentials: 'include'`
// the browser never sends that cookie on these cross-origin requests, so
// every authenticated call would 401 even with a perfectly valid token.
// Routed through this one wrapper (instead of calling `fetch` directly)
// so every one of this file's call sites gets it without repeating it.
function apiFetch(url, options = {}) {
  return fetch(url, { ...options, credentials: 'include' });
}

// Streak/engagement-history bucketing on the server must key off the
// USER's local calendar day, not the server's UTC day (see
// quiz-backend/src/utils/localDate.js) — otherwise, for anyone not at
// UTC+0, "today" can silently resolve to the wrong date for hours at a
// time, making an already-qualified day look like it still applies. Sent
// alongside every streak-related call below.
function localDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 🛡️ GLOBAL RESPONSE INTEGRITY INTERCEPTOR
const handleFetchResponse = async (response) => {
  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    // Fallback for non-JSON or blank responses
  }

  if (!response.ok) {
    // 🚨 The server ended this session (expired, signed out elsewhere, a
    // password change, an admin) — back to the login page with the reason.
    // Without a stored session (e.g. a wrong password on the login form) the
    // message is shown where the request was made instead.
    if (response.status === 401 && localStorage.getItem('token')) {
      console.error("Security Interceptor: this session is no longer valid.");

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('iris_studio_active_tree_state');

      const status = data.code === 'session_expired' ? 'expired' : data.code === 'session_revoked' ? 'revoked' : 'signed_out';
      window.location.href = `/login?session_status=${status}`;
      return;
    }
    throw new Error(data.message || 'Server request execution breakdown.');
  }
  return data;
};

// Helper function to get the clean auth header with the JWT token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper function for public routes
const getPublicHeader = () => {
  return { 'Content-Type': 'application/json' };
};

// ---------------- Progress Tracking ----------------
async function recordCardCompletion(cardId, topicId, moduleId, isCorrect, telemetryPayload = null, timeSpentDelta = 0) {
  try {
    const requestBody = { cardId, topicId, moduleId, isCorrect, timeSpentDelta };

    if (telemetryPayload && typeof telemetryPayload === 'object') {
      Object.assign(requestBody, telemetryPayload);
    }

    const response = await apiFetch(`${API_BASE_URL}/progress/card-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(requestBody),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Card completion API Error:', error);
    throw error;
  }
}

async function getUserProgress() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/progress`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Progress API Error:', error);
    throw error;
  }
}

// 🎯 LINEAR LOCKING + REVIEW MODE: ordered per-card progress+answers for one
// module/topic scope — the single hydration source useQuizEngine calls on
// mount to know which cards are reached/correct and what was submitted.
async function getModuleScopeState(moduleId, topicId) {
  try {
    const params = new URLSearchParams({ moduleId });
    if (topicId) params.set('topicId', topicId);
    const response = await apiFetch(`${API_BASE_URL}/progress/module-scope-state?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Module Scope State API Error:', error);
    throw error;
  }
}

// ---------------- Server-side grading ----------------
// The browser sends ANSWERS only; the server grades, awards XP and returns
// the verdict (plus, for quiz cards, the correct option + explanation —
// revealed only after grading).
async function postGrading(path, body) {
  const response = await apiFetch(`${API_BASE_URL}/grading${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  return handleFetchResponse(response);
}

// quiz: answer = { selectedOption }   code: answer = { userCodeAnswer }
async function gradeCardAttempt(cardId, answer, timeSpentDelta = 0) {
  const idempotencyKey = (globalThis.crypto && globalThis.crypto.randomUUID)
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return postGrading(`/cards/${cardId}/attempt`, { answer, idempotencyKey, timeSpentDelta });
}

// One answer captured by the in-page bridge of an HTML module.
async function recordSandboxAnswer(cardId, qid, chosen) {
  return postGrading(`/cards/${cardId}/sandbox-answer`, { qid, chosen });
}

// The HTML module's final submission. Only {id, userAnswer, ...} per
// question matter — any score/isCorrect the module computed is ignored.
async function submitSandbox(cardId, questions, timeSpentDelta = 0) {
  return postGrading(`/cards/${cardId}/sandbox-submit`, { questions, timeSpentDelta });
}

// Admin: what will grading detect in this HTML? → { ok, summary } | { ok:false, error }
async function previewSandboxKey(htmlSource) {
  return postGrading('/admin/preview-key', { htmlSource });
}

// 🎯 REATTEMPT: learner self-service reset — archives this module's/topic's
// progress, claws back its XP, and returns a clean slate.
async function resetModuleProgress(moduleId, topicId) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/progress/module-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ moduleId, topicId }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Module Reset API Error:', error);
    throw error;
  }
}

// ---------------- Authentication ----------------
async function login(email, password, captchaToken) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getPublicHeader(),
      body: JSON.stringify({ email, password, localDate: localDateKey(), captchaToken }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Login API Error:', error);
    throw error;
  }
}

async function register(username, email, password, department, teamId, regions, captchaToken) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getPublicHeader(),
      body: JSON.stringify({ username, email, password, department, teamId, regions, captchaToken }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Registration API Error:', error);
    throw error;
  }
}

async function verifyEmail(email, otp) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: getPublicHeader(),
      body: JSON.stringify({ email, otp }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('OTP Verification API Error:', error);
    throw error;
  }
}

async function validateToken() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ localDate: localDateKey() }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Validate Token API Error:', error);
    throw error;
  }
}

async function updateProfile(profileData) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/update-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(profileData),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Profile Update API Error:', error);
    throw error;
  }
}

async function completeProfile(department, teamId, regions) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/complete-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ department, teamId, regions }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Complete Profile API Error:', error);
    throw error;
  }
}

async function forgotPassword(email, captchaToken) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: getPublicHeader(),
      body: JSON.stringify({ email, captchaToken }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Forgot Password API Error:', error);
    throw error;
  }
}

async function resetPassword(token, newPassword) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
      method: 'PUT',
      headers: getPublicHeader(),
      body: JSON.stringify({ password: newPassword }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Reset Password API Error:', error);
    throw error;
  }
}

// ---------------- Upload ----------------
async function uploadImage(imageFile) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const authHeaders = getAuthHeader();
    delete authHeaders['Content-Type']; 

    const response = await apiFetch(`${IMAGE_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Image upload failed on the server.');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Frontend image upload error:", error);
    throw error;
  }
}

async function uploadVideoCard(contextParam, videoFile, cardDetails, cardId = null) {
  try {
    let targetContextId = "";
    let flatModuleIdFallback = null;

    if (typeof contextParam === 'object' && contextParam !== null) {
      targetContextId = contextParam.topic_id || contextParam.module_id || "";
      if (contextParam.module_id) flatModuleIdFallback = contextParam.module_id;
    } else {
      targetContextId = contextParam || "";
    }

    const formData = new FormData();
    if (videoFile) formData.append('video', videoFile);
    formData.append('title', cardDetails.title);
    formData.append('description', cardDetails.description || "");
    formData.append('cardOrder', cardDetails.cardOrder);
    if (flatModuleIdFallback) formData.append('module_id', flatModuleIdFallback);

    const authHeaders = getAuthHeader();
    delete authHeaders['Content-Type']; 

    const url = cardId 
      ? `${API_BASE_URL}/topics/cards/upload-video/${cardId}`
      : `${API_BASE_URL}/topics/${targetContextId}/cards/upload-video`; 

    const response = await apiFetch(url, {
      method: cardId ? 'PUT' : 'POST',
      headers: authHeaders,
      body: formData
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error("High-scale Video Upload Service Fault:", error);
    throw error;
  }
}

async function uploadDocumentCard(contextParam, documentFile, cardDetails, type = 'pdf', cardId = null) {
  try {
    let targetContextId = "";
    let flatModuleIdFallback = null;

    if (typeof contextParam === 'object' && contextParam !== null) {
      targetContextId = contextParam.topic_id || contextParam.module_id || "";
      if (contextParam.module_id) flatModuleIdFallback = contextParam.module_id;
    } else {
      targetContextId = contextParam || "";
    }

    const formData = new FormData();
    if (documentFile) formData.append('document', documentFile);
    formData.append('title', cardDetails.title);
    formData.append('description', cardDetails.description || "");
    formData.append('cardOrder', cardDetails.cardOrder);
    formData.append('card_type', type);
    if (flatModuleIdFallback) formData.append('module_id', flatModuleIdFallback);

    const authHeaders = getAuthHeader();
    delete authHeaders['Content-Type'];

    const url = cardId
      ? `${API_BASE_URL}/topics/cards/upload-document/${cardId}`
      : `${API_BASE_URL}/topics/${targetContextId}/cards/upload-document`;

    const response = await apiFetch(url, {
      method: cardId ? 'PUT' : 'POST',
      headers: authHeaders,
      body: formData
    });
    return await handleFetchResponse(response);
  } catch (error) {
    const safeType = (type || 'document').toUpperCase();
    console.error(`High-scale Document Upload Service Fault [${safeType}]:`, error);
    throw error;
  }
}

async function uploadPptCard(contextParam, pptFile, cardDetails, cardId = null) {
  return uploadDocumentCard(contextParam, pptFile, cardDetails, 'ppt', cardId);
}

async function uploadPdfCard(contextParam, pdfFile, cardDetails, cardId = null) {
  return uploadDocumentCard(contextParam, pdfFile, cardDetails, 'pdf', cardId);
}

// ---------------- Daily Reads Architecture ----------------
// Records (server-side) that the learner opened this read — the streak's
// "daily_read" credit is only granted after a real open.
async function openDailyRead(readId) {
  const response = await apiFetch(`${API_BASE_URL}/daily-reads/${readId}/open`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  return handleFetchResponse(response);
}

async function getTodaysRead() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/daily-reads/todays-read`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Fetch Today\'s Read API Error:', error);
    throw error;
  }
}

async function createDailyRead(readData) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/daily-reads/admin/daily-reads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(readData),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Create Daily Read API Error:', error);
    throw error;
  }
}

async function getAllDailyReads() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/daily-reads/all-reads`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Fetch All Historical Reads API Error:', error);
    throw error;
  }
}

async function updateDailyRead(id, readData) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/daily-reads/admin/daily-reads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(readData),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Update Daily Read API Error:', error);
    throw error;
  }
}

async function deleteDailyRead(id) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/daily-reads/admin/daily-reads/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Delete Daily Read API Error:', error);
    throw error;
  }
}

// ---------------- News/Broadcast Architecture ----------------
async function getDashboardNews() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/news/dashboard`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Fetch Dashboard News API Error:', error);
    throw error;
  }
}

async function uploadBroadcastVideo(videoFile) {
  try {
    const formData = new FormData();
    formData.append('video', videoFile);

    const authHeaders = getAuthHeader();
    delete authHeaders['Content-Type'];

    const response = await apiFetch(`${IMAGE_BASE_URL}/upload-video`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Video upload failed on the server.');
    }

    const data = await response.json();
    return data.videoUrl;
  } catch (error) {
    console.error("Frontend broadcast video upload error:", error);
    throw error;
  }
}

async function getNewsFeed() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/news/feed`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Fetch News Feed API Error:', error);
    throw error;
  }
}

async function getAllNewsForAdmin() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/news/manage`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Fetch Manageable News API Error:', error);
    throw error;
  }
}

async function createNewsPost(newsData) {
  try {
    const response = await apiFetch(`${API_BASE_URL}/news/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(newsData),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Create News Post API Error:', error);
    throw error;
  }
}

// Add this method inside your existing `const api = { ... }` definition mapping block


// ---------------- Central API Export ----------------
const api = {
  recordCardCompletion,
  getUserProgress,
  getModuleScopeState,
  resetModuleProgress,
  gradeCardAttempt,
  recordSandboxAnswer,
  submitSandbox,
  previewSandboxKey,
  login,
  register,
  verifyEmail,
  validateToken,
  updateProfile,
  completeProfile,
  forgotPassword,
  resetPassword,
  uploadImage,
  uploadVideoCard,
  uploadDocumentCard,
  uploadPptCard,
  uploadPdfCard,
  getTodaysRead,
  openDailyRead,
  createDailyRead,
  getAllDailyReads,
  updateDailyRead,
  deleteDailyRead,
  getDashboardNews,
  getNewsFeed,
  uploadBroadcastVideo,
  getAllNewsForAdmin,
  createNewsPost, 
 
  // Add this method inside your api = { ... } object
// ---------------- Learn: Tag → Path → modules ----------------
  getLearnTags: async () => {
    const response = await apiFetch(`${API_BASE_URL}/learn/tags`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  getLearnTagPaths: async (categoryId) => {
    const response = await apiFetch(`${API_BASE_URL}/learn/tags/${categoryId}/paths`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  getLearnPath: async (pathId) => {
    const response = await apiFetch(`${API_BASE_URL}/learn/paths/${pathId}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  getLegacyPath: async (categoryId, regionId) => {
    const qs = new URLSearchParams({ categoryId, ...(regionId ? { regionId } : {}) }).toString();
    const response = await apiFetch(`${API_BASE_URL}/learn/legacy-path?${qs}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },

  // ---------------- Pre/Post checks (learner) ----------------
  getPathCheck: async (pathId, kind) => {
    const response = await apiFetch(`${API_BASE_URL}/assessments/paths/${pathId}/${kind}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  submitPathCheck: async (pathId, kind, answers) => {
    const response = await apiFetch(`${API_BASE_URL}/assessments/paths/${pathId}/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ answers }),
    });
    return handleFetchResponse(response);
  },
  getPathCheckResult: async (pathId) => {
    const response = await apiFetch(`${API_BASE_URL}/assessments/paths/${pathId}/result`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },

  // ---------------- Path builder (admin) ----------------
  getAdminPaths: async (categoryId) => {
    const qs = categoryId ? `?categoryId=${categoryId}` : '';
    const response = await apiFetch(`${API_BASE_URL}/paths${qs}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  createPath: async (payload) => {
    const response = await apiFetch(`${API_BASE_URL}/paths`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(payload),
    });
    return handleFetchResponse(response);
  },
  updatePath: async (pathId, payload) => {
    const response = await apiFetch(`${API_BASE_URL}/paths/${pathId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(payload),
    });
    return handleFetchResponse(response);
  },
  publishPath: async (pathId, published) => {
    const response = await apiFetch(`${API_BASE_URL}/paths/${pathId}/publish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ published }),
    });
    return handleFetchResponse(response);
  },
  duplicatePath: async (pathId) => {
    const response = await apiFetch(`${API_BASE_URL}/paths/${pathId}/duplicate`, { method: 'POST', headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  deletePath: async (pathId) => {
    const response = await apiFetch(`${API_BASE_URL}/paths/${pathId}`, { method: 'DELETE', headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  reorderPaths: async (categoryId, pathIds) => {
    const response = await apiFetch(`${API_BASE_URL}/paths/reorder`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ categoryId, pathIds }),
    });
    return handleFetchResponse(response);
  },
  // Pre/Post test of a path (built from the module question bank)
  getPathForm: async (pathId) => {
    const response = await apiFetch(`${API_BASE_URL}/paths/${pathId}/form`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  generatePathForm: async (pathId, perModule) => {
    const response = await apiFetch(`${API_BASE_URL}/paths/${pathId}/form/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ perModule }),
    });
    return handleFetchResponse(response);
  },
  swapPathFormQuestion: async (pathId, kind, questionId) => {
    const response = await apiFetch(`${API_BASE_URL}/paths/${pathId}/form/swap`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ kind, questionId }),
    });
    return handleFetchResponse(response);
  },
  lockPathForm: async (pathId) => {
    const response = await apiFetch(`${API_BASE_URL}/paths/${pathId}/form/lock`, { method: 'POST', headers: getAuthHeader() });
    return handleFetchResponse(response);
  },

  // ---------------- Question bank (admin) ----------------
  getBankModules: async (search = '') => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await apiFetch(`${API_BASE_URL}/bank/modules${qs}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  getBankQuestions: async (moduleId, status) => {
    const qs = status ? `?status=${status}` : '';
    const response = await apiFetch(`${API_BASE_URL}/bank/modules/${moduleId}/questions${qs}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  createBankQuestion: async (moduleId, payload) => {
    const response = await apiFetch(`${API_BASE_URL}/bank/modules/${moduleId}/questions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(payload),
    });
    return handleFetchResponse(response);
  },
  updateBankQuestion: async (questionId, payload) => {
    const response = await apiFetch(`${API_BASE_URL}/bank/questions/${questionId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(payload),
    });
    return handleFetchResponse(response);
  },
  approveBankQuestion: async (questionId) => {
    const response = await apiFetch(`${API_BASE_URL}/bank/questions/${questionId}/approve`, { method: 'POST', headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  deleteBankQuestion: async (questionId) => {
    const response = await apiFetch(`${API_BASE_URL}/bank/questions/${questionId}`, { method: 'DELETE', headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  importBankQuestions: async (rows, dryRun) => {
    const response = await apiFetch(`${API_BASE_URL}/bank/import`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ rows, dryRun }),
    });
    return handleFetchResponse(response);
  },
  aiDraftBankQuestions: async (moduleId, count) => {
    const response = await apiFetch(`${API_BASE_URL}/bank/modules/${moduleId}/ai-draft`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ count }),
    });
    return handleFetchResponse(response);
  },
  getPrePostReport: async (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    const response = await apiFetch(`${API_BASE_URL}/assessments/admin/report${qs ? `?${qs}` : ''}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  getPrePostPathReport: async (pathId, params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    const response = await apiFetch(`${API_BASE_URL}/assessments/admin/report/paths/${pathId}${qs ? `?${qs}` : ''}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  downloadPrePostCsv: async (pathId, params = {}) => {
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), format: 'csv' }).toString();
    const url = pathId
      ? `${API_BASE_URL}/assessments/admin/report/paths/${pathId}?${qs}`
      : `${API_BASE_URL}/assessments/admin/report?${qs}`;
    const response = await apiFetch(url, { headers: getAuthHeader() });
    if (!response.ok) throw new Error('CSV export failed.');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = pathId ? 'pre-post-path.csv' : 'pre-post-report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },
  resetAssessmentAttempt: async (pathId, userId, kind, reason) => {
    const response = await apiFetch(`${API_BASE_URL}/assessments/admin/paths/${pathId}/users/${userId}/reset`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ kind, reason }),
    });
    return handleFetchResponse(response);
  },

  // ---------------- Sign-in activity (admin) ----------------
  getAuthEvents: async (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    const response = await apiFetch(`${API_BASE_URL}/admin/auth/events${qs ? `?${qs}` : ''}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  downloadAuthEventsCsv: async (params = {}) => {
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), format: 'csv' }).toString();
    const response = await apiFetch(`${API_BASE_URL}/admin/auth/events?${qs}`, { headers: getAuthHeader() });
    if (!response.ok) throw new Error('CSV export failed.');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sign-in-activity.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },
  getUserSessions: async (userId) => {
    const response = await apiFetch(`${API_BASE_URL}/admin/auth/users/${userId}/sessions`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  revokeUserSessions: async (userId) => {
    const response = await apiFetch(`${API_BASE_URL}/admin/auth/users/${userId}/sessions/revoke`, { method: 'POST', headers: getAuthHeader() });
    return handleFetchResponse(response);
  },

  // ---------------- Learner reports ----------------
  getLearnerRoster: async (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    const response = await apiFetch(`${API_BASE_URL}/reports/learners${qs ? `?${qs}` : ''}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  getLearnerReport: async (userId) => {
    const response = await apiFetch(`${API_BASE_URL}/reports/learners/${userId}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  getLearnerModuleDetail: async (userId, moduleId) => {
    const response = await apiFetch(`${API_BASE_URL}/reports/learners/${userId}/modules/${moduleId}`, { headers: getAuthHeader() });
    return handleFetchResponse(response);
  },
  // userId → that learner's report; no userId → the roster (with its filters).
  downloadLearnerCsv: async (userId, params = {}, fallbackName = 'learner-report.csv') => {
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), format: 'csv' }).toString();
    const url = userId ? `${API_BASE_URL}/reports/learners/${userId}?${qs}` : `${API_BASE_URL}/reports/learners?${qs}`;
    const response = await apiFetch(url, { headers: getAuthHeader() });
    if (!response.ok) throw new Error('CSV export failed.');
    const name = /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') || '')?.[1];
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name || fallbackName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

getWorkspaceCurriculum: async (categoryId, regionId) => {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', categoryId);
  if (regionId) params.set('regionId', regionId);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await apiFetch(`${API_BASE_URL}/modules/workspace-curriculum${qs}`, { headers: getAuthHeader() });
  return await handleFetchResponse(response);
},

  getDepartmentLeaderboard: async () => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/users/department-leaderboard`, {
      method: 'GET',
      headers: getAuthHeader(), // Pass secure authorization token headers securely
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Fetch Leaderboard API Error:', error);
    throw error;
  }
},

  getMyGamification: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/users/me/gamification`, {
        method: 'GET',
        headers: getAuthHeader(),
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Fetch Gamification Summary API Error:', error);
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Change Password API Error:', error);
      throw error;
    }
  },
  // =========================================================================
  // 💡 FIXED: IDEAS ENGINE INTEGRATION ENDPOINTS WITH UNIFORM LITERALS
  // =========================================================================
  submitIdeaNode: async (payloadData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payloadData)
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Submit Idea API Error:', error);
      throw error;
    }
  },

  getUserIdeas: async () => {
    try {
      // ✅ FIXED: String literal fully resolved with uniform backtick boundaries
      const response = await apiFetch(`${API_BASE_URL}/ideas/my-history`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Get User Ideas API Error:', error);
      throw error;
    }
  },

  // Admin/superadmin Product Council view — every idea in-scope (department-
  // filtered for admins, all departments for superadmin), NOT just the
  // caller's own submissions. See getUserIdeas above for that.
  getCouncilBoard: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/ideas/council-board`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Get Council Board API Error:', error);
      throw error;
    }
  },

  updateIdeaStatusByCurator: async (ideaId, curationUpdates) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/ideas/${ideaId}/curate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(curationUpdates)
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Curate Idea API Error:', error);
      throw error;
    }
  },

  getDepartments: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/departments/public`, { 
        method: 'GET',
        headers: getPublicHeader() 
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Fetch Department List Error:', error);
      throw error;
    }
  },

  createDepartment: async (deptData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(deptData)
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Create Department Entity Error:', error);
      throw error;
    }
  },

  // ---------------- Categories ("Tags") ----------------
  getCategories: async () => {
    const response = await apiFetch(`${API_BASE_URL}/categories`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getCategory: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/categories/${id}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  createCategory: async (categoryData) => {
    const response = await apiFetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(categoryData),
    });
    return await handleFetchResponse(response);
  },

  updateCategory: async (id, categoryData) => {
    const response = await apiFetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(categoryData),
    });
    return await handleFetchResponse(response);
  },

  deleteCategory: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  // 🔒 Sets the sequential-unlock order of every module in a category in one
  // shot — moduleIds is the FULL, newly-ordered array of every module
  // currently in that category (powers the admin drag-and-drop reorder UI).
  // Pass regionId to instead reorder just ONE region bucket's subset —
  // moduleIds must then be exactly that bucket's current modules; every
  // other module in the category keeps its existing relative position.
  reorderCategoryModules: async (categoryId, moduleIds, regionId) => {
    const response = await apiFetch(`${API_BASE_URL}/categories/${categoryId}/modules/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(regionId ? { moduleIds, regionId } : { moduleIds }),
    });
    return await handleFetchResponse(response);
  },

  // ---------------- Regions ----------------
  getRegions: async () => {
    const response = await apiFetch(`${API_BASE_URL}/regions`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getRegion: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/${id}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  createRegion: async (regionData) => {
    const response = await apiFetch(`${API_BASE_URL}/regions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(regionData),
    });
    return await handleFetchResponse(response);
  },

  updateRegion: async (id, regionData) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(regionData),
    });
    return await handleFetchResponse(response);
  },

  deleteRegion: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getRegionTags: async (regionId) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/${regionId}/tags`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getRegionAvailableTags: async (regionId) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/${regionId}/available-tags`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  addTagToRegion: async (regionId, tagId) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/${regionId}/tags/${tagId}`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  removeTagFromRegion: async (regionId, tagId) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/${regionId}/tags/${tagId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getRegionModules: async (regionId, categoryId) => {
    const qs = categoryId ? `?categoryId=${categoryId}` : '';
    const response = await apiFetch(`${API_BASE_URL}/regions/${regionId}/modules${qs}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getRegionAvailableModules: async (regionId, categoryId) => {
    const qs = categoryId ? `?categoryId=${categoryId}` : '';
    const response = await apiFetch(`${API_BASE_URL}/regions/${regionId}/available-modules${qs}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  // Per-region module counts for one tag ("Onboarding-US: 7 modules", ...) —
  // powers the admin's Tag x Region bucket grid.
  getRegionModuleBreakdown: async (categoryId) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/by-tag/${categoryId}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  // The inverse: per-tag module counts for one region — powers the "By
  // Region" view's read-only content overview.
  getRegionTagBreakdown: async (regionId) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/${regionId}/tag-breakdown`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  addModuleToRegion: async (regionId, moduleId) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/${regionId}/modules/${moduleId}`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  removeModuleFromRegion: async (regionId, moduleId) => {
    const response = await apiFetch(`${API_BASE_URL}/regions/${regionId}/modules/${moduleId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getTeams: async (departmentId) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/teams/${departmentId}`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Fetch Team List Error:', error);
      throw error;
    }
  },

  createTeam: async (teamData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(teamData)
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Create Team Entity Error:', error);
      throw error;
    }
  },

  // ---------------- Team Hub ----------------
  getTeamHub: async (departmentId) => {
    const response = await apiFetch(`${API_BASE_URL}/teams/hub/${departmentId}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  requestTeamTransfer: async (userId, toTeamId) => {
    const response = await apiFetch(`${API_BASE_URL}/teams/transfer-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ userId, toTeamId }),
    });
    return await handleFetchResponse(response);
  },

  getTransferRequests: async () => {
    const response = await apiFetch(`${API_BASE_URL}/teams/transfer-requests`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  respondTransferRequest: async (requestId, approve) => {
    const response = await apiFetch(`${API_BASE_URL}/teams/transfer-requests/${requestId}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ approve }),
    });
    return await handleFetchResponse(response);
  },

  getModules: async () => {
    const response = await apiFetch(`${API_BASE_URL}/modules`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getModule: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/modules/${id}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  rateModule: async (id, { rating, reviewText }) => {
    const response = await apiFetch(`${API_BASE_URL}/modules/${id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ rating, reviewText }),
    });
    return await handleFetchResponse(response);
  },

  getModuleReviews: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/modules/${id}/reviews`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getMyModuleReview: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/modules/${id}/my-review`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  createModule: async (moduleData) => {
    const response = await apiFetch(`${API_BASE_URL}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(moduleData),
    });
    return await handleFetchResponse(response);
  },

  updateModule: async (id, moduleData) => {
    const response = await apiFetch(`${API_BASE_URL}/modules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(moduleData),
    });
    return await handleFetchResponse(response);
  },

  deleteModule: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/modules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  exportModuleSubmissionsCsv: async (moduleId) => {
    const response = await apiFetch(`${API_BASE_URL}/modules/${moduleId}/submissions`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to export submissions CSV.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `module_${moduleId}_submissions.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  gradeSubmission: async (cardId, userId, payload) => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/card/${cardId}/user/${userId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    return await handleFetchResponse(response);
  },

  setHotModule: async (moduleId, isHotModule) => {
    const response = await apiFetch(`${API_BASE_URL}/modules/${moduleId}/hot-module`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ isHotModule }),
    });
    return await handleFetchResponse(response);
  },

  setPopularModule: async (moduleId, isPopular) => {
    const response = await apiFetch(`${API_BASE_URL}/modules/${moduleId}/popular`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ isPopular }),
    });
    return await handleFetchResponse(response);
  },

  getTopic: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/topics/${id}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  createTopic: async (topicData) => {
    const response = await apiFetch(`${API_BASE_URL}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(topicData),
    });
    return await handleFetchResponse(response);
  },

  updateTopic: async (topicId, topicData) => {
    const response = await apiFetch(`${API_BASE_URL}/topics/${topicId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(topicData),
    });
    return await handleFetchResponse(response);
  },

  deleteTopic: async (topicId) => {
    const response = await apiFetch(`${API_BASE_URL}/topics/${topicId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  createCard: async (contextParam, cardData) => {
    let targetContextId = "";
    if (typeof contextParam === 'object' && contextParam !== null) {
      targetContextId = contextParam.topic_id || contextParam.module_id || "";
    } else {
      targetContextId = contextParam || "";
    }

    const response = await apiFetch(`${API_BASE_URL}/topics/${targetContextId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(cardData),
    });
    return await handleFetchResponse(response);
  },

  updateCard: async (cardId, cardData) => {
    const response = await apiFetch(`${API_BASE_URL}/topics/cards/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(cardData),
    });
    return await handleFetchResponse(response);
  },

  getCard: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/topics/cards/${id}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  deleteCard: async (cardId) => {
    const response = await apiFetch(`${API_BASE_URL}/topics/cards/${cardId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getUsersCount: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/users/count-verified`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error("❌ Failed to fetch user counts from backend auth servers:", error);
      throw error;
    }
  },

  // ---------------- Analytics (Admin) ----------------
  getAdminUsersList: async () => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/users`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  // Sets which regions a user is scoped to — Department Admins may only
  // target users in their own department, Superadmin may target anyone
  // (see userRoutes.js's PUT /:id/regions).
  assignUserRegions: async (userId, regionIds) => {
    const response = await apiFetch(`${API_BASE_URL}/users/${userId}/regions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ regions: regionIds }),
    });
    return await handleFetchResponse(response);
  },

  getAdminUserAnalytics: async (userId) => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/user/${userId}`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getAdminSandboxResults: async (cardId) => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/sandbox/${cardId}`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getAdminPlatformStats: async () => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/platform-stats`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getAdminModuleEngagement: async () => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/module-engagement`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getAdminTeamStats: async (teamId) => {
    const qs = teamId ? `?teamId=${teamId}` : '';
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/team-stats${qs}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getModuleCompletionReal: async (teamId) => {
    const qs = teamId ? `?teamId=${teamId}` : '';
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/module-completion${qs}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getDailyReadParticipation: async (teamId) => {
    const params = new URLSearchParams({ localDate: localDateKey() });
    if (teamId) params.set('teamId', teamId);
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/daily-read-participation?${params.toString()}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getQuizScoreDistribution: async (teamId) => {
    const qs = teamId ? `?teamId=${teamId}` : '';
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/quiz-score-distribution${qs}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getAdminDepartmentStats: async () => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/department-stats`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getUserSandboxAnswers: async (userId) => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/user/${userId}/sandbox-answers`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  importGrades: async (gradesArray) => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/import-grades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ grades: gradesArray }),
    });
    return await handleFetchResponse(response);
  },

  getDeptSandboxAnswers: async () => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/dept-sandbox-answers`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getAdminModuleProgressTable: async () => {
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/module-progress-table`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  importModuleGradesCsv: async (moduleId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiFetch(`${API_BASE_URL}/progress/admin/module/${moduleId}/import-grades-csv`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    return await handleFetchResponse(response);
  },

  getMySandboxResults: async () => {
    const response = await apiFetch(`${API_BASE_URL}/progress/my-sandbox-results`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getNotifications: async () => {
    const response = await apiFetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  markNotificationRead: async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  markAllNotificationsRead: async () => {
    const response = await apiFetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  // ── Streak API ────────────────────────────────────────────────────────────
  verifyDailyStreak: async (actionType) => {
    const response = await apiFetch(`${API_BASE_URL}/progress/streak/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body:    JSON.stringify({ actionType, localDate: localDateKey() }),
    });
    return handleFetchResponse(response);
  },

  getMyStreak: async () => {
    const response = await apiFetch(`${API_BASE_URL}/progress/streak?localDate=${localDateKey()}`, {
      headers: getAuthHeader(),
    });
    return handleFetchResponse(response);
  },

  // Ends THIS session server-side (its session record + the binding cookie)
  // instead of only discarding the token client-side; other devices stay
  // signed in, and the Microsoft session is not touched. Best-effort —
  // AuthContext's logout() already clears local state regardless of whether
  // this call succeeds. `keepalive` lets it finish while the page navigates
  // away. reason "idle" = the inactivity timer (App.jsx).
  logoutUser: async (reason) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(reason ? { reason } : {}),
        keepalive: true,
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Logout API Error:', error);
    }
  },
};

export default api;