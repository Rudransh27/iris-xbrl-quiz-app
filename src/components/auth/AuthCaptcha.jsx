// src/components/auth/AuthCaptcha.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Themed reCAPTCHA frame shared by AuthCard (login/register) and ForgotPassword.
// The reCAPTCHA widget itself is a Google iframe — its internal colors can't be
// restyled — so this wraps it in a card that matches the rest of the auth form
// (label, border, verified state) and forwards the `theme` prop to match the
// app's light/dark mode. `ref` is forwarded straight to <ReCAPTCHA> so existing
// `captchaRef.current?.reset()` calls keep working unchanged.
// ─────────────────────────────────────────────────────────────────────────────
import React, { forwardRef, useContext } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { ThemeContext } from "../../context/ThemeContext";

const AuthCaptcha = forwardRef(function AuthCaptcha(
  { sitekey, onChange, onExpired, verified = false },
  ref
) {
  const themeCtx = useContext(ThemeContext);
  const recaptchaTheme = themeCtx?.theme === "dark" ? "dark" : "light";

  if (!sitekey) return null;

  return (
    <div className={`auth-captcha-wrap${verified ? " is-verified" : ""}`}>
      <div className="auth-captcha-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2.5 4.5 5.3v5.4c0 5 3.3 8.9 7.5 10.5 4.2-1.6 7.5-5.5 7.5-10.5V5.3L12 2.5Z"
            stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
          />
          {verified && (
            <path d="M8.7 12.3 11 14.6l4.3-4.7" stroke="currentColor" strokeWidth="1.9"
              strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        {verified ? "Verified — you're human" : "Quick security check"}
      </div>
      <div className="auth-captcha-frame">
        <ReCAPTCHA
          ref={ref}
          sitekey={sitekey}
          onChange={onChange}
          onExpired={onExpired}
          theme={recaptchaTheme}
        />
      </div>
    </div>
  );
});

export default AuthCaptcha;
