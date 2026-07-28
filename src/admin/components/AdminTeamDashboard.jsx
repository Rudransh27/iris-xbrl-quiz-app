// src/admin/components/AdminTeamDashboard.jsx
// Team Hub — every team in the admin's department, each showing its own
// admin(s), member roster, and top performer. Any admin in the department
// can view every team here (reads have always been department-wide); only
// dragging a member to another team is gated by that team's own admin (see
// requestTeamTransfer's approve/auto-approve split on the backend).
import React, { useState, useEffect, useContext, useCallback } from "react";
import { Spinner, Alert, Modal } from "react-bootstrap";
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { TrophyFill, ShieldLockFill, PlusCircleFill, CheckCircleFill, HourglassSplit } from "react-bootstrap-icons";
import api from "../services/api";
import AuthContext from "../../context/AuthContext";
import CreateTeam from "./CreateTeam";
import "./AdminTeamDashboard.css";

function MemberAvatar({ member }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = (member.username || "US").substring(0, 2).toUpperCase();

  if (member.avatarUrl && !imgFailed) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.username}
        className="team-hub-member-avatar"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return <div className="team-hub-member-avatar">{initials}</div>;
}

function MemberCard({ member, isTopPerformer, sourceTeamId }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: member._id,
    data: { member, sourceTeamId },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="team-hub-member-card"
      title="Drag to move this member to another team"
      data-testid={`member-card-${member._id}`}
    >
      <div className="d-flex align-items-center gap-2">
        <MemberAvatar member={member} />
        <div className="team-hub-member-name">
          {member.username}
          {isTopPerformer && <TrophyFill className="ms-1" size={11} color="#d4a017" title="Top performer" />}
        </div>
      </div>
      <span className="team-hub-member-xp">{member.xp || 0} XP</span>
    </div>
  );
}

