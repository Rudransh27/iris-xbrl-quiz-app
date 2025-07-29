import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "../src/components/Navbar";
import HomePage from "../src/pages/HomePage";
import XbrlTrail from "./pages/XbrlTrail";
import Quiz from "./pages/Quiz";
// import learning modules as you build

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/world" element={<XbrlTrail />} />
        <Route path="/quiz" element={<Quiz />} />
        {/* Add module routes by topic here */}
      </Routes>
    </Router>
  );
}
