import { useState, useEffect } from "react";
import api from "../../../services/axios";
import PaymentItem from "./PaymentItem";
import PaymentModal from "./PaymentModal";

const PaymentTab = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUnpaidOrders = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/user/orders", {
          params: { page: 1, limit: 50 },
        });
        // chỉ lấy các đơn chưa thanh toán
        const unpaid = (data.orders || []).filter(
          (o) => o.paymentStatus !== "paid"
        );
        setOrders(unpaid);
      } catch (err) {
        console.error("Lỗi khi lấy đơn hàng chưa thanh toán:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnpaidOrders();
  }, []);

  const toggleSelect = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const totalAmount = orders
    .filter((o) => selectedOrders.includes(o._id))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="relative">
      {loading ? (
        <p>Đang tải đơn hàng...</p>
      ) : orders.length === 0 ? (
        <p>Không có đơn hàng chờ thanh toán.</p>
      ) : (
        orders.map((o) => (
          <PaymentItem
            key={o._id}
            order={o}
            selected={selectedOrders.includes(o._id)}
            onSelect={() => toggleSelect(o._id)}
            onPayNow={() => setShowModal(true)}
          />
        ))
      )}

      {selectedOrders.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white p-4 shadow-lg rounded-lg">
          <div className="flex items-center gap-4">
            <span>Tổng: {totalAmount.toLocaleString()} đ</span>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Thanh toán tất cả
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <PaymentModal
          amount={totalAmount}
          onClose={() => setShowModal(false)}
          selectedItems={orders.filter((o) =>
            selectedOrders.includes(o._id)
          )}
        />
      )}
    </div>
  );
};

export default PaymentTab;
