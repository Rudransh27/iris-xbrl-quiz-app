// src/admin/pages/CreateTeam.jsx
import React, { useState, useEffect, useLayoutEffect, useContext } from "react";
import { Form, Button, Card, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AuthContext from "../../context/AuthContext"; // 🔒 Imported to read admin context boundaries

const CreateTeam = ({ onTeamCreated, setActiveTab }) => {
  const { user } = useContext(AuthContext); // Extract active administrator privileges
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingDepts, setFetchingDepts] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 📡 Load corporate structure map and enforce tenant routing filters
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await api.getDepartments();
        setDepartments(data || []);

        // 🛡️ TENANT RESTRICTION AUTO-LOCK
        // If they are a standard department admin, automatically lock them into their own unit
        if (user && user.role === "admin" && user.department) {
          const userDeptStr = user.department.toString();
          // Match by database string ID or alphanumeric tracking key string
          const matchedDept = data.find(
            (d) => d._id === userDeptStr || d.code === userDeptStr,
          );
          if (matchedDept) {
            setSelectedDeptId(matchedDept._id);
          }
        }
      } catch (err) {
        console.error("Failed to load departments:", err.message);
        setError("System Fault: Failed to load corporate departments list.");
      } finally {
        setFetchingDepts(false);
      }
    };

    if (user) {
      loadDepartments();
    }
  }, [user]);

  // 🚀 Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!teamName.trim() || !teamCode.trim() || !selectedDeptId) {
      setError("Validation Error: Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: teamName.trim(),
        code: teamCode.trim().toUpperCase(), // Enforce uniform uppercase alphanumeric tracking codes
        departmentId: selectedDeptId,
      };

      const response = await api.createTeam(payload);

      if (response && response.success) {
        setSuccess(
          `Success: Team '${response.data.name}' successfully added to the department.`,
        );
        setTeamName("");
        setTeamCode("");

        if (typeof onTeamCreated === "function") {
          onTeamCreated(); // 🔄 Re-triggers automatic database refetch on the left list panel
        }

        // Only flush dropdown selection if user is unrestricted superadmin
        if (user?.role === "superadmin") {
          setSelectedDeptId("");
        }

        // Return to overview tab after creation
        setTimeout(() => {
          if (typeof setActiveTab === "function") setActiveTab("overview");
          else navigate("/orbit/dashboard?tab=overview");
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "Failed to create team entity asset.");
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = user?.role === "superadmin";

  return (
    <div
      className="admin-page-container d-flex align-items-center justify-content-center p-4 w-100 animate-fade-in"
      style={{ minHeight: "80vh" }}
    >
      <Card
        className="shadow-sm border-slate w-100"
        style={{ maxWidth: "500px", borderRadius: "12px" }}
      >
        <Card.Body className="p-4 text-start">
          <h2
            className="mb-2"
            style={{ fontWeight: "700", letterSpacing: "-0.5px" }}
          >
            Create New Team
          </h2>
          <p className="text-muted small mb-4">
            Provision a new operational sub-team under a designated parent
            business line.
          </p>

          {error && (
            <Alert
              variant="danger"
              style={{ borderRadius: "8px", fontSize: "13px" }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              variant="success"
              style={{ borderRadius: "8px", fontSize: "13px" }}
            >
              {success}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* 🏢 Dropdown 1: Select Parent Department */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "600", fontSize: "13px" }}>
                Parent Department
              </Form.Label>
              {fetchingDepts ? (
                <div className="d-flex align-items-center ps-2 pt-1">
                  <Spinner
                    animation="border"
                    size="sm"
                    className="text-primary me-2"
                  />
                  <span className="text-muted small">
                    Loading departments map...
                  </span>
                </div>
              ) : (
                <Form.Select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  // 🛡️ Disable field if normal department admin is logged in to block multi-tenant modifications
                  disabled={loading || !isSuperAdmin}
                  required
                  style={{ borderRadius: "8px", padding: "10px" }}
                  className="text-muted fw-semibold"
                >
                  <option value="" disabled>
                    Select Department
                  </option>
                  {departments.map((dept) => {
                    // Filter selection items list visibility out if not superadmin matching tenant codes
                    const isOwnDept =
                      user?.department?.toString() === dept._id ||
                      user?.department?.toString() === dept.code;
                    if (!isSuperAdmin && !isOwnDept) return null;

                    return (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code.toUpperCase()})
                      </option>
                    );
                  })}
                </Form.Select>
              )}
              {!isSuperAdmin && (
                <Form.Text
                  className="text-primary ps-1 font-monospace"
                  style={{ fontSize: "10px", fontWeight: "600" }}
                >
                  Locked: Allocation scope restricted to your assigned admin
                  department tenant.
                </Form.Text>
              )}
            </Form.Group>

            {/* 📝 Input 1: Team Name */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "600", fontSize: "13px" }}>
                Team Name
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., DevOps, Core Analytics, India Sales"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={loading || fetchingDepts}
                required
                style={{ borderRadius: "8px", padding: "10px" }}
              />
            </Form.Group>

            {/* ⚙️ Input 2: Team Code */}
            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: "600", fontSize: "13px" }}>
                Team Tracking Code
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., DEVOPS, CORE_ANALYTICS"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                disabled={loading || fetchingDepts}
                required
                style={{ borderRadius: "8px", padding: "10px" }}
              />
              <Form.Text className="text-muted" style={{ fontSize: "11px" }}>
                A unique shorthand alphanumeric token used for backend mapping
                policies.
              </Form.Text>
            </Form.Group>

            {/* 🛠️ Action Buttons */}
            <div className="d-flex gap-2">
              <Button
                variant="light"
                type="button"
                onClick={() => { if (typeof setActiveTab === "function") setActiveTab("overview"); else navigate("/orbit/dashboard?tab=overview"); }}
                disabled={loading}
                className="w-50 border fw-semibold text-secondary"
                style={{ borderRadius: "8px", padding: "10px" }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading || fetchingDepts || !selectedDeptId}
                className="w-50 fw-semibold"
                style={{
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: "#0f256e",
                  borderColor: "#0f256e",
                }}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "Save Team"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreateTeam;
