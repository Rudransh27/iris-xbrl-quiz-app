// src/components/LoginBonusToast.jsx
import React from "react";
import { RocketTakeoffFill } from "react-bootstrap-icons";
import "./LoginBonusToast.css";

export default function LoginBonusToast() {
  return (
    <div className="login-bonus-toast-body">
      <span className="login-bonus-toast-icon">
        <RocketTakeoffFill size={16} />
      </span>
      <span className="login-bonus-toast-text">Welcome back! Daily check-in bonus</span>
      <span className="login-bonus-toast-pill">+1</span>
    </div>
  );
}
