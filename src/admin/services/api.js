// src/admin/services/api.js

import { BASE_URL, API_BASE_URL, IMAGE_BASE_URL } from './config';

// Helper function to get the auth header with the JWT token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ---------------- Progress Tracking ----------------
async function recordCardCompletion(cardId, topicId, moduleId, isCorrect) {
  try {
    const response = await fetch(`${API_BASE_URL}/progress/card-completed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ cardId, topicId, moduleId, isCorrect }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to record progress.');
    }
    // *** IMPORTANT: Ensure data returned includes isTopicCompleted ***
    return data; // { isTopicCompleted: boolean, xpChange: number, ... }
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
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch user progress.');
    }
    return await response.json();
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  } catch (error) {
    console.error('Login API Error:', error);
    throw error;
  }
}

async function register(username, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  } catch (error) {
    console.error('Registration API Error:', error);
    throw error;
  }
}

// NEW: Validate token
async function validateToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Token validation failed');
    }
    return data; // { valid: true/false, user: {...} }
  } catch (error) {
    console.error('Validate Token API Error:', error);
    throw error;
  }
}

// NEW: Function to request password reset
async function forgotPassword(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Password reset request failed.');
    }
    return data;
  } catch (error) {
    console.error('Forgot Password API Error:', error);
    throw error;
  }
}

// NEW: Function to reset password with token
async function resetPassword(token, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Password reset failed.');
    }
    return data;
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validatorName, userCode }),
    });
    if (!response.ok) {
      throw new Error('Server-side validation failed.');
    }
    return await response.json();
  } catch (error) {
    console.error('Validation API Error:', error);
    return { isCorrect: false, error: 'Connection to validation service failed.' };
  }
}

async function uploadImage(imageFile) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${IMAGE_BASE_URL}/upload-image`, {
      method: 'POST',
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

// ---------------- Modules ----------------
const api = {
  // Progress
  recordCardCompletion,
  getUserProgress,

  // Authentication
  login,
  register,
  validateToken,   // <--- Added here
  forgotPassword,
  resetPassword,

  // Validation and image upload
  validateCode,
  uploadImage,

  // Module management
  getModules: async () => {
    const response = await fetch(BASE_URL);
    return response.json();
  },

  getModule: async (id) => {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch module with ID ${id}`);
    }
    return response.json();
  },

  createModule: async (moduleData) => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(moduleData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create module');
    }
    return data;
  },

  updateModule: async (id, moduleData) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(moduleData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update module');
    }
    return data;
  },

  deleteModule: async (id) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete module');
    }
  },

  // Topic management
  getTopic: async (id) => {
    const response = await fetch(`${API_BASE_URL}/topics/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch topic with ID ${id}`);
    }
    return response.json();
  },

  createTopic: async (topicData) => {
    const response = await fetch(`${API_BASE_URL}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(topicData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create topic');
    }
    return data;
  },

  updateTopic: async (topicId, topicData) => {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(topicData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update topic');
    }
    return data;
  },

  deleteTopic: async (topicId) => {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete topic');
    }
  },

  // Card management
  createCard: async (topicId, cardData) => {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(cardData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create card');
    }
    return data;
  },

  updateCard: async (cardId, cardData) => {
    const response = await fetch(`${API_BASE_URL}/topics/cards/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(cardData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update card');
    }
    return data;
  },

  getCard: async (id) => {
    const response = await fetch(`${API_BASE_URL}/topics/cards/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch card with ID ${id}`);
    }
    return response.json();
  },

  deleteCard: async (cardId) => {
    const response = await fetch(`${API_BASE_URL}/topics/cards/${cardId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete card');
    }
  },
};

export default api;
