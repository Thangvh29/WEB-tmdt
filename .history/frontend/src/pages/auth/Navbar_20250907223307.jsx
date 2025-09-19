import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/style/navbar.css"; // tùy chỉnh nếu cần

const Navbar = () => {
  const location = useLocation();

  const linkClass = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          MyShop
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
