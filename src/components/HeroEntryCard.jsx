// src/components/HeroEntryCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroEntryCard.css';
import { FaSearch } from 'react-icons/fa';
import { StarFill } from 'react-bootstrap-icons'; // Swapped for Fill variant for pop
import CosmicHeroCanvas from './hero3d/CosmicHeroCanvas';

export default function HeroEntryCard() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/orbit?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/orbit');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="simple-vibrant-hero-container">
      <CosmicHeroCanvas />

      <div className="simple-hero-wrapper simple-split-layout">

        {/* ================= LEFT SIDE: GAMIFIED PORTAL ================= */}
        <div className="simple-text-panel">
          <div className="simple-badge">
            <StarFill className="simple-star-icon" /> START LEARNING
          </div>

          <h1 className="simple-hero-title">
            Welcome to <br />
            <span className="simple-brand-text">IRIS Orbit</span>
          </h1>

          <p className="simple-hero-subtitle">
            Your friendly path to learning new skills. Explore modules, track your daily progress, and unlock achievements!
          </p>


        </div>

        {/* ================= RIGHT SIDE: reserved so the astronaut (rendered
             by CosmicHeroCanvas, full-bleed behind both columns) has visual
             room to sit under this column without recentring the text ===== */}
        <div className="simple-graphic-panel" aria-hidden="true" />

      </div>
    </div>
  );
}