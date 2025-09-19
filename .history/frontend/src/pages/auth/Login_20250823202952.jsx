import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { LogIn } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ username: form.username, role: form.username === "admin" ? "admin" : "user" });
    navigate("/");
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const res = await fetch("/api/auth/google/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (data.success) {
        login({ username: data.user.username, role: data.user.role });
        navigate("/");
      } else {
        console.error("Google login failed:", data.message);
      }
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const handleFacebookResponse = async (response) => {
    if (response.accessToken) {
      try {
        const res = await fetch("/api/auth/facebook/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: response.accessToken }),
        });
        const data = await res.json();
        if (data.success) {
          login({ username: data.user.username, role: data.user.role });
          navigate("/");
        } else {
          console.error("Facebook login failed:", data.message);
        }
      } catch (error) {
        console.error("Facebook login error:", error);
      }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card p-4 col-12 col-md-6 col-lg-4">
        <div className="text-center mb-4">
          <LogIn size={40} className="text-primary mx-auto" />
          <h3 className="fw-bold">Đăng nhập</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Tên đăng nhập"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Đăng nhập
          </button>
        </form>
        <div className="text-center my-3">
          <p className="text-muted">Hoặc đăng nhập bằng</p>
          <div className="d-flex flex-column gap-2">
            <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error("Google login error")}
                text="signin_with"
              />
            </GoogleOAuthProvider>
            <FacebookLogin
              appId="YOUR_FACEBOOK_APP_ID"
              fields="name,email,picture"
              callback={handleFacebookResponse}
              cssClass="btn btn-social facebook w-100"
              textButton="Đăng nhập với Facebook"
            />
          </div>
        </div>
        <p className="text-center mt-3 text-muted">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;