// src/admin/services/api.js
import { API_BASE_URL, IMAGE_BASE_URL } from './config'; 

// 🛡️ GLOBAL RESPONSE INTEGRITY INTERCEPTOR
const handleFetchResponse = async (response) => {
  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    // Fallback for non-JSON or blank responses
  }

  if (!response.ok) {
    // 🚨 CONCURRENT LOGIN OR TIMEOUT BREACH DETECTED
    if (response.status === 401) {
      console.error("Security Interceptor: Token invalidated or concurrent login detected.");
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('iris_studio_active_tree_state');
      
      window.location.href = '/login?session_status=concurrent_kickout';
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

    const response = await fetch(`${API_BASE_URL}/progress/card-completed`, {
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
    const response = await fetch(`${API_BASE_URL}/progress`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Progress API Error:', error);
    throw error;
  }
}

// ---------------- Authentication ----------------
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getPublicHeader(),
      body: JSON.stringify({ email, password }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Login API Error:', error);
    throw error;
  }
}

async function register(username, email, password, department, teamId) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getPublicHeader(),
      body: JSON.stringify({ username, email, password, department, teamId }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Registration API Error:', error);
    throw error;
  }
}

async function verifyEmail(email, otp) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Validate Token API Error:', error);
    throw error;
  }
}

async function updateProfile(profileData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
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

async function completeProfile(department, teamId) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/complete-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ department, teamId }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Complete Profile API Error:', error);
    throw error;
  }
}

async function forgotPassword(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: getPublicHeader(),
      body: JSON.stringify({ email }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Forgot Password API Error:', error);
    throw error;
  }
}

