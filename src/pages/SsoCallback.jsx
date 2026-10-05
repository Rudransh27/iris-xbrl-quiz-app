// src/pages/SsoCallback.jsx
// Landing point for the Microsoft SSO redirect chain — the backend's
// GET /api/auth/microsoft/callback sends the browser here with either
// #token=<jwt> (success — in the fragment so it never reaches server logs)
// or ?error=<code> (domain rejection, cancelled sign-in, etc.), never raw
// Microsoft tokens.
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import { takeRedirectPath } from "../utils/safeNav";

const SSO_ERRORS = {
  start_failed: "Could not start Microsoft sign-in. Please try again.",
  cancelled: "Microsoft sign-in was cancelled or did not complete.",
  profile_missing: "Microsoft did not return the expected account details.",
  domain_denied: "Access denied. Only corporate emails from @irisregtech.com or @irisbusiness.com are allowed.",
  not_member: "Guest accounts from other organisations can't sign in. Please use your IRIS Microsoft account.",
  identity_conflict: "This email is already linked to a different Microsoft account. Please contact your administrator.",
  session_failed: "Sign-in succeeded but session creation failed. Please try again.",
  failed: "Microsoft sign-in failed. Please try again or contact IT.",
};

export default function SsoCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token");
    const errorCode = params.get("error");
    // Drop the token from the address bar / history right away.
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);

    if (errorCode) {
      // Only fixed codes are accepted — never echo text from the URL.
      setError(SSO_ERRORS[errorCode] || SSO_ERRORS.failed);
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

      // A logged-in user always lands straight in the Orbit dashboard —
      // "/" (the marketing homepage) is only ever for logged-out visitors.
      const redirect = takeRedirectPath("/orbit");
      navigate(redirect, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout>
      <div className="auth-fade-in auth-pane auth-pane--center">
        {error ? (
          <>
            <h1 className="auth-title auth-title--sm">
              Sign-in failed
            </h1>
            <div className="auth-alert-error">
              {error}
            </div>
            <button type="button" className="auth-btn-primary" onClick={() => navigate("/login")}>
              Back to login
            </button>
          </>
        ) : (
          <>
            <div className="auth-spinner auth-spinner--lg" />
            <p className="auth-sub">
              Finishing Microsoft sign-in…
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
