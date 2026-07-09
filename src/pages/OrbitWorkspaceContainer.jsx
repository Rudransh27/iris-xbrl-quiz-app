// src/pages/OrbitWorkspaceContainer.jsx
import React from "react";
import OrbitWorkspace from "./OrbitWorkspace"; 
import Dashboard1 from "../admin/Dashboard1";    
import SuperAdminDashboard from "../admin/SuperAdminDashboard"; 

export default function OrbitWorkspaceContainer({ currentViewMode }) {
  // Now this prop will reliably catch "superadmin" from Layout.jsx!
  if (currentViewMode === "superadmin") return <SuperAdminDashboard />;
  if (currentViewMode === "admin") return <Dashboard1 />;
  
  return <OrbitWorkspace currentViewMode="learner" />;
}