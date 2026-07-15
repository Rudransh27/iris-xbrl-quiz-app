// src/components/FeaturesShowcase.jsx
import React from "react";
import {
  Fire,
  CheckCircleFill,
  LightningChargeFill,
  TrophyFill,
  Lightbulb,
  RocketTakeoffFill,
  StarFill,
} from "react-bootstrap-icons";
import "./FeaturesShowcase.css";

const FEATURES = [
  {
    icon: Fire,
    accent: "text-blaze",
    title: "Daily Streak & Calendar",
    text: "Every qualifying action — a read, a completed topic, a submitted idea — lights up your streak. A full activity calendar tracks your consistency over time.",
  },
  {
    icon: CheckCircleFill,
    accent: "text-azure",
    title: "Daily Checklist",
    text: "Three simple goals reset every day: Today's Read, Module Completion, and Idea Submission — small habits that compound into real progress.",
  },
  {
    icon: LightningChargeFill,
    accent: "text-gold",
    title: "Plasma & Gamification",
    text: "Every card, quiz, and topic you finish earns real Plasma. Watch your total climb as you move through modules built the way people actually learn.",
  },
  {
    icon: TrophyFill,
    accent: "text-violet",
    title: "Team Leaderboard",
    text: "See how your team stacks up against every other team in the organization — friendly competition that keeps learning momentum alive.",
  },
  {
    icon: Lightbulb,
    accent: "text-pink",
    title: "Ideas & R&D Studio",
    text: "Got a process improvement or a product idea? Submit it straight to the Product Council and track its status from pitch to decision.",
  },
  {
    icon: RocketTakeoffFill,
    accent: "text-azure",
    title: "Hot Modules",
    text: "Admins can spotlight one platform-wide \"hot\" module at a time — surfacing exactly what's most important to learn right now.",
  },
];

export default function FeaturesShowcase() {
  return (
    <section className="orbit-features-section">
      <div className="orbit-features-wrapper">
        <div className="orbit-features-header">
          <div className="duo-spark-badge">
            <StarFill size={11} /> INSIDE THE DASHBOARD
          </div>
          <h2 className="orbit-features-title">
            What makes <span className="title-accent">Iris Orbit</span> click
          </h2>
          <p className="orbit-features-subtitle">
            A quick look at the gamified engine powering your learning journey once you're signed in.
          </p>
        </div>

        <div className="orbit-features-grid">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div className="orbit-feature-card" key={feature.title}>
                <div className={`orbit-feature-icon-badge ${feature.accent}`}>
                  <Icon size={22} />
                </div>
                <h4 className="orbit-feature-title">{feature.title}</h4>
                <p className="orbit-feature-text">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
