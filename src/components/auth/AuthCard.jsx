// src/components/auth/AuthCard.jsx

import React, { useState, useContext, useEffect } from "react";
import { Form, Button, Card, Spinner, Alert, InputGroup } from "react-bootstrap";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons"; // for password toggle
import AuthContext from "../../context/AuthContext";
import irisLogo from "../../assets/IRIS-Logo_CMYK.svg";
import "../../pages/Auth.css";

const AuthCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Switch mode based on route
  useEffect(() => {
    if (location.pathname === "/login") {
      setIsLoginMode(true);
    } else if (location.pathname === "/register") {
      setIsLoginMode(false);
    }
  }, [location.pathname]);

  // Validation rules
  const isFormValid = isLoginMode
    ? email && password.length >= 6
    : username &&
      email &&
      password.length >= 6 &&
      password === confirmPassword;

  // Handle login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        const redirectPath = localStorage.getItem("redirectPath") || "/";
        localStorage.removeItem("redirectPath");
        navigate(redirectPath);
      } else {
        setError(res.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await register(username, email, password);
      if (res.success) {
        setSuccess("Registration successful! Please sign in.");
        setIsLoginMode(true);
        navigate("/login");
      } else {
        setError(res.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login/register
  const toggleFormMode = () => {
    setIsLoginMode(!isLoginMode);
    if (isLoginMode) {
      navigate("/register");
    } else {
      navigate("/login");
    }
  };

  return (
    <Card className="auth-card p-4 shadow-lg border-0 rounded-4">
      <Card.Body>
        {/* Logo */}
        <div className="text-center mb-3">
          <img src={irisLogo} alt="Iris Logo" className="auth-logo-img" />
        </div>

        {/* Global error / success messages */}
        {error && (
          <Alert variant="danger" className="text-center mb-3">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="text-center mb-3">
            {success}
          </Alert>
        )}

        {/* Title */}
        <h1 className="text-center mb-2 fw-bold">
          {isLoginMode ? "Welcome Back" : "Join Us"}
        </h1>
        <p className="text-center text-muted mb-4">
          {isLoginMode
            ? "Sign in to your account."
            : "Create your new account."}
        </p>

        {/* Form */}
        <Form
          onSubmit={isLoginMode ? handleLoginSubmit : handleRegisterSubmit}
          className="w-100"
        >
          {!isLoginMode && (
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                className="auth-input"
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Control
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="auth-input"
            />
          </Form.Group>

          {/* Password with toggle */}
          <Form.Group className="mb-3">
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="auth-input"
              />
              <Button
                variant="outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeSlash /> : <Eye />}
              </Button>
            </InputGroup>
            {password && password.length < 6 && (
              <small className="text-danger">
                Password must be at least 6 characters
              </small>
            )}
          </Form.Group>

          {!isLoginMode && (
            <Form.Group className="mb-4">
              <Form.Control
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className="auth-input"
              />
              {confirmPassword &&
                confirmPassword !== password && (
                  <small className="text-danger">
                    Passwords do not match
                  </small>
                )}
            </Form.Group>
          )}

          {/* Submit button */}
          <Button
            variant="primary"
            type="submit"
            className="w-100 auth-submit-button"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : isLoginMode ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </Button>

          {/* Forgot password link */}
          {isLoginMode && (
            <div className="text-center mt-3">
              <Link
                to="/forgot-password"
                className="text-muted text-decoration-none auth-link"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </Form>

        {/* Footer action */}
        <div className="auth-footer-actions text-center mt-4">
          {isLoginMode ? (
            <>
              Don’t have an account?{" "}
              <button
                type="button"
                onClick={toggleFormMode}
                className="text-decoration-none auth-link btn btn-link p-0"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={toggleFormMode}
                className="text-decoration-none auth-link btn btn-link p-0"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default AuthCard;
