// src/admin/Dashboard.jsx

import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardHome from './components/DashboardHome';
import ContentManager from './components/ContentManager';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="main-content-area">
        <div className="main-content-scroll">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="content" element={<ContentManager />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;