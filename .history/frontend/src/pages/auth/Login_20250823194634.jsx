import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/axios";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      console.log("Login success:", res.data);
      navigate("/"); // sau khi login thì về Home hoặc Dashboard
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:4000/api/auth/google";
  };

  const handleFacebookLogin = () => {
    window.location.href = "http://localhost:4000/api/auth/facebook";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow w-96"
      >
        <h2 className="text-2xl font-bold mb-6">Đăng nhập</h2>

        {error && <div className="mb-4 text-red-500">{error}</div>}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-4"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-4"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Đăng nhập
        </button>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
          >
            Đăng nhập với Google
          </button>
          <button
            type="button"
            onClick={handleFacebookLogin}
            className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-900"
          >
            Đăng nhập với Facebook
          </button>
        </div>
      </form>
    </div>
  );
}
