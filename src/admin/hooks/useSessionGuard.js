// src/admin/hooks/useSessionGuard.js
import { useEffect, useCallback } from 'react';

/**
 * Custom Enterprise Security Guard to enforce strict session timeout limits,
 * prevent multi-tab state anomalies, and manage structural hydration storage.
 * 
 * @param {Function} onTimeoutCallback - Action execution boundary when idle timeout limit hits.
 * @param {number} timeoutBufferMs - Time threshold in milliseconds (Default: 15 minutes).
 */
export default function useSessionGuard(onTimeoutCallback, timeoutBufferMs = 15 * 60 * 1000) {
  
  // ⏳ SESSION INITIALIZATION TIMEOUT ENGINE
  const executeSessionInvalidation = useCallback(() => {
    console.warn("Security Alert: System idle threshold breached. Initiating force logout routine.");
    if (onTimeoutCallback) {
      onTimeoutCallback();
    } else {
      // Graceful structural absolute storage wipes
      localStorage.removeItem('authToken');
      localStorage.removeItem('trainee_session_fingerprint');
      window.location.href = '/login';
    }
  }, [onTimeoutCallback]);

  useEffect(() => {
    let activityTimer;

    // 🚀 TELEMETRY EVENT MONITOR RESET FUNCTION
    const resetActivityTimer = () => {
      if (activityTimer) clearTimeout(activityTimer);
      activityTimer = setTimeout(executeSessionInvalidation, timeoutBufferMs);
    };

    // 👥 REGISTRATION MAP FOR ACTIVE OPERATION TRACKERS
    const registrationEvents = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click'
    ];

    // Bind event tracking listeners to global window viewports
    registrationEvents.forEach(eventType => {
      window.addEventListener(eventType, resetActivityTimer);
    });

    // Run initial trigger check loop
    resetActivityTimer();

    // 🔒 RESTRUCTURE TOKEN SHARING DETECTOR MATRIX
    const handleStorageCrossTampering = (event) => {
      if (event.key === 'authToken' && event.newValue === null) {
        console.error("Security Warning: Auth token revoked from parallel instance block window context.");
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageCrossTampering);

    // 🧼 DISPOSAL CLEANDOWN HOOK LOOPS
    return () => {
      if (activityTimer) clearTimeout(activityTimer);
      registrationEvents.forEach(eventType => {
        window.removeEventListener(eventType, resetActivityTimer);
      });
      window.removeEventListener('storage', handleStorageCrossTampering);
    };
  }, [executeSessionInvalidation, timeoutBufferMs]);

  /**
   * Non-Linear State Hydration Helper:
   * Secures active tree paths without throwing state layout collapses on hard updates.
   */
  const persistLayoutExpansionTree = useCallback((expandedNodeMapArray) => {
    try {
      localStorage.setItem(
        'iris_studio_active_tree_state', 
        JSON.stringify(expandedNodeMapArray)
      );
    } catch (error) {
      console.error("Hydration State Capture Failure:", error);
    }
  }, []);

  const retrieveHydratedTreeLayout = useCallback(() => {
    try {
      const activeStateMap = localStorage.getItem('iris_studio_active_tree_state');
      return activeStateMap ? JSON.parse(activeStateMap) : [];
    } catch (e) {
      return [];
    }
  }, []);

  return {
    persistLayoutExpansionTree,
    retrieveHydratedTreeLayout
  };
}