// ProgressBar.jsx
import React from "react";
import "./ProgressBar.css"; 

const ProgressBar = ({ percent }) => {
  return (
    /* 🎯 FIXED: Containers and fill nodes mapped strictly to match CSS selectors */
    <div className="quiz-progress-bar-container">
      <div
        className="quiz-progress-fill" 
        role="progressbar"
        style={{ width: `${Math.max(3, percent)}%` }} /* 3% minimum taaki starting me bhi bar halki si visible rahe */
        aria-valuenow={percent}
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
  );
};

export default ProgressBar;