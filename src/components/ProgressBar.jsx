// ProgressBar.jsx
import React from "react";
import "./ProgressBar.css"; // Still include this, we'll update its content

const ProgressBar = ({ percent }) => {
  return (
    // Use the class names defined in Quiz.css for consistency
    <div className="quiz-progress-bar-container">
      <div
        className="quiz-progress-fill" // This is the filling part of the bar
        role="progressbar"
        style={{ width: `${percent}%` }}
        aria-valuenow={percent}
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
  );
};

export default ProgressBar;