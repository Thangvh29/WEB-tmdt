import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "20px" }}>
      <h1>🏠 Trang Chủ</h1>
      {user ? (
        <>
          <p>Xin chào, <b>{user.username}</b> ({user.role})</p>
          <button onClick={logout}>Đăng xuất</button>
        </>
      ) : (
        <>
          <p>Bạn chưa đăng nhập.</p>
          <Link to="/login">Đăng nhập</Link> |{" "}
          <Link to="/register">Đăng ký</Link>
        </>
      )}
    </div>
  );
};

export default Home;
