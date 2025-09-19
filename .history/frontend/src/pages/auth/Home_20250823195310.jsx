import { useAuth } from "../../context/AuthProvider";
import { Link } from "react-router-dom";

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {user ? (
        <>
          <h1 className="text-3xl font-bold">Xin chào, {user.name} 👋</h1>
          <p>Email: {user.email}</p>
          <button
            onClick={logout}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          >
            Đăng xuất
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl mb-4">Chào mừng đến với trang chủ</h1>
          <div className="flex space-x-4">
            <Link to="/login" className="px-4 py-2 bg-blue-500 text-white rounded">
              Đăng nhập
            </Link>
            <Link to="/register" className="px-4 py-2 bg-green-500 text-white rounded">
              Đăng ký
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
