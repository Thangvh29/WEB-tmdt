import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/api/auth/success", { withCredentials: true });
        if (res.data?.user) {
          setUser(res.data.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await axios.post(
      "/api/auth/login",
      { identifier, password },
      { withCredentials: true }
    );
    setUser(res.data.user);
  };

  const register = async (name, email, password, phone) => {
    const res = await axios.post(
      "/api/auth/register",
      { name, email, password, phone },
      { withCredentials: true }
    );
    setUser(res.data.user);
  };

  const logout = async () => {
    await axios.post("/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
