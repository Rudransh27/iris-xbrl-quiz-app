// src/pages/SsoCallback.jsx
// Landing point for the Microsoft SSO redirect chain — the backend's
// GET /api/auth/microsoft/callback sends the browser here with either
// ?token=<jwt> (success) or ?error=<message> (domain rejection, cancelled
// sign-in, etc.), never raw Microsoft tokens.
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";

export default function SsoCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const errorMessage = params.get("error");

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    if (!token) {
      setError("Microsoft sign-in did not complete. Please try again.");
      return;
    }

    (async () => {
      localStorage.setItem("token", token);
      const userData = await refreshUser();

      if (!userData) {
        setError("Signed in, but we couldn't load your profile. Please try again.");
        return;
      }

      if (!userData.department) {
        // First-ever SSO login for this account — needs department/team
        // before the rest of the app (visibility scoping, dashboards) works.
        navigate("/complete-profile", { replace: true });
        return;
      }

      const redirect = localStorage.getItem("redirectPath") || "/";
      localStorage.removeItem("redirectPath");
      navigate(redirect, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout>
      <div className="auth-fade-in" style={{ width: "100%", maxWidth: "380px", textAlign: "center" }}>
        {error ? (
          <>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--orbit-text-heading)", margin: "0 0 10px" }}>
              Sign-in failed
            </h1>
            <div className="auth-alert-error" style={{ marginBottom: "20px", textAlign: "left" }}>
              {error}
            </div>
            <button type="button" className="auth-btn-primary" onClick={() => navigate("/login")}>
              Back to login
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%", margin: "0 auto 18px",
              border: "3px solid var(--orbit-border)", borderTopColor: "var(--orbit-brand)",
              animation: "orbit-spin 0.7s linear infinite",
            }} />
            <p style={{ fontSize: "14px", color: "var(--orbit-text-muted)" }}>
              Finishing Microsoft sign-in…
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
