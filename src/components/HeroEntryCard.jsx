import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroEntryCard.css';
import { FaSearch } from 'react-icons/fa';

export default function HeroEntryCard() {
  // State to store the search term
  const [searchTerm, setSearchTerm] = useState('');
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Function to handle the search action
  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Navigates to the /modules page with the search term as a query parameter
      navigate(`/modules?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Allows search on 'Enter' key press
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="hero-banner-complete">
      <div className="hero-banner__background-overlay"></div>
      
      {/* New creative shapes container */}
      <div className="creative-shapes-container">
        <div className="shape-pattern"><div className="shape-circle"></div></div>
        <div className="shape-pattern"><div className="shape-square"></div></div>
        <div className="shape-pattern"><div className="shape-triangle"></div></div>
        <div className="shape-pattern"><div className="shape-circle"></div></div>
        <div className="shape-pattern"><div className="shape-square"></div></div>
        <div className="shape-pattern"><div className="shape-triangle"></div></div>
      </div>
      
      <div className="hero-content">
        <h1 className="hero-title">
          IRIS Onboard
        </h1>
        <p className="hero-subtitle">
          Your Personalized Path to Success at <span className="iris-brand-color">Iris Business Services Limited.</span>
        </p>
        <p className="hero-description">
          Explore a rich variety of courses with interactive quizzes and hands-on code editors, designed to help you master our products and services. Discover your unique learning path now!
        </p>
        <div className="search-bar-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search courses"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-btn" onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>
      </div>
    </div>
  );
}