async function resetPassword(token, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
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

// ---------------- Validation + Upload ----------------
async function validateCode(validatorName, userCode) {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-code`, {
      method: 'POST',
      headers: getPublicHeader(),
      body: JSON.stringify({ validatorName, userCode }),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Validation API Error:', error);
    return { isCorrect: false, error: 'Connection to validation service failed.' };
  }
}

async function uploadImage(imageFile) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const authHeaders = getAuthHeader();
    delete authHeaders['Content-Type']; 

    const response = await fetch(`${IMAGE_BASE_URL}/upload-image`, {
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

    const response = await fetch(url, {
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

    const response = await fetch(url, {
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
async function getTodaysRead() {
  try {
    const response = await fetch(`${API_BASE_URL}/daily-reads/todays-read`, {
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
    const response = await fetch(`${API_BASE_URL}/daily-reads/admin/daily-reads`, {
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
    const response = await fetch(`${API_BASE_URL}/daily-reads/all-reads`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Fetch All Historical Reads API Error:', error);
    throw error;
  }
}

// ---------------- News/Broadcast Architecture ----------------
async function getDashboardNews() {
  try {
    const response = await fetch(`${API_BASE_URL}/news/dashboard`, {
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

    const response = await fetch(`${IMAGE_BASE_URL}/upload-video`, {
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
    const response = await fetch(`${API_BASE_URL}/news/feed`, {
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
    const response = await fetch(`${API_BASE_URL}/news/manage`, {
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
    const response = await fetch(`${API_BASE_URL}/news/create`, {
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
  login,
  register,
  verifyEmail,
  validateToken,
  updateProfile,
  completeProfile,
  forgotPassword,
  resetPassword,
  validateCode,
  uploadImage,
  uploadVideoCard,
  uploadDocumentCard,
  uploadPptCard,
  uploadPdfCard,
  getTodaysRead,
  createDailyRead,
  getAllDailyReads,
  getDashboardNews,
  getNewsFeed,
  uploadBroadcastVideo,
  getAllNewsForAdmin,
  createNewsPost, 
 
  // Add this method inside your api = { ... } object
getWorkspaceCurriculum: async () => {
  const response = await fetch(`${API_BASE_URL}/modules/workspace-curriculum`, { headers: getAuthHeader() });
  return await handleFetchResponse(response);
},

  getDepartmentLeaderboard: async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/department-leaderboard`, {
      method: 'GET',
      headers: getAuthHeader(), // Pass secure authorization token headers securely
    });
    return await handleFetchResponse(response);
  } catch (error) {
    console.error('Fetch Leaderboard API Error:', error);
    throw error;
  }
},
  // =========================================================================
  // 💡 FIXED: IDEAS ENGINE INTEGRATION ENDPOINTS WITH UNIFORM LITERALS
  // =========================================================================
  submitIdeaNode: async (payloadData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ideas`, {
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
      const response = await fetch(`${API_BASE_URL}/ideas/my-history`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      return await handleFetchResponse(response);
    } catch (error) {
      console.error('Get User Ideas API Error:', error);
      throw error;
    }
  },

  updateIdeaStatusByCurator: async (ideaId, curationUpdates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ideas/${ideaId}/curate`, {
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
      const response = await fetch(`${API_BASE_URL}/departments/public`, { 
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
      const response = await fetch(`${API_BASE_URL}/departments`, {
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

  getTeams: async (departmentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${departmentId}`, {
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
      const response = await fetch(`${API_BASE_URL}/teams`, {
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

  getModules: async () => {
    const response = await fetch(`${API_BASE_URL}/modules`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getModule: async (id) => {
    const response = await fetch(`${API_BASE_URL}/modules/${id}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  createModule: async (moduleData) => {
    const response = await fetch(`${API_BASE_URL}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(moduleData),
    });
    return await handleFetchResponse(response);
  },

  updateModule: async (id, moduleData) => {
    const response = await fetch(`${API_BASE_URL}/modules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(moduleData),
    });
    return await handleFetchResponse(response);
  },

  deleteModule: async (id) => {
    const response = await fetch(`${API_BASE_URL}/modules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  exportModuleSubmissionsCsv: async (moduleId) => {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/submissions`, {
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
    const response = await fetch(`${API_BASE_URL}/progress/admin/card/${cardId}/user/${userId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    return await handleFetchResponse(response);
  },

  setHotModule: async (moduleId, isHotModule) => {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/hot-module`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ isHotModule }),
    });
    return await handleFetchResponse(response);
  },

  setPopularModule: async (moduleId, isPopular) => {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/popular`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ isPopular }),
    });
    return await handleFetchResponse(response);
  },

  getTopic: async (id) => {
    const response = await fetch(`${API_BASE_URL}/topics/${id}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  createTopic: async (topicData) => {
    const response = await fetch(`${API_BASE_URL}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(topicData),
    });
    return await handleFetchResponse(response);
  },

  updateTopic: async (topicId, topicData) => {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(topicData),
    });
    return await handleFetchResponse(response);
  },

  deleteTopic: async (topicId) => {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}`, {
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

    const response = await fetch(`${API_BASE_URL}/topics/${targetContextId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(cardData),
    });
    return await handleFetchResponse(response);
  },

  updateCard: async (cardId, cardData) => {
    const response = await fetch(`${API_BASE_URL}/topics/cards/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(cardData),
    });
    return await handleFetchResponse(response);
  },

  getCard: async (id) => {
    const response = await fetch(`${API_BASE_URL}/topics/cards/${id}`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  deleteCard: async (cardId) => {
    const response = await fetch(`${API_BASE_URL}/topics/cards/${cardId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getUsersCount: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/count-verified`, {
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
    const response = await fetch(`${API_BASE_URL}/progress/admin/users`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getAdminUserAnalytics: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/progress/admin/user/${userId}`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getAdminSandboxResults: async (cardId) => {
    const response = await fetch(`${API_BASE_URL}/progress/admin/sandbox/${cardId}`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getAdminPlatformStats: async () => {
    const response = await fetch(`${API_BASE_URL}/progress/admin/platform-stats`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getAdminModuleEngagement: async () => {
    const response = await fetch(`${API_BASE_URL}/progress/admin/module-engagement`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getAdminDepartmentStats: async () => {
    const response = await fetch(`${API_BASE_URL}/progress/admin/department-stats`, { headers: getAuthHeader() });
    return await handleFetchResponse(response);
  },

  getUserSandboxAnswers: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/progress/admin/user/${userId}/sandbox-answers`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  importGrades: async (gradesArray) => {
    const response = await fetch(`${API_BASE_URL}/progress/admin/import-grades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ grades: gradesArray }),
    });
    return await handleFetchResponse(response);
  },

  getDeptSandboxAnswers: async () => {
    const response = await fetch(`${API_BASE_URL}/progress/admin/dept-sandbox-answers`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getAdminModuleProgressTable: async () => {
    const response = await fetch(`${API_BASE_URL}/progress/admin/module-progress-table`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  importModuleGradesCsv: async (moduleId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/progress/admin/module/${moduleId}/import-grades-csv`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    return await handleFetchResponse(response);
  },

  getMySandboxResults: async () => {
    const response = await fetch(`${API_BASE_URL}/progress/my-sandbox-results`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  getNotifications: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  markNotificationRead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  markAllNotificationsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    return await handleFetchResponse(response);
  },

  // ── Streak API ────────────────────────────────────────────────────────────
  verifyDailyStreak: async (actionType) => {
    const response = await fetch(`${API_BASE_URL}/progress/streak/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body:    JSON.stringify({ actionType }),
    });
    return handleFetchResponse(response);
  },

  getMyStreak: async () => {
    const response = await fetch(`${API_BASE_URL}/progress/streak`, {
      headers: getAuthHeader(),
    });
    return handleFetchResponse(response);
  },
};

export default api;