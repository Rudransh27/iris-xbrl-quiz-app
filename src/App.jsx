// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, default as AuthContext } from './context/AuthContext';
import { Container, Spinner } from "react-bootstrap";
import Navbar from "./components/Navbar"; // Assuming Navbar is used within Layout
import HomePage from "./pages/HomePage";
import TopicTrail from "./pages/TopicTrail";
import Quiz from "./pages/Quiz";
import Dashboard from "./admin/Dashboard";
import ModuleTrail from "./pages/ModuleTrail";
import ModuleDetail from "./components/ModuleDetail";
import Layout from "./components/Layout";
import DocumentationPage from "./components/DocumentationPage";
import Contact from "./components/Contact";
import AuthPage from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './App.css';
// Import ToastContainer and its CSS
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EmailVerificationPage from "./components/EmailVerificationPage";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!user) {
    localStorage.setItem('redirectPath', location.pathname);
    return <Navigate to="/login" />;
  }

  return children;
};

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!user) {
    localStorage.setItem('redirectPath', location.pathname);
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Layout><AuthPage /></Layout>} />
          <Route path="/register" element={<Layout><AuthPage /></Layout>} />

          <Route path="/verify-email/:token" element={<Layout><EmailVerificationPage /></Layout>} />
          <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
          <Route path="/reset-password/:token" element={<Layout><ResetPassword /></Layout>} />

          {/* Corrected Quiz route to match the one defined in Quiz.jsx */}
          <Route path="/quiz/:moduleId/:topicId" element={<Quiz />} />
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/modules" element={<Layout><ModuleTrail /></Layout>} />
          <Route path="/modules/:moduleId" element={<Layout><ModuleDetail /></Layout>} />
          <Route path="/modules/:moduleId/topics" element={<Layout><TopicTrail /></Layout>} />
          <Route path="/modules/:moduleId/topics/:topicId/cards/:cardId/documentation" element={<Layout><DocumentationPage /></Layout>} />
          <Route path="/contact" element={<Layout><Contact/></Layout>} />

          <Route path="/admin/*" element={<AdminProtectedRoute><Layout><Dashboard /></Layout></AdminProtectedRoute>} />

          <Route path="*" element={<Layout><h1>404 Not Found</h1></Layout>} />
        </Routes>
        {/* Render the ToastContainer here */}
        <ToastContainer />
      </AuthProvider>
    </Router>
  );
}