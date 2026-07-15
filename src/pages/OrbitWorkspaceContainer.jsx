// src/pages/OrbitWorkspaceContainer.jsx
import React from "react";
import OrbitWorkspace from "./OrbitWorkspace";

// This component's only two mount points (App.jsx's "/orbit" index and
// ":section" routes) are both nested inside OrbitShell.jsx's <Outlet />,
// which itself only renders here when OrbitShell has already resolved the
// view mode to "learner" (see resolveViewMode in src/utils/viewMode.js) —
// that's the real, role-derived security gate. This component used to
// re-check a passed-in `currentViewMode` prop and render Dashboard1 /
// SuperAdminDashboard itself, which was both redundant (OrbitShell already
// renders those directly, without ever mounting this component, when the
// mode is admin/superadmin) and risky (it trusted a prop instead of the
// authenticated role) — simplified to just the learner workspace.
export default function OrbitWorkspaceContainer() {
  return <OrbitWorkspace currentViewMode="learner" />;
}
