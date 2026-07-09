import React, { useState } from 'react';
import './DashboardLayout.css';

export default function DashboardLayout({ children, sidebar }) {
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('admin');
  const toggleView = () => {
  setViewMode(prev => (prev === 'admin' ? 'learner' : 'admin'));
};

  return (
    <div className={`shell ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar">
        {sidebar(collapsed, setCollapsed)}
      </div>
      <div className="content">
        {children}
      </div>
    </div>
  );
}