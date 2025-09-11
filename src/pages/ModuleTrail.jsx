// src/pages/ModuleTrail.jsx

import React, { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModuleCardEach from "../components/ModuleCardEach";
import api from "../admin/services/api";
import "./ModuleTrail.css";

const departments = ["All", "ideal", "ifile", "carbon"];

export default function ModuleTrail() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const navigate = useNavigate();

  useLayoutEffect(() => {
      window.scrollTo(0, 0);
    }, []);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const data = await api.getModules();
        setModules(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch modules:", error);
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  const handleModuleClick = (module) => {
    // Navigate to the new module detail URL instead of changing state
    navigate(`/modules/${module._id}`);
  };

  const filteredModules =
    activeFilter === "All"
      ? modules
      : modules.filter((mod) => mod.department === activeFilter);

  if (loading) {
    return <div className="loading-state">Loading modules...</div>;
  }
  
  return (
    <div className="module-trail-page">
      {/* Background shapes container */}
      <div className="module-trail-background-shapes">
        <div className="course-shape shape--circle-green"></div>
        <div className="course-shape shape--square-blue"></div>
        <div className="course-shape shape--triangle-pink"></div>
      </div>

      <div className="page-header">
        <h1 className="page-title">Your Learning Trail</h1>
        <p className="page-subtitle">
          Explore curated modules across different departments and start your journey.
        </p>
        <div className="filter-buttons">
          {departments.map((department) => (
            <button
              key={department}
              className={`filter-btn ${activeFilter === department ? "active" : ""}`}
              onClick={() => setActiveFilter(department)}
            >
              {department}
            </button>
          ))}
        </div>
      </div>

      <div className="module-grid-wrapper">
        <div className="module-trail-grid">
          {filteredModules.length > 0 ? (
            filteredModules.map((module) => (
              <ModuleCardEach
                key={module._id}
                title={module.title}
                imageUrl={module.imageUrl}
                description={module.description}
                department={module.department}
                onClick={() => handleModuleClick(module)}
              />
            ))
          ) : (
            <p className="no-modules-message">No modules found for this department.</p>
          )}
        </div>
      </div>
    </div>
  );
}