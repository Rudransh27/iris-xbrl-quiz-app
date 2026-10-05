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
  const [regionsData,       setRegionsData]      = useState([]);
  const [selectedRegionIds, setSelectedRegionIds] = useState([]);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    api.getDepartments()
      .then(data => setDepartmentsData(data || []))
      .catch(() => setError("Failed to load business units. Please refresh."));
    api.getRegions()
      .then(res => setRegionsData(res?.data || []))
      .catch(() => {});
  }, []);

  const toggleRegion = (regionId) => {
    setSelectedRegionIds(prev =>
      prev.includes(regionId) ? prev.filter(id => id !== regionId) : [...prev, regionId]
    );
  };

  const availableTeams = departmentsData.find(d => d.code === selectedDeptCode)?.teams || [];
  const isValid = selectedDeptCode && selectedTeamId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.completeProfile(selectedDeptCode, selectedTeamId, selectedRegionIds);
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
      <div className="auth-fade-in auth-pane">
        <h1 className="auth-title">
          One last thing.
        </h1>
        <p className="auth-sub">
          You signed in with Microsoft — just tell us your team so we can show you the right content.
        </p>

        {error && <div className="auth-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form auth-form--tight">
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

          {regionsData.length > 0 && (
            <div className="auth-region">
              <span className="auth-region__label">
                Your region (optional — pick one or more)
              </span>
              <div className="auth-chips">
                {regionsData.map(r => {
                  const isSelected = selectedRegionIds.includes(r._id);
                  return (
                    <button
                      key={r._id}
                      type="button"
                      onClick={() => toggleRegion(r._id)}
                      disabled={loading}
                      className={`auth-chip${isSelected ? " is-selected" : ""}`}
                    >
                      <span
                        className="auth-chip__dot"
                        style={r.color ? { backgroundColor: r.color } : undefined}
                      />
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit" className="auth-btn-primary auth-mt-2"
            disabled={loading || !isValid}
          >
            {loading ? "Saving…" : "Continue →"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
