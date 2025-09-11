// src/admin/components/Sidebar.jsx

import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaCogs } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h4 className="m-0">Admin Panel</h4>
      </div>
      <Nav className="flex-column p-3">
        <Nav.Link
          as={Link}
          to="/admin"
          className={`sidebar-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
        >
          <FaTachometerAlt className="me-2" />
          Dashboard
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/admin/content"
          className={`sidebar-nav-link ${location.pathname.startsWith('/admin/content') ? 'active' : ''}`}
        >
          <FaCogs className="me-2" />
          Content Manager
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default Sidebar;