function TeamColumn({ team }) {
  const { setNodeRef, isOver } = useDroppable({ id: team._id, data: { team } });
  const topPerformerId = team.topPerformer?._id;

  return (
    <div
      ref={setNodeRef}
      className={`team-hub-column ${isOver ? "team-hub-column--drop-active" : ""}`}
      data-testid={`team-column-${team._id}`}
    >
      <div className="team-hub-column-header">
        <h6 className="team-hub-column-name">
          {team.name}
          {team.isCouncil && <ShieldLockFill size={12} color="var(--orbit-brand)" title="Council — department-wide admin" />}
        </h6>
        <span className="team-hub-member-count">{team.memberCount}</span>
      </div>

      <div className="team-hub-admins-line">
        {team.admins.length === 0 ? (
          <span className="team-hub-no-admin">No admin — moves here apply instantly</span>
        ) : (
          <span>Admin{team.admins.length > 1 ? "s" : ""}: {team.admins.map((a) => a.username).join(", ")}</span>
        )}
      </div>

      <div className="team-hub-member-list">
        {team.members.length === 0 ? (
          <p className="team-hub-empty-members">No members yet.</p>
        ) : (
          team.members.map((m) => (
            <MemberCard key={m._id} member={m} isTopPerformer={m._id === topPerformerId} sourceTeamId={team._id} />
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminTeamDashboard({ setActiveTab }) {
  const { user: currentUser } = useContext(AuthContext);
  const isSuperAdmin = currentUser?.role === "superadmin";
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  // 🎯 A Superadmin has no `department` of their own — the Team Hub used to
  // silently render empty for them (fetchHub's `if (!departmentId) return`
  // never fired at all) since departmentId came only from currentUser. Give
  // Superadmins the same department-picker pattern AdminIdeasReview.jsx
  // already uses, defaulting to the first department.
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");

  useEffect(() => {
    if (isSuperAdmin && api.getDepartments) {
      api.getDepartments()
        .then((res) => {
          const list = res?.data || res || [];
          setDepartments(list);
          if (list.length > 0) setSelectedDeptId(list[0]._id);
        })
        .catch((err) => console.error("Failed to fetch department directory:", err.message));
    }
  }, [isSuperAdmin]);

  const departmentId = isSuperAdmin
    ? selectedDeptId
    : (currentUser?.department?._id || currentUser?.department);

  const fetchHub = useCallback(async () => {
    if (!departmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTeamHub(departmentId);
      setTeams(res?.success ? res.teams : []);
    } catch (err) {
      console.error("Team Hub fetch failed:", err);
      setError("Failed to load the Team Hub. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await api.getTransferRequests();
      setPendingRequests(res?.success ? res.requests : []);
    } catch (err) {
      console.error("Pending transfer requests fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchHub();
    fetchPendingRequests();
  }, [fetchHub, fetchPendingRequests]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    const member = active.data.current?.member;
    const sourceTeamId = active.data.current?.sourceTeamId;
    const targetTeam = over.data.current?.team;
    if (!member || !targetTeam) return;
    if (sourceTeamId === targetTeam._id) return;

    try {
      const res = await api.requestTeamTransfer(member._id, targetTeam._id);
      if (res?.success) {
        setStatusMsg({ variant: res.autoApproved ? "success" : "info", text: res.message });
        if (res.autoApproved) fetchHub();
      } else {
        setStatusMsg({ variant: "danger", text: res?.message || "Transfer failed." });
      }
    } catch (err) {
      setStatusMsg({ variant: "danger", text: err.message || "Transfer failed." });
    }
  };

  const respondToRequest = async (requestId, approve) => {
    try {
      await api.respondTransferRequest(requestId, approve);
      fetchPendingRequests();
      if (approve) fetchHub();
    } catch (err) {
      setStatusMsg({ variant: "danger", text: err.message || "Failed to respond to request." });
    }
  };

  return (
    <div className="animate-fade-in text-start w-100">
      <div className="team-hub-header">
        <div>
          <h4 className="team-hub-title fw-bold">Team Hub</h4>
          <p className="team-hub-subtitle">Drag a member card to move them to another team.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {isSuperAdmin && departments.length > 0 && (
            <select
              className="team-hub-dept-picker"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name || d.title}</option>
              ))}
            </select>
          )}
          <button className="team-hub-new-btn" onClick={() => setShowCreateTeam(true)}>
            <PlusCircleFill size={13} /> New Team
          </button>
        </div>
      </div>

      {statusMsg && (
        <Alert variant={statusMsg.variant} dismissible onClose={() => setStatusMsg(null)} style={{ fontSize: "13px" }}>
          {statusMsg.text}
        </Alert>
      )}
      {error && <Alert variant="danger" style={{ fontSize: "13px" }}>{error}</Alert>}

      <Modal show={showCreateTeam} onHide={() => setShowCreateTeam(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>Create New Team</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CreateTeam
            embedded
            onTeamCreated={() => { fetchHub(); setShowCreateTeam(false); }}
            setActiveTab={() => setShowCreateTeam(false)}
          />
        </Modal.Body>
      </Modal>

      {pendingRequests.length > 0 && (
        <div className="team-hub-pending-panel">
          <h6 className="fw-bold mb-0" style={{ fontSize: "13px", color: "var(--orbit-text-heading)" }}>
            <HourglassSplit className="me-2" size={13} />Pending requests for your team ({pendingRequests.length})
          </h6>
          {pendingRequests.map((r) => (
            <div key={r._id} className="team-hub-pending-row">
              <span>
                <strong>{r.user?.username}</strong> from {r.fromTeam?.name} → {r.toTeam?.name}
                <span className="ms-2" style={{ color: "var(--orbit-text-muted)" }}>(requested by {r.requestedBy?.username})</span>
              </span>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-success" onClick={() => respondToRequest(r._id, true)}>
                  <CheckCircleFill size={12} /> Approve
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => respondToRequest(r._id, false)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" style={{ color: "var(--orbit-brand)" }} /></div>
      ) : teams.length === 0 ? (
        <p style={{ color: "var(--orbit-text-muted)" }}>No teams found for your department yet — create one to get started.</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="team-hub-grid">
            {teams.map((team) => (
              <TeamColumn key={team._id} team={team} />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
