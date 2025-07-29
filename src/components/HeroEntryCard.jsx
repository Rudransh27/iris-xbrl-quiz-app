import React, { useEffect, useState } from "react";
import processImg from "../assets/xbrlfunction.png";
import tomAndJerryImg from "../assets/tomandjerry.jpg";
import { useNavigate } from "react-router-dom";
import "./HeroEntryCard.css"; // Ensure this path is correct

export default function HeroEntryCard() {
  const navigate = useNavigate();
  const [showProcess, setShowProcess] = useState(true);
  const [showTomJerry, setShowTomJerry] = useState(false);

  useEffect(() => {
    let timers = [];

    function runCycle() {
      setShowProcess(true);
      setShowTomJerry(false);

      // After 3.5s, hide process image and show Tom & Jerry
      timers.push(setTimeout(() => {
        setShowProcess(false);
        setShowTomJerry(true);
      }, 3500)); // Adjusted from 5000ms

      // After another 3.5s, hide Tom & Jerry and restart the cycle
      timers.push(setTimeout(() => {
        setShowTomJerry(false);
        // No need to setShowProcess(true) here, it's done at the start of runCycle
        runCycle();
      }, 7000)); // Adjusted from 7000ms (5000+2000), total cycle time for each image should roughly align

    }

    runCycle();
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleStartJourney = () => {
    navigate("/world"); // Navigate to the /world route
  };

  return (
    <div className="homepage-hero">
      <div className="hero-left">
        <div className="cycle-img-center">
          {showProcess && (
            <img
              src={processImg}
              alt="Raw data transforms to XBRL"
              className="cycle-img pop-cycle"
              key="process"
            />
          )}
          {showTomJerry && (
            <img
              src={tomAndJerryImg}
              alt="Tom & Jerry"
              className="cycle-img pop-cycle"
              key="tj"
            />
          )}
        </div>
      </div>
      <div className="hero-right">
        <h1 className="hero-banner">The easiest way to learn XBRL!</h1>
        <p>
          Follow Tom & Jerry on a fun, interactive XBRL journey.
        </p>
        <button className="herocard__btn" onClick={handleStartJourney}>Start Your Journey</button>
      </div>
    </div>
  );
}