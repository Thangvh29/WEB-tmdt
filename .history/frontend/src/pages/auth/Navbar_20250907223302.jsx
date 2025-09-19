// frontend/src/pages/auth/Navbar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/style/navbar.css";
import Avatar from "../../assets/img/PeekTechStore.jpg";

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const linkClass = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src={Avatar} alt="Logo" className="brand-avatar" />
          PeekTechStore
        </Link>

        <button className="navbar-toggler" onClick={() => setOpen(!open)}>
          <span className="toggler-icon"></span>
          <span className="toggler-icon"></span>
          <span className="toggler-icon"></span>
        </button>

        <ul className={`navbar-nav ${open ? "open" : ""}`}>
          <li>
            <Link className={linkClass("/")} to="/" onClick={() => setOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link className={linkClass("/login")} to="/login" onClick={() => setOpen(false)}>
              Login
            </Link>
          </li>
          <li>
            <Link className={linkClass("/register")} to="/register" onClick={() => setOpen(false)}>
              Register
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
