// frontend/src/pages/auth/Navbar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/style/navbar.css";
import Avatar from "../../assets/img/PeekTechStore.jpg";

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* LEFT: Brand */}
        <Link to="/" className="navbar-brand">
          <img src={Avatar} alt="PeekTechStore" className="brand-avatar" />
          PeekTechStore
        </Link>

        {/* RIGHT: Menu */}
        <div className="menu-wrapper">
          {/* Toggler cho mobile */}
          <button
            className="navbar-toggler"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className="toggler-icon"></span>
            <span className="toggler-icon"></span>
            <span className="toggler-icon"></span>
          </button>

          {/* Menu links */}
          <ul className={`navbar-nav ${menuOpen ? "open" : ""}`}>
            <li>
              <Link className={linkClass("/")} to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            </li>
            <li>
              <Link className={linkClass("/login")} to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            </li>
            <li>
              <Link className={linkClass("/register")} to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
