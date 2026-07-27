// src/admin/components/AdminTeamDashboard.jsx
// Team Hub — every team in the admin's department, each showing its own
// admin(s), member roster, and top performer. Any admin in the department
// can view every team here (reads have always been department-wide); only
// dragging a member to another team is gated by that team's own admin (see
// requestTeamTransfer's approve/auto-approve split on the backend).
import React, { useState, useEffect, useContext, useCallback } from "react";
import { Spinner, Alert, Badge } from "react-bootstrap";
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { PersonBadgeFill, TrophyFill, ShieldLockFill, PlusCircleFill, CheckCircleFill, HourglassSplit } from "react-bootstrap-icons";
import api from "../services/api";
import AuthContext from "../../context/AuthContext";
import CreateTeam from "./CreateTeam";

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
      className="d-flex align-items-center justify-content-between p-2 rounded-3 mb-2"
      title="Drag to move this member to another team"
      data-testid={`member-card-${member._id}`}
    >
      <div className="d-flex align-items-center gap-2">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
          style={{
            width: "30px", height: "30px",
            backgroundColor: "var(--bg-hud-banner)", color: "var(--text-inverse)",
            fontSize: "11px", flexShrink: 0,
          }}
        >
          {(member.username || "US").substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="fw-semibold" style={{ fontSize: "13px", color: "var(--text-primary)" }}>
            {member.username}
            {isTopPerformer && <TrophyFill className="ms-1" size={11} color="#d4a017" title="Top performer" />}
          </div>
        </div>
      </div>
      <Badge className="font-monospace" style={{ fontSize: "10px", backgroundColor: "var(--curriculum-icon-bg)", color: "var(--curriculum-icon-text)" }}>
        {member.xp || 0} XP
      </Badge>
    </div>
  );
}

function TeamColumn({ team, currentUserId }) {
  const { setNodeRef, isOver } = useDroppable({ id: team._id, data: { team } });
  const topPerformerId = team.topPerformer?._id;

  return (
    <div
      ref={setNodeRef}
      className="p-3 rounded-4 flex-shrink-0"
      data-testid={`team-column-${team._id}`}
      style={{
        width: "280px",
        backgroundColor: "var(--bg-tactile-cards)",
        border: isOver ? "2px solid var(--bg-hud-banner)" : "2px solid var(--border-tactile)",
        transition: "border-color 120ms ease",
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-1">
        <h6 className="fw-bold m-0" style={{ color: "var(--text-primary)", fontSize: "14px" }}>
          {team.name}
          {team.isCouncil && <ShieldLockFill className="ms-1" size={12} color="var(--bg-hud-banner)" title="Council — department-wide admin" />}
        </h6>
        <Badge bg="dark" className="font-monospace" style={{ fontSize: "10px" }}>{team.memberCount}</Badge>
      </div>

      <div className="mb-2" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
        {team.admins.length === 0 ? (
          <span className="text-danger">No admin — moves here apply instantly</span>
        ) : (
          <span>Admin{team.admins.length > 1 ? "s" : ""}: {team.admins.map((a) => a.username).join(", ")}</span>
        )}
      </div>

      <div style={{ minHeight: "60px", maxHeight: "360px", overflowY: "auto" }}>
        {team.members.length === 0 ? (
          <p className="text-muted text-center" style={{ fontSize: "12px", padding: "20px 0" }}>No members yet.</p>
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
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  const departmentId = currentUser?.department?._id || currentUser?.department;

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
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="fw-bold m-0" style={{ color: "var(--text-primary)", fontSize: "19px" }}>Team Hub</h4>
          <p className="text-muted m-0 mt-1" style={{ fontSize: "12px" }}>
            Drag a member card to move them to another team.
          </p>
        </div>
        <button
          className="btn btn-sm fw-semibold d-flex align-items-center gap-2"
          style={{ backgroundColor: "var(--bg-hud-banner)", color: "var(--text-inverse)", borderRadius: "8px" }}
          onClick={() => setShowCreateTeam((v) => !v)}
        >
          <PlusCircleFill size={13} /> {showCreateTeam ? "Close" : "New Team"}
        </button>
      </div>

      {statusMsg && (
        <Alert variant={statusMsg.variant} dismissible onClose={() => setStatusMsg(null)} style={{ fontSize: "13px" }}>
          {statusMsg.text}
        </Alert>
      )}
      {error && <Alert variant="danger" style={{ fontSize: "13px" }}>{error}</Alert>}

      {showCreateTeam && (
        <div className="mb-4">
          <CreateTeam
            onTeamCreated={() => { fetchHub(); setShowCreateTeam(false); }}
            setActiveTab={() => setShowCreateTeam(false)}
          />
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="mb-4 p-3 rounded-4" style={{ backgroundColor: "var(--bg-tactile-cards)", border: "2px solid var(--border-tactile)" }}>
          <h6 className="fw-bold mb-2" style={{ fontSize: "13px" }}>
            <HourglassSplit className="me-2" size={13} />Pending requests for your team ({pendingRequests.length})
          </h6>
          {pendingRequests.map((r) => (
            <div key={r._id} className="d-flex align-items-center justify-content-between py-2" style={{ fontSize: "12px", borderTop: "1px solid var(--border-tactile)" }}>
              <span>
                <strong>{r.user?.username}</strong> from {r.fromTeam?.name} → {r.toTeam?.name}
                <span className="text-muted ms-2">(requested by {r.requestedBy?.username})</span>
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
        <div className="text-center py-5"><Spinner animation="border" style={{ color: "var(--bg-hud-banner)" }} /></div>
      ) : teams.length === 0 ? (
        <p className="text-muted">No teams found for your department yet — create one to get started.</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="d-flex gap-3" style={{ overflowX: "auto", paddingBottom: "12px" }}>
            {teams.map((team) => (
              <TeamColumn key={team._id} team={team} currentUserId={currentUser?._id} />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
