// src/pages/CompleteProfile.jsx
// One-time onboarding step for freshly auto-created Microsoft SSO accounts —
// reuses the exact department/team cascade UI from AuthCard's register step,
// since every other feature (module visibility, admin scoping) assumes each
// user already has both.
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import api from "../admin/services/api";
import AuthLayout from "../components/auth/AuthLayout";

export default function CompleteProfile() {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [departmentsData,  setDepartmentsData]  = useState([]);
  const [selectedDeptCode, setSelectedDeptCode] = useState("");
  const [selectedTeamId,   setSelectedTeamId]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    api.getDepartments()
      .then(data => setDepartmentsData(data || []))
      .catch(() => setError("Failed to load business units. Please refresh."));
  }, []);

  const availableTeams = departmentsData.find(d => d.code === selectedDeptCode)?.teams || [];
  const isValid = selectedDeptCode && selectedTeamId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.completeProfile(selectedDeptCode, selectedTeamId);
      if (res.success) {
        await refreshUser();
        navigate("/", { replace: true });
      } else {
        setError(res.message || "Could not save your department/team.");
      }
    } catch (err) {
      setError(err.message || "Could not save your department/team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-fade-in" style={{ width: "100%", maxWidth: "380px" }}>
        <h1 style={{
          fontSize: "clamp(22px, 2.8vw, 28px)", fontWeight: "800",
          letterSpacing: "-0.5px", color: "var(--orbit-text-heading)",
          margin: "0 0 6px", lineHeight: 1.2,
        }}>
          One last thing.
        </h1>
        <p style={{ fontSize: "14px", color: "var(--orbit-text-muted)", margin: "0 0 24px", lineHeight: 1.6 }}>
          You signed in with Microsoft — just tell us your team so we can show you the right content.
        </p>

        {error && <div className="auth-alert-error" style={{ marginBottom: "14px" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <select
            className="auth-select"
            value={selectedDeptCode}
            onChange={e => { setSelectedDeptCode(e.target.value); setSelectedTeamId(""); }}
            disabled={loading} required
          >
            <option value="" disabled>Select Line of Business</option>
            {departmentsData.map(d => (
              <option key={d._id} value={d.code}>{d.name}</option>
            ))}
          </select>

          <select
            className="auth-select"
            value={selectedTeamId}
            onChange={e => setSelectedTeamId(e.target.value)}
            disabled={loading || !selectedDeptCode} required
          >
            <option value="" disabled>
              {!selectedDeptCode ? "Awaiting business line…" : "Select Team"}
            </option>
            {availableTeams.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>

          <button
            type="submit" className="auth-btn-primary"
            disabled={loading || !isValid}
            style={{ marginTop: "8px" }}
          >
            {loading ? "Saving…" : "Continue →"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
