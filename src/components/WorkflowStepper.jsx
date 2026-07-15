// src/components/WorkflowStepper.jsx
import React from 'react';
import './WorkflowStepper.css';
import { Collection, JournalText, Check2Circle, ArrowRight } from 'react-bootstrap-icons';

export default function WorkflowStepper() {
  return (
    <section className="duo-stepper-section">
      <div className="duo-stepper-wrapper">
        
        {/* ================= STEPPER HEADERS ================= */}
        <div className="duo-stepper-header text-center">
          <h2 className="stepper-main-title">How Iris Orbit Works</h2>
          <p className="stepper-main-subtitle">
            Three simple, gamified steps to master specialized product frameworks and level up your skills.
          </p>
        </div>

        {/* ================= HORIZONTAL BALANCED RAIL PATH ================= */}
        <div className="duo-stepper-rail-grid">
          
          {/* STEP 1: CHOOSE TRACK (Azure Blue Accents) */}
          <div className="duo-step-node accent-blue">
            <div className="duo-step-circle-badge">
              <Collection className="duo-step-icon" />
              <div className="duo-step-counter">1</div>
            </div>
            <div className="duo-step-text-content">
              <h4>Choose Your Track</h4>
              <p>Pick your target product domain—whether it's iFile compliance schemas, iDEAL mappings, or Carbon data runs.</p>
            </div>
            <div className="duo-rail-arrow-connector desktop-only">
              <ArrowRight size={16} />
            </div>
          </div>

          {/* STEP 2: INTERACTIVE UNITS (Neon Pink Accents) */}
          <div className="duo-step-node accent-pink">
            <div className="duo-step-circle-badge">
              <JournalText className="duo-step-icon" />
              <div className="duo-step-counter">2</div>
            </div>
            <div className="duo-step-text-content">
              <h4>Bite-Sized Learning</h4>
              <p>Go through quick, micro-learning cards without getting bogged down by endless walls of text.</p>
            </div>
            <div className="duo-rail-arrow-connector desktop-only">
              <ArrowRight size={16} />
            </div>
          </div>

          {/* STEP 3: HANDS-ON VALIDATION (Amber Gold Accents) */}
          <div className="duo-step-node accent-gold">
            <div className="duo-step-circle-badge">
              <Check2Circle className="duo-step-icon" />
              <div className="duo-step-counter">3</div>
            </div>
            <div className="duo-step-text-content">
              <h4>Test & Earn Plasma</h4>
              <p>Solve interactive puzzles or fix sandboxed code to sync your accumulated points straight to the system.</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}