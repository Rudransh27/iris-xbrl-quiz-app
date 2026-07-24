// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../admin/services/api";
import LoginBonusToast from "../components/LoginBonusToast";

const AuthContext = createContext();

// =========================================================================
// 🧠 STRUCTURAL DATA NORMALIZATION MATRIX
// Module-scope (not recreated per render) — it's pure and only reads its own
// argument, so hoisting it out avoids relying on a "stable" closure over
// something that was actually a fresh function identity every render.
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

// 🎯 "+1 for showing up today" — fired from wherever the server first tells
// us the bonus was actually claimed this call (initAuth/refreshUser's
// /validate roundtrip, or a fresh /login), never guessed client-side, so it
// can never fire twice for the same day no matter which path gets there first.
const maybeShowLoginBonusToast = (res) => {
  if (res?.loginBonusAwarded) {
    toast(<LoginBonusToast />, {
      position: "top-center",
      autoClose: 3500,
      hideProgressBar: true,
      closeButton: false,
      className: "login-bonus-toast",
    });
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // 🎉 Set the moment a daily-action streak day is first claimed (see
  // celebrateStreakAction below) — StreakCelebrationOverlay renders whenever
  // this is non-null and clears it itself after the celebration plays.
  const [celebration, setCelebration] = useState(null);

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
            maybeShowLoginBonusToast(res);
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

  // 🎯 BUG FIX ("sandbox reviews continuously flickering"): this used to be a
  // plain function, redefined with a new identity on every AuthProvider
  // render. Any consumer with refreshUser in a useCallback/useEffect
  // dependency array (e.g. UserProfile.jsx's syncTelemetry) would then loop
  // forever: refreshUser() -> setUser() -> re-render -> new refreshUser
  // reference -> dependent effect re-fires -> refreshUser() again. useCallback
  // with an empty dependency array gives it a stable identity across renders.
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const res = await api.validateToken();
      if (res.valid && res.user) {
        const userData = normalizeUserData(res.user);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        maybeShowLoginBonusToast(res);
        return userData;
      }
      return null;
    } catch (err) {
      console.error("Failed to refresh user profile matrix:", err.message);
      return null;
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      localStorage.setItem("token", res.token);

      const userData = normalizeUserData(res.user);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      maybeShowLoginBonusToast(res);
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

  // 🎯 Single entry point for all 3 daily-action streak triggers (daily
  // read, module/topic completion, idea submission). Callers just fire-and-
  // await this instead of hitting api.verifyDailyStreak directly — it syncs
  // XP/streak into this context AND arms StreakCelebrationOverlay whenever
  // the server confirms THIS call is the one that first qualified today
  // (streakIncremented), so no caller needs to guess whether it "won" the
  // race to be first. Returns the raw response so callers with their own
  // local bookkeeping (e.g. OrbitWorkspace's calendar/checklist state) can
  // still read it.
  const celebrateStreakAction = useCallback(async (actionType) => {
    try {
      const res = await api.verifyDailyStreak(actionType);
      if (res?.success) {
        if (res.currentStreak !== undefined) updateUserStreak(res.currentStreak);
        if (res.pointsAwarded) addUserXP(res.pointsAwarded);
        if (res.streakIncremented) {
          setCelebration({
            actionType,
            points: res.pointsAwarded,
            previousStreak: res.previousStreak,
            newStreak: res.currentStreak,
          });
        }
      }
      return res;
    } catch (err) {
      console.error("celebrateStreakAction failed:", err);
      return null;
    }
  }, [addUserXP, updateUserStreak]);

  const dismissCelebration = useCallback(() => setCelebration(null), []);

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
        celebration,
        celebrateStreakAction,
        dismissCelebration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;