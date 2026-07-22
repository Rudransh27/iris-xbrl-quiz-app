// src/components/HomeHero.jsx
// Public landing-page hero. Previously reused the Dashboard's dark-galaxy
// hero (stars/comet/rings-on-the-O) — the user flagged both of those (the
// rings on the "O" and the orbiting feature icons) as not working visually
// and asked for something else. Replaced with a plain, centered, product-
// catalog-style layout instead: big bold heading, subtitle, a real working
// search bar (submits to the Learn page's ?search= filter — see
// ModulesLabsSection.jsx), and a row of quick-link pills to real
// destinations rather than decorative filter chips with nothing behind them.
import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, TrophyFill, Book, Lightbulb, JournalText, ArrowRightShort } from "react-bootstrap-icons";
import AuthContext from "../context/AuthContext";
import "./HomeHero.css";

const QUICK_LINKS = [
  { to: "/orbit/modules",     label: "Modules",     icon: Book },
  { to: "/orbit/leaderboard", label: "Leaderboard", icon: TrophyFill },
  { to: "/orbit/ideas",       label: "Ideas",        icon: Lightbulb },
  { to: "/orbit",             label: "Daily Reads",  icon: JournalText },
];

export default function HomeHero() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const isLoggedIn = Boolean(user);
  const ctaLabel = isLoggedIn ? "Go to Iris Orbit" : "Sign In to Get Started";
  const ctaTarget = isLoggedIn ? "/orbit" : "/login";

  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    navigate(term ? `/orbit/modules?search=${encodeURIComponent(term)}` : "/orbit/modules");
  };

  return (
    <section className="home-hero-shell">
      <span className="home-hero__eyebrow">LEVEL UP AT IRIS</span>

      <h1 className="home-hero__heading">Explore learning your way</h1>

      <p className="home-hero__subheading">
        Your home for building skills at IRIS. Work through bite-sized modules,
        earn Lightyear and streaks, and see where you stand on the leaderboard.
      </p>

      <button className="home-hero__cta" onClick={() => navigate(ctaTarget)}>
        {ctaLabel} <ArrowRightShort size={20} />
      </button>

      <form className="home-hero__search" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Search modules…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <div className="home-hero__pills">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="home-hero__pill">
            <Icon size={12} /> {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
