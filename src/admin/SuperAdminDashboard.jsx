// src/admin/SuperAdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { Row, Col, Card, ProgressBar, Spinner, Alert } from "react-bootstrap";
import {
  Globe2, Building, Collection, Trophy,
  ArrowUpShort, Broadcast, ShieldCheck, People,
  LightningCharge, ShieldFillCheck
} from "react-bootstrap-icons";
import api from "./services/api";

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [platformMetrics, setPlatformMetrics] = useState({
    totalUsers: 0,
    totalModules: 0,
    totalXp: 0,
    avgXp: 0,
  });
  const [departments, setDepartments] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);

  useEffect(() => {
    const fetchSuperAdminData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Real department stats from analytics endpoint
        const [deptRes, platformRes, modulesData, usersRes] = await Promise.allSettled([
          api.getAdminDepartmentStats ? api.getAdminDepartmentStats() : Promise.resolve(null),
          api.getAdminPlatformStats  ? api.getAdminPlatformStats()   : Promise.resolve(null),
          api.getModules             ? api.getModules()              : Promise.resolve([]),
          api.getUsersCount          ? api.getUsersCount()           : Promise.resolve({ count: 0 }),
        ]);

        // Departments — real data
        const deptData = deptRes.status === 'fulfilled' && deptRes.value?.success
          ? deptRes.value.departments
          : [];
        if (deptData.length > 0) {
          const maxXp = Math.max(...deptData.map(d => d.totalXp || 0), 1);
          setDepartments(deptData.map(d => ({
            name: d.name,
            code: d.code,
            count: d.userCount,
            totalXp: d.totalXp,
            avgXp: d.avgXp,
            cardsCompleted: d.cardsCompleted,
            completion: Math.round((d.totalXp / maxXp) * 100),
            topEarner: d.topEarner
          })));
        }

        // Platform XP stats — real data
        const platData = platformRes.status === 'fulfilled' && platformRes.value?.success
          ? platformRes.value
          : null;

        // Modules
        const mods = modulesData.status === 'fulfilled' ? (modulesData.value || []) : [];
        const globalModules = mods.filter(m => m.visibility === 'Global');
        if (globalModules.length > 0) {
          setBroadcasts(globalModules.map(m => ({
            title: m.title,
            meta: `Global broadcast • ${mods.length} total modules`,
            status: 'Live'
          })));
        } else if (mods.length > 0) {
          setBroadcasts(mods.slice(0, 3).map(m => ({
            title: m.title,
            meta: `${m.visibility} module`,
            status: 'Live'
          })));
        }

        const userCount = usersRes.status === 'fulfilled' ? (usersRes.value?.count ?? 0) : 0;

        setPlatformMetrics({
          totalUsers: userCount,
          totalModules: mods.length,
          totalXp: platData?.xpStats?.total || 0,
          avgXp: platData?.xpStats?.avg || 0,
        });

        // Real admins from user list
        if (api.getAdminUsersList) {
          const usersListRes = await api.getAdminUsersList();
          if (usersListRes?.success) {
            const admins = usersListRes.users.filter(u => u.role === 'admin' || u.role === 'superadmin').slice(0, 5);
            setAdminsList(admins.map(u => ({
              avatar: (u.username || 'U').substring(0, 2).toUpperCase(),
              name: u.username,
              role: `${u.role} • ${u.cardsCompleted} cards completed`,
              status: u.xp > 10 ? 'Active' : 'Low activity'
            })));
          }
        }

      } catch (err) {
        console.error("Superadmin context stream error: ", err);
        setError("Failed to compile global structural environment registers from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuperAdminData();
  }, []);

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" style={{ color: "#4C3D9E" }} />
        <div className="text-muted font-monospace mt-2" style={{ fontSize: '13px' }}>Syncing global infrastructure indices...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in text-start w-100" style={{ paddingBottom: "32px" }}>
      {error && <Alert variant="warning" className="font-monospace">{error}</Alert>}

      {/* PLATFORM ORBIT BANNER */}
      <div className="p-4 mb-4 rounded-4 text-white d-flex align-items-center justify-content-between flex-wrap gap-3"
           style={{ background: "#0F0D1F", borderBottom: "5px solid #1c183a" }}>
        <div className="d-flex align-items-center gap-4">
          <div className="rounded-circle" style={{
            width: "48px", height: "48px",
            background: "radial-gradient(circle at 35% 35%, #7C3AED, #2D1B69)",
            boxShadow: "0 0 0 6px rgba(124,58,237,0.15)"
          }}></div>
          <div>
            <h4 className="fw-bold m-0" style={{ letterSpacing: "0.5px", fontSize: "19px" }}>IRIS Orbit</h4>
            <p className="m-0 font-monospace" style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              Innovate · Resolve · Inspire · Scale
            </p>
            <div className="d-flex gap-2 mt-2 flex-wrap">
              {["IFILE", "CARBON", "IDEAL", "DATATECH"].map((chip) => (
                <span key={chip} className="badge bg-white bg-opacity-10 text-white font-monospace rounded-3" style={{ fontSize: "10px" }}>{chip}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-sm-end">
          <h2 className="fw-bold m-0" style={{ fontSize: "26px" }}>{platformMetrics.totalUsers}</h2>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: "600" }}>verified users across platform</div>
        </div>
      </div>

      {/* METRICS GRID */}
      <Row className="g-3 row-cols-1 row-cols-sm-2 row-cols-md-4 mb-4">
        <Col>
          <Card className="p-3 border-0 rounded-3 shadow-sm h-100" style={{ backgroundColor: "var(--bg-tactile-cards)", borderBottom: "4px solid var(--border-tactile)" }}>
            <div className="text-muted text-uppercase font-monospace" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Departments</div>
            <h2 className="fw-bold my-1" style={{ color: "var(--text-primary)" }}>{departments.length}</h2>
            <div className="font-monospace text-muted" style={{ fontSize: "11px" }}>Active business units</div>
          </Card>
        </Col>
        <Col>
          <Card className="p-3 border-0 rounded-3 shadow-sm h-100" style={{ backgroundColor: "var(--bg-tactile-cards)", borderBottom: "4px solid var(--border-tactile)" }}>
            <div className="text-muted text-uppercase font-monospace" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Total Modules</div>
            <h2 className="fw-bold my-1" style={{ color: "var(--text-primary)" }}>{platformMetrics.totalModules}</h2>
            <div className="font-monospace text-success" style={{ fontSize: "11px" }}><ArrowUpShort /> Live ecosystem</div>
          </Card>
        </Col>
        <Col>
          <Card className="p-3 border-0 rounded-3 shadow-sm h-100" style={{ backgroundColor: "var(--bg-tactile-cards)", borderBottom: "4px solid var(--border-tactile)" }}>
            <div className="text-muted text-uppercase font-monospace" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Avg Lightyear / User</div>
            <h2 className="fw-bold my-1" style={{ color: "var(--text-primary)" }}>{platformMetrics.avgXp}</h2>
            <div className="font-monospace text-success" style={{ fontSize: "11px" }}><ArrowUpShort /> Mean score</div>
          </Card>
        </Col>
        <Col>
          <Card className="p-3 border-0 rounded-3 shadow-sm h-100" style={{ backgroundColor: "var(--bg-tactile-cards)", borderBottom: "4px solid var(--border-tactile)" }}>
            <div className="text-muted text-uppercase font-monospace" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Lightyear Earned (Total)</div>
            <h2 className="fw-bold my-1" style={{ color: "var(--text-primary)" }}>{(platformMetrics.totalXp || 0).toLocaleString()}</h2>
            <div className="font-monospace text-success" style={{ fontSize: "11px" }}><ArrowUpShort /> Platform-wide</div>
          </Card>
        </Col>
      </Row>

      {/* DEPARTMENTS + ADMINS */}
      <Row className="g-4 mb-4">
        <Col lg={7}>
          <Card className="p-4 h-100 border-0 rounded-4 shadow-sm" style={{ backgroundColor: "var(--bg-tactile-cards)", border: "2px solid var(--border-tactile)" }}>
            <h5 className="fw-bold mb-3" style={{ fontSize: "15px" }}>Departments</h5>
            {departments.length === 0 ? (
              <div className="text-muted font-monospace text-center py-4" style={{ fontSize: "13px" }}>No department data yet.</div>
            ) : (
              <Row className="g-2 row-cols-2 row-cols-sm-3">
                {departments.map((dept, idx) => (
                  <Col key={idx}>
                    <div className="p-3 text-center rounded-3 border h-100"
                         style={{ backgroundColor: "var(--bg-global-canvas)", borderBottom: "3px solid var(--border-tactile)" }}>
                      <div className="fw-bold text-truncate" style={{ fontSize: "13px", color: "var(--text-primary)" }}>{dept.name}</div>
                      <div className="text-muted font-monospace mt-1" style={{ fontSize: "11px" }}>{dept.count} members</div>
                      <ProgressBar now={dept.completion} className="mt-2" style={{ height: "4px" }} />
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="p-4 h-100 border-0 rounded-4 shadow-sm" style={{ backgroundColor: "var(--bg-tactile-cards)", border: "2px solid var(--border-tactile)" }}>
            <h5 className="fw-bold mb-3" style={{ fontSize: "15px" }}>Department Admins</h5>
            {adminsList.length === 0 ? (
              <div className="text-muted font-monospace text-center py-4" style={{ fontSize: "13px" }}>No admins registered yet.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {adminsList.map((adm, idx) => (
                  <div key={idx} className="d-flex align-items-center justify-content-between pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white text-uppercase font-monospace"
                           style={{ width: "28px", height: "28px", fontSize: "10px", backgroundColor: "#2563EB", flexShrink: 0 }}>{adm.avatar}</div>
                      <div>
                        <div className="fw-bold" style={{ fontSize: "12.5px", color: "var(--text-primary)" }}>{adm.name}</div>
                        <div className="text-muted font-monospace" style={{ fontSize: "11px" }}>{adm.role}</div>
                      </div>
                    </div>
                    <span className={`badge font-monospace rounded-3 px-2 py-1 ${adm.status === "Active" ? "bg-success bg-opacity-10 text-success" : "bg-warning bg-opacity-10 text-warning"}`} style={{ fontSize: "10px" }}>
                      {adm.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* PLATFORM MODULES */}
      <Card className="p-4 border-0 rounded-4 shadow-sm" style={{ backgroundColor: "var(--bg-tactile-cards)", border: "2px solid var(--border-tactile)" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold m-0" style={{ fontSize: "15px" }}>Platform-wide Modules</h5>
            <span className="text-danger font-monospace" style={{ fontSize: "11px" }}>Super Admin Restricted</span>
          </div>
        </div>
        {broadcasts.length === 0 ? (
          <div className="text-muted font-monospace text-center py-4" style={{ fontSize: "13px" }}>No modules found.</div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {broadcasts.map((bc, idx) => (
              <div key={idx} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-3"
                       style={{ width: "32px", height: "32px", color: "#7C3AED", backgroundColor: "rgba(124,58,237,0.12)", flexShrink: 0 }}>
                    <Broadcast size={15} />
                  </div>
                  <div>
                    <div className="fw-bold" style={{ fontSize: "13px", color: "var(--text-primary)" }}>{bc.title}</div>
                    <div className="text-muted font-monospace" style={{ fontSize: "11px" }}>{bc.meta}</div>
                  </div>
                </div>
                <span className={`badge font-monospace rounded-3 px-2 py-1 ${bc.status === "Live" ? "bg-success bg-opacity-10 text-success" : "bg-secondary bg-opacity-10 text-secondary"}`} style={{ fontSize: "11px" }}>
                  {bc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}