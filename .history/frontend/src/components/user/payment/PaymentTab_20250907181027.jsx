// frontend/src/components/user/payment/PaymentTab.jsx
import { useState, useEffect } from "react";
import api from "../../../services/axios";
import PaymentItem from "./PaymentItem";
import PaymentModal from "./PaymentModal";

const PaymentTab = () => {
  const [orders, setOrders] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/user/orders");
        // Lọc ra các đơn chưa thanh toán
        const unpaidOrders = data.orders.filter(
          (o) => o.paymentStatus === "unpaid"
        );
        setOrders(unpaidOrders);
      } catch (err) {
        console.error("Lỗi khi lấy đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const toggleSelect = (orderId) => {
    setSelectedItems((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Tính tổng tiền các đơn đã chọn
  const totalAmount = orders
    .filter((o) => selectedItems.includes(o._id))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="relative">
      {loading ? (
        <p>Đang tải đơn hàng...</p>
      ) : orders.length === 0 ? (
        <p>Không có đơn hàng cần thanh toán.</p>
      ) : (
        orders.map((order) => (
          <PaymentItem
            key={order._id}
            item={order}
            selected={selectedItems.includes(order._id)}
            onSelect={() => toggleSelect(order._id)}
            onPayNow={() => setShowModal(true)}
          />
        ))
      )}

      {/* Thanh toán tất cả */}
      {selectedItems.length > 0 && (
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
          selectedItems={orders.filter((o) => selectedItems.includes(o._id))}
        />
      )}
    </div>
  );
};

export default PaymentTab;
