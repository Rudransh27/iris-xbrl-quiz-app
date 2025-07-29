// TopBar.jsx
import React from "react";

const TopBar = ({ title, rightSection }) => {
  return (
    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light shadow-sm">
      <h5 className="mb-0">{title}</h5>
      <div>{rightSection}</div>
    </div>
  );
};

export default TopBar;
