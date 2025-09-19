import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/style/navbar.css";
import Avatar from "../../assets/img/PeekTechStore.jpg"; // ảnh avatar

const Navbar = () => {
  const location = useLocation();

  const linkClass = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container">
        {/* Brand + Avatar */}
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <img
            src={Avatar}
            alt="PeekTechStore"
            className="brand-avatar me-2"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          PeekTechStore
        </Link>

        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className={linkClass("/")} to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className={linkClass("/login")} to="/login">
                Login
              </Link>
            </li>
            <li className="nav-item">
              <Link className={linkClass("/register")} to="/register">
                Register
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
