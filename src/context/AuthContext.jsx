// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../admin/services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // 🧠 STRUCTURAL DATA NORMALIZATION MATRIX
  // =========================================================================
  const normalizeUserData = (userPayload) => {
    return {
      ...userPayload,
      role: userPayload.role || "user",
      isAdmin: userPayload.role === "admin" || userPayload.role === "superadmin",
      xp: userPayload.xp ?? 0,
      streak: userPayload.streak ?? userPayload.currentStreak ?? 0,
      avatarUrl: userPayload.avatarUrl || "",
      avatarId: userPayload.avatarId || "dev",
      department: userPayload.department || null,
      team: userPayload.team || null
    };
  };

  // Load user on app start (Reload Hydration Layer)
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.validateToken();
          if (res.valid && res.user) {
            const userData = normalizeUserData(res.user);
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } else {
            logout();
          }
        } catch (err) {
          console.error("❌ Token authentication handshake crashed:", err.message);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const res = await api.validateToken();
      if (res.valid && res.user) {
        const userData = normalizeUserData(res.user);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return userData;
      }
      return null;
    } catch (err) {
      console.error("Failed to refresh user profile matrix:", err.message);
      return null;
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      localStorage.setItem("token", res.token);

      const userData = normalizeUserData(res.user);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Login failed' };
    }
  };

  // =========================================================================
  // 📝 REGISTRATION PIPELINE ASSIGNMENT LINK
  // =========================================================================
  const register = async (username, email, password, department, teamId) => {
    try {
      const res = await api.register(username, email, password, department, teamId);
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || "Registration failed" };
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      const res = await api.verifyEmail(email, otp);

      if (res.success && res.token) {
        localStorage.setItem("token", res.token);

        // 🎯 BUG FIX: this used to fabricate a "welcome +100 XP" that the
        // backend never actually granted — the real stored value is 0, so it
        // silently reverted back to 0 the next time the session revalidated
        // (app reload, token refresh), making XP appear to vanish. Just show
        // whatever the server actually returned.
        const userData = normalizeUserData(res.user);

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: 'Verification handshake payload error' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Verification failed' };
    }
  };

  // =========================================================================
  // 🧹 DEEP CLEAN LIFECYCLE LOGOUT ACTIONS
  // =========================================================================
  const logout = () => {
    // 🌟 FIXED: Flushes all active curriculum and layout state flags cleanly
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("iris_active_module_id");
    localStorage.removeItem("iris_selected_topic");
    localStorage.removeItem("iris_selected_topic_id");
    localStorage.removeItem("iris_studio_active_tree_state");
    
    setUser(null);
  };

  const updateUserXP = (newXpTotal) => {
    if (user) {
      const updatedUser = { ...user, xp: newXpTotal };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // 🎯 Delta-based, stale-closure-safe XP update — unlike updateUserXP above
  // (which needs the caller to already know the correct new total, read from
  // a `user` closure that can go stale), this reads the CURRENT user from
  // React's own functional setState callback, same safe pattern already used
  // by updateUserStreak below. Lets any caller (e.g. the quiz engine, or an
  // effect whose closure was captured much earlier) safely say "add X XP"
  // without needing to track the current total itself.
  const addUserXP = useCallback((amount) => {
    if (!amount) return;
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, xp: (prev.xp || 0) + amount };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateUserStreak = useCallback((newStreak) => {
    setUser(prev => {
      if (!prev || prev.streak === newStreak) return prev;
      const updated = { ...prev, streak: newStreak };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        verifyEmail,
        updateUserXP,
        addUserXP,
        updateUserStreak,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;