// frontend/src/components/user/payment/PaymentTab.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/axios";

const PaymentTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/user/orders", {
        params: { status: "pending" }, // chỉ lấy đơn cần thanh toán
      });
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Lỗi khi fetch đơn hàng chờ thanh toán:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Đơn hàng chờ thanh toán</h2>
      {loading ? (
        <p>Đang tải...</p>
      ) : orders.length === 0 ? (
        <p>Không có đơn hàng nào cần thanh toán.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order._id}
              className="border p-4 rounded flex justify-between items-center"
            >
              <div>
                <p>
                  <span className="font-semibold">Mã đơn:</span> {order._id}
                </p>
                <p>
                  <span className="font-semibold">Tổng tiền:</span>{" "}
                  {order.totalAmount?.toLocaleString("vi-VN")} đ
                </p>
                <p>
                  <span className="font-semibold">Sản phẩm:</span>{" "}
                  {order.itemsCount}
                </p>
              </div>
              <Link
                to={`/user/orders/${order._id}`}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Thanh toán
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PaymentTab;
