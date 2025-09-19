import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">E-Store - Đồ điện tử cũ & mới</h1>
      <p className="mb-4">Chào mừng bạn đến với cửa hàng!</p>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Đăng nhập
        </Link>
        <Link
          to="/register"
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Đăng ký
        </Link>
      </div>
    </div>
  );
}
